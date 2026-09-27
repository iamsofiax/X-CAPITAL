import axios, { AxiosInstance } from 'axios';
import { env } from '../config/env';
import { logger } from '../utils/logger';

interface AlpacaOrder {
  id: string;
  status: string;
  symbol: string;
  qty: string;
  filled_qty: string;
  filled_avg_price: string;
  side: string;
  created_at: string;
}

interface Quote {
  symbol: string;
  bid: number;
  ask: number;
  last: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: string;
}

interface Bar {
  t: string;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

class BrokerService {
  private readonly tradingClient: AxiosInstance;
  private readonly dataClient: AxiosInstance;

  constructor() {
    const headers = {
      'APCA-API-KEY-ID': env.ALPACA_API_KEY,
      'APCA-API-SECRET-KEY': env.ALPACA_SECRET_KEY,
      'Content-Type': 'application/json',
    };

    this.tradingClient = axios.create({
      baseURL: `${env.ALPACA_BASE_URL}/v2`,
      headers,
      timeout: 10000,
    });

    this.dataClient = axios.create({
      baseURL: `${env.ALPACA_DATA_URL}/v2`,
      headers,
      timeout: 10000,
    });
  }

  async placeOrder(params: {
    symbol: string;
    qty: number;
    side: 'buy' | 'sell';
    type: 'market' | 'limit';
    limitPrice?: number;
  }): Promise<AlpacaOrder> {
    try {
      const response = await this.tradingClient.post('/orders', {
        symbol: params.symbol,
        qty: params.qty.toFixed(8),
        side: params.side,
        type: params.type,
        time_in_force: 'day',
        ...(params.limitPrice && { limit_price: params.limitPrice }),
      });
      logger.info(`Alpaca order placed: ${response.data.id} — ${params.side} ${params.qty} ${params.symbol}`);
      return response.data;
    } catch (error: unknown) {
      const msg = axios.isAxiosError(error) ? error.response?.data?.message : String(error);
      logger.error(`Alpaca order failed: ${msg}`);
      throw new Error(`Broker execution failed: ${msg}`);
    }
  }

  async cancelOrder(orderId: string): Promise<void> {
    await this.tradingClient.delete(`/orders/${orderId}`);
    logger.info(`Alpaca order cancelled: ${orderId}`);
  }

  async getOrder(orderId: string): Promise<AlpacaOrder> {
    const response = await this.tradingClient.get(`/orders/${orderId}`);
    return response.data;
  }

  configured(): boolean {
    return Boolean(env.ALPACA_API_KEY && env.ALPACA_SECRET_KEY);
  }

  async getQuote(symbol: string): Promise<Quote> {
    try {
      const response = await this.dataClient.get(`/stocks/${symbol}/quotes/latest`, {
        params: { feed: 'iex' },
      });
      const q = response.data.quote;
      return {
        symbol,
        bid: q.bp,
        ask: q.ap,
        last: (q.bp + q.ap) / 2,
        change: 0,
        changePercent: 0,
        volume: q.bs,
        timestamp: q.t,
      };
    } catch (error) {
      logger.warn(`Quote fetch failed for ${symbol}, using stored price`);
      throw error;
    }
  }

  async getSnapshots(symbols: string[]): Promise<Record<string, Quote>> {
    if (!this.configured() || symbols.length === 0) return {};
    const uniq = [...new Set(symbols.map((s) => s.toUpperCase()))].slice(0, 30);
    try {
      const response = await this.dataClient.get('/stocks/snapshots', {
        params: { symbols: uniq.join(','), feed: 'iex' },
      });
      const out: Record<string, Quote> = {};
      for (const [symbol, raw] of Object.entries(response.data || {})) {
        const snap = raw as {
          latestQuote?: { bp?: number; ap?: number; t?: string };
          latestTrade?: { p?: number; t?: string };
          dailyBar?: { v?: number };
          prevDailyBar?: { c?: number };
        };
        const q = snap.latestQuote;
        const trade = snap.latestTrade;
        const prev = snap.prevDailyBar?.c;
        const last = trade?.p ?? (q && q.bp && q.ap ? (q.bp + q.ap) / 2 : 0);
        if (!last) continue;
        const change = prev ? last - prev : 0;
        const changePercent = prev ? (change / prev) * 100 : 0;
        out[symbol] = {
          symbol,
          bid: q?.bp ?? last,
          ask: q?.ap ?? last,
          last,
          change,
          changePercent,
          volume: snap.dailyBar?.v ?? 0,
          timestamp: q?.t ?? trade?.t ?? new Date().toISOString(),
        };
      }
      return out;
    } catch (error) {
      logger.warn(`Alpaca snapshots failed: ${error instanceof Error ? error.message : String(error)}`);
      return {};
    }
  }

  async getBars(symbol: string, period: string): Promise<Bar[]> {
    const periodMap: Record<string, { timeframe: string; limit: number }> = {
      '1D': { timeframe: '5Min', limit: 78 },
      '1W': { timeframe: '1Hour', limit: 168 },
      '1M': { timeframe: '1Day', limit: 30 },
      '3M': { timeframe: '1Day', limit: 90 },
      '1Y': { timeframe: '1Week', limit: 52 },
    };

    const config = periodMap[period] || periodMap['1M'];

    try {
      const response = await this.dataClient.get(`/stocks/${symbol}/bars`, {
        params: {
          timeframe: config.timeframe,
          limit: config.limit,
          adjustment: 'raw',
          feed: 'iex',
        },
      });
      return response.data.bars || [];
    } catch (error) {
      logger.warn(`Alpaca bars failed for ${symbol}: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  async getAccount(): Promise<Record<string, unknown>> {
    const response = await this.tradingClient.get('/account');
    return response.data;
  }
}

export const brokerService = new BrokerService();
