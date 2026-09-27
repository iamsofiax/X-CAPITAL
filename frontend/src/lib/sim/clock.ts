export const EPOCH_MS = 8 * 60 * 60 * 1000;
export const EPOCHS_PER_YEAR = (365 * 24 * 60 * 60 * 1000) / EPOCH_MS;
export const EPOCHS_PER_DAY = 3;
export const SEASON_EPOCHS = 30 * EPOCHS_PER_DAY;
/** Epoch 0 of the simulated network. */
export const GENESIS_TS = Date.UTC(2026, 0, 1, 0, 0, 0);

export function epochAt(ts: number): number {
  return Math.max(0, Math.floor((ts - GENESIS_TS) / EPOCH_MS));
}

export function epochStart(epoch: number): number {
  return GENESIS_TS + epoch * EPOCH_MS;
}

export function currentEpoch(now = Date.now()): number {
  return epochAt(now);
}

export function msUntilNextEpoch(now = Date.now()): number {
  return epochStart(epochAt(now) + 1) - now;
}

export function seasonOf(epoch: number): number {
  return Math.floor(epoch / SEASON_EPOCHS);
}

export function seasonBounds(season: number): { start: number; end: number } {
  return { start: season * SEASON_EPOCHS, end: (season + 1) * SEASON_EPOCHS - 1 };
}

/** Simulated block height: one block every 2 seconds since genesis. */
export function blockHeight(now = Date.now()): number {
  return 18_400_000 + Math.floor((now - GENESIS_TS) / 2000);
}

export function utcDay(ts: number): string {
  return new Date(ts).toISOString().slice(0, 10);
}
