"use client";

import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMarketPrices } from "@/hooks/useMarketPrices";

interface TickerItem {
  symbol: string;
  price: number;
  change: number;
  tag?: string;
}

const TICKER_SEED: TickerItem[] = [
  { symbol: "TSLA", price: 342.18, change: 3.12, tag: "NYSE" },
  { symbol: "NVDA", price: 875.39, change: 2.41, tag: "NASDAQ" },
  { symbol: "BTC", price: 97842.5, change: -1.23, tag: "CRYPTO" },
  { symbol: "DOGE", price: 0.4217, change: 8.52, tag: "CRYPTO" },
  { symbol: "AAPL", price: 213.07, change: 0.84, tag: "NASDAQ" },
  { symbol: "AMZN", price: 196.25, change: -0.62, tag: "NASDAQ" },
  { symbol: "META", price: 513.92, change: 1.37, tag: "NASDAQ" },
  { symbol: "PLTR", price: 23.47, change: 4.21, tag: "NASDAQ" },
  { symbol: "ETH", price: 3842.1, change: -0.38, tag: "CRYPTO" },
  { symbol: "SOL", price: 187.63, change: 5.17, tag: "CRYPTO" },
  { symbol: "MSFT", price: 428.5, change: 0.97, tag: "NASDAQ" },
  { symbol: "GOOGL", price: 178.32, change: -0.14, tag: "NASDAQ" },
  { symbol: "AMD", price: 164.82, change: 1.93, tag: "NASDAQ" },
  { symbol: "AVGO", price: 1423.11, change: 3.94, tag: "NASDAQ" },
  { symbol: "MU", price: 104.3, change: 4.11, tag: "NASDAQ" },
  { symbol: "ORCL", price: 141.82, change: 0.94, tag: "NYSE" },
  { symbol: "ADBE", price: 512.3, change: -0.65, tag: "NASDAQ" },
  { symbol: "QCOM", price: 171.5, change: 2.08, tag: "NASDAQ" },
  { symbol: "CRM", price: 302.5, change: -0.84, tag: "NYSE" },
  { symbol: "NFLX", price: 628.4, change: 1.05, tag: "NASDAQ" },
  { symbol: "UBER", price: 74.15, change: -1.12, tag: "NYSE" },
  { symbol: "COIN", price: 254.8, change: 3.62, tag: "NASDAQ" },
  { symbol: "SQ", price: 78.92, change: 2.18, tag: "NYSE" },
  { symbol: "SNAP", price: 16.35, change: -2.41, tag: "NYSE" },
  { symbol: "RIVN", price: 18.92, change: 5.21, tag: "NASDAQ" },
  { symbol: "HOOD", price: 24.78, change: 4.87, tag: "NASDAQ" },
  { symbol: "SOFI", price: 8.94, change: 2.15, tag: "NASDAQ" },
  { symbol: "CRWD", price: 302.6, change: 2.31, tag: "NASDAQ" },
  { symbol: "SNOW", price: 184.29, change: 1.44, tag: "NYSE" },
  { symbol: "JPM", price: 202.8, change: 0.44, tag: "NYSE" },
  { symbol: "GS", price: 472.3, change: 0.88, tag: "NYSE" },
  { symbol: "V", price: 286.4, change: 0.18, tag: "NYSE" },
  { symbol: "BA", price: 178.4, change: -1.44, tag: "NYSE" },
  { symbol: "LMT", price: 489.3, change: -0.77, tag: "NYSE" },
  { symbol: "XOM", price: 112.8, change: 0.35, tag: "NYSE" },
  { symbol: "DIS", price: 96.4, change: 0.72, tag: "NYSE" },
  { symbol: "KO", price: 60.8, change: 0.12, tag: "NYSE" },
  { symbol: "WMT", price: 66.3, change: 0.55, tag: "NYSE" },
  { symbol: "ADA", price: 0.6428, change: 4.75, tag: "CRYPTO" },
  { symbol: "AVAX", price: 38.92, change: 6.21, tag: "CRYPTO" },
  { symbol: "LINK", price: 18.47, change: 3.08, tag: "CRYPTO" },
  { symbol: "DOT", price: 7.82, change: -1.54, tag: "CRYPTO" },
  { symbol: "XRP", price: 0.6215, change: 2.33, tag: "CRYPTO" },
  { symbol: "MATIC", price: 0.8814, change: -0.92, tag: "CRYPTO" },
  { symbol: "UNI", price: 12.84, change: 3.61, tag: "CRYPTO" },
  { symbol: "TON", price: 6.94, change: 3.37, tag: "CRYPTO" },
  { symbol: "SHIB", price: 0.0000214, change: 6.12, tag: "CRYPTO" },
  { symbol: "LTC", price: 84.7, change: 1.28, tag: "CRYPTO" },
  { symbol: "ARKK", price: 52.3, change: 1.87, tag: "ETF" },
  { symbol: "QQQ", price: 482.6, change: 0.64, tag: "ETF" },
  { symbol: "SPY", price: 525.18, change: 0.42, tag: "ETF" },
  { symbol: "VTI", price: 259.3, change: 0.47, tag: "ETF" },
  { symbol: "SOXX", price: 231.5, change: 1.84, tag: "ETF" },
  { symbol: "IBIT", price: 52.89, change: -1.34, tag: "ETF" },
  { symbol: "GLD", price: 214.78, change: 0.21, tag: "ETF" },
  { symbol: "SPX", price: 5621.8, change: 0.42, tag: "INDEX" },
  { symbol: "NDX", price: 19782.4, change: 0.71, tag: "INDEX" },
  { symbol: "VIX", price: 13.42, change: -4.82, tag: "INDEX" },
  { symbol: "EURUSD", price: 1.0864, change: 0.14, tag: "FX" },
  { symbol: "USDJPY", price: 154.78, change: 0.34, tag: "FX" },
  { symbol: "GOLD", price: 2342.5, change: 0.22, tag: "COMMOD" },
  { symbol: "SILVER", price: 28.47, change: -0.62, tag: "COMMOD" },
  { symbol: "OIL", price: 78.42, change: -1.08, tag: "COMMOD" },
  { symbol: "URAN", price: 85.6, change: 2.95, tag: "COMMOD" },
  { symbol: "COPPER", price: 4.62, change: 0.88, tag: "COMMOD" },
  { symbol: "NATGAS", price: 2.84, change: 3.45, tag: "COMMOD" },
];

function formatPrice(price: number): string {
  const p = Number(price ?? 0);
  if (p >= 1000)
    return p.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  if (p < 1) return p.toFixed(4);
  return p.toFixed(2);
}

export default function MarketTicker() {
  const [data, setData] = useState(TICKER_SEED);
  const { prices } = useMarketPrices({ refreshInterval: 120_000 });

  // Overlay live prices onto ticker items whenever prices update
  useEffect(() => {
    if (Object.keys(prices).length === 0) return;
    setData((prev) =>
      prev.map((item) => {
        const live = prices[item.symbol];
        if (!live) return item;
        return {
          ...item,
          price: live.price,
          change: live.changePercent24h,
        };
      }),
    );
  }, [prices]);

  const items = [...data, ...data]; // duplicate for seamless loop

  return (
    <div className="w-full bg-xc-black/90 border-b border-white/[0.08] overflow-hidden relative">
      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-xc-black/90 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-xc-black/90 to-transparent z-10 pointer-events-none" />

      <div className="flex items-center animate-ticker whitespace-nowrap py-2">
        {items.map((item, i) => (
          <div
            key={`${item.symbol}-${i}`}
            className="inline-flex items-center gap-2.5 px-5 border-r border-white/[0.08] shrink-0"
          >
            <span className="text-xs font-bold text-white/90">
              {item.symbol}
            </span>
            {item.tag && (
              <span
                className={cn(
                  "text-[8px] font-mono px-1 py-px rounded",
                  "bg-white/[0.06] text-white/40",
                )}
              >
                {item.tag}
              </span>
            )}
            <span className="text-xs font-mono text-white/70">
              ${formatPrice(item.price)}
            </span>
            <span
              className={cn(
                "text-[10px] font-bold flex items-center gap-0.5",
                item.change >= 0 ? "text-emerald-400" : "text-red-400",
              )}
            >
              {item.change >= 0 ? (
                <TrendingUp className="w-2.5 h-2.5" />
              ) : (
                <TrendingDown className="w-2.5 h-2.5" />
              )}
              {item.change >= 0 ? "+" : ""}
              {Number(item.change ?? 0).toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
