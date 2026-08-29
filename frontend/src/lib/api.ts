import axios from 'axios';

// Production API lives on Render. `.env.local` is gitignored, so the static
// GitHub Pages build must default to the live endpoint — never localhost.
const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://xcapital-api.onrender.com/api/v1';

export const API_ORIGIN = API_URL.replace(/\/api\/v1\/?$/, '');

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Attach auth token from localStorage on every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('xc_access_token');
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

    if (error?.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        if (typeof window === 'undefined') return Promise.reject(error);

        const refreshToken = localStorage.getItem('xc_refresh_token');
        if (!refreshToken) return Promise.reject(error);

        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRefresh } = data.data;

        localStorage.setItem('xc_access_token', accessToken);
        localStorage.setItem('xc_refresh_token', newRefresh);

        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${accessToken}`;

        return api(original);
      } catch {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('xc_access_token');
          localStorage.removeItem('xc_refresh_token');
          window.location.href = '/auth/login';
        }
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

// ─── API Modules ──────────────────────────────────────────────────────────────

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'offline';
  service: string;
  version: string;
  environment: string;
  uptimeSeconds: number;
  timestamp: string;
  latencyMs?: number;
  services: Array<{
    name: string;
    status: 'operational' | 'degraded' | 'offline';
    latencyMs?: number;
    detail?: string;
  }>;
  summary: {
    operational: number;
    degraded: number;
    offline: number;
    total: number;
  };
}

export const systemAPI = {
  getHealth: () => api.get('/health'),
};

/**
 * Ping origin `/health` (liveness). This is the cheap wake-up for Render
 * cold starts and is what the badge uses — not the heavier `/api/v1/health`
 * probe that also talks to the oracle.
 */
export const wakeApi = async (timeoutMs = 45_000): Promise<boolean> => {
  try {
    const { status, data } = await axios.get(`${API_ORIGIN}/health`, {
      timeout: timeoutMs,
    });
    return status === 200 && (data?.status === 'healthy' || data?.status === 'starting' || data?.status === 'degraded');
  } catch {
    return false;
  }
};

/**
 * Health probe with a much longer timeout + 503 retry.
 *
 * Render free-tier backends cold-start in 30–60s and answer 503 while they
 * boot. The shared axios timeout would fail the first probe and the badge
 * would show "API OFFLINE" even though the API is just waking up. This
 * dedicated probe waits up to 60s and retries 503s so real cold-starts read
 * as "CHECKING…" until the API answers.
 *
 * Liveness (`/health`) is the source of truth for ONLINE/OFFLINE. Detailed
 * `/api/v1/health` is best-effort and must not flip the badge to OFFLINE
 * if the process is up but the oracle is slow.
 */
export const healthProbe = async (
  attempts = 5,
  timeoutMs = 60_000,
): Promise<SystemHealth | null> => {
  for (let i = 0; i < attempts; i++) {
    try {
      const live = await axios.get(`${API_ORIGIN}/health`, { timeout: timeoutMs });
      if (live.status !== 200) {
        throw new Error('liveness not 200');
      }
      let detailed: SystemHealth | null = null;
      try {
        const { data } = await api.get('/health', { timeout: 8_000 });
        detailed = data?.data ?? null;
      } catch {
        detailed = null;
      }
      if (detailed) return detailed;
      const dbUp = Boolean(live.data?.database);
      return {
        status: dbUp ? 'healthy' : 'degraded',
        service: live.data?.service || 'X-CAPITAL API',
        version: live.data?.version || '1.0.0',
        environment: live.data?.environment || 'production',
        uptimeSeconds: 0,
        timestamp: live.data?.timestamp || new Date().toISOString(),
        services: [
          {
            name: 'database',
            status: dbUp ? 'operational' : 'offline',
          },
        ],
        summary: {
          operational: dbUp ? 1 : 0,
          degraded: 0,
          offline: dbUp ? 0 : 1,
          total: 1,
        },
      };
    } catch (error) {
      const status = (error as { response?: { status?: number } } | undefined)
        ?.response?.status;
      // 503 = Render cold-start; retry with backoff instead of declaring offline.
      if ((status === 503 || !status) && i < attempts - 1) {
        await new Promise((r) => setTimeout(r, 4000 * (i + 1)));
        continue;
      }
      return null;
    }
  }
  return null;
};

export const authAPI = {
  register: (data: { email: string; password: string; firstName: string; lastName: string }) =>
    api.post('/auth/register', data, { timeout: 45_000 }),
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }, { timeout: 45_000 }),
  google: (credential: string) =>
    api.post('/auth/google', { credential }, { timeout: 45_000 }),
  apple: (
    identityToken: string,
    names?: { firstName?: string; lastName?: string },
  ) => api.post('/auth/apple', { identityToken, ...names }, { timeout: 45_000 }),
  logout: (refreshToken: string) =>
    api.post('/auth/logout', { refreshToken }),
  getMe: () => api.get('/auth/me'),
  initiateKYC: () => api.post('/auth/kyc/initiate'),
};

export const tradingAPI = {
  getAssets: (params?: { type?: string; search?: string; limit?: number; offset?: number }) =>
    api.get('/trading/assets', { params }),
  getAsset: (symbol: string) => api.get(`/trading/assets/${symbol}`),
  getAssetChart: (symbol: string, period: string) =>
    api.get(`/trading/assets/${symbol}/chart`, { params: { period } }),
  buy: (assetId: string, amount: number) =>
    api.post('/trading/buy', { assetId, amount }),
  sell: (assetId: string, quantity: number) =>
    api.post('/trading/sell', { assetId, quantity }),
  getOrders: () => api.get('/trading/orders'),
  cancelOrder: (id: string) => api.delete(`/trading/orders/${id}`),
};

export const portfolioAPI = {
  getPortfolio: () => api.get('/portfolio'),
  getHoldings: () => api.get('/portfolio/holdings'),
  getPerformance: (period?: string) =>
    api.get('/portfolio/performance', { params: { period } }),
  getAllocation: () => api.get('/portfolio/allocation'),
};

export const fundsAPI = {
  getFunds: () => api.get('/funds'),
  getFund: (id: string) => api.get(`/funds/${id}`),
  getMyInvestments: () => api.get('/funds/my/investments'),
  invest: (fundId: string, amount: number) =>
    api.post(`/funds/${fundId}/invest`, { amount }),
  redeem: (investmentId: string) =>
    api.post(`/funds/${investmentId}/redeem`),
};

export const walletAPI = {
  getWallet: () => api.get('/wallet'),
  getTransactions: (params?: { limit?: number; offset?: number; type?: string }) =>
    api.get('/wallet/transactions', { params }),
  deposit: (amount: number, paymentMethodId?: string) =>
    api.post('/wallet/deposit', { amount, paymentMethodId }),
  withdraw: (amount: number, bankAccountId: string) =>
    api.post('/wallet/withdraw', { amount, bankAccountId }),
};

export const commerceAPI = {
  getProducts: () => api.get('/commerce/products'),
  getProduct: (id: string) => api.get(`/commerce/products/${id}`),
  checkout: (productId: string, options: { paymentMethod: string; investmentBundle?: boolean; investmentPercent?: number }) =>
    api.post('/commerce/checkout', { productId, ...options }),
};

export const oracleAPI = {
  getForecast: (symbol: string, horizon?: string) =>
    api.get(`/oracle/forecast/${symbol}`, { params: { horizon } }),
  getOptimalAllocation: () => api.get('/oracle/allocation'),
  getSentiment: (symbol: string) => api.get(`/oracle/sentiment/${symbol}`),
  getPortfolioRisk: () => api.get('/oracle/risk'),
};

export const accountAPI = {
  getSnapshot: () => api.get('/account/snapshot'),
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
  adjustBalance: (
    userId: string,
    body: {
      amount: number;
      direction: 'credit' | 'debit';
      note?: string;
      txType?: string;
    },
  ) => api.post(`/admin/users/${userId}/balance`, body),
  getAlerts: (status?: string) =>
    api.get('/admin/alerts', { params: status ? { status } : {} }),
  approveAlert: (id: string) => api.post(`/admin/alerts/${id}/approve`),
  rejectAlert: (id: string, reason?: string) =>
    api.post(`/admin/alerts/${id}/reject`, { reason }),
  getYieldConfig: (userId: string) =>
    api.get(`/admin/users/${userId}/yield-config`),
  putYieldConfig: (
    userId: string,
    body: {
      profitRate?: number;
      dailyRate?: number;
      profitMode?: 'linear' | 'compound';
      profitMultiplier?: number;
      profitHold?: boolean;
      nodeGoal?: number | null;
      nextNodeRate?: number | null;
    },
  ) => api.put(`/admin/users/${userId}/yield-config`, body),
  setYieldHold: (userId: string, profitHold: boolean) =>
    api.post(`/admin/users/${userId}/hold`, { profitHold }),
  createSpike: (
    userId: string,
    body: {
      percentage: number;
      durationHours: number;
      direction?: 'up' | 'down';
      label?: string;
      profitRate?: number;
    },
  ) => api.post(`/admin/users/${userId}/spikes`, body),
  resolveSpike: (userId: string, spikeId?: string) =>
    spikeId
      ? api.post(`/admin/users/${userId}/spikes/${spikeId}/resolve`)
      : api.post(`/admin/users/${userId}/spikes/resolve`),
};
