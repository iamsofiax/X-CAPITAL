import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types";
import { authAPI } from "@/lib/api";
import { hasApiToken, hasSessionToken, mapAuthLoginUser } from "@/lib/apiUser";
import {
  browserDesk,
  deskToUser,
  findDesk,
  hashDeskSecret,
  localTokens,
  newDeskId,
  upsertDesk,
} from "@/lib/localDesk";

type AuthResult = { success: boolean; error?: string };

type AuthPayload = {
  accessToken: string;
  refreshToken: string;
  user: Parameters<typeof mapAuthLoginUser>[0];
};

function readGoogleIdentity(idToken: string): { email: string; firstName?: string; lastName?: string } | null {
  try {
    const part = idToken.split(".")[1];
    if (!part) return null;
    const json = JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/"))) as {
      aud?: string;
      exp?: number;
      email?: string;
      nonce?: string;
      given_name?: string;
      family_name?: string;
    };
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (clientId && json.aud !== clientId) return null;
    if (typeof json.exp === "number" && json.exp * 1000 < Date.now()) return null;
    if (typeof json.email !== "string" || !json.email.includes("@")) return null;
    if (typeof window !== "undefined") {
      const nonce = sessionStorage.getItem("xc_google_nonce");
      if (nonce && json.nonce && json.nonce !== nonce) return null;
    }
    return {
      email: json.email.toLowerCase(),
      firstName: json.given_name,
      lastName: json.family_name,
    };
  } catch {
    return null;
  }
}

function apiStatus(err: unknown): number | undefined {
  return (err as { response?: { status?: number } })?.response?.status;
}

function apiUnreachable(err: unknown): boolean {
  const status = apiStatus(err);
  return status === undefined || status >= 500;
}

function rememberSession(remember: boolean) {
  if (typeof window === "undefined") return;
  if (remember) localStorage.setItem("xc_remember_me", "1");
  else localStorage.removeItem("xc_remember_me");
  sessionStorage.setItem("xc_session_active", "1");
}

function describeAuthError(err: unknown, fallback: string): string {
  const e = err as {
    response?: { status?: number; data?: { message?: string; errors?: Array<{ msg?: string }> } };
    request?: unknown;
  };
  if (!e?.response) {
    return e?.request
      ? "Cannot reach X-CAPITAL servers. Check your connection and try again."
      : fallback;
  }
  const { status, data } = e.response;
  if (status === 400) return data?.errors?.[0]?.msg ?? data?.message ?? fallback;
  if (status === 401) return data?.message ?? "Invalid email or password.";
  if (status === 403) return data?.message ?? "Account disabled. Contact support.";
  if (status === 409) return data?.message ?? "An account with this email already exists.";
  if (status === 429) return "Too many attempts. Wait a few minutes and try again.";
  if (status === 503) return data?.message ?? "Sign-in provider is not configured.";
  return data?.message ?? fallback;
}

export { describeAuthError };

interface Store {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  updateUser: (user: Partial<User>) => void;
  logout: () => void;
  completeSession: (payload: AuthPayload) => void;
  registerUser: (userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) => Promise<AuthResult>;
  loginUser: (email: string, password: string, remember?: boolean) => Promise<AuthResult>;
  loginWithProvider: (
    provider: "google" | "apple",
    idToken: string,
    profile?: { firstName?: string; lastName?: string },
  ) => Promise<AuthResult>;
  loginWithGoogleProfile: (profile: { email: string; firstName?: string; lastName?: string }) => AuthResult;
  openLocalDesk: () => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<AuthResult>;
  syncSessionFromApi: () => Promise<void>;

  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  theme: "black" | "light";
  setTheme: (theme: "black" | "light") => void;
}

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (user, accessToken, refreshToken) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("xc_access_token", accessToken);
          localStorage.setItem("xc_refresh_token", refreshToken);
        }
        set({ user, accessToken, refreshToken, isAuthenticated: true });
      },

      updateUser: (updates) =>
        set((state) => ({ user: state.user ? { ...state.user, ...updates } : null })),

      logout: () => {
        const refreshToken = get().refreshToken;
        if (refreshToken && hasApiToken()) {
          void authAPI.logout(refreshToken).catch(() => undefined);
        }
        if (typeof window !== "undefined") {
          localStorage.removeItem("xc_access_token");
          localStorage.removeItem("xc_refresh_token");
          localStorage.removeItem("xc_remember_me");
          sessionStorage.removeItem("xc_session_active");
        }
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },

      completeSession: ({ accessToken, refreshToken, user }) => {
        get().setAuth(
          { ...mapAuthLoginUser(user), lastLogin: new Date().toISOString() },
          accessToken,
          refreshToken,
        );
        if (typeof window !== "undefined") sessionStorage.setItem("xc_session_active", "1");
      },

      syncSessionFromApi: async () => {
        if (!hasApiToken()) return;
        try {
          const { data } = await authAPI.getMe();
          const me = data.data;
          if (!me?.id) return;
          const current = get().user;
          if (!current || current.id !== me.id) return;
          set({ user: { ...current, ...mapAuthLoginUser(me), lastLogin: current.lastLogin } });
        } catch {
          /* offline or token expired — the API interceptor handles refresh/logout */
        }
      },

      registerUser: async ({ firstName, lastName, email, password }) => {
        const key = email.trim().toLowerCase();
        try {
          const { data } = await authAPI.register({ email: key, password, firstName, lastName });
          get().completeSession(data.data as AuthPayload);
          rememberSession(true);
          return { success: true };
        } catch (err) {
          if (!apiUnreachable(err)) {
            return { success: false, error: describeAuthError(err, "Registration failed. Please try again.") };
          }
          if (findDesk(key)?.passwordHash) {
            return { success: false, error: "An account with this email already exists. Sign in instead." };
          }
          const desk = {
            id: newDeskId(),
            email: key,
            firstName,
            lastName,
            passwordHash: await hashDeskSecret(password),
            createdAt: new Date().toISOString(),
            provider: "password" as const,
          };
          upsertDesk(desk);
          const tokens = localTokens(desk.id);
          get().setAuth(deskToUser(desk), tokens.accessToken, tokens.refreshToken);
          rememberSession(true);
          return { success: true };
        }
      },

      loginUser: async (email, password, remember = true) => {
        const key = email.trim().toLowerCase();
        const openLocal = async () => {
          const desk = findDesk(key);
          if (!desk?.passwordHash) return null;
          const hash = await hashDeskSecret(password);
          if (hash !== desk.passwordHash) return "bad-password" as const;
          const tokens = localTokens(desk.id);
          get().setAuth(deskToUser(desk), tokens.accessToken, tokens.refreshToken);
          rememberSession(remember);
          return "ok" as const;
        };
        try {
          const { data } = await authAPI.login(key, password);
          get().completeSession(data.data as AuthPayload);
          rememberSession(remember);
          return { success: true };
        } catch (err) {
          const status = apiStatus(err);
          if (status === 401 || apiUnreachable(err)) {
            const local = await openLocal();
            if (local === "ok") return { success: true };
            if (local === "bad-password") return { success: false, error: "Invalid email or password." };
            if (status === 401) return { success: false, error: describeAuthError(err, "Invalid email or password.") };
            return { success: false, error: "No account for that email yet. Open a node first." };
          }
          return { success: false, error: describeAuthError(err, "Sign-in failed. Please try again.") };
        }
      },

      openLocalDesk: () => {
        const desk = browserDesk();
        const tokens = localTokens(desk.id);
        get().setAuth(deskToUser(desk), tokens.accessToken, tokens.refreshToken);
        if (typeof window !== "undefined") {
          localStorage.setItem("xc_remember_me", "1");
          sessionStorage.setItem("xc_session_active", "1");
        }
      },

      loginWithProvider: async (provider, idToken, profile) => {
        try {
          const { data } = await authAPI.oauth(provider, { idToken, ...profile });
          get().completeSession(data.data as AuthPayload);
          rememberSession(true);
          return { success: true };
        } catch (err) {
          if (provider !== "google" || !apiUnreachable(err)) {
            return { success: false, error: describeAuthError(err, "Google sign-in failed.") };
          }
          const identity = readGoogleIdentity(idToken);
          if (!identity) return { success: false, error: "Google did not return a usable account." };
          const existing = findDesk(identity.email);
          const desk = {
            id: existing?.id ?? newDeskId(),
            email: identity.email,
            firstName: profile?.firstName || identity.firstName || existing?.firstName || "Investor",
            lastName: profile?.lastName || identity.lastName || existing?.lastName || "",
            passwordHash: existing?.passwordHash ?? "",
            createdAt: existing?.createdAt ?? new Date().toISOString(),
            provider: existing?.passwordHash ? existing.provider : ("google" as const),
            role: existing?.role,
          };
          upsertDesk(desk);
          const tokens = localTokens(desk.id);
          get().setAuth(deskToUser(desk), tokens.accessToken, tokens.refreshToken);
          rememberSession(true);
          return { success: true };
        }
      },

      loginWithGoogleProfile: (profile) => {
        const email = profile.email.trim().toLowerCase();
        if (!email.includes("@")) return { success: false, error: "Google did not return an email." };
        const existing = findDesk(email);
        const desk = {
          id: existing?.id ?? newDeskId(),
          email,
          firstName: profile.firstName || existing?.firstName || "Investor",
          lastName: profile.lastName || existing?.lastName || "",
          passwordHash: existing?.passwordHash ?? "",
          createdAt: existing?.createdAt ?? new Date().toISOString(),
          provider: existing?.passwordHash ? existing.provider : ("google" as const),
          role: existing?.role,
        };
        upsertDesk(desk);
        const tokens = localTokens(desk.id);
        get().setAuth(deskToUser(desk), tokens.accessToken, tokens.refreshToken);
        rememberSession(true);
        return { success: true };
      },

      changePassword: async (currentPassword, newPassword) => {
        const user = get().user;
        if (!user) return { success: false, error: "Not logged in." };
        if (user.authProvider === "local" || user.id.startsWith("local-")) {
          const desk = findDesk(user.email);
          if (!desk) return { success: false, error: "Local desk not found." };
          if (desk.passwordHash) {
            const ok = (await hashDeskSecret(currentPassword)) === desk.passwordHash;
            if (!ok) return { success: false, error: "Current password is incorrect." };
          }
          upsertDesk({ ...desk, passwordHash: await hashDeskSecret(newPassword) });
          return { success: true };
        }
        try {
          await authAPI.changePassword(currentPassword || undefined, newPassword);
          return { success: true };
        } catch (err) {
          return { success: false, error: describeAuthError(err, "Could not update password.") };
        }
      },

      sidebarOpen: false,
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      theme: "black",
      setTheme: (theme) => {
        set({ theme });
        if (typeof document !== "undefined") {
          document.documentElement.setAttribute("data-theme", theme);
        }
      },
    }),
    {
      name: "xcapital-store",
      version: 6,
      migrate: () => ({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        theme: "black",
      }) as unknown as Store,
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        theme: state.theme,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error("[Store] Rehydration error:", error);
          return;
        }
        if (typeof window === "undefined" || !state) return;
        if (state.theme) document.documentElement.setAttribute("data-theme", state.theme);
        const remembered = localStorage.getItem("xc_remember_me") === "1";
        const sessionActive = sessionStorage.getItem("xc_session_active") === "1";
        if (state.isAuthenticated && ((!remembered && !sessionActive) || !hasSessionToken())) {
          useStore.setState({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
          return;
        }
        if (state.isAuthenticated && !remembered) sessionStorage.setItem("xc_session_active", "1");
      },
    },
  ),
);
