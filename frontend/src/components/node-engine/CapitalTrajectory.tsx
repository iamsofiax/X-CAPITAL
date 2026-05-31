"use client";

import { NODE_TRAJECTORY } from "@/lib/nodeCopy";
import { cn } from "@/lib/utils";

interface CapitalTrajectoryProps {
  className?: string;
  compact?: boolean;
  /** 0–100 aspirational network capacity metaphor */
  progress?: number;
}

export default function CapitalTrajectory({
  className,
  compact = false,
  progress = 12,
}: CapitalTrajectoryProps) {
  const clamped = Math.min(100, Math.max(0, progress));

  return (
    <div
      className={cn(
        "node-panel rounded-lg relative overflow-hidden",
        compact ? "p-3" : "p-5",
        className,
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-node-signal/5 to-transparent pointer-events-none" />
      <div className="relative">
        <p className="node-telemetry text-node-signal mb-1">
          {NODE_TRAJECTORY.headline}
        </p>
        <p className="text-lg md:text-xl font-bold text-white tracking-tight">
          {NODE_TRAJECTORY.targetLabel}
          <span className="text-node-muted font-normal text-sm ml-2">
            · {NODE_TRAJECTORY.horizon}
          </span>
        </p>
        <p className="text-xs text-node-muted mt-2 max-w-xl">
          {NODE_TRAJECTORY.subline}
        </p>
        <div className="mt-4 h-2 rounded-full bg-node-border overflow-hidden border border-node-border">
          <div
            className="h-full bg-gradient-to-r from-node-signal/80 to-node-signal rounded-full transition-all duration-1000"
            style={{ width: `${clamped}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 node-telemetry">
          <span>Network capacity index</span>
          <span className="text-node-signal">{clamped}% mapped</span>
        </div>
      </div>
    </div>
  );
}
