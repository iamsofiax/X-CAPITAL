"use client";

import { useSimQuotes } from "@/hooks/useSimQuotes";
import { FEATURED } from "@/lib/sim/instruments";
import { fmtPrice } from "@/lib/sim/format";
import { cn } from "@/lib/utils";

export default function MarketTicker() {
  const { quotes } = useSimQuotes();
  const items = [...FEATURED, ...FEATURED];

  return (
    <div className="w-full border-b border-white/[0.05] bg-black/40 overflow-hidden relative">
      <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[#030405] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#030405] to-transparent z-10 pointer-events-none" />
      <div className="flex items-center animate-ticker whitespace-nowrap py-1.5">
        {items.map((inst, i) => {
          const q = quotes[inst.symbol];
          if (!q) return null;
          return (
            <div key={`${inst.symbol}-${i}`} className="inline-flex items-center gap-2 px-4 border-r border-white/[0.05] shrink-0 sim-num text-[11px]">
              <span className="font-bold text-white/85">{inst.symbol}</span>
              <span className="text-white/60">{fmtPrice(q.mid)}</span>
              <span className={cn(q.change24h >= 0 ? "sim-pos" : "sim-neg")}>
                {q.change24h >= 0 ? "+" : ""}{q.change24h.toFixed(2)}%
              </span>
              <span className={cn("text-[8px] tracking-widest", q.source === "LIVE" ? "text-emerald-400/60" : "text-amber-300/50")}>
                {q.source}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
