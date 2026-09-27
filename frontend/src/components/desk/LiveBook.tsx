"use client";

import Link from "next/link";
import { useLiveYield } from "@/hooks/useLiveYield";
import { fmtUsdc } from "@/lib/sim/format";

export function LiveBook() {
  const { live, posted, accruing, rate, fleetPerMin, fleetPending } = useLiveYield();
  const quiet = rate <= 0 && fleetPerMin <= 0;

  return (
    <section className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.04] p-5 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-emerald-300/80 flex items-center gap-2">
            {!quiet && <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />}
            Book value · live
          </p>
          <p className="mt-2 text-4xl md:text-5xl font-black tabular-nums tracking-tight text-white">
            {fmtUsdc(live, { decimals: rate > 0 || fleetPerMin > 0 ? 4 : 2 })}
            <span className="ml-2 text-lg font-semibold text-white/40">USD</span>
          </p>
          <p className="mt-2 text-sm text-white/55">
            {quiet
              ? "Posted and ready. Daily growth appears here when ground station assigns a rate. Adding capital raises the base it accrues on."
              : [
                  rate > 0 ? `${rate}% per day on ${fmtUsdc(posted)} posted. Today +${fmtUsdc(accruing, { decimals: 4 })} USD.` : "",
                  fleetPerMin > 0 ? `Fleet occupancy +${fmtUsdc(fleetPending, { decimals: 4 })} USD open, ${fmtUsdc(fleetPerMin, { decimals: 4 })} USD each minute.` : "",
                ].filter(Boolean).join(" ")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/wallet" className="sim-btn sim-btn-primary">Fund the book</Link>
          <Link href="/portfolio" className="sim-btn sim-btn-ghost">Open portfolio</Link>
        </div>
      </div>
      {!quiet && (
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full bg-emerald-400"
            style={{ width: `${Math.min(100, (accruing / Math.max(posted * (rate / 100), 0.01)) * 100)}%` }}
          />
        </div>
      )}
    </section>
  );
}
