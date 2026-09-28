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
