"use client";

import { cn } from "@/lib/utils";
import type { TwinMetricSpec } from "./telemetry";
import { metricTone } from "./telemetry";

/* ══════════════════════════════════════════════════════════════════════
   MetricCell — one institutional readout on the Capital Network Twin HUD.

   Bloomberg-style: a hairline-bordered tile with a mono label, the live
   damped value, a channel bar and a tone dot. The bar renders the raw
   normalized channel (0..1) so latency-style metrics (low-good) display
   inverted truthfully — a short bar on Settlement Speed means fast.
   ══════════════════════════════════════════════════════════════════════ */

const TONE_TEXT: Record<ReturnType<typeof metricTone>, string> = {
  good: "text-emerald-400",
  warn: "text-amber-400",
  bad: "text-red-400",
};

const TONE_BAR: Record<ReturnType<typeof metricTone>, string> = {
  good: "bg-emerald-400/80",
  warn: "bg-amber-400/80",
  bad: "bg-red-400/80",
};

interface MetricCellProps {
  spec: TwinMetricSpec;
  channel: number;
  value: string;
  /** Slight stagger so cells don't all "arrive" in lockstep on boot. */
  index?: number;
}

export default function MetricCell({ spec, channel, value, index = 0 }: MetricCellProps) {
  const tone = metricTone(spec, channel);
  // Bar shows the channel toward "good": efficiency/liquidity/reserves/
  // oracle/network/velocity render high=full; latency/settlement render
  // inverted (short bar = fast); load renders as its actual utilization.
  const barRatio =
    spec.id === "load" ? channel : spec.idealHigh ? channel : 1 - channel;

  return (
    <div
      className="group/met relative overflow-hidden rounded-lg border border-white/[0.07] bg-white/[0.015] px-3 py-2.5 transition-colors hover:border-white/[0.14] hover:bg-white/[0.03]"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[8px] font-mono uppercase tracking-[0.18em] text-white/35">
          {spec.label}
        </span>
        <span
          className={cn(
            "h-1 w-1 shrink-0 rounded-full",
            tone === "good" ? "bg-emerald-400" : tone === "warn" ? "bg-amber-400" : "bg-red-400",
          )}
          style={{ boxShadow: `0 0 6px currentColor` }}
        />
      </div>

      <div className="mt-1 flex items-baseline justify-between gap-2">
        <span
          className={cn(
            "font-mono text-sm font-bold tabular-nums leading-none tracking-tight",
            TONE_TEXT[tone],
          )}
        >
          {value}
        </span>
      </div>

      {/* Channel bar — moving toward "good" */}
      <div className="mt-2 h-[2px] w-full overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className={cn("h-full rounded-full transition-[width] duration-300 ease-out", TONE_BAR[tone])}
          style={{ width: `${Math.round(barRatio * 100)}%` }}
        />
      </div>
    </div>
  );
}
