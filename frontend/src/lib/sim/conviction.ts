import type { ConvictionLock } from "./types";

const DAY = 86_400_000;
export const MAX_LOCK_MS = 365 * DAY;
export const LOCK_TERMS = [
  { days: 30, label: "30D" },
  { days: 90, label: "90D" },
  { days: 180, label: "180D" },
  { days: 365, label: "365D" },
] as const;

/** veXC weight decays linearly to zero at unlock; a fresh 365-day lock carries weight 1.0 per sXC. */
export function lockWeight(lock: ConvictionLock, ts: number): number {
  const remaining = Math.max(0, lock.endTs - ts);
  return lock.amount * Math.min(1, remaining / MAX_LOCK_MS);
}

export function totalWeight(locks: ConvictionLock[], ts: number): number {
  return locks.reduce((a, l) => a + lockWeight(l, ts), 0);
}

export function lockedAmount(locks: ConvictionLock[]): number {
  return locks.reduce((a, l) => a + l.amount, 0);
}

export function isUnlockable(lock: ConvictionLock, ts: number): boolean {
  return ts >= lock.endTs;
}

export function initialWeight(amount: number, days: number): number {
  return amount * Math.min(1, (days * DAY) / MAX_LOCK_MS);
}
