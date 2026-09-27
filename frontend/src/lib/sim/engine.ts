import { currentEpoch, epochAt, epochStart, seasonOf, utcDay } from "./clock";
import { lockWeight, totalWeight, isUnlockable, LOCK_TERMS } from "./conviction";
import { INSTRUMENT_BY_SYMBOL, buildQuote, type Quote } from "./instruments";
import { appendLedger, makeEntry, TREASURY } from "./ledger";
export { verifyReserves } from "./ledger";
import {
  ACHIEVEMENT_BY_ID,
  XP_RULES,
  tierFor,
} from "./scoring";
import type { LedgerEntry, SimAccount } from "./types";
import { CATALOG_BY_SKU, cabUnitPrice, fleetIncome } from "@/lib/commerceDesk";
import {
  FEE_SWITCH,
  VAULT_BY_ID,
  drawdownFromPeak,
  navAt,
  networkFeesAt,
  networkVeWeightAt,
  regimeAt,
} from "./vaults";

/** Opening books carry no cash. Capital posts only after an operator confirms a crypto deposit. */
export const GENESIS_ALLOCATION = 0;
/** sXC emitted per epoch per 1,000 sUSDC deployed, before the career boost. */
export const EMISSION_PER_1K = 1;
const NAV_HISTORY_CAP = 270;
/** Catch-up beyond this many epochs only re-marks NAV; emissions, fees and XP are not back-filled. */
const MAX_CATCHUP_EPOCHS = 540;
const DUST = 1e-9;

export class SimError extends Error {}

export function createAccount(userId: string, now = Date.now()): SimAccount {
  const epoch = currentEpoch(now);
  return {
    userId,
    createdAt: now,
    genesisClaimedAt: null,
    resets: 0,
    cash: 0,
    sxc: 0,
    lastSettledEpoch: epoch,
    vaults: {},
    positions: {},
    marks: {},
    locks: [],
    ledger: [],
    navHistory: [],
    xp: 0,
    streak: { count: 0, lastDay: null },
    achievements: [],
    season: { index: seasonOf(epoch), startNav: 0, startEpoch: epoch },
    totals: { feeShare: 0, spreadPaid: 0, sxcEmitted: 0, trades: 0 },
    pendingSpreadFee: 0,
  };
}

// ─── Valuation ───────────────────────────────────────────────────────────────

export function vaultValue(acc: SimAccount, vaultId: string, epoch = currentEpoch()): number {
  const p = acc.vaults[vaultId];
  return p ? p.shares * navAt(vaultId, epoch) : 0;
}

export function vaultsValue(acc: SimAccount, epoch = currentEpoch()): number {
  return Object.keys(acc.vaults).reduce((a, id) => a + vaultValue(acc, id, epoch), 0);
}

export function positionsValue(acc: SimAccount, marks: Record<string, number> = acc.marks): number {
  return Object.entries(acc.positions).reduce(
    (a, [sym, p]) => a + p.qty * (marks[sym] ?? acc.marks[sym] ?? p.avgCost),
    0,
  );
}

export function holdingsValue(acc: SimAccount): number {
  const goods = (acc.commerce ?? []).reduce((sum, h) => sum + h.cost, 0);
  return goods + (acc.fleet?.cost ?? 0);
}

/** Posts a ground-station daily growth credit onto free cash and the node ledger. */
export function creditYield(acc: SimAccount, amount: number, memo: string, now = Date.now()): SimAccount {
  if (!(amount > 0) || !acc.genesisClaimedAt) return acc;
  const epoch = currentEpoch(now);
  const cash = acc.cash + amount;
  const nav = accountNav({ ...acc, cash }, epoch);
  const next: SimAccount = {
    ...acc,
    cash,
    navHistory: [...acc.navHistory, { epoch, nav }].slice(-NAV_HISTORY_CAP),
  };
  return withLedger(next, [
    makeEntry(next, {
      epoch,
      kind: "YIELD",
      asset: "sUSDC",
      amount,
      from: "desk:growth",
      to: TREASURY,
      memo,
      ts: now,
    }),
  ]);
}

export function accountNav(
  acc: SimAccount,
  epoch = currentEpoch(),
  marks: Record<string, number> = acc.marks,
): number {
  return acc.cash + vaultsValue(acc, epoch) + positionsValue(acc, marks) + holdingsValue(acc);
}

export function buyFleet(acc: SimAccount, units: number, now = Date.now()): SimAccount {
  requireGenesis(acc);
  acc = settleFleetIncome(acc, now);
  const qty = Math.floor(units);
  if (qty < 1) throw new SimError("Order at least one cab.");
  const unit = cabUnitPrice(qty);
  const cost = qty * unit;
  if (acc.cash + 1e-6 < cost) throw new SimError("Free USD is below this fleet order.");
  const prev = acc.fleet ?? { units: 0, cost: 0, accruedAt: now };
  const epoch = currentEpoch(now);
  const next: SimAccount = {
    ...acc,
    cash: acc.cash - cost,
    fleet: {
      units: prev.units + qty,
      cost: prev.cost + cost,
      accruedAt: prev.units > 0 ? prev.accruedAt : now,
    },
  };
  const booked = withLedger(next, [
    makeEntry(next, {
      epoch,
      kind: "VAULT_DEPOSIT",
      asset: "sUSDC",
      amount: -cost,
      from: TREASURY,
      to: "desk:fleet",
      memo: `Robotaxi fleet · ${qty} unit${qty === 1 ? "" : "s"} at ${unit} USD`,
      ts: now,
    }),
  ]);
  return { ...booked, navHistory: [...acc.navHistory, { epoch, nav: accountNav(booked, epoch) }].slice(-NAV_HISTORY_CAP) };
}

export function settleFleetIncome(acc: SimAccount, now = Date.now()): SimAccount {
  const fleet = acc.fleet;
  if (!fleet || fleet.cost <= 0 || !acc.genesisClaimedAt) return acc;
  const elapsed = now - fleet.accruedAt;
  const minutes = Math.floor(elapsed / 60_000);
  if (minutes < 1) return acc;
  const profit = fleetIncome(fleet.cost, minutes * 60_000);
  if (!(profit > 0)) return acc;
  const credited = creditYield(acc, profit, `Robotaxi occupancy · ${minutes} minute${minutes === 1 ? "" : "s"}`, now);
  return { ...credited, fleet: { ...fleet, accruedAt: fleet.accruedAt + minutes * 60_000 } };
}

export function buyCatalog(acc: SimAccount, sku: string, units: number, now = Date.now()): SimAccount {
  requireGenesis(acc);
  const item = CATALOG_BY_SKU[sku];
  if (!item) throw new SimError("That piece is not on the atelier list.");
  const qty = Math.floor(units);
  if (qty < 1) throw new SimError("Order at least one.");
  const cost = qty * item.price;
  if (acc.cash + 1e-6 < cost) throw new SimError("Free USD is below this order.");
  const rows = [...(acc.commerce ?? [])];
  const i = rows.findIndex((h) => h.sku === sku);
  if (i >= 0) rows[i] = { sku, qty: rows[i].qty + qty, cost: rows[i].cost + cost };
  else rows.push({ sku, qty, cost });
  const epoch = currentEpoch(now);
  const next: SimAccount = { ...acc, cash: acc.cash - cost, commerce: rows };
  const booked = withLedger(next, [
    makeEntry(next, {
      epoch,
      kind: "VAULT_DEPOSIT",
      asset: "sUSDC",
      amount: -cost,
      from: TREASURY,
      to: `desk:atelier:${sku}`,
      memo: `${item.name} · ${qty} at ${item.price} USD`,
      ts: now,
    }),
  ]);
  return { ...booked, navHistory: [...acc.navHistory, { epoch, nav: accountNav(booked, epoch) }].slice(-NAV_HISTORY_CAP) };
}

export function exposureCount(acc: SimAccount): number {
  const v = Object.values(acc.vaults).filter((p) => p.shares > DUST).length;
  const t = Object.values(acc.positions).filter((p) => p.qty > DUST).length;
  return v + t;
}

// ─── Internal helpers ────────────────────────────────────────────────────────

function withLedger(acc: SimAccount, entries: LedgerEntry[]): SimAccount {
  return entries.length ? { ...acc, ledger: appendLedger(acc.ledger, entries) } : acc;
}

function grant(acc: SimAccount, id: string): SimAccount {
  if (acc.achievements.includes(id)) return acc;
  const a = ACHIEVEMENT_BY_ID[id];
  if (!a) return acc;
  return { ...acc, achievements: [...acc.achievements, id], xp: acc.xp + a.xp };
}

function checkPortfolioAchievements(acc: SimAccount): SimAccount {
  let next = acc;
  if (exposureCount(next) >= 5) next = grant(next, "diversified");
  const hasTail = (next.vaults.tail?.shares ?? 0) > DUST;
  const hasRisk =
    ["aidx", "momo", "dnlp"].some((id) => (next.vaults[id]?.shares ?? 0) > DUST) ||
    Object.entries(next.positions).some(
      ([sym, p]) => p.qty > DUST && INSTRUMENT_BY_SYMBOL[sym]?.cls !== "etf",
    );
  if (hasTail && hasRisk) next = grant(next, "hedged");
  return next;
}

function requireGenesis(acc: SimAccount): void {
  if (!acc.genesisClaimedAt) throw new SimError("Post the opening credit before using this rail.");
}

// ─── Settlement ──────────────────────────────────────────────────────────────

export interface SettlementReport {
  epochs: number;
  feeShare: number;
  compounded: number;
  emitted: number;
  xp: number;
}

export function settle(
  acc: SimAccount,
  now = Date.now(),
): { account: SimAccount; report: SettlementReport } {
  const target = currentEpoch(now);
  const report: SettlementReport = { epochs: 0, feeShare: 0, compounded: 0, emitted: 0, xp: 0 };
  if (!acc.genesisClaimedAt || target <= acc.lastSettledEpoch) {
    return { account: acc, report };
  }

  let next: SimAccount = {
    ...acc,
    vaults: { ...acc.vaults },
    navHistory: acc.navHistory.slice(),
  };
  const start = Math.max(acc.lastSettledEpoch + 1, target - MAX_CATCHUP_EPOCHS + 1);
  let pendingSpread = next.pendingSpreadFee;
  let sawStressWhileInvested = false;

  for (let e = start; e <= target; e++) {
    const ts = epochStart(e);

    // 1. Protocol fee share, pro-rata by veXC weight.
    const weight = totalWeight(next.locks, ts);
    const pool = (networkFeesAt(e) + pendingSpread) * FEE_SWITCH;
    pendingSpread = 0;
    const payout = weight > 0 ? (pool * weight) / (networkVeWeightAt(e) + weight) : 0;

    if (payout > 0) {
      report.feeShare += payout;
      const compounding = Object.entries(next.vaults).filter(
        ([, p]) => p.autoCompound && p.shares > DUST,
      );
      const base = compounding.reduce((a, [id, p]) => a + p.shares * navAt(id, e), 0);
      if (compounding.length && base > 0) {
        for (const [id, p] of compounding) {
          const slice = (payout * p.shares * navAt(id, e)) / base;
          next.vaults[id] = {
            ...p,
            shares: p.shares + slice / navAt(id, e),
            costBasis: p.costBasis + slice,
          };
        }
        report.compounded += payout;
      } else {
        next.cash += payout;
      }
    }

    // 2. sXC emissions on deployed capital.
    const deployed = vaultsValue(next, e) + positionsValue(next);
    const emitted = (deployed / 1000) * EMISSION_PER_1K * tierFor(next.xp).boost;
    if (emitted > 0) {
      next.sxc += emitted;
      report.emitted += emitted;
    }

    // 3. Skill XP: diversification and holding through drawdowns.
    const exposures = exposureCount(next);
    let xp = 0;
    if (exposures > 0) {
      xp += XP_RULES.diversificationPerExposure * Math.min(exposures, XP_RULES.diversificationCap);
    }
    for (const [id, p] of Object.entries(next.vaults)) {
      if (p.shares > DUST && drawdownFromPeak(id, e, 90) <= XP_RULES.disciplineThreshold) {
        xp += XP_RULES.discipline;
      }
    }
    if (regimeAt(e) === "stress" && Object.entries(next.vaults).some(
      ([id, p]) => p.shares > DUST && VAULT_BY_ID[id]?.kind === "strategy",
    )) {
      sawStressWhileInvested = true;
    }
    next.xp += xp;
    report.xp += xp;

    // 4. NAV history and season roll.
    const nav = accountNav(next, e);
    const season = seasonOf(e);
    if (season !== next.season.index) {
      const prevNav = next.navHistory[next.navHistory.length - 1]?.nav ?? nav;
      next.season = { index: season, startNav: prevNav, startEpoch: e };
    }
    next.navHistory.push({ epoch: e, nav });
    report.epochs++;
  }

  if (next.navHistory.length > NAV_HISTORY_CAP) {
    next.navHistory = next.navHistory.slice(-NAV_HISTORY_CAP);
  }
  next.lastSettledEpoch = target;
  next.pendingSpreadFee = pendingSpread;
  next.totals = {
    ...next.totals,
    feeShare: next.totals.feeShare + report.feeShare,
    sxcEmitted: next.totals.sxcEmitted + report.emitted,
  };

  const entries: LedgerEntry[] = [];
  if (report.feeShare > 0) {
    entries.push(
      makeEntry(next, {
        epoch: target,
        kind: "FEE_SHARE",
        asset: "sUSDC",
        amount: report.feeShare,
        from: "protocol:fees",
        to: TREASURY,
        memo: `veXC fee share across ${report.epochs} epoch(s)`,
        ts: now,
      }),
    );
    if (report.compounded > 0) {
      entries.push(
        makeEntry(next, {
          epoch: target,
          kind: "COMPOUND",
          asset: "sUSDC",
          amount: -report.compounded,
          from: TREASURY,
          to: "vaults:auto-compound",
          memo: "Fee share reinvested pro-rata into auto-compounding vaults",
          ts: now,
        }),
      );
    }
  }
  if (report.emitted > 0) {
    entries.push(
      makeEntry(next, {
        epoch: target,
        kind: "EMISSION",
        asset: "sXC",
        amount: report.emitted,
        from: "protocol:emissions",
        to: TREASURY,
        memo: `XC accrual on deployed capital (${tierFor(next.xp).title} ${tierFor(next.xp).boost}x)`,
        ts: now,
      }),
    );
  }
  next = withLedger(next, entries);
  if (report.compounded > 0) next = grant(next, "compounder");
  if (sawStressWhileInvested) next = grant(next, "survivor");

  return { account: next, report };
}

// ─── Actions ─────────────────────────────────────────────────────────────────

export function claimGenesis(acc: SimAccount, now = Date.now()): SimAccount {
  if (acc.genesisClaimedAt) throw new SimError("Opening credit already posted.");
  const epoch = currentEpoch(now);
  let next: SimAccount = {
    ...acc,
    genesisClaimedAt: now,
    cash: acc.cash + GENESIS_ALLOCATION,
    lastSettledEpoch: epoch,
    navHistory: [{ epoch, nav: GENESIS_ALLOCATION }],
    season: { index: seasonOf(epoch), startNav: GENESIS_ALLOCATION, startEpoch: epoch },
  };
  next = withLedger(next, [
    makeEntry(next, {
      epoch,
      kind: "GENESIS",
      asset: "sUSDC",
      amount: GENESIS_ALLOCATION,
      from: "protocol:genesis",
      to: TREASURY,
      memo: "Book opened at zero. Cash posts only after a confirmed crypto deposit.",
      ts: now,
    }),
  ]);
  return grant(next, "genesis");
}

const GIFT_USD = 100_000;

/** Opens a zero book, and retires the old automatic $100k credit when no real deposit exists. */
export function openZeroBook(acc: SimAccount, now = Date.now()): SimAccount {
  const gifted = acc.ledger.some((e) => e.kind === "GENESIS" && e.amount >= GIFT_USD);
  const funded = acc.ledger.some((e) => e.kind === "DEPOSIT");
  if (gifted && !funded) return claimGenesis(createAccount(acc.userId, acc.createdAt), now);
  if (!acc.genesisClaimedAt) return claimGenesis(acc, now);
  return acc;
}

/** Credits USD after an operator confirms a crypto transfer. */
export function creditConfirmedDeposit(
  acc: SimAccount,
  usd: number,
  asset: string,
  txHash: string,
  now = Date.now(),
): SimAccount {
  if (!(usd > 0)) throw new SimError("Enter the USD value of the confirmed transfer.");
  let next = acc.genesisClaimedAt ? acc : claimGenesis(acc, now);
  const epoch = currentEpoch(now);
  const cash = next.cash + usd;
  const season = next.season.startNav > 0 ? next.season : { ...next.season, startNav: cash, startEpoch: epoch };
  const nav = accountNav({ ...next, cash }, epoch);
  next = {
    ...next,
    cash,
    season,
    navHistory: [...next.navHistory, { epoch, nav }].slice(-NAV_HISTORY_CAP),
  };
  return withLedger(next, [
    makeEntry(next, {
      epoch,
      kind: "DEPOSIT",
      asset: "sUSDC",
      amount: usd,
      from: `chain:${asset}`,
      to: TREASURY,
      memo: `Confirmed ${asset} deposit ${txHash}`,
      ts: now,
    }),
  ]);
}

export function resetAccount(acc: SimAccount, now = Date.now()): SimAccount {
  const claimed = claimGenesis(
    { ...createAccount(acc.userId, now), resets: acc.resets + 1, tradingHalted: acc.tradingHalted },
    now,
  );
  return withLedger(
    { ...claimed, xp: acc.xp, achievements: acc.achievements, streak: acc.streak },
    [
      makeEntry(claimed, {
        epoch: currentEpoch(now),
        kind: "RESET",
        asset: "sUSDC",
        amount: 0,
        from: "protocol",
        to: TREASURY,
        memo: `Book reset #${acc.resets + 1} — counted on the leaderboard`,
        ts: now,
      }),
    ],
  );
}

export function depositVault(acc: SimAccount, vaultId: string, amount: number, now = Date.now()): SimAccount {
  requireGenesis(acc);
  const spec = VAULT_BY_ID[vaultId];
  if (!spec) throw new SimError("Unknown vault.");
  if (!(amount > 0)) throw new SimError("Enter an amount.");
  if (amount < spec.minTicket) throw new SimError(`Minimum ticket is ${spec.minTicket.toLocaleString()} USD.`);
  if (amount > acc.cash + 1e-6) throw new SimError("Insufficient USD in Treasury.");

  const epoch = currentEpoch(now);
  const nav = navAt(vaultId, epoch);
  const prev = acc.vaults[vaultId];
  let next: SimAccount = {
    ...acc,
    cash: acc.cash - amount,
    vaults: {
      ...acc.vaults,
      [vaultId]: {
        shares: (prev?.shares ?? 0) + amount / nav,
        costBasis: (prev?.costBasis ?? 0) + amount,
        lastDepositEpoch: epoch,
        autoCompound: prev?.autoCompound ?? true,
      },
    },
  };
  next = withLedger(next, [
    makeEntry(next, {
      epoch,
      kind: "VAULT_DEPOSIT",
      asset: "sUSDC",
      amount: -amount,
      from: TREASURY,
      to: `vault:${vaultId}`,
      memo: `Minted ${(amount / nav).toFixed(4)} ${spec.code} shares @ NAV ${nav.toFixed(4)}`,
      ts: now,
    }),
  ]);
  next = grant(next, spec.kind === "rwa" ? "first-rwa" : "first-vault");
  return checkPortfolioAchievements(next);
}

export function redemptionOpensAt(acc: SimAccount, vaultId: string): number {
  const spec = VAULT_BY_ID[vaultId];
  const p = acc.vaults[vaultId];
  if (!spec || !p) return 0;
  return p.lastDepositEpoch + spec.lockEpochs;
}

export function withdrawVault(acc: SimAccount, vaultId: string, amount: number, now = Date.now()): SimAccount {
  requireGenesis(acc);
  const spec = VAULT_BY_ID[vaultId];
  const p = acc.vaults[vaultId];
  if (!spec || !p || p.shares <= DUST) throw new SimError("No position in this vault.");
  const epoch = currentEpoch(now);
  const opens = redemptionOpensAt(acc, vaultId);
  if (epoch < opens) {
    throw new SimError(`Redemption window opens at epoch ${opens.toLocaleString()} (${opens - epoch} epoch(s) away).`);
  }
  const nav = navAt(vaultId, epoch);
  const value = p.shares * nav;
  const take = Math.min(amount, value);
  if (!(take > 0)) throw new SimError("Enter an amount.");
  const fraction = take / value;
  const remaining = fraction >= 1 - 1e-9 ? 0 : p.shares * (1 - fraction);

  const vaults = { ...acc.vaults };
  if (remaining <= DUST) delete vaults[vaultId];
  else vaults[vaultId] = { ...p, shares: remaining, costBasis: p.costBasis * (1 - fraction) };

  const next: SimAccount = { ...acc, cash: acc.cash + take, vaults };
  return withLedger(next, [
    makeEntry(next, {
      epoch,
      kind: "VAULT_WITHDRAW",
      asset: "sUSDC",
      amount: take,
      from: `vault:${vaultId}`,
      to: TREASURY,
      memo: `Burned ${(take / nav).toFixed(4)} ${spec.code} shares @ NAV ${nav.toFixed(4)}`,
      ts: now,
    }),
  ]);
}

export function setAutoCompound(acc: SimAccount, vaultId: string, on: boolean): SimAccount {
  const p = acc.vaults[vaultId];
  if (!p) return acc;
  return { ...acc, vaults: { ...acc.vaults, [vaultId]: { ...p, autoCompound: on } } };
}

export function setTradingHalt(acc: SimAccount, halted: boolean): SimAccount {
  return { ...acc, tradingHalted: halted };
}

export function executeTrade(
  acc: SimAccount,
  quote: Quote,
  side: "BUY" | "SELL",
  input: { notional?: number; qty?: number },
  now = Date.now(),
): SimAccount {
  requireGenesis(acc);
  if (acc.tradingHalted) throw new SimError("Trading is frozen on this desk.");
  const inst = INSTRUMENT_BY_SYMBOL[quote.symbol];
  if (!inst) throw new SimError("Unknown instrument.");
  const epoch = currentEpoch(now);
  const pos = acc.positions[quote.symbol];

  if (side === "BUY") {
    const notional = input.notional ?? (input.qty ?? 0) * quote.ask;
    if (!(notional >= 1)) throw new SimError("Minimum order is 1 USD.");
    if (notional > acc.cash + 1e-6) throw new SimError("Insufficient USD in Treasury.");
    const qty = notional / quote.ask;
    const spread = qty * (quote.ask - quote.mid);
    const newQty = (pos?.qty ?? 0) + qty;
    const avgCost = ((pos?.qty ?? 0) * (pos?.avgCost ?? 0) + notional) / newQty;
    let next: SimAccount = {
      ...acc,
      cash: acc.cash - notional,
      positions: { ...acc.positions, [quote.symbol]: { qty: newQty, avgCost } },
      marks: { ...acc.marks, [quote.symbol]: quote.mid },
      pendingSpreadFee: acc.pendingSpreadFee + spread,
      totals: { ...acc.totals, spreadPaid: acc.totals.spreadPaid + spread, trades: acc.totals.trades + 1 },
    };
    next = withLedger(next, [
      makeEntry(next, {
        epoch,
        kind: "TRADE_BUY",
        asset: "sUSDC",
        amount: -notional,
        from: TREASURY,
        to: `exec:${quote.symbol}`,
        memo: `BUY ${qty.toFixed(6)} ${quote.symbol} @ ${quote.ask.toFixed(4)} (${quote.source}, spread ${spread.toFixed(2)})`,
        ts: now,
      }),
    ]);
    return checkPortfolioAchievements(grant(next, "first-trade"));
  }

  if (!pos || pos.qty <= DUST) throw new SimError(`No ${quote.symbol} position to sell.`);
  const qty = Math.min(pos.qty, input.qty ?? (input.notional ?? 0) / quote.bid);
  if (!(qty > DUST)) throw new SimError("Enter a quantity.");
  const proceeds = qty * quote.bid;
  const spread = qty * (quote.mid - quote.bid);
  const left = pos.qty - qty;
  const positions = { ...acc.positions };
  if (left <= DUST) delete positions[quote.symbol];
  else positions[quote.symbol] = { ...pos, qty: left };

  const next: SimAccount = {
    ...acc,
    cash: acc.cash + proceeds,
    positions,
    marks: { ...acc.marks, [quote.symbol]: quote.mid },
    pendingSpreadFee: acc.pendingSpreadFee + spread,
    totals: { ...acc.totals, spreadPaid: acc.totals.spreadPaid + spread, trades: acc.totals.trades + 1 },
  };
  return withLedger(next, [
    makeEntry(next, {
      epoch,
      kind: "TRADE_SELL",
      asset: "sUSDC",
      amount: proceeds,
      from: `exec:${quote.symbol}`,
      to: TREASURY,
      memo: `SELL ${qty.toFixed(6)} ${quote.symbol} @ ${quote.bid.toFixed(4)} (${quote.source}, P&L ${((quote.bid - pos.avgCost) * qty).toFixed(2)})`,
      ts: now,
    }),
  ]);
}

export type RaiseCashResult = {
  account: SimAccount;
  raised: number;
  sold: string[];
  locked: string[];
};

/** Sells every spot position at the bid and redeems vaults whose window is open. Locked sleeves stay put. */
export function raiseCash(acc: SimAccount, mids: Record<string, number>, now = Date.now()): RaiseCashResult {
  requireGenesis(acc);
  if (acc.tradingHalted) throw new SimError("Trading is frozen on this desk.");
  let next = acc;
  const sold: string[] = [];
  const locked: string[] = [];
  const startCash = acc.cash;

  for (const [symbol, pos] of Object.entries({ ...acc.positions })) {
    if (pos.qty <= DUST) continue;
    const inst = INSTRUMENT_BY_SYMBOL[symbol];
    const mid = mids[symbol] ?? acc.marks[symbol] ?? pos.avgCost;
    if (!inst || !(mid > 0)) {
      locked.push(`${symbol} has no price, so it was left in place.`);
      continue;
    }
    const quote = buildQuote(inst, mid, 0, mids[symbol] ? "LIVE" : "MARKED");
    next = executeTrade(next, quote, "SELL", { qty: pos.qty }, now);
    sold.push(symbol);
  }

  for (const vaultId of Object.keys(next.vaults)) {
    const value = vaultValue(next, vaultId);
    if (!(value > 0)) continue;
    try {
      next = withdrawVault(next, vaultId, value, now);
      sold.push(vaultId);
    } catch (err) {
      if (err instanceof SimError) locked.push(err.message);
      else throw err;
    }
  }

  next = settleFleetIncome(next, now);
  if ((next.fleet?.cost ?? 0) > 0 && next.fleet) {
    const cost = next.fleet.cost;
    const epoch = currentEpoch(now);
    next = {
      ...next,
      cash: next.cash + cost,
      fleet: undefined,
    };
    next = withLedger(next, [
      makeEntry(next, {
        epoch,
        kind: "VAULT_WITHDRAW",
        asset: "sUSDC",
        amount: cost,
        from: "desk:fleet",
        to: TREASURY,
        memo: "Fleet returned to cash at cost",
        ts: now,
      }),
    ]);
    sold.push("fleet");
  }

  const goods = next.commerce ?? [];
  if (goods.length > 0) {
    const cost = goods.reduce((sum, h) => sum + h.cost, 0);
    const epoch = currentEpoch(now);
    next = { ...next, cash: next.cash + cost, commerce: [] };
    if (cost > 0) {
      next = withLedger(next, [
        makeEntry(next, {
          epoch,
          kind: "VAULT_WITHDRAW",
          asset: "sUSDC",
          amount: cost,
          from: "desk:atelier",
          to: TREASURY,
          memo: "Atelier holdings returned to cash at cost",
          ts: now,
        }),
      ]);
    }
    sold.push("atelier");
  }

  if (sold.length === 0 && locked.length === 0) {
    throw new SimError("Nothing is held that can be turned into cash.");
  }
  return { account: next, raised: Math.max(0, next.cash - startCash), sold, locked };
}

export function lockSxc(acc: SimAccount, amount: number, days: number, now = Date.now()): SimAccount {
  requireGenesis(acc);
  if (!LOCK_TERMS.some((t) => t.days === days)) throw new SimError("Unsupported lock term.");
  if (!(amount > 0)) throw new SimError("Enter an amount.");
  if (amount > acc.sxc + 1e-9) throw new SimError("Insufficient XC.");
  const lock = {
    id: `lock-${now.toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    amount,
    startTs: now,
    endTs: now + days * 86_400_000,
  };
  let next: SimAccount = { ...acc, sxc: acc.sxc - amount, locks: [...acc.locks, lock] };
  next = withLedger(next, [
    makeEntry(next, {
      epoch: epochAt(now),
      kind: "LOCK",
      asset: "sXC",
      amount: -amount,
      from: TREASURY,
      to: `veXC:${lock.id}`,
      memo: `Locked ${amount.toFixed(2)} XC for ${days}D → ${lockWeight(lock, now).toFixed(2)} weight`,
      ts: now,
    }),
  ]);
  return grant(next, "first-lock");
}

export function unlockSxc(acc: SimAccount, lockId: string, now = Date.now()): SimAccount {
  const lock = acc.locks.find((l) => l.id === lockId);
  if (!lock) throw new SimError("Lock not found.");
  if (!isUnlockable(lock, now)) throw new SimError("This lock has not expired yet.");
  const next: SimAccount = {
    ...acc,
    sxc: acc.sxc + lock.amount,
    locks: acc.locks.filter((l) => l.id !== lockId),
  };
  return withLedger(next, [
    makeEntry(next, {
      epoch: epochAt(now),
      kind: "UNLOCK",
      asset: "sXC",
      amount: lock.amount,
      from: `veXC:${lock.id}`,
      to: TREASURY,
      memo: `Unlocked ${lock.amount.toFixed(2)} XC`,
      ts: now,
    }),
  ]);
}

export function checkIn(acc: SimAccount, now = Date.now()): { account: SimAccount; xp: number } {
  const today = utcDay(now);
  if (acc.streak.lastDay === today) return { account: acc, xp: 0 };
  const yesterday = utcDay(now - 86_400_000);
  const count = acc.streak.lastDay === yesterday ? acc.streak.count + 1 : 1;
  const xp = XP_RULES.checkInBase * Math.min(count, XP_RULES.streakCap);
  let next: SimAccount = { ...acc, xp: acc.xp + xp, streak: { count, lastDay: today } };
  if (count >= 7) next = grant(next, "streak-7");
  return { account: next, xp };
}

export function markPositions(acc: SimAccount, mids: Record<string, number>): SimAccount {
  const held = Object.keys(acc.positions).filter((s) => mids[s] && mids[s] !== acc.marks[s]);
  if (!held.length) return acc;
  const marks = { ...acc.marks };
  for (const s of held) marks[s] = mids[s];
  return { ...acc, marks };
}
