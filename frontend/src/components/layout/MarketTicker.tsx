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
  { symbol: "SpaceX", price: 252.0, change: 6.84, tag: "PRIVATE" },
  { symbol: "NVDA", price: 875.39, change: 2.41 },
  { symbol: "BTC", price: 97842.5, change: -1.23, tag: "CRYPTO" },
  { symbol: "DOGE", price: 0.4217, change: 8.52, tag: "CRYPTO" },
  { symbol: "xAI", price: 180.0, change: 12.4, tag: "PRIVATE" },
  { symbol: "AAPL", price: 213.07, change: 0.84 },
  { symbol: "AMZN", price: 196.25, change: -0.62 },
  { symbol: "META", price: 513.92, change: 1.37 },
  { symbol: "PLTR", price: 23.47, change: 4.21 },
  { symbol: "ETH", price: 3842.1, change: -0.38, tag: "CRYPTO" },
  { symbol: "SOL", price: 187.63, change: 5.17, tag: "CRYPTO" },
  { symbol: "MSFT", price: 428.5, change: 0.97 },
  { symbol: "GOOGL", price: 178.32, change: -0.14 },
  { symbol: "Starlink", price: 95.0, change: 4.22, tag: "PRIVATE" },
  { symbol: "Neuralink", price: 48.5, change: 9.8, tag: "PRIVATE" },
  { symbol: "Boring Co", price: 32.0, change: 2.15, tag: "PRIVATE" },
  { symbol: "AMD", price: 164.82, change: 1.93 },
  { symbol: "CRM", price: 302.5, change: -0.84 },
  { symbol: "NFLX", price: 628.4, change: 1.05 },
  { symbol: "UBER", price: 74.15, change: -1.12 },
  { symbol: "COIN", price: 254.8, change: 3.62, tag: "CRYPTO" },
  { symbol: "SQ", price: 78.92, change: 2.18 },
  { symbol: "SNAP", price: 16.35, change: -2.41 },
  { symbol: "ADA", price: 0.6428, change: 4.75, tag: "CRYPTO" },
  { symbol: "AVAX", price: 38.92, change: 6.21, tag: "CRYPTO" },
  { symbol: "LINK", price: 18.47, change: 3.08, tag: "CRYPTO" },
  { symbol: "DOT", price: 7.82, change: -1.54, tag: "CRYPTO" },
  { symbol: "XRP", price: 0.6215, change: 2.33, tag: "CRYPTO" },
  { symbol: "MATIC", price: 0.8814, change: -0.92, tag: "CRYPTO" },
  { symbol: "ARKK", price: 52.3, change: 1.87, tag: "ETF" },
  { symbol: "QQQ", price: 482.6, change: 0.64, tag: "ETF" },
  { symbol: "SPY", price: 525.18, change: 0.42, tag: "ETF" },
  { symbol: "GOLD", price: 2342.5, change: 0.22, tag: "COMMOD" },
  { symbol: "OIL", price: 78.42, change: -1.08, tag: "COMMOD" },
  { symbol: "URAN", price: 85.6, change: 2.95, tag: "COMMOD" },
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
  const { prices } = useMarketPrices({ refreshInterval: 30_000 });

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

  // Micro-fluctuations for items without live data (private tokens, commodities)
  useEffect(() => {
    const interval = setInterval(() => {
      setData((prev) =>
        prev.map((item) => {
          if (prices[item.symbol]) return item; // skip live-priced items
          return {
            ...item,
            price: item.price * (1 + (Math.random() - 0.5) * 0.002),
            change: item.change + (Math.random() - 0.5) * 0.15,
          };
        }),
      );
    }, 12000);
    return () => clearInterval(interval);
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
