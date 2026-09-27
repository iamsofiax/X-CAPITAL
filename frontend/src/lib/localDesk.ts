import type { User } from "@/types";

const DESKS_KEY = "xc_local_desks";
export const LOCAL_TOKEN_PREFIX = "xc-local.";

export type LocalDesk = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  passwordHash: string;
  createdAt: string;
  provider?: "password" | "google";
  role?: "USER" | "ADMIN";
};

export function isLocalToken(token: string | null | undefined): boolean {
  return !!token && token.startsWith(LOCAL_TOKEN_PREFIX);
}

export function hasLocalSession(): boolean {
  if (typeof window === "undefined") return false;
  return isLocalToken(localStorage.getItem("xc_access_token"));
}

export async function hashDeskSecret(secret: string): Promise<string> {
  const data = new TextEncoder().encode(`xcapital-local-desk|${secret}`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function loadDesks(): LocalDesk[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(DESKS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LocalDesk[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveDesks(desks: LocalDesk[]) {
  localStorage.setItem(DESKS_KEY, JSON.stringify(desks));
}

export function findDesk(email: string): LocalDesk | undefined {
  return loadDesks().find((d) => d.email === email.trim().toLowerCase());
}

export function upsertDesk(desk: LocalDesk) {
  const desks = loadDesks().filter((d) => d.email !== desk.email);
  desks.push(desk);
  saveDesks(desks);
}

export function deskToUser(desk: LocalDesk): User {
  return {
    id: desk.id,
    email: desk.email,
    firstName: desk.firstName,
    lastName: desk.lastName,
    role: desk.role === "ADMIN" ? "GOD_ADMIN" : "USER",
    tier: "CORE",
    kycStatus: "NOT_STARTED",
    accreditationStatus: "NOT_ACCREDITED",
    createdAt: desk.createdAt,
    authProvider: desk.provider === "google" ? "google" : "local",
    lastLogin: new Date().toISOString(),
  };
}

export function newDeskId(): string {
  return `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function localTokens(userId: string) {
  return {
    accessToken: `${LOCAL_TOKEN_PREFIX}${userId}`,
    refreshToken: `${LOCAL_TOKEN_PREFIX}r.${userId}`,
  };
}

/** Stable browser desk — same id across visits so the sim ledger persists. */
export const BROWSER_DESK_ID = "local-browser-desk";

export function browserDesk(): LocalDesk {
  const existing = loadDesks().find((d) => d.id === BROWSER_DESK_ID);
  if (existing) return existing;
  const desk: LocalDesk = {
    id: BROWSER_DESK_ID,
    email: "desk@local.xcapital",
    firstName: "Local",
    lastName: "Desk",
    passwordHash: "",
    createdAt: new Date().toISOString(),
  };
  upsertDesk(desk);
  return desk;
}
