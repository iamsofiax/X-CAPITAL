"use client";

import { useMemo } from "react";
import { useMarketPrices } from "@/hooks/useMarketPrices";
import { FEATURED, INSTRUMENTS, buildQuote, type Quote } from "@/lib/sim/instruments";

const TAPE = FEATURED.map((inst) => inst.symbol);

/** Last sale for the tape. The long book stays on its reference mark so the desk opens at once. */
export function useSimQuotes(): { quotes: Record<string, Quote>; liveCount: number; markedCount: number } {
  const { prices } = useMarketPrices({ symbols: TAPE, refreshInterval: 30_000 });

  return useMemo(() => {
    const quotes: Record<string, Quote> = {};
    let liveCount = 0;
    let markedCount = 0;
    for (const inst of INSTRUMENTS) {
      const live = prices[inst.symbol];
      if (live && live.price > 0) {
        quotes[inst.symbol] = buildQuote(inst, live.price, live.changePercent24h, "LIVE");
        liveCount++;
      } else {
        quotes[inst.symbol] = buildQuote(inst, inst.ref, 0, "INDICATIVE");
        markedCount++;
      }
    }
    return { quotes, liveCount, markedCount };
  }, [prices]);
}
