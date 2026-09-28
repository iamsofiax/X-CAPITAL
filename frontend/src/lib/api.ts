import axios from 'axios';
import { sessionKeys } from '@/lib/sessionScope';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Attach auth token from localStorage on every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem(sessionKeys().access);
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh on 401 (hardened: backend may be down during early deploy)
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    // axios errors can happen before we have a config (ex: network error)
    const original = error?.config as (typeof error.config & {
      _retry?: boolean;
    }) | undefined;

    if (!original) return Promise.reject(error);

    const isAuthCall = typeof original.url === 'string' && /\/auth\/(login|register|oauth|refresh)/.test(original.url);
    const stored = typeof window !== 'undefined' ? localStorage.getItem(sessionKeys().access) : null;
    if (stored?.startsWith('xc-local.')) return Promise.reject(error);
    if (error?.response?.status === 401 && !original._retry && !isAuthCall) {
      original._retry = true;
      try {
        if (typeof window === 'undefined') return Promise.reject(error);

        const refreshToken = localStorage.getItem(sessionKeys().refresh);
        if (!refreshToken) return Promise.reject(error);

        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRefresh } = data.data;

        const keys = sessionKeys();
        localStorage.setItem(keys.access, accessToken);
        localStorage.setItem(keys.refresh, newRefresh);

        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${accessToken}`;

        return api(original);
      } catch {
        if (typeof window !== 'undefined') {
          const keys = sessionKeys();
          localStorage.removeItem(keys.access);
          localStorage.removeItem(keys.refresh);
          window.location.href = keys.login;
        }
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

// --- API Modules ---

const authTimeout = { timeout: 4000 };

export const authAPI = {
  register: (data: { email: string; password: string; firstName: string; lastName: string }) =>
    api.post('/auth/register', data, authTimeout),
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }, authTimeout),
  oauth: (
    provider: 'google' | 'apple',
    body: { idToken: string; firstName?: string; lastName?: string },
  ) => api.post(`/auth/oauth/${provider}`, body, authTimeout),
  changePassword: (currentPassword: string | undefined, newPassword: string) =>
    api.post('/auth/password', { currentPassword, newPassword }),
  logout: (refreshToken: string) =>
    api.post('/auth/logout', { refreshToken }),
  getMe: () => api.get('/auth/me'),
};

export const tradingAPI = {
  getAssets: (params?: { type?: string; search?: string; limit?: number; offset?: number }) =>
    api.get('/trading/assets', { params }),
  getAsset: (symbol: string) => api.get(`/trading/assets/${symbol}`),
  getAssetChart: (symbol: string, period: string) =>
    api.get(`/trading/assets/${symbol}/chart`, { params: { period } }),
  getQuotes: (symbols: string[]) =>
    api.get('/trading/quotes', { params: { symbols: symbols.join(',') } }),
};

export const oracleAPI = {
  getForecast: (symbol: string, horizon?: string) =>
    api.get(`/oracle/forecast/${symbol}`, { params: { horizon } }),
  getSentiment: (symbol: string) => api.get(`/oracle/sentiment/${symbol}`),
};

export interface SimSnapshotPayload {
  season: number;
  nav: number;
  seasonReturn: number;
  sortino: number | null;
  maxDrawdown: number;
  careerTier: string;
  xp: number;
  resets: number;
  epochs: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatarUrl: string | null;
  nav: number;
  seasonReturn: number;
  sortino: number | null;
  maxDrawdown: number;
  careerTier: string;
  resets: number;
  updatedAt: string;
}

export const simAPI = {
  submitSnapshot: (payload: SimSnapshotPayload) => api.post('/sim/snapshot', payload),
  getLeaderboard: (season?: number) =>
    api.get<{ success: boolean; data: { season: number; entries: LeaderboardEntry[] } }>(
      '/sim/leaderboard',
      { params: season === undefined ? {} : { season } },
    ),
};

export const walletAPI = {
  getWallet: () => api.get('/wallet'),
  getJournal: (params?: { limit?: number; offset?: number }) =>
    api.get('/wallet/transactions', { params }),
  depositAddress: (asset: string) => api.post('/wallet/deposit-address', { asset }),
  claimDeposit: (asset: string, txHash: string) =>
    api.post('/wallet/deposit-claim', { asset, txHash }),
  withdraw: (data: {
    asset: string;
    toAddress: string;
    amount: string;
    idempotencyKey: string;
    reason?: string;
  }) => api.post('/wallet/withdraw', data),
};

export const adminAPI = {
  listUsers: () => api.get('/admin/users'),
  createUser: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    tier?: string;
    phone?: string;
  }) => api.post('/admin/users', data),
  setUserActive: (userId: string, active: boolean) =>
    api.post(`/admin/users/${userId}/active`, { active }),
  postJournal: (
    userId: string,
    data: {
      asset: string;
      amount: string;
      direction: 'credit' | 'debit';
      reason: string;
      idempotencyKey: string;
    },
  ) => api.post(`/admin/users/${userId}/journal`, data),
};
