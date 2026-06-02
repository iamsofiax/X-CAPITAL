"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  fetchCryptoPrices,
  fetchStockQuotes,
  STOCK_SYMBOLS,
  ETF_SYMBOLS,
  type MarketPrice,
} from "@/lib/marketData";

interface UseMarketPricesOptions {
  stocks?: boolean;
  crypto?: boolean;
  etfs?: boolean;
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
    refreshInterval = 120_000,
  } = options;

  const [prices, setPrices] = useState<Record<string, MarketPrice>>({});
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const mountedRef = useRef(true);

  const refresh = useCallback(async () => {
    const results: Record<string, MarketPrice> = {};

    // Fetch crypto (CoinGecko — free, no key)
    if (crypto) {
      const cryptoPrices = await fetchCryptoPrices();
      Object.assign(results, cryptoPrices);
    }

    // Fetch stocks + ETFs (Finnhub — needs key, gracefully returns {} if no key)
    if (stocks || etfs) {
      const symbols = [
        ...(stocks ? STOCK_SYMBOLS : []),
        ...(etfs ? ETF_SYMBOLS : []),
      ];
      const stockPrices = await fetchStockQuotes(symbols);
      Object.assign(results, stockPrices);
    }

    if (mountedRef.current && Object.keys(results).length > 0) {
      setPrices((prev) => ({ ...prev, ...results }));
      setLoading(false);
      setLastUpdated(Date.now());
    } else if (mountedRef.current) {
      setLoading(false);
    }
  }, [stocks, crypto, etfs]);

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
