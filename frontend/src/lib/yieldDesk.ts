export type YieldMandate = {
  userId: string;
  email: string;
  dailyPct: number;
  principal: number;
  lastSettledAt: number;
  updatedAt: number;
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

export function setDailyGrowth(input: {
  userId: string;
  email: string;
  dailyPct: number;
  principal: number;
}) {
  const pct = Math.round(input.dailyPct * 10000) / 10000;
  if (!(pct >= 0) || pct > 5) throw new Error("Daily growth must be between 0 and 5 percent.");
  const now = Date.now();
  const prev = readMandate(input.userId);
  const next: YieldMandate = {
    userId: input.userId,
    email: input.email,
    dailyPct: pct,
    principal: input.principal > 0 ? input.principal : prev?.principal ?? 0,
    lastSettledAt: now,
    updatedAt: now,
  };
  const rows = listMandates().filter((m) => m.userId !== input.userId);
  rows.unshift(next);
  writeJson(MANDATES, rows);
  pushNotice(
    input.userId,
    "Daily growth set",
    `Ground station set ${pct}% per day on the book. Accrual runs continuously and posts to cash at each day close.`,
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

export function liveAccrual(mandate: YieldMandate, now = Date.now()) {
  const elapsed = Math.max(0, now - mandate.lastSettledAt);
  const accruing = mandate.principal * (mandate.dailyPct / 100) * (elapsed / DAY);
  const wholeDays = Math.floor(elapsed / DAY);
  return { elapsed, accruing, wholeDays, dayMs: DAY };
}

export function listNotices(userId: string): DeskNotice[] {
  return readJson<DeskNotice[]>(NOTICES, [])
    .filter((n) => n.userId === userId)
    .sort((a, b) => b.at - a.at);
}

export function unreadCount(userId: string) {
  return listNotices(userId).filter((n) => !n.read).length;
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
