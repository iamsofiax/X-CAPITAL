import { EPOCHS_PER_YEAR } from "./clock";
import { mulberry32, normal, hashString } from "./prng";
import { VAULT_BY_ID, epochLogReturn, stepRegime, type Regime } from "./vaults";

export interface ProjectionInput {
  /** sUSDC value currently held per vault id. */
  vaults: Record<string, number>;
  /** Value that earns nothing (idle cash, marked trading positions treated as flat). */
  idle: number;
  /** Annualized fee-share yield on total NAV from conviction locks, reinvested. */
  feeShareApr: number;
  horizonEpochs: number;
  startRegime: Regime;
  paths?: number;
  seedKey?: string;
}

export interface ProjectionPoint {
  step: number;
  days: number;
  p10: number;
  p50: number;
  p90: number;
}

function quantile(sorted: number[], q: number): number {
  const idx = (sorted.length - 1) * q;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

/**
 * Monte Carlo of the current book under the published vault models. Each path draws its own
 * regime chain, so the fan shows the real spread of outcomes rather than a single promised line.
 */
export function projectBook(input: ProjectionInput): ProjectionPoint[] {
  const paths = input.paths ?? 400;
  const horizon = Math.max(1, input.horizonEpochs);
  const sampleEvery = Math.max(1, Math.round(horizon / 60));
  const ids = Object.keys(input.vaults).filter((id) => input.vaults[id] > 0 && VAULT_BY_ID[id]);
  const rand = mulberry32(hashString(input.seedKey ?? "projection") % 4294967296);
  const feePerEpoch = input.feeShareApr / EPOCHS_PER_YEAR;

  const samples: number[][] = [];
  for (let s = 0; s * sampleEvery <= horizon; s++) samples.push([]);

  for (let p = 0; p < paths; p++) {
    const values = ids.map((id) => input.vaults[id]);
    let idle = input.idle;
    let regime = input.startRegime;
    samples[0].push(values.reduce((a, b) => a + b, idle));
    for (let e = 1; e <= horizon; e++) {
      regime = stepRegime(regime, rand());
      let total = idle;
      for (let i = 0; i < ids.length; i++) {
        const spec = VAULT_BY_ID[ids[i]];
        const r = epochLogReturn(regime === "calm" ? spec.calm : spec.stress, normal(rand));
        const simple = Math.exp(r) - 1;
        values[i] *= 1 + (simple > 0 ? simple * (1 - spec.perfFee) : simple);
        total += values[i];
      }
      const fee = total * feePerEpoch;
      idle += fee;
      total += fee;
      if (e % sampleEvery === 0) samples[e / sampleEvery].push(total);
    }
  }

  return samples.map((vals, s) => {
    const sorted = vals.slice().sort((a, b) => a - b);
    const step = s * sampleEvery;
    return {
      step,
      days: step / 3,
      p10: quantile(sorted, 0.1),
      p50: quantile(sorted, 0.5),
      p90: quantile(sorted, 0.9),
    };
  });
}
