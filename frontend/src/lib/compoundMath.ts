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
 * ══════════════════════════════════════════════════════════════════════════
 */

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
 * institutional credibility, but the geometric mean ≈ 1.015% so the trend is
 * strongly positive and the chart never looks like a straight line.
 */
const DAILY_VARIANCE: number[] = [
  1.015, 1.022, 0.997, 1.018, 1.024, 0.998, 1.016, 1.021, 1.013, 0.996,
  1.019, 1.025, 1.012, 1.017, 0.995, 1.023, 1.014, 1.020, 0.999, 1.026,
  1.011, 1.018, 1.022, 1.015, 0.997, 1.024, 1.016, 1.013, 1.021, 1.019,
  1.010, 1.023, 1.017, 1.014, 0.998, 1.020, 1.025, 1.012, 1.018, 1.016,
];

function getDailyFactor(daysElapsed: number, dailyRate: number): number {
  // Scale the variance around the configured rate so an admin override
  // (e.g. 3% or 10%) reshapes the projected curve instead of being ignored.
  const variance = DAILY_VARIANCE[daysElapsed % DAILY_VARIANCE.length];
  return (variance - 1) * (dailyRate / 0.015) + 1;
}

/**
 * Compound with realistic daily variance, honoring the configured daily rate.
 * Used for the 30-day performance chart so it never looks synthetic.
 */
export function projectCompoundVariance(principal: number, dailyRate: number, days: number): number {
  let value = principal;
  for (let i = 0; i < days; i++) {
    value *= getDailyFactor(days - i, dailyRate);
  }
  return value;
}

/** Deterministic projection with net return and percentage (rate-aware). */
export function projectReturns(
  balance: number,
  dailyRate: number,
  days: number,
): { gross: number; netReturn: number; netPct: number } {
  if (balance <= 0 || days <= 0) {
    return { gross: 0, netReturn: 0, netPct: 0 };
  }
  const projected = projectCompoundVariance(balance, dailyRate, days);
  const netReturn = projected - balance;
  const netPct = (netReturn / balance) * 100;
  return { gross: projected, netReturn, netPct };
}

/** Daily variance map for a 90-day projection window. */
export function getDailyVarianceSeed(dayIndex: number): number {
  return DAILY_VARIANCE[dayIndex % DAILY_VARIANCE.length];
}
