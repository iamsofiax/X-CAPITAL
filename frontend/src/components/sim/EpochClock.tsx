"use client";

import { useEffect, useState } from "react";
import { subscribeDeskClock } from "@/hooks/useLiveYield";
import { blockHeight, currentEpoch, msUntilNextEpoch, seasonOf, EPOCH_MS } from "@/lib/sim/clock";
import { regimeAt } from "@/lib/sim/vaults";
import { fmtDuration } from "@/lib/sim/format";
import { cn } from "@/lib/utils";

function useNow(): number {
  const [now, setNow] = useState(0);
  useEffect(() => subscribeDeskClock(setNow), []);
  return now;
}

export function RegimeChip({ epoch, className }: { epoch: number; className?: string }) {
  const regime = regimeAt(epoch);
  return (
    <span
      className={cn("sim-chip", regime === "calm" ? "sim-chip-live" : "sim-chip-warn", className)}
      title={
        regime === "calm"
          ? "Calm regime: carry and beta strategies drift up; hedges bleed."
          : "Stress regime: correlations spike; hedges and trend strategies pay."
      }
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", regime === "calm" ? "bg-[#8aa396]" : "bg-amber-400")} />
      {regime === "calm" ? "Calm regime" : "Stress regime"}
    </span>
  );
}

/** Compact inline epoch/block readout for the header. */
export function EpochTicker({ className }: { className?: string }) {
  const now = useNow();
  const epoch = now ? currentEpoch(now) : 0;
  return (
    <div className={cn("flex items-center gap-3 sim-num text-[11px]", className)}>
      <span className="text-white/35">EPOCH</span>
      <span className="text-white font-bold">{now ? epoch.toLocaleString() : "—"}</span>
      <span className="w-px h-3 bg-white/10" />
      <span className="text-white/35">NEXT</span>
      <span className="text-white/80 tabular-nums">{now ? fmtDuration(msUntilNextEpoch(now)) : "—:—"}</span>
      <span className="w-px h-3 bg-white/10 hidden xl:block" />
      <span className="text-white/35 hidden xl:inline">BLOCK</span>
      <span className="text-white/70 tabular-nums hidden xl:inline">{now ? `#${blockHeight(now).toLocaleString()}` : "#—"}</span>
    </div>
  );
}

/** Full epoch panel with a progress ring to the next settlement. */
export function EpochClock({ className }: { className?: string }) {
  const now = useNow();
  const epoch = now ? currentEpoch(now) : 0;
  const remaining = now ? msUntilNextEpoch(now) : EPOCH_MS;
  const progress = 1 - remaining / EPOCH_MS;
  const r = 34;
  const c = 2 * Math.PI * r;

  return (
    <div className={cn("flex items-center gap-5", className)}>
      <div className="relative w-[88px] h-[88px] shrink-0">
        <svg viewBox="0 0 88 88" className="w-full h-full -rotate-90" aria-hidden>
          <circle cx="44" cy="44" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
          <circle
            cx="44"
            cy="44"
            r={r}
            fill="none"
            stroke="rgba(231,239,233,0.72)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - progress)}
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="sim-label text-[8px]">Epoch</span>
          <span className="sim-num text-white font-bold text-[15px]">{now ? epoch.toLocaleString() : "—"}</span>
        </div>
      </div>
      <div className="min-w-0 space-y-1.5">
        <p className="sim-label">Next settlement</p>
        <p className="sim-num text-2xl font-bold text-white tabular-nums">{now ? fmtDuration(remaining) : "—:—"}</p>
        <div className="flex flex-wrap items-center gap-2">
          <RegimeChip epoch={epoch} />
          <span className="sim-chip">Season {seasonOf(epoch) + 1}</span>
          <span className="sim-chip tabular-nums">{now ? `#${blockHeight(now).toLocaleString()}` : "#—"}</span>
        </div>
      </div>
    </div>
  );
}
