"use client";

import { useSyncExternalStore } from "react";
import { INSTRUMENTS } from "@/lib/sim/instruments";
import {
  fetchBinancePrices,
  fetchBrokerQuotes,
  fetchEquityPrints,
  fetchStockQuotes,
  STOCK_SYMBOLS,
  ETF_SYMBOLS,
  type MarketPrice,
} from "@/lib/marketData";

interface UseMarketPricesOptions {
  stocks?: boolean;
  crypto?: boolean;
  etfs?: boolean;
  /** When set, only these names are requested. The long book stays on its reference mark. */
  symbols?: string[];
  refreshInterval?: number;
}

interface UseMarketPricesReturn {
  prices: Record<string, MarketPrice>;
  loading: boolean;
  lastUpdated: number | null;
}

const EMPTY: UseMarketPricesReturn = { prices: {}, loading: true, lastUpdated: null };

const CRYPTO = new Set(["BTC", "ETH", "SOL", "DOGE", "ADA", "AVAX", "LINK", "DOT", "XRP", "BNB", "USDT", "USDC", "MATIC", "TRX"]);

type Slot = {
  snapshot: UseMarketPricesReturn;
  listeners: Set<() => void>;
  timer: number | null;
  inflight: boolean;
  interval: number;
  refresh: () => Promise<void>;
};

const slots = new Map<string, Slot>();

function publish(slot: Slot, next: UseMarketPricesReturn) {
  slot.snapshot = next;
  slot.listeners.forEach((fn) => fn());
}

function createSlot(options: Required<Pick<UseMarketPricesOptions, "stocks" | "crypto" | "etfs" | "refreshInterval">> & { symbols?: string[] }, key: string): Slot {
  const slot: Slot = {
    snapshot: EMPTY,
    listeners: new Set(),
    timer: null,
    inflight: false,
    interval: options.refreshInterval,
    refresh: async () => undefined,
  };

  slot.refresh = async () => {
    if (slot.inflight) return;
    if (typeof document !== "undefined" && document.hidden) return;
    slot.inflight = true;
    const results: Record<string, MarketPrice> = {};
    try {
      const wanted = options.symbols?.map((s) => s.toUpperCase());
      if (options.crypto && (!wanted || wanted.some((s) => CRYPTO.has(s)))) {
        Object.assign(results, await fetchBinancePrices());
      }
      if (options.stocks || options.etfs) {
        const listed = (wanted ?? INSTRUMENTS.filter((inst) => (options.stocks && inst.cls === "equity") || (options.etfs && inst.cls === "etf")).map((inst) => inst.symbol))
          .filter((s) => !CRYPTO.has(s));
        const desk = (wanted ?? [...(options.stocks ? STOCK_SYMBOLS : []), ...(options.etfs ? ETF_SYMBOLS : [])]).filter((s) => !CRYPTO.has(s));
        if (listed.length || desk.length) {
          const broker = Promise.race([
            fetchBrokerQuotes(desk.slice(0, 20)),
            new Promise<Record<string, MarketPrice>>((resolve) => setTimeout(() => resolve({}), 3500)),
          ]);
          const [brokerQuotes, finnhub, prints] = await Promise.all([
            broker,
            fetchStockQuotes(desk.slice(0, 20)),
            fetchEquityPrints(listed),
          ]);
          Object.assign(results, prints, finnhub, brokerQuotes);
        }
      }
      if (wanted) {
        for (const sym of Object.keys(results)) {
          if (!wanted.includes(sym)) delete results[sym];
        }
      }
      if (Object.keys(results).length > 0) {
        publish(slot, {
          prices: { ...slot.snapshot.prices, ...results },
          loading: false,
          lastUpdated: Date.now(),
        });
      } else if (slot.snapshot.loading) {
        publish(slot, { ...slot.snapshot, loading: false });
      }
    } finally {
      slot.inflight = false;
    }
  };

  slots.set(key, slot);
  return slot;
}

function slotFor(options: UseMarketPricesOptions): Slot {
  const stocks = options.stocks ?? true;
  const crypto = options.crypto ?? true;
  const etfs = options.etfs ?? true;
  const refreshInterval = options.refreshInterval ?? 120_000;
  const symbols = options.symbols?.map((s) => s.toUpperCase()).sort();
  const key = `${stocks}|${crypto}|${etfs}|${refreshInterval}|${symbols?.join(",") ?? "*"}`;
  return slots.get(key) ?? createSlot({ stocks, crypto, etfs, refreshInterval, symbols }, key);
}

function arm(slot: Slot) {
  if (slot.timer != null || typeof window === "undefined") return;
  void slot.refresh();
  slot.timer = window.setInterval(() => void slot.refresh(), slot.interval);
}

function disarm(slot: Slot) {
  if (slot.listeners.size > 0 || slot.timer == null) return;
  window.clearInterval(slot.timer);
  slot.timer = null;
}

export function useMarketPrices(options: UseMarketPricesOptions = {}): UseMarketPricesReturn {
  const slot = slotFor(options);
  return useSyncExternalStore(
    (notify) => {
      slot.listeners.add(notify);
      arm(slot);
      return () => {
        slot.listeners.delete(notify);
        disarm(slot);
      };
    },
    () => slot.snapshot,
    () => EMPTY,
  );
}
