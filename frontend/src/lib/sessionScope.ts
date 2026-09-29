/** Investor and admin sessions live in different storage so one login cannot replace the other. */

export type DeskScope = "user" | "admin";

export function scopeFromPath(pathname: string): DeskScope {
  return pathname === "/admin" || pathname.startsWith("/admin/") ? "admin" : "user";
}

export function currentScope(): DeskScope {
  if (typeof window === "undefined") return "user";
  return scopeFromPath(window.location.pathname);
}

export function sessionKeys(scope: DeskScope = currentScope()) {
  if (scope === "admin") {
    return {
      scope,
      access: "xc_admin_access_token",
      refresh: "xc_admin_refresh_token",
      remember: "xc_admin_remember_me",
      session: "xc_admin_session_active",
      store: "xcapital-admin-store",
      login: "/admin/login",
    };
  }
  return {
    scope,
    access: "xc_access_token",
    refresh: "xc_refresh_token",
    remember: "xc_remember_me",
    session: "xc_session_active",
    store: "xcapital-store",
    login: "/auth/login",
  };
}

export type PersistedAuth = {
  user: unknown;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  theme?: "black" | "light";
};

export function readPersistedAuth(scope: DeskScope): PersistedAuth | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(sessionKeys(scope).store);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: PersistedAuth };
    return parsed.state ?? null;
  } catch {
    return null;
  }
}

/** Copy persist tokens back onto the tab keys when Remember me is on. */
export function restoreRememberedTokens(tokens: {
  accessToken: string | null;
  refreshToken: string | null;
}): boolean {
  if (typeof window === "undefined") return false;
  const keys = sessionKeys();
  if (localStorage.getItem(keys.remember) !== "1" || !tokens.accessToken) return false;
  localStorage.setItem(keys.access, tokens.accessToken);
  if (tokens.refreshToken) localStorage.setItem(keys.refresh, tokens.refreshToken);
  return true;
}

/** True only for a session-only login whose tab flag is gone (refresh after Remember me off). */
export function sessionOnlyExpired(): boolean {
  if (typeof window === "undefined") return false;
  const keys = sessionKeys();
  const remembered = localStorage.getItem(keys.remember) === "1";
  const sessionActive = sessionStorage.getItem(keys.session) === "1";
  return !remembered && !sessionActive;
}
