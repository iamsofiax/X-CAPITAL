const SCOPED_PREFIX = "xc:";

export function scopedKey(userId: string, suffix: string): string {
  return `${SCOPED_PREFIX}${userId}:${suffix}`;
}

export function wipeUserScopedStorage(userId?: string | null): void {
  if (typeof window === "undefined") return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (key.startsWith(SCOPED_PREFIX)) {
        if (!userId || key.startsWith(`${SCOPED_PREFIX}${userId}:`)) {
          keys.push(key);
        }
      }
    }
    keys.forEach((key) => localStorage.removeItem(key));
    if (!userId) {
      localStorage.removeItem("xcapital-profit-engine");
      localStorage.removeItem("xcapital-ledger");
      localStorage.removeItem("xcapital-compound-velocity");
      localStorage.removeItem("xcapital-daily-rewards");
      localStorage.removeItem("xc_retirement_401k");
    }
  } catch {
    /* storage unavailable */
  }
}

export function readScopedJson<T>(userId: string, suffix: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(scopedKey(userId, suffix));
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeScopedJson(userId: string, suffix: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(scopedKey(userId, suffix), JSON.stringify(value));
  } catch {
    /* quota */
  }
}
