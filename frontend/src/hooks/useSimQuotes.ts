"use client";

import { useEffect, useMemo, useState } from "react";
import { useMarketPrices } from "@/hooks/useMarketPrices";
import {
  INSTRUMENTS,
  buildQuote,
  simQuote,
  type Quote,
} from "@/lib/sim/instruments";

/** Live quotes where a feed is available; deterministic SIM FEED otherwise. Ticks every 5s. */
export function useSimQuotes(): { quotes: Record<string, Quote>; liveCount: number } {
  const { prices } = useMarketPrices({ refreshInterval: 60_000 });
  const [now, setNow] = useState(0);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 5_000);
    return () => clearInterval(id);
  }, []);

  return useMemo(() => {
    const quotes: Record<string, Quote> = {};
    let liveCount = 0;
    for (const inst of INSTRUMENTS) {
      const live = prices[inst.symbol];
      if (live && live.price > 0) {
        quotes[inst.symbol] = buildQuote(inst, live.price, live.changePercent24h, "LIVE");
        liveCount++;
      } else {
        quotes[inst.symbol] = simQuote(inst, now);
      }
    }
    return { quotes, liveCount };
  }, [prices, now]);
}
