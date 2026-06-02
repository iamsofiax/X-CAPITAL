"use client";

import { useXEngine } from "@/hooks/useXEngine";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { PHASE_COLOR } from "@/lib/xEngine";

export default function EngineHUD() {
  const { phase, phaseLabel, balance, nodeId, feedLine } = useXEngine();

  return (
    <div className="engine-hud border-b border-white/[0.06] bg-black/40 backdrop-blur-md">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-2 flex flex-wrap items-center gap-x-6 gap-y-1">
        <span className="engine-mono text-[10px] text-white/30 tracking-[0.2em]">
          {nodeId}
        </span>
        <span
          className={cn(
            "engine-mono text-[10px] font-bold tracking-[0.15em]",
            PHASE_COLOR[phase],
          )}
        >
          ● {phaseLabel}
        </span>
        <span className="engine-mono text-[10px] text-emerald-400/90">
          LOADOUT {formatCurrency(balance)}
        </span>
        <span className="engine-mono text-[10px] text-white/25 hidden lg:inline truncate max-w-xl">
          {feedLine}
        </span>
      </div>
    </div>
  );
}
