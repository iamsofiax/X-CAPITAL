"use client";

import { memo } from "react";
import { CheckCircle2, Lock, Unlock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useXEngine } from "@/hooks/useXEngine";
import { OPERATOR_RAILS, RAIL_REGISTRY } from "@/lib/xEngine";

function RailAccessStrip() {
  const { canAccess, unlockedRails, isArmed } = useXEngine();
  const adminUnlocked = (unlockedRails?.length ?? 0) > 0;

  if (!adminUnlocked && !isArmed) return null;

  return (
    <section className="rail-access-strip mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-950/15 overflow-hidden">
      <div className="px-4 py-3 border-b border-emerald-500/15 flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        <p className="text-sm font-bold text-emerald-300">
          {adminUnlocked
            ? "Operator rail clearance active"
            : "Node armed — operator rails nominal"}
        </p>
      </div>
      <div className="px-4 py-3 flex flex-wrap gap-2">
        {OPERATOR_RAILS.map((rail) => {
          const spec = RAIL_REGISTRY[rail];
          const open = canAccess(rail);
          const forced = unlockedRails?.includes(rail);
          return (
            <span
              key={rail}
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border",
                open
                  ? "bg-emerald-500/12 border-emerald-500/28 text-emerald-300"
                  : "bg-white/[0.02] border-white/[0.08] text-white/35",
              )}
            >
              {open ? (
                forced ? (
                  <Unlock className="w-3 h-3" />
                ) : (
                  <CheckCircle2 className="w-3 h-3" />
                )
              ) : (
                <Lock className="w-3 h-3" />
              )}
              <span className="text-white/30 font-mono mr-0.5">{spec.code}</span>
              {spec.title}
            </span>
          );
        })}
      </div>
    </section>
  );
}

export default memo(RailAccessStrip);
