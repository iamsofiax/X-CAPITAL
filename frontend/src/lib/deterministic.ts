/**
 * deterministic — seeded pseudo-random helpers for charts & projections.
 *
 * Every "random-looking" readout on the platform (performance curves,
 * drawdown series, monthly returns) MUST be derived from these seeded
 * functions so a given account always shows the same governed curve and
 * the math can never produce different numbers per session or per login.
 *
 * Seed keys are built from the user's stable identity (id / email / createdAt),
 * so each account gets ONE deterministic curve — no per-refresh randomness,
 * no cross-account bleed.
 */

/** FNV-1a style 32-bit hash — stable string → seed. */
export function hashSeed(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Mulberry32 — tiny, deterministic PRNG from a 32-bit seed. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Seeded random() factory from any stable key string. */
export function seededRandom(seedKey: string): () => number {
  return mulberry32(hashSeed(seedKey));
}

/** Deterministic per-account seed key. */
export function userSeedKey(user?: {
  id?: string;
  email?: string;
  createdAt?: string;
} | null): string {
  if (!user) return "anon";
  return [user.id, user.email?.toLowerCase(), user.createdAt]
    .filter(Boolean)
    .join("|");
}
