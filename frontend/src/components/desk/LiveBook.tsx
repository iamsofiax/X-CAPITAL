"use client";

import Link from "next/link";
import { Landmark, Wallet } from "lucide-react";
import { useLiveYield } from "@/hooks/useLiveYield";
import { operatedOf } from "@/lib/yieldDesk";
import { fmtUsdc } from "@/lib/sim/format";

export function LiveBook() {
  const { live, posted, accruing, rate, weekly, active, mandate, fleetPerMin, fleetPending, now } = useLiveYield();
  const operated = mandate ? operatedOf(mandate) : 0;
  const quiet = !active && fleetPerMin <= 0;

  return (
    <section className="sim-glass sim-glass-edge p-5 md:p-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="sim-label text-emerald-300/80 flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-white/15 bg-white/[0.04]">
              <Landmark className="h-3.5 w-3.5" aria-hidden />
            </span>
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Your node · live{now > 0 ? ` · ${new Date(now).toLocaleTimeString()}` : ""}
          </p>
          <p className="mt-2 text-4xl md:text-5xl font-black tabular-nums tracking-tight text-white">
            {fmtUsdc(live, { decimals: rate > 0 || fleetPerMin > 0 ? 4 : 2 })}
            <span className="ml-2 text-lg font-semibold text-white/40">USD</span>
          </p>
          <p className="mt-2 text-sm text-white/55">
            {quiet
              ? "This node stays flat until the desk confirms the funds and sets the operated percent. Gains and execution open on that activation."
              : [
                  rate > 0 ? `${operated}% operated · ${rate}% a day, ${weekly.toFixed(2)}% this week, on ${fmtUsdc(posted)} posted. Today +${fmtUsdc(accruing, { decimals: 4 })} USD.` : "",
                  fleetPerMin > 0 ? `Fleet occupancy +${fmtUsdc(fleetPending, { decimals: 4 })} USD open, ${fmtUsdc(fleetPerMin, { decimals: 4 })} USD each minute.` : "",
                ].filter(Boolean).join(" ")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/wallet" className="sim-btn sim-btn-primary"><Wallet className="h-4 w-4" aria-hidden /> Fund node</Link>
          <Link href="/portfolio" className="sim-btn sim-btn-ghost">Open book</Link>
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
