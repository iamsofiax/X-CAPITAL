export type YieldMandate = {
  userId: string;
  email: string;
  dailyPct: number;
  /** Published week target. Accrual still runs on the daily rate, so the week print stays consistent with the day. */
  weeklyPct: number;
  /** Share of the confirmed book the desk operates for this user. Gains stay off at 0. */
  operatedPct: number;
  activatedAt: number | null;
  principal: number;
  lastSettledAt: number;
  updatedAt: number;
};

export type PendingDeposit = {
  id: string;
  userId: string;
  email: string;
  asset: string;
  txHash: string;
  at: number;
  status: "pending" | "confirmed";
  usd?: number;
};

export type DeskNotice = {
  id: string;
  userId: string;
  title: string;
  body: string;
  at: number;
  read: boolean;
};

const MANDATES = "xc_yield_mandates";
const NOTICES = "xc_desk_notices";
const DEPOSITS = "xc_pending_deposits";
const RECEIPTS = "xc_trade_receipts";
const DAY = 86_400_000;

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event("xc-yield"));
}

export function listMandates(): YieldMandate[] {
  return readJson<YieldMandate[]>(MANDATES, []);
}

export function readMandate(userId: string): YieldMandate | null {
  return listMandates().find((m) => m.userId === userId) ?? null;
}

export function weeklyFromDaily(dailyPct: number) {
  return (Math.pow(1 + dailyPct / 100, 7) - 1) * 100;
}

export function weeklyOf(mandate: YieldMandate) {
  if (typeof mandate.weeklyPct === "number" && mandate.weeklyPct >= 0) return mandate.weeklyPct;
  return weeklyFromDaily(mandate.dailyPct);
}

export function operatedOf(mandate: Pick<YieldMandate, "operatedPct">) {
  const n = mandate.operatedPct;
  if (typeof n !== "number" || Number.isNaN(n)) return 0;
  return Math.min(100, Math.max(0, n));
}

export function nodeActivated(mandate: YieldMandate | null | undefined) {
  return !!mandate && mandate.principal > 0 && operatedOf(mandate) > 0 && !!mandate.activatedAt;
}

export function setDailyGrowth(input: {
  userId: string;
  email: string;
  dailyPct: number;
  weeklyPct?: number;
  operatedPct?: number;
  principal: number;
}) {
  const pct = Math.round(input.dailyPct * 10000) / 10000;
  if (!(pct >= 0) || pct > 5) throw new Error("Daily growth must be between 0 and 5 percent.");
  const weekly = Math.round((input.weeklyPct ?? weeklyFromDaily(pct)) * 10000) / 10000;
  if (!(weekly >= 0) || weekly > 25) throw new Error("Weekly growth must be between 0 and 25 percent.");
  const operated = Math.round((input.operatedPct ?? 0) * 100) / 100;
  if (!(operated >= 0) || operated > 100) throw new Error("Operated percent must be between 0 and 100.");
  const now = Date.now();
  const prev = readMandate(input.userId);
  const principal = input.principal > 0 ? input.principal : prev?.principal ?? 0;
  const live = operated > 0 && principal > 0;
  const next: YieldMandate = {
    userId: input.userId,
    email: input.email,
    dailyPct: pct,
    weeklyPct: weekly,
    operatedPct: operated,
    activatedAt: live ? prev?.activatedAt ?? now : null,
    principal,
    lastSettledAt: now,
    updatedAt: now,
  };
  const rows = listMandates().filter((m) => m.userId !== input.userId);
  rows.unshift(next);
  writeJson(MANDATES, rows);
  pushNotice(
    input.userId,
    operated > 0 && principal > 0 ? "Node activated" : "Yield path staged",
    operated > 0 && principal > 0
      ? `The desk operates ${operated}% of the book at ${pct}% a day and ${weekly.toFixed(2)}% this week. Gains are live.`
      : `Path staged at ${pct}% a day. Gains stay off until funds are confirmed and the desk sets an operated percent.`,
  );
  return next;
}

export function touchMandate(userId: string, patch: Partial<YieldMandate>) {
  const rows = listMandates();
  const i = rows.findIndex((m) => m.userId === userId);
  if (i < 0) return null;
  rows[i] = { ...rows[i], ...patch, updatedAt: Date.now() };
  writeJson(MANDATES, rows);
  return rows[i];
}

const WEEK = 7 * DAY;
const TAPE_CYCLE = 18_000;

export function liveAccrual(mandate: YieldMandate, now = Date.now()) {
  const elapsed = Math.max(0, now - mandate.lastSettledAt);
  const operatedBase = mandate.principal * (operatedOf(mandate) / 100);
  const accruing = operatedBase * (mandate.dailyPct / 100) * (elapsed / DAY);
  const wholeDays = Math.floor(elapsed / DAY);
  const weeklyPct = weeklyOf(mandate);
  const intoWeek = elapsed % WEEK;
  const weekTarget = mandate.principal * (weeklyPct / 100);
  const weekProfit = weekTarget * (intoWeek / WEEK);
  return { elapsed, accruing, wholeDays, dayMs: DAY, weeklyPct, weekTarget, weekProfit, intoWeek };
}

const ILLUSTRATED_DAY = 24_000;

/**
 * One illustrated day of the mandate. The print may go negative, then the
 * daily rate puts it back so the day closes on the profit. Display only.
 */
export function illustratedDay(principal: number, dailyPct: number, weeklyPct: number, elapsedMs: number) {
  const into = elapsedMs % ILLUSTRATED_DAY;
  const p = into / ILLUSTRATED_DAY;
  const dayProfit = principal * (dailyPct / 100);
  const trend = dayProfit * p;
  const dipWindow = p > 0.62 && p < 0.74;
  const dip = dipWindow ? -dayProfit * 0.035 * Math.sin(((p - 0.62) / 0.12) * Math.PI) : 0;
  const tape = trend + dip;
  const dayIndex = Math.floor(elapsedMs / ILLUSTRATED_DAY);
  const weekDay = dayIndex % 7;
  const weekTarget = principal * (weeklyPct / 100);
  const weekSoFar = weekDay * dayProfit + Math.max(0, tape);
  return {
    tape,
    dayProfit,
    restored: p >= 0.35,
    inLoss: tape < 0,
    progress: p,
    weekDay,
    weekSoFar,
    weekTarget,
  };
}

/** Smooth daily accrual, with a short loss print that the mandate replaces. */
export function yieldTape(mandate: YieldMandate, now = Date.now()) {
  const accrual = liveAccrual(mandate, now);
  const elapsed = Math.max(0, now - (mandate.updatedAt || mandate.lastSettledAt));
  const p = (elapsed % TAPE_CYCLE) / TAPE_CYCLE;
  const amp = Math.min(accrual.accruing * 0.08, mandate.principal * operatedOf(mandate) / 100 * 0.00015);
  const dip = p > 0.72 && p < 0.84 ? -amp * Math.sin(((p - 0.72) / 0.12) * Math.PI) : 0;
  return {
    ...accrual,
    dip,
    tape: accrual.accruing + dip,
    restored: dip === 0,
  };
}

export function listNotices(userId: string): DeskNotice[] {
  return readJson<DeskNotice[]>(NOTICES, [])
    .filter((n) => n.userId === userId)
    .sort((a, b) => b.at - a.at);
}

export function unreadCount(userId: string) {
  return listNotices(userId).filter((n) => !n.read).length;
}

export function listDeposits(): PendingDeposit[] {
  return readJson<PendingDeposit[]>(DEPOSITS, []);
}

export function queueDeposit(row: Omit<PendingDeposit, "id" | "at" | "status">): PendingDeposit {
  const rows = listDeposits();
  const existing = rows.find((r) => r.txHash.toLowerCase() === row.txHash.toLowerCase() && r.status === "pending");
  if (existing) return existing;
  const next: PendingDeposit = {
    ...row,
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    at: Date.now(),
    status: "pending",
  };
  writeJson(DEPOSITS, [next, ...rows].slice(0, 200));
  return next;
}

export function confirmDepositRecord(id: string, usd: number) {
  const rows = listDeposits().map((r) => (r.id === id ? { ...r, status: "confirmed" as const, usd } : r));
  writeJson(DEPOSITS, rows);
}

export function pushNotice(userId: string, title: string, body: string) {
  if (typeof window === "undefined") return;
  const notice: DeskNotice = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    userId,
    title,
    body,
    at: Date.now(),
    read: false,
  };
  const rows = readJson<DeskNotice[]>(NOTICES, []);
  writeJson(NOTICES, [notice, ...rows].slice(0, 80));
}

export function markNoticesRead(userId: string) {
  const rows = readJson<DeskNotice[]>(NOTICES, []).map((n) =>
    n.userId === userId ? { ...n, read: true } : n,
  );
  writeJson(NOTICES, rows);
}

export type TradeReceipt = {
  id: string;
  userId: string;
  at: number;
  side: "BUY" | "SELL";
  symbol: string;
  name: string;
  qty: number;
  price: number;
  notional: number;
  spread: number;
};

export function listReceipts(userId: string): TradeReceipt[] {
  return readJson<TradeReceipt[]>(RECEIPTS, [])
    .filter((r) => r.userId === userId)
    .sort((a, b) => b.at - a.at);
}

export function saveReceipt(row: Omit<TradeReceipt, "id" | "at">): TradeReceipt {
  const next: TradeReceipt = {
    ...row,
    id: `XC-${Date.now().toString(36).toUpperCase()}`,
    at: Date.now(),
  };
  const rows = readJson<TradeReceipt[]>(RECEIPTS, []);
  writeJson(RECEIPTS, [next, ...rows].slice(0, 40));
  return next;
}

const KYC = "xc_kyc_packets";
const LINKS = "xc_external_links";

export type KycPacket = {
  id: string;
  userId: string;
  email: string;
  legalFirst: string;
  legalLast: string;
  dob: string;
  nationality: string;
  address: string;
  city: string;
  region: string;
  postal: string;
  country: string;
  phone: string;
  occupation: string;
  sourceOfFunds: string;
  docType: "Passport" | "National ID" | "Driver license";
  docNumber: string;
  at: number;
  status: "pending" | "approved" | "rejected";
};

export type ExternalLinkRequest = {
  id: string;
  userId: string;
  email: string;
  kind: "401k" | "IRA" | "Brokerage" | "Pension";
  custodian: string;
  planName: string;
  accountTitle: string;
  last4: string;
  requestedUsd: number;
  at: number;
  status: "pending" | "linked" | "booked" | "rejected";
  bookedUsd?: number;
};

function newId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function listKyc(): KycPacket[] {
  return readJson<KycPacket[]>(KYC, []);
}

export function latestKyc(userId: string): KycPacket | null {
  return listKyc().find((row) => row.userId === userId) ?? null;
}

export function submitKyc(row: Omit<KycPacket, "id" | "at" | "status">): KycPacket {
  const rows = listKyc().filter((r) => !(r.userId === row.userId && r.status === "pending"));
  const next: KycPacket = { ...row, id: newId(), at: Date.now(), status: "pending" };
  writeJson(KYC, [next, ...rows].slice(0, 200));
  return next;
}

export function setKycStatus(id: string, status: KycPacket["status"]) {
  writeJson(KYC, listKyc().map((row) => (row.id === id ? { ...row, status } : row)));
}

export function listLinks(): ExternalLinkRequest[] {
  return readJson<ExternalLinkRequest[]>(LINKS, []);
}

export function linksFor(userId: string): ExternalLinkRequest[] {
  return listLinks().filter((row) => row.userId === userId);
}

export function submitLink(row: Omit<ExternalLinkRequest, "id" | "at" | "status" | "bookedUsd">): ExternalLinkRequest {
  const rows = listLinks();
  const next: ExternalLinkRequest = { ...row, id: newId(), at: Date.now(), status: "pending" };
  writeJson(LINKS, [next, ...rows].slice(0, 200));
  return next;
}

export function setLinkStatus(id: string, status: ExternalLinkRequest["status"], bookedUsd?: number) {
  writeJson(
    LINKS,
    listLinks().map((row) => (row.id === id ? { ...row, status, bookedUsd: bookedUsd ?? row.bookedUsd } : row)),
  );
}
