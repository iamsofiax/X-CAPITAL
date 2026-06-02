import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
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

export const authAPI = {
  register: (data: { email: string; password: string; firstName: string; lastName: string }) =>
    api.post('/auth/register', data),
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
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
};
