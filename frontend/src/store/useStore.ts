import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, Wallet, Portfolio } from "@/types";
import { mergeUserFromRegistry } from "@/lib/mergeSessionUser";
import { authAPI, adminAPI } from "@/lib/api";
import {
  hasApiToken,
  mapAuthLoginUser,
  mapMeToUser,
  mergeUsersFromServer,
  type ApiUserRow,
} from "@/lib/apiUser";

// Simple hash for client-side password storage (not bcrypt, but acceptable for client-only demo)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "xcapital-salt-2026");
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Default God Admin account — always available
const GOD_ADMIN_USER: User = {
  id: "god-admin-001",
  email: "admin@xcapital.io",
  firstName: "Platform",
  lastName: "Admin",
  role: "GOD_ADMIN",
  tier: "BLACK" as const,
  kycStatus: "APPROVED" as const,
  accreditationStatus: "ACCREDITED" as const,
  createdAt: "2024-01-01T00:00:00Z",
  isFrozen: false,
  isSuspended: false,
  isBlocked: false,
  tradingEnabled: true,
  profitHold: false,
  profitMultiplier: 1.0,
  balance: 0,
  country: "US",
  trades: 0,
  // passwordHash will be set during init
  passwordHash: "",
};

// Placeholder hash — actual hash computed at runtime via hashPassword()
const _GOD_ADMIN_PW_HASH =
  "6e3a6c3f8e4b2a1d9c8f7e6d5b4a3c2e1f0d9c8b7a6e5d4c3b2a1f0e9d8c7b6";
void _GOD_ADMIN_PW_HASH;

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  registeredUsers: User[];
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  updateUser: (user: Partial<User>) => void;
  logout: () => void;
  registerUser: (userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) => Promise<{ success: boolean; error?: string }>;
  loginUser: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  getAllUsers: () => User[];
  updateUserById: (userId: string, updates: Partial<User>) => void;
  deleteUserById: (userId: string) => void;
  createUserAsAdmin: (userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role?: string;
    tier?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  changePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<{ success: boolean; error?: string }>;
  syncSessionFromApi: () => Promise<void>;
  loadAdminUsersFromApi: () => Promise<boolean>;
  addAuditEntry: (entry: AuditEntry) => void;
  auditLog: AuditEntry[];
}

export interface AuditEntry {
  id: string;
  time: string;
  actor: string;
  action: string;
  target: string;
  level: "info" | "action" | "warning" | "success" | "danger";
}

export interface PendingTransaction {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  type: "DEPOSIT" | "WITHDRAWAL" | "FUND_INVEST";
  method: "wire" | "crypto" | "card" | "fund";
  amount: number;
  currency: string;
  details: Record<string, string>;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  rejectionReason?: string;
  fundId?: string;
  fundName?: string;
}

export interface AdminAlert {
  id: string;
  type: "DEPOSIT" | "FUND_INVEST" | "WITHDRAW";
  userId: string;
  userEmail: string;
  userName: string;
  amount: number;
  method: string;
  priority: "HIGH" | "NORMAL";
  read: boolean;
  status: "PENDING" | "APPROVED" | "REJECTED";
  pendingTxId?: string;
  metadata?: Record<string, string>;
  createdAt: string;
  resolvedAt?: string;
}

export interface UserNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "congratulations" | "reward" | "system" | "transaction";
  externalLink?: string;
  externalLinkLabel?: string;
  read: boolean;
  createdAt: string;
}

interface PendingTxState {
  pendingTransactions: PendingTransaction[];
  addPendingTransaction: (tx: PendingTransaction) => void;
  approvePendingTransaction: (txId: string, adminEmail: string) => void;
  rejectPendingTransaction: (
    txId: string,
    adminEmail: string,
    reason: string,
  ) => void;
}

interface AdminAlertState {
  adminAlerts: AdminAlert[];
  addAdminAlert: (alert: Omit<AdminAlert, "id" | "createdAt" | "read" | "status">) => string;
  markAdminAlertRead: (id: string) => void;
  resolveAdminAlert: (id: string, status: "APPROVED" | "REJECTED") => void;
  getUnreadAdminAlertCount: () => number;
}

interface NotificationState {
  notifications: UserNotification[];
  addNotification: (n: UserNotification) => void;
  markNotificationRead: (id: string) => void;
  deleteNotification: (id: string) => void;
}

export interface KYCSubmission {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  // Personal
  firstName: string;
  lastName: string;
  maidenName: string;
  dateOfBirth: string;
  nationality: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  // Identity
  ssn: string; // last 4 displayed, full stored
  idType: "drivers_license" | "passport" | "national_id";
  idNumber: string;
  idFrontImage: string; // base64 data URL
  idBackImage?: string;
  selfieImage: string;
  // Status
  status: "PENDING" | "APPROVED" | "REJECTED";
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
}

interface KYCState {
  kycSubmissions: KYCSubmission[];
  submitKYC: (submission: KYCSubmission) => void;
  approveKYC: (submissionId: string, adminEmail: string) => void;
  rejectKYC: (submissionId: string, adminEmail: string, reason: string) => void;
}

interface AdminContentState {
  termsOfService: string;
  setTermsOfService: (content: string) => void;
}

interface UIState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  theme: "black" | "light";
  setTheme: (theme: "black" | "light") => void;
}

interface DataState {
  wallet: Wallet | null;
  portfolio: Portfolio | null;
  setWallet: (wallet: Wallet) => void;
  setPortfolio: (portfolio: Portfolio) => void;
}

type Store = AuthState &
  UIState &
  DataState &
  PendingTxState &
  AdminAlertState &
  NotificationState &
  KYCState &
  AdminContentState;

const DEFAULT_TOS = `X-CAPITAL TERMS OF SERVICE

Last Updated: January 2026

1. ACCEPTANCE OF TERMS
By accessing or using the X-Capital platform, you agree to be bound by these Terms of Service.

2. ELIGIBILITY
You must be at least 18 years of age and meet all applicable regulatory requirements in your jurisdiction.

3. ACCOUNT REGISTRATION
You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate.

4. INVESTMENT RISKS
All investments carry risk. Past performance is not indicative of future results. You may lose some or all of your invested capital.

5. FEES AND CHARGES
X-Capital may charge fees for certain services. All applicable fees will be disclosed prior to any transaction.

6. PRIVACY
Your privacy is important to us. Please review our Privacy Policy for information on how we collect and use your data.

7. PROHIBITED ACTIVITIES
You agree not to engage in any activity that violates applicable laws, regulations, or these Terms.

8. LIMITATION OF LIABILITY
X-Capital shall not be liable for any indirect, incidental, special, or consequential damages.

9. MODIFICATIONS
X-Capital reserves the right to modify these Terms at any time. Continued use constitutes acceptance of modified Terms.

10. GOVERNING LAW
These Terms shall be governed by the laws of the State of Delaware, United States.

For questions, contact legal@xcapital.investments`;

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      // ─── Auth ─────────────────────────────────────────────────────────────
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      registeredUsers: [],
      auditLog: [],

      setAuth: (user, accessToken, refreshToken) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("xc_access_token", accessToken);
          localStorage.setItem("xc_refresh_token", refreshToken);
        }
        set({ user, accessToken, refreshToken, isAuthenticated: true });
      },

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),

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
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          portfolio: null,
          wallet: null,
        });
      },

      syncSessionFromApi: async () => {
        if (!hasApiToken()) return;
        try {
          const { data: meRes } = await authAPI.getMe();
          const me = meRes.data;
          if (!me?.id) return;

          const serverBalance = Number(me.wallet?.fiatBalance ?? 0);
          const emailKey = me.email.toLowerCase();

          set((state) => {
            const currentBal = Number(state.wallet?.fiatBalance ?? state.user?.balance ?? 0);
            if (
              Math.abs(currentBal - serverBalance) < 0.01 &&
              state.user?.id === me.id
            ) {
              return state;
            }

            const registeredUsers = state.registeredUsers.map((u) =>
              u.id === me.id || u.email.toLowerCase() === emailKey
                ? { ...u, balance: serverBalance }
                : u,
            );
            const sessionMatches =
              state.user &&
              (state.user.id === me.id ||
                state.user.email.toLowerCase() === emailKey);

            const user = sessionMatches
              ? { ...state.user!, balance: serverBalance }
              : state.user;

            const wallet = sessionMatches
              ? {
                  id: me.wallet?.id ?? state.wallet?.id ?? "wallet",
                  fiatBalance: serverBalance,
                  cryptoBalance: Number(me.wallet?.cryptoBalance ?? 0),
                  lockedBalance: Number(me.wallet?.lockedBalance ?? 0),
                }
              : state.wallet;

            return { registeredUsers, user, wallet };
          });
        } catch {
          /* API offline — keep current state */
        }
      },

      loadAdminUsersFromApi: async () => {
        if (!hasApiToken()) return false;
        try {
          const { data: res } = await adminAPI.listUsers();
          const rows = (res.data ?? []) as ApiUserRow[];
          const adminEmail = get().user?.email;
          set((state) => ({
            registeredUsers: mergeUsersFromServer(
              state.registeredUsers,
              rows,
              adminEmail,
            ),
          }));
          return true;
        } catch {
          return false;
        }
      },

      registerUser: async ({ firstName, lastName, email, password }) => {
        try {
          const { data: regRes } = await authAPI.register({
            email,
            password,
            firstName,
            lastName,
          });
          const payload = regRes.data;
          const { accessToken, refreshToken, user: apiUser } = payload;

          let balance = 0;
          try {
            const { data: meRes } = await authAPI.getMe();
            balance = Number(meRes.data?.wallet?.fiatBalance ?? 0);
          } catch {
            /* use zero balance */
          }

          const user = mapAuthLoginUser(apiUser, balance);
          const state = get();
          const emailKey = user.email.toLowerCase();
          const registeredUsers = state.registeredUsers.some(
            (u) => u.email.toLowerCase() === emailKey,
          )
            ? state.registeredUsers.map((u) =>
                u.email.toLowerCase() === emailKey ? { ...u, ...user } : u,
              )
            : [...state.registeredUsers, user];

          get().setAuth(user, accessToken, refreshToken);
          set({ registeredUsers });
          if (typeof window !== "undefined") {
            sessionStorage.setItem("xc_session_active", "1");
          }
          return { success: true };
        } catch (err: unknown) {
          const status =
            err &&
            typeof err === "object" &&
            "response" in err &&
            err.response &&
            typeof err.response === "object" &&
            "status" in err.response
              ? Number(err.response.status)
              : undefined;
          if (status === 409) {
            return {
              success: false,
              error: "An account with this email already exists.",
            };
          }
          /* fall through to offline registration */
        }

        const state = get();
        const existing = state.registeredUsers.find(
          (u) => u.email.toLowerCase() === email.toLowerCase(),
        );
        if (existing)
          return {
            success: false,
            error: "An account with this email already exists.",
          };

        const pwHash = await hashPassword(password);
        const newUser: User = {
          id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          email: email.toLowerCase(),
          firstName,
          lastName,
          role: "USER",
          tier: "CORE",
          kycStatus: "NOT_STARTED",
          accreditationStatus: "NOT_ACCREDITED",
          createdAt: new Date().toISOString(),
          isFrozen: false,
          isSuspended: false,
          isBlocked: false,
          tradingEnabled: true,
          profitHold: false,
          profitMultiplier: 1.0,
          passwordHash: pwHash,
          balance: 0,
          lastLogin: new Date().toISOString(),
          country: "",
          trades: 0,
        };

        const token = `xc-token-${Date.now()}`;
        set({
          registeredUsers: [...state.registeredUsers, newUser],
          user: newUser,
          accessToken: token,
          refreshToken: `xc-refresh-${Date.now()}`,
          isAuthenticated: true,
        });
        if (typeof window !== "undefined") {
          localStorage.setItem("xc_access_token", token);
          sessionStorage.setItem("xc_session_active", "1");
        }
        return { success: true };
      },

      loginUser: async (email, password) => {
        try {
          const { data: loginRes } = await authAPI.login(email, password);
          const payload = loginRes.data;
          const { accessToken, refreshToken, user: apiUser } = payload;

          let balance = 0;
          try {
            get().setAuth(mapAuthLoginUser(apiUser, 0), accessToken, refreshToken);
            const { data: meRes } = await authAPI.getMe();
            balance = Number(meRes.data?.wallet?.fiatBalance ?? 0);
          } catch {
            /* wallet optional on login */
          }

          const user = mapAuthLoginUser(apiUser, balance);
          const state = get();
          const emailKey = user.email.toLowerCase();
          const registeredUsers = state.registeredUsers.some(
            (u) => u.email.toLowerCase() === emailKey,
          )
            ? state.registeredUsers.map((u) =>
                u.email.toLowerCase() === emailKey
                  ? { ...u, ...user, lastLogin: new Date().toISOString() }
                  : u,
              )
            : [...state.registeredUsers, { ...user, lastLogin: new Date().toISOString() }];

          get().setAuth(
            { ...user, lastLogin: new Date().toISOString() },
            accessToken,
            refreshToken,
          );
          set({ registeredUsers });
          if (typeof window !== "undefined") {
            sessionStorage.setItem("xc_session_active", "1");
          }
          return { success: true };
        } catch (err: unknown) {
          const status =
            err &&
            typeof err === "object" &&
            "response" in err &&
            err.response &&
            typeof err.response === "object" &&
            "status" in err.response
              ? Number(err.response.status)
              : undefined;
          if (status === 401 || status === 403) {
            return { success: false, error: "Incorrect password." };
          }
          /* API unavailable — use local auth */
        }

        const state = get();
        const pwHash = await hashPassword(password);

        // Check God Admin hardcoded account
        const godAdminHash = await hashPassword("Admin2026!");
        if (
          email.toLowerCase() === "admin@xcapital.io" &&
          pwHash === godAdminHash
        ) {
          const adminUser = state.registeredUsers.find(
            (u) => u.email === "admin@xcapital.io",
          ) || {
            ...GOD_ADMIN_USER,
            passwordHash: godAdminHash,
            lastLogin: new Date().toISOString(),
          };

          // Ensure admin exists in registered users
          const exists = state.registeredUsers.some(
            (u) => u.email === "admin@xcapital.io",
          );
          const updatedUsers = exists
            ? state.registeredUsers.map((u) =>
                u.email === "admin@xcapital.io"
                  ? { ...u, lastLogin: new Date().toISOString() }
                  : u,
              )
            : [
                ...state.registeredUsers,
                { ...adminUser, lastLogin: new Date().toISOString() },
              ];

          const token = `xc-token-${Date.now()}`;
          set({
            registeredUsers: updatedUsers,
            user: { ...adminUser, lastLogin: new Date().toISOString() },
            accessToken: token,
            refreshToken: `xc-refresh-${Date.now()}`,
            isAuthenticated: true,
          });
          if (typeof window !== "undefined") {
            sessionStorage.setItem("xc_session_active", "1");
          }
          return { success: true };
        }

        // Check registered users
        const foundUser = state.registeredUsers.find(
          (u) => u.email.toLowerCase() === email.toLowerCase(),
        );

        // Auto-register: if user not found locally, create account so any browser can log in
        if (!foundUser) {
          const parts = email.split("@")[0].split(/[._\-+]/);
          const autoFirst = parts[0]
            ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1)
            : "User";
          const autoLast = parts[1]
            ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1)
            : "";
          const newUser: User = {
            id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            email: email.toLowerCase(),
            firstName: autoFirst,
            lastName: autoLast,
            role: "USER",
            tier: "CORE",
            kycStatus: "NOT_STARTED",
            accreditationStatus: "NOT_ACCREDITED",
            createdAt: new Date().toISOString(),
            isFrozen: false,
            isSuspended: false,
            isBlocked: false,
            tradingEnabled: true,
            profitHold: false,
            profitMultiplier: 1.0,
            passwordHash: pwHash,
            balance: 0,
            lastLogin: new Date().toISOString(),
            country: "",
            trades: 0,
          };
          const autoToken = `xc-token-${Date.now()}`;
          set({
            registeredUsers: [...state.registeredUsers, newUser],
            user: newUser,
            accessToken: autoToken,
            refreshToken: `xc-refresh-${Date.now()}`,
            isAuthenticated: true,
          });
          if (typeof window !== "undefined") {
            sessionStorage.setItem("xc_session_active", "1");
          }
          return { success: true };
        }

        if (foundUser.passwordHash !== pwHash)
          return { success: false, error: "Incorrect password." };
        if (foundUser.isBlocked)
          return {
            success: false,
            error: "This account has been blocked. Contact support.",
          };
        if (foundUser.isSuspended)
          return {
            success: false,
            error: "This account is suspended. Contact support.",
          };

        const updatedUser = {
          ...foundUser,
          lastLogin: new Date().toISOString(),
        };
        const token = `xc-token-${Date.now()}`;
        set({
          registeredUsers: state.registeredUsers.map((u) =>
            u.id === foundUser.id ? updatedUser : u,
          ),
          user: updatedUser,
          accessToken: token,
          refreshToken: `xc-refresh-${Date.now()}`,
          isAuthenticated: true,
        });
        if (typeof window !== "undefined") {
          sessionStorage.setItem("xc_session_active", "1");
        }
        return { success: true };
      },

      getAllUsers: () => get().registeredUsers,

      updateUserById: (userId, updates) => {
        set((state) => {
          const target = state.registeredUsers.find((u) => u.id === userId);
          const updatedRegisteredUsers = state.registeredUsers.map((u) =>
            u.id === userId ? { ...u, ...updates } : u,
          );
          const sessionMatches =
            state.user &&
            (state.user.id === userId ||
              (target &&
                state.user.email.toLowerCase() ===
                  target.email.toLowerCase()));
          const updatedUser = sessionMatches
            ? mergeUserFromRegistry(state.user, updatedRegisteredUsers)
            : state.user;

          let updatedWallet = state.wallet;
          if (
            sessionMatches &&
            updates.balance !== undefined &&
            state.wallet
          ) {
            updatedWallet = {
              ...state.wallet,
              fiatBalance: updates.balance,
            };
          }

          return {
            registeredUsers: updatedRegisteredUsers,
            user: updatedUser,
            wallet: updatedWallet,
          };
        });
      },

      deleteUserById: (userId) => {
        set((state) => ({
          registeredUsers: state.registeredUsers.filter((u) => u.id !== userId),
        }));
      },

      createUserAsAdmin: async ({
        firstName,
        lastName,
        email,
        password,
        role = "USER",
        tier = "CORE",
      }) => {
        if (hasApiToken()) {
          try {
            const { data: res } = await adminAPI.createUser({
              firstName,
              lastName,
              email,
              password,
              tier,
            });
            const created = res.data;
            const newUser: User = {
              ...mapAuthLoginUser(created, Number(created.balance ?? 0)),
              role: role as User["role"],
              tier: tier as User["tier"],
            };
            set({
              registeredUsers: [...get().registeredUsers, newUser],
            });
            return { success: true };
          } catch (err: unknown) {
            const msg =
              err &&
              typeof err === "object" &&
              "response" in err &&
              err.response &&
              typeof err.response === "object" &&
              "data" in err.response &&
              err.response.data &&
              typeof err.response.data === "object" &&
              "message" in err.response.data
                ? String(err.response.data.message)
                : "Failed to create user on server.";
            return { success: false, error: msg };
          }
        }

        const state = get();
        const existing = state.registeredUsers.find(
          (u) => u.email.toLowerCase() === email.toLowerCase(),
        );
        if (existing)
          return {
            success: false,
            error: "An account with this email already exists.",
          };

        const pwHash = await hashPassword(password);
        const newUser: User = {
          id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          email: email.toLowerCase(),
          firstName,
          lastName,
          role: role as User["role"],
          tier: tier as User["tier"],
          kycStatus: "APPROVED",
          accreditationStatus: "NOT_ACCREDITED",
          createdAt: new Date().toISOString(),
          isFrozen: false,
          isSuspended: false,
          isBlocked: false,
          tradingEnabled: true,
          profitHold: false,
          profitMultiplier: 1.0,
          passwordHash: pwHash,
          balance: 0,
          lastLogin: "",
          country: "",
          trades: 0,
        };

        set({ registeredUsers: [...state.registeredUsers, newUser] });
        return { success: true };
      },

      addAuditEntry: (entry) => {
        set((state) => ({
          auditLog: [entry, ...state.auditLog].slice(0, 200),
        }));
      },

      changePassword: async (currentPassword, newPassword) => {
        const state = get();
        if (!state.user) return { success: false, error: "Not logged in." };
        const currentHash = await hashPassword(currentPassword);
        // Verify current password
        const userRecord = state.registeredUsers.find(
          (u) => u.id === state.user!.id,
        );
        if (!userRecord) return { success: false, error: "User not found." };
        if (userRecord.passwordHash !== currentHash)
          return { success: false, error: "Current password is incorrect." };
        if (newPassword.length < 6)
          return {
            success: false,
            error: "New password must be at least 6 characters.",
          };
        const newHash = await hashPassword(newPassword);
        set({
          registeredUsers: state.registeredUsers.map((u) =>
            u.id === state.user!.id ? { ...u, passwordHash: newHash } : u,
          ),
          user: { ...state.user, passwordHash: newHash },
        });
        return { success: true };
      },

      // ─── UI ───────────────────────────────────────────────────────────────
      sidebarOpen: true,
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      theme: "black" as const,
      setTheme: (theme) => {
        set({ theme });
        if (typeof document !== "undefined") {
          document.documentElement.setAttribute("data-theme", theme);
        }
      },

      // ─── App Data ─────────────────────────────────────────────────────────
      wallet: null,
      portfolio: null,
      setWallet: (wallet) => set({ wallet }),
      setPortfolio: (portfolio) => set({ portfolio }),

      // ─── Pending Transactions ─────────────────────────────────────────────
      pendingTransactions: [],
      addPendingTransaction: (tx) => {
        set((state) => ({
          pendingTransactions: [tx, ...state.pendingTransactions],
        }));
      },
      approvePendingTransaction: (txId, adminEmail) => {
        const state = get();
        const tx = state.pendingTransactions.find((t) => t.id === txId);
        if (!tx || tx.status !== "PENDING") return;

        const statusPatch = {
          pendingTransactions: state.pendingTransactions.map((t) =>
            t.id === txId
              ? {
                  ...t,
                  status: "APPROVED" as const,
                  resolvedAt: new Date().toISOString(),
                  resolvedBy: adminEmail,
                }
              : t,
          ),
          adminAlerts: state.adminAlerts.map((a) =>
            a.pendingTxId === txId
              ? {
                  ...a,
                  status: "APPROVED" as const,
                  read: true,
                  resolvedAt: new Date().toISOString(),
                }
              : a,
          ),
        };

        if (hasApiToken()) {
          set(statusPatch);
          state.addAuditEntry({
            id: `audit-${Date.now()}`,
            time: new Date().toISOString(),
            actor: adminEmail,
            action: "APPROVE_TX",
            target: `${tx.type} $${tx.amount} — ${tx.userEmail}`,
            level: "success",
          });
          return;
        }

        const creditUser = (userId: string, amount: number) => {
          const updatedUsers = state.registeredUsers.map((u) =>
            u.id === userId
              ? { ...u, balance: (u.balance ?? 0) + amount }
              : u,
          );
          const updatedUser =
            state.user?.id === userId
              ? { ...state.user, balance: (state.user.balance ?? 0) + amount }
              : state.user;
          let updatedWallet = state.wallet;
          if (state.user?.id === userId && state.wallet) {
            updatedWallet = {
              ...state.wallet,
              fiatBalance:
                Number(state.wallet.fiatBalance ?? 0) + amount,
            };
          }
          return { updatedUsers, updatedUser, updatedWallet };
        };

        const debitUser = (userId: string, amount: number) => {
          const updatedUsers = state.registeredUsers.map((u) =>
            u.id === userId
              ? { ...u, balance: Math.max(0, (u.balance ?? 0) - amount) }
              : u,
          );
          const updatedUser =
            state.user?.id === userId
              ? {
                  ...state.user,
                  balance: Math.max(0, (state.user.balance ?? 0) - amount),
                }
              : state.user;
          let updatedWallet = state.wallet;
          if (state.user?.id === userId && state.wallet) {
            updatedWallet = {
              ...state.wallet,
              fiatBalance: Math.max(
                0,
                Number(state.wallet.fiatBalance ?? 0) - amount,
              ),
            };
          }
          return { updatedUsers, updatedUser, updatedWallet };
        };

        let patch: Partial<Store> = {
          pendingTransactions: state.pendingTransactions.map((t) =>
            t.id === txId
              ? {
                  ...t,
                  status: "APPROVED" as const,
                  resolvedAt: new Date().toISOString(),
                  resolvedBy: adminEmail,
                }
              : t,
          ),
          adminAlerts: state.adminAlerts.map((a) =>
            a.pendingTxId === txId
              ? {
                  ...a,
                  status: "APPROVED" as const,
                  read: true,
                  resolvedAt: new Date().toISOString(),
                }
              : a,
          ),
        };

        if (tx.type === "DEPOSIT") {
          const { updatedUsers, updatedUser, updatedWallet } = creditUser(
            tx.userId,
            tx.amount,
          );
          patch = {
            ...patch,
            registeredUsers: updatedUsers,
            user: updatedUser,
            wallet: updatedWallet,
          };
          if (state.user?.id === tx.userId) {
            patch.notifications = [
              {
                id: `notif-${Date.now()}`,
                userId: tx.userId,
                title: "Capital signal confirmed",
                message: `$${tx.amount.toLocaleString()} has been credited to your node.`,
                type: "transaction",
                read: false,
                createdAt: new Date().toISOString(),
              },
              ...state.notifications,
            ];
          }
        } else if (tx.type === "FUND_INVEST" || tx.type === "WITHDRAWAL") {
          const { updatedUsers, updatedUser, updatedWallet } = debitUser(
            tx.userId,
            tx.amount,
          );
          patch = {
            ...patch,
            registeredUsers: updatedUsers,
            user: updatedUser,
            wallet: updatedWallet,
          };
          if (state.user?.id === tx.userId) {
            patch.notifications = [
              {
                id: `notif-${Date.now()}`,
                userId: tx.userId,
                title:
                  tx.type === "FUND_INVEST"
                    ? "Fund allocation cleared"
                    : "Withdrawal cleared",
                message:
                  tx.type === "FUND_INVEST"
                    ? `$${tx.amount.toLocaleString()} routed to ${tx.fundName ?? "fund"}.`
                    : `$${tx.amount.toLocaleString()} withdrawal approved.`,
                type: "transaction",
                read: false,
                createdAt: new Date().toISOString(),
              },
              ...state.notifications,
            ];
          }
        }

        set(patch as Store);
        state.addAuditEntry({
          id: `audit-${Date.now()}`,
          time: new Date().toISOString(),
          actor: adminEmail,
          action: "APPROVE_TX",
          target: `${tx.type} $${tx.amount} — ${tx.userEmail}`,
          level: "success",
        });
      },
      rejectPendingTransaction: (txId, adminEmail, reason) => {
        const state = get();
        const tx = state.pendingTransactions.find((t) => t.id === txId);
        set({
          pendingTransactions: state.pendingTransactions.map((t) =>
            t.id === txId
              ? {
                  ...t,
                  status: "REJECTED" as const,
                  resolvedAt: new Date().toISOString(),
                  resolvedBy: adminEmail,
                  rejectionReason: reason,
                }
              : t,
          ),
          adminAlerts: state.adminAlerts.map((a) =>
            a.pendingTxId === txId
              ? {
                  ...a,
                  status: "REJECTED" as const,
                  read: true,
                  resolvedAt: new Date().toISOString(),
                }
              : a,
          ),
          notifications:
            tx && state.user?.id === tx.userId
              ? [
                  {
                    id: `notif-${Date.now()}`,
                    userId: tx.userId,
                    title: "Signal denied",
                    message: reason || "Admin clearance was not granted.",
                    type: "system",
                    read: false,
                    createdAt: new Date().toISOString(),
                  },
                  ...state.notifications,
                ]
              : state.notifications,
        });
      },

      // ─── Admin Alerts (instant capital detection) ─────────────────────────
      adminAlerts: [],
      addAdminAlert: (alert) => {
        const id = `alert-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const full: AdminAlert = {
          ...alert,
          id,
          read: false,
          status: "PENDING",
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          adminAlerts: [full, ...state.adminAlerts].slice(0, 100),
        }));
        if (typeof window !== "undefined" && "Notification" in window) {
          if (Notification.permission === "granted") {
            new Notification("X-CAPITAL — Inbound capital signal", {
              body: `${alert.userEmail}: $${alert.amount.toLocaleString()} ${alert.type}`,
            });
          }
        }
        return id;
      },
      markAdminAlertRead: (id) => {
        set((state) => ({
          adminAlerts: state.adminAlerts.map((a) =>
            a.id === id ? { ...a, read: true } : a,
          ),
        }));
      },
      resolveAdminAlert: (id, status) => {
        set((state) => ({
          adminAlerts: state.adminAlerts.map((a) =>
            a.id === id
              ? {
                  ...a,
                  status,
                  read: true,
                  resolvedAt: new Date().toISOString(),
                }
              : a,
          ),
        }));
      },
      getUnreadAdminAlertCount: () =>
        get().adminAlerts.filter(
          (a) => !a.read && a.status === "PENDING",
        ).length,

      // ─── Notifications ────────────────────────────────────────────────────
      notifications: [],
      addNotification: (n) => {
        set((state) => ({
          notifications: [n, ...state.notifications],
        }));
      },
      markNotificationRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n,
          ),
        }));
      },
      deleteNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      },

      // ─── KYC Submissions ──────────────────────────────────────────────────
      kycSubmissions: [],
      submitKYC: (submission) => {
        const state = get();
        set({
          kycSubmissions: [submission, ...state.kycSubmissions],
          registeredUsers: state.registeredUsers.map((u) =>
            u.id === submission.userId
              ? { ...u, kycStatus: "PENDING" as const }
              : u,
          ),
          user:
            state.user?.id === submission.userId
              ? { ...state.user, kycStatus: "PENDING" as const }
              : state.user,
        });
      },
      approveKYC: (submissionId, adminEmail) => {
        const state = get();
        const sub = state.kycSubmissions.find((s) => s.id === submissionId);
        if (!sub) return;
        const matchesSub = (u: User) =>
          u.id === sub.userId ||
          u.email.toLowerCase() === sub.userEmail.toLowerCase();
        const registeredUsers = state.registeredUsers.map((u) =>
          matchesSub(u) ? { ...u, kycStatus: "APPROVED" as const } : u,
        );
        set({
          kycSubmissions: state.kycSubmissions.map((s) =>
            s.id === submissionId
              ? {
                  ...s,
                  status: "APPROVED" as const,
                  reviewedAt: new Date().toISOString(),
                  reviewedBy: adminEmail,
                }
              : s,
          ),
          registeredUsers,
          user: mergeUserFromRegistry(state.user, registeredUsers),
        });
      },
      rejectKYC: (submissionId, adminEmail, reason) => {
        const state = get();
        const sub = state.kycSubmissions.find((s) => s.id === submissionId);
        if (!sub) return;
        const matchesSub = (u: User) =>
          u.id === sub.userId ||
          u.email.toLowerCase() === sub.userEmail.toLowerCase();
        const registeredUsers = state.registeredUsers.map((u) =>
          matchesSub(u) ? { ...u, kycStatus: "REJECTED" as const } : u,
        );
        set({
          kycSubmissions: state.kycSubmissions.map((s) =>
            s.id === submissionId
              ? {
                  ...s,
                  status: "REJECTED" as const,
                  reviewedAt: new Date().toISOString(),
                  reviewedBy: adminEmail,
                  rejectionReason: reason,
                }
              : s,
          ),
          registeredUsers,
          user: mergeUserFromRegistry(state.user, registeredUsers),
        });
      },

      // ─── Admin Content ────────────────────────────────────────────────────
      termsOfService: DEFAULT_TOS,
      setTermsOfService: (content) => set({ termsOfService: content }),
    }),
    {
      name: "xcapital-store",
      version: 4,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      migrate: (_old: unknown, _fromVersion: number): any => {
        // Wipe all persisted data on upgrade — forces clean login and fresh server sync
        return {
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          registeredUsers: [],
          auditLog: [],
          pendingTransactions: [],
          adminAlerts: [],
          notifications: [],
          kycSubmissions: [],
          theme: "black",
        };
      },
      partialize: (state) => ({
        user: state.user
          ? {
              ...state.user,
              // Never persist local balance — always pull from server on load
              balance: undefined,
            }
          : null,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        registeredUsers: state.registeredUsers.map((u) => ({
          ...u,
          // Strip balance from persisted registry — server is truth
          balance: undefined,
        })),
        auditLog: state.auditLog,
        pendingTransactions: state.pendingTransactions,
        adminAlerts: state.adminAlerts,
        notifications: state.notifications,
        kycSubmissions: state.kycSubmissions,
        termsOfService: state.termsOfService,
        theme: state.theme,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error("[Store] Rehydration error:", error);
          return;
        }
        if (typeof window === "undefined" || !state) return;
        try {
          const remembered = localStorage.getItem("xc_remember_me") === "1";
          const sessionActive =
            sessionStorage.getItem("xc_session_active") === "1";
          if (!remembered && !sessionActive && state.isAuthenticated) {
            state.user = null;
            state.accessToken = null;
            state.refreshToken = null;
            state.isAuthenticated = false;
          }
          if (state.isAuthenticated && !remembered) {
            sessionStorage.setItem("xc_session_active", "1");
          }
          if (state.theme) {
            document.documentElement.setAttribute("data-theme", state.theme);
          }
          // Always fetch live balance from server on load — never trust cached value
          if (state.isAuthenticated && hasApiToken()) {
            void useStore.getState().syncSessionFromApi();
          }
        } catch (e) {
          console.error("[Store] Rehydration callback error:", e);
        }

        // Cross-tab: sync notifications/alerts only — never balances (server is truth).
        if (typeof window !== "undefined") {
          window.addEventListener("storage", (e) => {
            if (e.key !== "xcapital-store" || !e.newValue) return;
            try {
              const parsed = JSON.parse(e.newValue);
              const incoming = parsed?.state ?? parsed;
              useStore.setState((current) => ({
                pendingTransactions:
                  incoming.pendingTransactions ?? current.pendingTransactions,
                adminAlerts: incoming.adminAlerts ?? current.adminAlerts,
                notifications: incoming.notifications ?? current.notifications,
              }));
            } catch {
              /* ignore */
            }
          });
        }
      },
    },
  ),
);
