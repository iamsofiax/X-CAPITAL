"use client";

import Link from "next/link";
import { Landmark, Wallet } from "lucide-react";
import { useLiveYield } from "@/hooks/useLiveYield";
import { nodeFace, nodeFaceLine, nodeFaceTitle, operatedOf, tradesPaused } from "@/lib/yieldDesk";
import { fmtUsdc } from "@/lib/sim/format";

export function LiveBook() {
  const { live, posted, accruing, rate, weekly, mandate, fleetPerMin, fleetPending, now } = useLiveYield();
  const operated = mandate ? operatedOf(mandate) : 0;
  const halted = tradesPaused(mandate);
  const face = nodeFace(mandate, posted, halted);
  const marking = face === "live" && (rate > 0 || fleetPerMin > 0);

  return (
    <section className="sim-glass sim-glass-edge p-5 md:p-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="sim-label text-emerald-300/80 flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-white/15 bg-white/[0.04]">
              <Landmark className="h-3.5 w-3.5" aria-hidden />
            </span>
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ background: face === "live" ? "#34d399" : face === "halted" ? "#fbbf24" : "#8aa396" }}
            />
            Your node · {nodeFaceTitle(face).toLowerCase()}
            {now > 0 ? ` · ${new Date(now).toLocaleTimeString()}` : ""}
          </p>
          <p className="mt-2 text-4xl md:text-5xl font-black tabular-nums tracking-tight text-white">
            {fmtUsdc(live, { decimals: marking ? 4 : 2 })}
            <span className="ml-2 text-lg font-semibold text-white/40">USD</span>
          </p>
          <p className="mt-2 text-sm text-white/55">
            {face === "live"
              ? [
                  rate > 0 ? `${operated}% of the book is in operation · ${rate}% a day, ${weekly.toFixed(2)}% this week, on ${fmtUsdc(posted)} posted. Today +${fmtUsdc(accruing, { decimals: 4 })} USD.` : nodeFaceLine(face),
                  fleetPerMin > 0 ? `Fleet occupancy +${fmtUsdc(fleetPending, { decimals: 4 })} USD open, ${fmtUsdc(fleetPerMin, { decimals: 4 })} USD each minute.` : "",
                ].filter(Boolean).join(" ")
              : nodeFaceLine(face)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/wallet" className="sim-btn sim-btn-primary"><Wallet className="h-4 w-4" aria-hidden /> Fund node</Link>
          <Link href="/portfolio" className="sim-btn sim-btn-ghost">Open book</Link>
        </div>
      </div>
      {marking && (
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
