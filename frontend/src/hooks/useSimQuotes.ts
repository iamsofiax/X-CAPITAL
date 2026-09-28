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
    const moving = (inst: (typeof INSTRUMENTS)[number], base: number, change: number, source: Quote["source"]) => {
      const mid = tapeMid(inst, base, now);
      const drift = base > 0 ? (mid / base - 1) * 100 : 0;
      return buildQuote(inst, mid, change + drift, source);
    };
    for (const inst of INSTRUMENTS) {
      const live = prices[inst.symbol];
      if (live && live.price > 0) {
        quotes[inst.symbol] = moving(inst, live.price, live.changePercent24h, "LIVE");
        liveCount++;
      } else if (indexFactor > 0 && inst.cls !== "crypto") {
        quotes[inst.symbol] = moving(inst, inst.ref * indexFactor, spy?.changePercent24h ?? 0, "MARKED");
        markedCount++;
      } else {
        const indicative = simQuote(inst, now);
        quotes[inst.symbol] = moving(inst, indicative.mid, indicative.change24h, "INDICATIVE");
      }
    }
    return { quotes, liveCount, markedCount };
  }, [prices, now]);
}
