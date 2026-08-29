"use client";

import { memo } from "react";
import { Activity, Lock, Shield, Unlock } from "lucide-react";
import { useXEngine } from "@/hooks/useXEngine";
import { RAIL_REGISTRY, type EngineRail } from "@/lib/xEngine";
import { cn } from "@/lib/utils";

interface RailInfrastructureHeaderProps {
  rail: EngineRail;
  className?: string;
}

function RailInfrastructureHeader({ rail, className }: RailInfrastructureHeaderProps) {
  const spec = RAIL_REGISTRY[rail];
  const { canAccess, phaseLabel, unlockedRails } = useXEngine();
  const open = canAccess(rail);
  const adminCleared = unlockedRails?.includes(rail) === true;

  return (
    <section
      className={cn(
        "rail-infrastructure rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] via-white/[0.02] to-transparent overflow-hidden",
        className,
      )}
    >
      <div className="px-5 md:px-7 py-5 md:py-6 border-b border-white/[0.06] flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="engine-mono text-[10px] text-emerald-500/80 tracking-[0.2em]">
              {spec.code}
            </span>
            <span className="text-white/15">·</span>
            <span className="engine-mono text-[10px] text-white/30 tracking-wider">
              {spec.sla}
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
            {spec.title}
          </h2>
          <p className="text-sm text-white/45 mt-1 font-medium">{spec.subtitle}</p>
          <p className="text-sm text-white/55 mt-4 leading-relaxed max-w-3xl">
            {spec.mission}
          </p>
        </div>
        <div
          className={cn(
            "shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold uppercase tracking-wider",
            open
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-amber-500/10 border-amber-500/25 text-amber-300",
          )}
        >
          {open ? (
            adminCleared ? (
              <Unlock className="w-3.5 h-3.5" />
            ) : (
              <Activity className="w-3.5 h-3.5" />
            )
          ) : (
            <Lock className="w-3.5 h-3.5" />
          )}
          {open ? (adminCleared ? "Cleared by operator" : "Rail live") : phaseLabel}
        </div>
      </div>
      <div className="px-5 md:px-7 py-4 grid sm:grid-cols-3 gap-3 bg-black/20">
        {spec.capabilities.map((cap) => (
          <div
            key={cap}
            className="flex items-start gap-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5"
          >
            <Shield className="w-3.5 h-3.5 text-emerald-500/50 shrink-0 mt-0.5" />
            <span className="text-[11px] text-white/50 leading-snug font-medium">
              {cap}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default memo(RailInfrastructureHeader);
