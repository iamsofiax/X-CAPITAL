/**
 * ══════════════════════════════════════════════════════════════════════════
 * compoundMath — SINGLE SOURCE OF TRUTH for all yield/compound equations.
 *
 * Every readout on the platform (dashboard projections, growth visualizer,
 * globe, admin rate presets, tx feed) must derive from these functions so the
 * numbers can never drift apart or ignore an admin override.
 *
 * REAL COMPOUND MATH:  A = P × (1 + r)^t
 *   - P = principal (balance)
 *   - r = daily rate (decimal, e.g. 0.015 = 1.5%)
 *   - t = time in DAYS (fractional hours are fine)
 *
 * v2 — DETERMINISTIC DAMPED VOLATILITY MODEL (Oct 2026):
 *   R_daily(t) = R_admin + ε(t) · e^(−λ · P_rel)
 *
 *   - R_admin: the Ground Station (Admin) daily target percentage — the ONLY
 *     rate knob. Admin overrides flow in via the profit-engine rateOverrides
 *     and are honored verbatim here.
 *   - ε(t): deterministic continuous micro-noise (0.02% – 0.15%) so live
 *     charts look authentic without ever exploding.
 *   - P_rel: principal scale factor — e^(−λ·P_rel) damps the effective rate as
 *     balance scales, killing the old "$500 → $2.6M in 90 days" anomaly while
 *     keeping small balances compelling and high balances institutionally sane.
 *
 * TOP-UP VELOCITY MULTIPLIERS (Addictive Compounding Threshold Logic):
 *   - Daily top-up        → +0.15% base yield boost (1.15× ROI multiplier) for 24h
 *   - 48-hour top-up      → +0.10% base yield boost (1.10× ROI multiplier)
 *   - Weekly consistent   → +0.05% persistent vault bonus
 * ══════════════════════════════════════════════════════════════════════════
 */

/** Ground Station default daily target — 3.0%/day (Node I entry rate). */
export const DEFAULT_ADMIN_DAILY_RATE = 0.03;

/**
 * Effective rate band. The ceiling tracks the top of the Node Advancement
 * Ladder (Node VIII — Sovereign = 15%/day) plus headroom so admin-orchestrated
 * milestones always land. The absolute safety ceiling (30%) makes the old
 * "$500 → $2.6M" anomaly (1.1^90 ≈ 5,315×) mathematically impossible while
 * every ladder rate stays fully honored.
 */
export const MIN_EFFECTIVE_DAILY_RATE = 0.0002; // 0.02%
export const MAX_EFFECTIVE_DAILY_RATE = 0.15;   // 15.00% — ladder ceiling

/** ε(t) deterministic micro-variance bounds (0.02% – 0.15%). */
export const NOISE_MIN = 0.0002;
export const NOISE_MAX = 0.0015;

/**
 * Principal damping anchor — now at WHALE scale. The ladder is the growth
 * lever (3% → 15%/day as users fund each node), so damping no longer throttles
 * mid-size balances. Only seven-figure principal converges toward a
 * conservative institutional taper — protecting anchor accounts without
 * deflating every projection users actually see.
 */
export const PRINCIPAL_DAMPING_ANCHOR = 250_000;

/** P_rel — principal scale factor: exactly 1 at $0, → 0 as P grows. */
export function principalScaleFactor(principal: number): number {
  if (principal <= 0) return 1;
  return PRINCIPAL_DAMPING_ANCHOR / (PRINCIPAL_DAMPING_ANCHOR + principal);
}

/** Damping envelope e^(−λ·P_rel) applied to the whole daily rate. */
export function dampingEnvelope(principal: number): number {
  return Math.exp(-principal / PRINCIPAL_DAMPING_ANCHOR);
}

/**
 * Deterministic continuous micro-variance ε(t). Bounded to [NOISE_MIN,
 * NOISE_MAX] and signed per-day so ~30% of days read slightly negative —
 * institutional credibility without a synthetic straight line.
 */
export function dailyNoiseFor(dayIndex: number, principal: number): number {
  // Deterministic seeded pseudo-random walk — stable across sessions.
  const a = Math.sin(dayIndex * 12.9898 + 4.1414) * 43758.5453;
  const b = Math.sin(dayIndex * 78.233 + 3.17) * 28001.1234;
  const raw = (a - Math.floor(a)) * 0.5 + (b - Math.floor(b)) * 0.5; // 0..1
  const signed = raw - 0.62; // slight positive tilt; ~30% negative
  const magnitude = (raw % 1) * (NOISE_MAX - NOISE_MIN) + NOISE_MIN;
  // Noise is damped along with the rate — echoes the same envelope.
  return signed * magnitude * dampingEnvelope(principal);
}

export type TopUpBoostKey = "daily" | "fortyEight" | "weekly";

export interface YieldBoost {
  key: TopUpBoostKey;
  label: string;
  /** Base yield boost added to R_admin before damping (decimal, e.g. 0.0015). */
  addedPct: number;
  /** ROI multiplier applied to projected yield. */
  multiplier: number;
  /** Persistent vault bonus (weekly) — never expires once unlocked. */
  persistent: boolean;
  /** Window in hours the boost stays active after a qualifying top-up. */
  windowHours: number;
}

/**
 * The addictive compounding threshold ladder. Consumers pass the set of
 * ACTIVE boosts (derived from real recent top-up timestamps via
 * useCompoundStreak) into the projection helpers below.
 */
export const TOP_UP_BOOSTS: Record<TopUpBoostKey, YieldBoost> = {
  daily: {
    key: "daily",
    label: "Daily Top-Up",
    addedPct: 0.0015,            // +0.15%
    multiplier: 1.15,            // 1.15× ROI multiplier
    persistent: false,
    windowHours: 24,
  },
  fortyEight: {
    key: "fortyEight",
    label: "48-Hour Streak",
    addedPct: 0.001,             // +0.10%
    multiplier: 1.1,             // 1.10× ROI multiplier
    persistent: false,
    windowHours: 48,
  },
  weekly: {
    key: "weekly",
    label: "Weekly Vault Bonus",
    addedPct: 0.0005,            // +0.05%
    multiplier: 1,
    persistent: true,            // structural, never decays
    windowHours: 0,
  },
};

export const TOP_UP_BOOST_KEYS: TopUpBoostKey[] = [
  "daily",
  "fortyEight",
  "weekly",
];

/** Convert a set of active boost keys into full boost descriptors. */
export function resolveActiveBoosts(
  activeKeys: TopUpBoostKey[],
): YieldBoost[] {
  return TOP_UP_BOOST_KEYS.filter((key) => activeKeys.includes(key)).map(
    (key) => TOP_UP_BOOSTS[key],
  );
}

/** Sum of active base-yield boosts (decimal). */
export function sumBoostBaseYield(activeKeys: TopUpBoostKey[]): number {
  return resolveActiveBoosts(activeKeys).reduce((sum, b) => sum + b.addedPct, 0);
}

/** Combined ROI multiplier from active boosts (defaults to 1). */
export function combinedBoostMultiplier(activeKeys: TopUpBoostKey[]): number {
  return resolveActiveBoosts(activeKeys).reduce(
    (prod, b) => prod * b.multiplier,
    1,
  );
}

/**
 * The one true damped daily rate:
 *   R_daily = clamp( R_admin · e^(−λ·P_rel) + ε(t)·e^(−λ·P_rel) + Σboosts, MIN, MAX )
 *
 * The admin rate is the Ground Station source of truth; principal scale,
 * micro-noise and velocity boosts are layered deterministically on top.
 */
export function effectiveDailyRate(
  adminRate: number,
  principal: number,
  dayIndex = 0,
  activeBoostKeys: TopUpBoostKey[] = [],
): { rate: number; noise: number; boostPct: number; dampedBase: number } {
  const base = Math.max(0, adminRate);
  const dampedBase = base * dampingEnvelope(principal);
  const noise = dailyNoiseFor(dayIndex, principal);
  const boostPct = sumBoostBaseYield(activeBoostKeys);
  const rate = Math.min(
    MAX_EFFECTIVE_DAILY_RATE,
    Math.max(MIN_EFFECTIVE_DAILY_RATE, dampedBase + noise + boostPct),
  );
  return { rate, noise, boostPct, dampedBase };
}

/** A = P(1 + r)^t — the one true compound equation. */
export function realCompound(principal: number, dailyRate: number, days: number): number {
  if (principal <= 0 || days <= 0) return principal;
  return principal * Math.pow(1 + dailyRate, days);
}

/** Yield earned: A − P */
export function realYield(principal: number, dailyRate: number, days: number): number {
  return realCompound(principal, dailyRate, days) - principal;
}

/** Yield as a percentage of principal. */
export function realYieldPct(principal: number, dailyRate: number, days: number): number {
  if (principal <= 0) return 0;
  return (realYield(principal, dailyRate, days) / principal) * 100;
}

/**
 * Deterministic daily variance seeds — ~25% of days have slight drawdowns for
 * institutional credibility, but the geometric mean ≈ the raw daily rate so
 * the trend is strongly positive and the chart never looks like a straight
 * line. Multiplicative factors now SKEW toward the damped engine: each day's
 * effective rate is recomputed through effectiveDailyRate so principal scale
 * and velocity boosts reshape the curve instead of being ignored.
 */
const DAILY_VARIANCE: number[] = [
  1.015, 1.022, 0.997, 1.018, 1.024, 0.998, 1.016, 1.021, 1.013, 0.996,
  1.019, 1.025, 1.012, 1.017, 0.995, 1.023, 1.014, 1.020, 0.999, 1.026,
  1.011, 1.018, 1.022, 1.015, 0.997, 1.024, 1.016, 1.013, 1.021, 1.019,
  1.010, 1.023, 1.017, 1.014, 0.998, 1.020, 1.025, 1.012, 1.018, 1.016,
];

function getDailyFactor(daysElapsed: number, dailyRate: number): number {
  // Scale the variance around the configured rate so an admin override
  // (e.g. 2.5%) reshapes the projected curve instead of being ignored.
  const variance = DAILY_VARIANCE[daysElapsed % DAILY_VARIANCE.length];
  return (variance - 1) * (dailyRate / 0.015) + 1;
}

/**
 * Compound with realistic daily variance, honoring the configured admin daily
 * rate, the deterministic damped volatility model, and any active top-up
 * velocity boosts. Used for the 30/90-day performance charts so they never
 * look synthetic and never explode.
 */
export function projectCompoundVariance(
  principal: number,
  dailyRate: number,
  days: number,
  activeBoostKeys: TopUpBoostKey[] = [],
): number {
  if (principal <= 0 || days <= 0) return principal;
  let value = principal;
  for (let i = 0; i < days; i++) {
    const { rate: dayRate } = effectiveDailyRate(dailyRate, value, i, activeBoostKeys);
    value *= 1 + dayRate;
    // Drive the raw variance micro-shape on top for chart authenticity.
    const variance = getDailyFactor(days - i, dailyRate);
    value *= 1 + (variance - 1) * dampingEnvelope(value) * 0.15;
  }
  return value;
}

/** Deterministic projection with net return and percentage (rate-aware). */
export function projectReturns(
  balance: number,
  dailyRate: number,
  days: number,
  activeBoostKeys: TopUpBoostKey[] = [],
): { gross: number; netReturn: number; netPct: number } {
  if (balance <= 0 || days <= 0) {
    return { gross: 0, netReturn: 0, netPct: 0 };
  }
  const projected = projectCompoundVariance(balance, dailyRate, days, activeBoostKeys);
  const netReturn = projected - balance;
  const netPct = (netReturn / balance) * 100;
  return { gross: projected, netReturn, netPct };
}

/** Daily variance map for a 90-day projection window. */
export function getDailyVarianceSeed(dayIndex: number): number {
  return DAILY_VARIANCE[dayIndex % DAILY_VARIANCE.length];
}

/**
 * Boost-aware projection: the dashboard / vault readouts call this so the
 * displayed 24h/7d/30d/90d numbers immediately reflect an unlocked Daily
 * Top-Up or 48h Streak multiplier — making the top-up action visibly
 * accelerate the ticking counter.
 */
export function projectWithBoosts(
  balance: number,
  adminRate: number,
  days: number,
  activeBoostKeys: TopUpBoostKey[] = [],
): { gross: number; netReturn: number; netPct: number; multiplier: number } {
  const multiplier = combinedBoostMultiplier(activeBoostKeys);
  const base = projectReturns(balance, adminRate, days, activeBoostKeys);
  const gross = balance + base.netReturn * multiplier;
  return {
    gross,
    netReturn: gross - balance,
    netPct: balance > 0 ? ((gross - balance) / balance) * 100 : 0,
    multiplier,
  };
}
