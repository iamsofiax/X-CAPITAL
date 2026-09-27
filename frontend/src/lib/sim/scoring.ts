import { EPOCHS_PER_YEAR } from "./clock";
import type { NavPoint } from "./types";

export const MIN_EPOCHS_FOR_RANK = 6;

export function epochReturns(history: NavPoint[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < history.length; i++) {
    const prev = history[i - 1].nav;
    if (prev > 0) out.push(history[i].nav / prev - 1);
  }
  return out;
}

/** Annualized Sortino ratio with a 0% target. Null until there is enough history to be meaningful. */
export function sortino(history: NavPoint[]): number | null {
  const rets = epochReturns(history);
  if (rets.length < MIN_EPOCHS_FOR_RANK) return null;
  const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
  const downside = rets.map((r) => Math.min(0, r) ** 2);
  const dd = Math.sqrt(downside.reduce((a, b) => a + b, 0) / rets.length);
  if (dd === 0) return mean > 0 ? 9.99 : 0;
  const s = (mean * EPOCHS_PER_YEAR) / (dd * Math.sqrt(EPOCHS_PER_YEAR));
  return Math.max(-9.99, Math.min(9.99, s));
}

export function maxDrawdown(history: NavPoint[]): number {
  let peak = 0;
  let mdd = 0;
  for (const p of history) {
    peak = Math.max(peak, p.nav);
    if (peak > 0) mdd = Math.min(mdd, p.nav / peak - 1);
  }
  return mdd;
}

export function annualizedVol(history: NavPoint[]): number {
  const rets = epochReturns(history);
  if (rets.length < 2) return 0;
  const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
  const v = rets.reduce((a, b) => a + (b - mean) ** 2, 0) / (rets.length - 1);
  return Math.sqrt(v * EPOCHS_PER_YEAR);
}

// ─── Career ladder ───────────────────────────────────────────────────────────

export interface CareerTier {
  id: string;
  title: string;
  minXp: number;
  /** Multiplier on sXC emissions. */
  boost: number;
  perk: string;
}

export const CAREER_TIERS: CareerTier[] = [
  { id: "analyst", title: "Analyst", minXp: 0, boost: 1.0, perk: "Execution, Treasury and Strategy Vaults" },
  { id: "associate", title: "Associate", minXp: 1_000, boost: 1.1, perk: "+10% XC accrual" },
  { id: "vp", title: "Vice President", minXp: 5_000, boost: 1.25, perk: "+25% XC accrual" },
  { id: "director", title: "Director", minXp: 15_000, boost: 1.4, perk: "+40% XC accrual" },
  { id: "partner", title: "Partner", minXp: 40_000, boost: 1.6, perk: "+60% XC accrual" },
  { id: "gp", title: "General Partner", minXp: 100_000, boost: 2.0, perk: "2x XC accrual" },
];

export function tierFor(xp: number): CareerTier {
  let t = CAREER_TIERS[0];
  for (const c of CAREER_TIERS) if (xp >= c.minXp) t = c;
  return t;
}

export function nextTier(xp: number): CareerTier | null {
  return CAREER_TIERS.find((c) => c.minXp > xp) ?? null;
}

export function tierProgress(xp: number): number {
  const cur = tierFor(xp);
  const nxt = nextTier(xp);
  if (!nxt) return 1;
  return (xp - cur.minXp) / (nxt.minXp - cur.minXp);
}

// ─── XP rules ────────────────────────────────────────────────────────────────

export const XP_RULES = {
  /** Per settled epoch, per distinct exposure (vault or instrument), capped. */
  diversificationPerExposure: 5,
  diversificationCap: 6,
  /** Per settled epoch, per vault held while that vault sits ≥3% below its peak. */
  discipline: 15,
  disciplineThreshold: -0.03,
  /** Daily check-in: base × streak day, streak capped. */
  checkInBase: 20,
  streakCap: 7,
} as const;

export interface Achievement {
  id: string;
  title: string;
  description: string;
  xp: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: "genesis", title: "Desk Opened", description: "Opening credit posted to the node ledger", xp: 100 },
  { id: "first-vault", title: "First Allocation", description: "Deposited into a strategy vault", xp: 150 },
  { id: "first-trade", title: "First Fill", description: "Executed a trade on the Execution rail", xp: 150 },
  { id: "first-rwa", title: "Real-World Exposure", description: "Bought units of a tokenized RWA", xp: 150 },
  { id: "first-lock", title: "Conviction", description: "Locked XC for a share of protocol fees", xp: 250 },
  { id: "diversified", title: "Five-Sleeve Book", description: "Held 5+ distinct exposures at once", xp: 400 },
  { id: "hedged", title: "Bought Insurance", description: "Held the Tail-Risk Hedge alongside a risk asset", xp: 300 },
  { id: "compounder", title: "Compounder", description: "Auto-compounded a fee-share distribution", xp: 200 },
  { id: "streak-7", title: "Seven-Day Streak", description: "Checked in seven days in a row", xp: 500 },
  { id: "survivor", title: "Held the Line", description: "Stayed invested through a stress regime", xp: 600 },
];

export const ACHIEVEMENT_BY_ID: Record<string, Achievement> = Object.fromEntries(
  ACHIEVEMENTS.map((a) => [a.id, a]),
);
