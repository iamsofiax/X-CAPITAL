"use client";

import Link from "next/link";
import { Lock, ArrowRight } from "lucide-react";
import { useXEngine } from "@/hooks/useXEngine";
import type { EngineRail } from "@/lib/xEngine";
import { ENGINE_COPY } from "@/lib/xEngine";
import MissionPanel from "./MissionPanel";

interface RailLockProps {
  rail: EngineRail;
  children: React.ReactNode;
}

/** When locked: show gate only (no blurred page trap). When armed: full content scrolls. */
export default function RailLock({ rail, children }: RailLockProps) {
  const { canAccess, lockReason, phase } = useXEngine();

  if (canAccess(rail)) return <>{children}</>;

  return (
    <MissionPanel title={ENGINE_COPY.railLocked} code="GATE">
      <div className="py-8 md:py-12 text-center max-w-md mx-auto">
        <Lock className="w-10 h-10 text-amber-400/90 mx-auto mb-5" strokeWidth={1.5} />
        <p className="engine-mono text-[10px] text-amber-400/80 tracking-[0.2em] mb-3">
          {phase}
        </p>
        <p className="text-base text-white/80 leading-relaxed">{lockReason(rail)}</p>
        {(phase === "COLD" || phase === "DETECTING" || phase === "PENDING") && (
          <Link
            href="/wallet"
            className="inline-flex items-center gap-2 mt-8 px-6 py-3 bg-white text-black text-sm font-bold rounded-full hover:bg-slate-100 transition-colors"
          >
            {ENGINE_COPY.uplink}
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </MissionPanel>
  );
}
