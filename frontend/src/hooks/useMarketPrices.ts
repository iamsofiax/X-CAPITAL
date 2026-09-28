"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  /** When set, only these names are requested. The full book is reserved for the desk. */
  symbols?: string[];
  refreshInterval?: number;
}

interface UseMarketPricesReturn {
  prices: Record<string, MarketPrice>;
  loading: boolean;
  lastUpdated: number | null;
}

export function useMarketPrices(
  options: UseMarketPricesOptions = {},
): UseMarketPricesReturn {
  const {
    stocks = true,
    crypto = true,
    etfs = true,
    symbols,
    refreshInterval = 120_000,
  } = options;

  const [prices, setPrices] = useState<Record<string, MarketPrice>>({});
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const mountedRef = useRef(true);

  const refresh = useCallback(async () => {
    const results: Record<string, MarketPrice> = {};

    // Fetch crypto (CoinGecko — free, no key)
    const wanted = symbols?.map((s) => s.toUpperCase());
    const cryptoSet = new Set(["BTC", "ETH", "SOL", "DOGE", "ADA", "AVAX", "LINK", "DOT", "XRP", "BNB", "USDT", "USDC", "MATIC", "TRX"]);
    if (crypto && (!wanted || wanted.some((s) => cryptoSet.has(s)))) {
      Object.assign(results, await fetchBinancePrices());
    }

    if (stocks || etfs) {
      const listed = (wanted ?? INSTRUMENTS.filter((inst) => (stocks && inst.cls === "equity") || (etfs && inst.cls === "etf")).map((inst) => inst.symbol))
        .filter((s) => !cryptoSet.has(s));
      const desk = wanted ?? [...(stocks ? STOCK_SYMBOLS : []), ...(etfs ? ETF_SYMBOLS : [])];
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

    if (mountedRef.current && Object.keys(results).length > 0) {
      setPrices((prev) => ({ ...prev, ...results }));
      setLoading(false);
      setLastUpdated(Date.now());
    } else if (mountedRef.current) {
      setLoading(false);
    }
  }, [stocks, crypto, etfs, symbols?.join(",")]);

  useEffect(() => {
    mountedRef.current = true;
    refresh();
    const interval = setInterval(refresh, refreshInterval);
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [refresh, refreshInterval]);

  return { prices, loading, lastUpdated };
}
