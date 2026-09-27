import { EPOCHS_PER_YEAR } from "./clock";
import { normal, rngFor } from "./prng";

export type Regime = "calm" | "stress";
export type VaultKind = "strategy" | "rwa";

export interface RegimeParams {
  /** Annualized drift of log returns before the Itô correction. */
  mu: number;
  /** Annualized volatility. */
  sigma: number;
}

export interface VaultSpec {
  id: string;
  code: string;
  name: string;
  kind: VaultKind;
  thesis: string;
  mechanics: string;
  calm: RegimeParams;
  stress: RegimeParams;
  /** Performance fee on gains above the vault high-water mark. */
  perfFee: number;
  /** Epochs a position is locked after each deposit (RWA redemption windows). */
  lockEpochs: number;
  minTicket: number;
  risk: 1 | 2 | 3 | 4 | 5;
  /** Simulated network TVL at genesis, used for the protocol fee pool. */
  networkTvl: number;
  accent: string;
}

export const REGIME_TRANSITION = {
  calmToStress: 0.012,
  stressToCalm: 0.08,
} as const;

export const VAULTS: VaultSpec[] = [
  {
    id: "basis",
    code: "VLT-BASIS",
    name: "Basis Trade",
    kind: "strategy",
    thesis: "Long spot, short perpetual. Harvests funding and futures basis while staying market-neutral.",
    mechanics: "Carry accrues in calm regimes; basis blowouts during stress cause short, sharp drawdowns.",
    calm: { mu: 0.09, sigma: 0.03 },
    stress: { mu: -0.06, sigma: 0.09 },
    perfFee: 0.1,
    lockEpochs: 0,
    minTicket: 100,
    risk: 1,
    networkTvl: 80_000_000,
    accent: "#34d399",
  },
  {
    id: "dnlp",
    code: "VLT-DNLP",
    name: "Delta-Neutral LP",
    kind: "strategy",
    thesis: "Concentrated AMM liquidity, hedged with perps. Earns swap fees; pays impermanent loss when volatility spikes.",
    mechanics: "Fee income scales with volume. Hedge slippage and IL dominate in stress regimes.",
    calm: { mu: 0.15, sigma: 0.07 },
    stress: { mu: -0.28, sigma: 0.22 },
    perfFee: 0.1,
    lockEpochs: 0,
    minTicket: 100,
    risk: 2,
    networkTvl: 45_000_000,
    accent: "#22d3ee",
  },
  {
    id: "momo",
    code: "VLT-MOMO",
    name: "Momentum Quant",
    kind: "strategy",
    thesis: "Cross-asset time-series momentum with volatility targeting. Crisis alpha when trends persist.",
    mechanics: "Choppy calm markets grind slowly via whipsaw; sustained stress trends can pay handsomely.",
    calm: { mu: 0.07, sigma: 0.16 },
    stress: { mu: 0.4, sigma: 0.3 },
    perfFee: 0.1,
    lockEpochs: 0,
    minTicket: 100,
    risk: 3,
    networkTvl: 60_000_000,
    accent: "#a78bfa",
  },
  {
    id: "aidx",
    code: "VLT-AIDX",
    name: "AI Infrastructure Index",
    kind: "strategy",
    thesis: "Equal-risk basket of compute, networking, power, and cooling exposure. Pure beta to the AI capex cycle.",
    mechanics: "Highest long-run drift, highest drawdowns. Stress regimes can erase months of gains.",
    calm: { mu: 0.3, sigma: 0.34 },
    stress: { mu: -0.65, sigma: 0.55 },
    perfFee: 0.1,
    lockEpochs: 0,
    minTicket: 100,
    risk: 4,
    networkTvl: 90_000_000,
    accent: "#f472b6",
  },
  {
    id: "tail",
    code: "VLT-TAIL",
    name: "Tail-Risk Hedge",
    kind: "strategy",
    thesis: "Rolling out-of-the-money puts and variance. Built to lose slowly and win violently.",
    mechanics: "Negative carry in calm markets. Convex payoff when the regime flips to stress.",
    calm: { mu: -0.07, sigma: 0.05 },
    stress: { mu: 0.95, sigma: 0.45 },
    perfFee: 0.1,
    lockEpochs: 0,
    minTicket: 100,
    risk: 3,
    networkTvl: 25_000_000,
    accent: "#fbbf24",
  },
  {
    id: "tbill",
    code: "RWA-TBILL",
    name: "Tokenized T-Bill Ladder",
    kind: "rwa",
    thesis: "Rolling 1–6 month U.S. Treasury bills, tokenized. The risk-free anchor of the book.",
    mechanics: "Near-zero volatility. Instant redemption.",
    calm: { mu: 0.045, sigma: 0.004 },
    stress: { mu: 0.04, sigma: 0.006 },
    perfFee: 0.05,
    lockEpochs: 0,
    minTicket: 1_000,
    risk: 1,
    networkTvl: 120_000_000,
    accent: "#94a3b8",
  },
  {
    id: "pcred",
    code: "RWA-PCRED",
    name: "Senior Private Credit",
    kind: "rwa",
    thesis: "First-lien, floating-rate loans to sponsor-backed mid-market companies.",
    mechanics: "Contractual coupon; defaults cluster in stress. 3-day redemption window.",
    calm: { mu: 0.1, sigma: 0.04 },
    stress: { mu: -0.04, sigma: 0.1 },
    perfFee: 0.05,
    lockEpochs: 9,
    minTicket: 5_000,
    risk: 2,
    networkTvl: 40_000_000,
    accent: "#60a5fa",
  },
  {
    id: "dcre",
    code: "RWA-DCRE",
    name: "Data Center Real Estate",
    kind: "rwa",
    thesis: "Stabilized hyperscale campuses on long-dated triple-net leases.",
    mechanics: "Rental yield plus appraisal drift; cap-rate repricing in stress. 7-day window.",
    calm: { mu: 0.12, sigma: 0.1 },
    stress: { mu: -0.18, sigma: 0.2 },
    perfFee: 0.05,
    lockEpochs: 21,
    minTicket: 10_000,
    risk: 3,
    networkTvl: 30_000_000,
    accent: "#fb7185",
  },
  {
    id: "infra",
    code: "RWA-INFRA",
    name: "Grid & Energy Infrastructure",
    kind: "rwa",
    thesis: "Transmission, storage, and contracted generation assets with inflation-linked cash flows.",
    mechanics: "Defensive in stress, modest in calm. 7-day window.",
    calm: { mu: 0.085, sigma: 0.08 },
    stress: { mu: 0.03, sigma: 0.12 },
    perfFee: 0.05,
    lockEpochs: 21,
    minTicket: 10_000,
    risk: 2,
    networkTvl: 35_000_000,
    accent: "#4ade80",
  },
];

export const VAULT_BY_ID: Record<string, VaultSpec> = Object.fromEntries(
  VAULTS.map((v) => [v.id, v]),
);

export const STRATEGY_VAULTS = VAULTS.filter((v) => v.kind === "strategy");
export const RWA_VAULTS = VAULTS.filter((v) => v.kind === "rwa");

/** Share of protocol fees routed to veXC lockers. The remainder funds the simulated insurance reserve. */
export const FEE_SWITCH = 0.5;

const DT = 1 / EPOCHS_PER_YEAR;

export function epochLogReturn(p: RegimeParams, z: number): number {
  return (p.mu - 0.5 * p.sigma * p.sigma) * DT + p.sigma * Math.sqrt(DT) * z;
}

export function stepRegime(prev: Regime, u: number): Regime {
  if (prev === "calm") return u < REGIME_TRANSITION.calmToStress ? "stress" : "calm";
  return u < REGIME_TRANSITION.stressToCalm ? "calm" : "stress";
}

// ─── Canonical history (shared by every user) ────────────────────────────────

const regimes: Regime[] = ["calm"];

export function regimeAt(epoch: number): Regime {
  for (let e = regimes.length; e <= epoch; e++) {
    regimes.push(stepRegime(regimes[e - 1], rngFor(`regime:${e}`)()));
  }
  return regimes[epoch];
}

interface VaultSeries {
  gross: number[];
  net: number[];
  hwm: number[];
  /** Fee charged in epoch e as a fraction of the vault's net NAV at e-1. */
  feeRate: number[];
}

const series: Record<string, VaultSeries> = {};

function seriesFor(id: string): VaultSeries {
  if (!series[id]) series[id] = { gross: [1], net: [1], hwm: [1], feeRate: [0] };
  return series[id];
}

function extend(spec: VaultSpec, epoch: number): VaultSeries {
  const s = seriesFor(spec.id);
  for (let e = s.gross.length; e <= epoch; e++) {
    const regime = regimeAt(e);
    const z = normal(rngFor(`${spec.id}:${e}`));
    const r = epochLogReturn(regime === "calm" ? spec.calm : spec.stress, z);
    const prevGross = s.gross[e - 1];
    const gross = prevGross * Math.exp(r);
    const prevHwm = s.hwm[e - 1];
    const newHighGain = Math.max(0, gross - Math.max(prevHwm, prevGross));
    const feeRate = (spec.perfFee * newHighGain) / prevGross;
    const grossReturn = gross / prevGross - 1;
    s.gross.push(gross);
    s.hwm.push(Math.max(prevHwm, gross));
    s.feeRate.push(feeRate);
    s.net.push(s.net[e - 1] * (1 + grossReturn - feeRate));
  }
  return s;
}

export function navAt(vaultId: string, epoch: number): number {
  const spec = VAULT_BY_ID[vaultId];
  if (!spec) return 1;
  return extend(spec, epoch).net[epoch];
}

export function feeRateAt(vaultId: string, epoch: number): number {
  const spec = VAULT_BY_ID[vaultId];
  if (!spec || epoch <= 0) return 0;
  return extend(spec, epoch).feeRate[epoch];
}

export function navHistory(vaultId: string, fromEpoch: number, toEpoch: number): { epoch: number; nav: number }[] {
  const out: { epoch: number; nav: number }[] = [];
  for (let e = Math.max(0, fromEpoch); e <= toEpoch; e++) {
    out.push({ epoch: e, nav: navAt(vaultId, e) });
  }
  return out;
}

export function trailingReturn(vaultId: string, epoch: number, lookback: number): number {
  const from = Math.max(0, epoch - lookback);
  return navAt(vaultId, epoch) / navAt(vaultId, from) - 1;
}

export function drawdownFromPeak(vaultId: string, epoch: number, lookback = 270): number {
  let peak = 0;
  for (let e = Math.max(0, epoch - lookback); e <= epoch; e++) {
    peak = Math.max(peak, navAt(vaultId, e));
  }
  return peak > 0 ? navAt(vaultId, epoch) / peak - 1 : 0;
}

export function realizedVol(vaultId: string, epoch: number, lookback = 90): number {
  const rets: number[] = [];
  for (let e = Math.max(1, epoch - lookback + 1); e <= epoch; e++) {
    rets.push(Math.log(navAt(vaultId, e) / navAt(vaultId, e - 1)));
  }
  if (rets.length < 2) return 0;
  const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
  const variance = rets.reduce((a, b) => a + (b - mean) ** 2, 0) / (rets.length - 1);
  return Math.sqrt(variance * EPOCHS_PER_YEAR);
}

// ─── Simulated network: protocol fee pool and veXC supply ────────────────────

export function networkFeesAt(epoch: number): number {
  if (epoch <= 0) return 0;
  let total = 0;
  for (const v of VAULTS) {
    total += v.networkTvl * navAt(v.id, epoch - 1) * feeRateAt(v.id, epoch);
  }
  return total;
}

export function avgNetworkFees(epoch: number, lookback = 90): number {
  const from = Math.max(1, epoch - lookback + 1);
  let total = 0;
  for (let e = from; e <= epoch; e++) total += networkFeesAt(e);
  return epoch >= from ? total / (epoch - from + 1) : 0;
}

export function networkVeWeightAt(epoch: number): number {
  return 40_000_000 * (1 + epoch / 3000);
}

export function networkTvlAt(epoch: number): number {
  return VAULTS.reduce((acc, v) => acc + v.networkTvl * navAt(v.id, epoch), 0);
}
