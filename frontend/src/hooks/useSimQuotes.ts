"use client";

import { useEffect, useMemo, useState } from "react";
import { useMarketPrices } from "@/hooks/useMarketPrices";
import {
  INSTRUMENTS,
  buildQuote,
  simQuote,
  tapeMid,
  type Quote,
} from "@/lib/sim/instruments";

/** Confirmed last sales where a feed exists. Other equities are marked to the confirmed index. */
export function useSimQuotes(): { quotes: Record<string, Quote>; liveCount: number; markedCount: number } {
  const { prices } = useMarketPrices({ refreshInterval: 12_000 });
  const [now, setNow] = useState(0);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 1_000);
    return () => clearInterval(id);
  }, []);

  return useMemo(() => {
    const quotes: Record<string, Quote> = {};
    let liveCount = 0;
    let markedCount = 0;
    const spy = prices.SPY;
    const spyRef = INSTRUMENTS.find((i) => i.symbol === "SPY")?.ref ?? 0;
    const indexFactor = spy && spy.price > 0 && spyRef > 0 ? spy.price / spyRef : 0;
    for (const inst of INSTRUMENTS) {
      const live = prices[inst.symbol];
      if (live && live.price > 0) {
        quotes[inst.symbol] = buildQuote(inst, live.price, live.changePercent24h, "LIVE");
        liveCount++;
      } else if (indexFactor > 0 && inst.cls !== "crypto") {
        const marked = buildQuote(inst, inst.ref * indexFactor, spy?.changePercent24h ?? 0, "MARKED");
        quotes[inst.symbol] = buildQuote(inst, tapeMid(inst, marked.mid, now), marked.change24h, "MARKED");
        markedCount++;
      } else {
        const indicative = simQuote(inst, now);
        quotes[inst.symbol] = buildQuote(inst, tapeMid(inst, indicative.mid, now), indicative.change24h, "INDICATIVE");
      }
    }
    return { quotes, liveCount, markedCount };
  }, [prices, now]);
}
