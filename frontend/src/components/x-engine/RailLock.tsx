"use client";

import Link from "next/link";
import { Lock, ArrowRight, Shield } from "lucide-react";
import { useXEngine } from "@/hooks/useXEngine";
import { ENGINE_COPY, RAIL_REGISTRY, type EngineRail } from "@/lib/xEngine";
import MissionPanel from "./MissionPanel";

interface RailLockProps {
  rail: EngineRail;
  children: React.ReactNode;
}

export default function RailLock({ rail, children }: RailLockProps) {
  const { canAccess, lockReason, phase } = useXEngine();
  const spec = RAIL_REGISTRY[rail];

  if (canAccess(rail)) return <>{children}</>;

  return (
    <MissionPanel title={ENGINE_COPY.railLocked} code={spec.code}>
      <div className="py-8 md:py-12 max-w-lg mx-auto">
        <div className="text-center mb-8">
          <Lock
            className="w-10 h-10 text-amber-400/90 mx-auto mb-5"
            strokeWidth={1.5}
          />
          <p className="engine-mono text-[10px] text-amber-400/80 tracking-[0.2em] mb-3">
            {spec.code} · {phase}
          </p>
          <h3 className="text-lg font-bold text-white mb-2">{spec.title}</h3>
          <p className="text-sm text-white/55 leading-relaxed">{lockReason(rail)}</p>
        </div>
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-2">
          <p className="engine-mono text-[9px] text-white/25 uppercase tracking-widest mb-2">
            Rail requirements
          </p>
          {spec.capabilities.map((cap) => (
            <div key={cap} className="flex items-center gap-2 text-xs text-white/45">
              <Shield className="w-3 h-3 text-white/20 shrink-0" />
              {cap}
            </div>
          ))}
        </div>
        {(phase === "COLD" || phase === "DETECTING" || phase === "PENDING") && (
          <div className="text-center mt-8">
            <Link
              href="/wallet"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black text-sm font-bold rounded-full hover:bg-slate-100 transition-colors duration-100"
            >
              {ENGINE_COPY.uplink}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </MissionPanel>
  );
}
