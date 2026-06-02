"use client";

import Link from "next/link";
import { useXEngine } from "@/hooks/useXEngine";
import { cn } from "@/lib/utils";
import { ArrowRight, Rocket } from "lucide-react";
import MissionPanel from "./MissionPanel";

const PHASES = [
  {
    id: "I",
    title: "Register node",
    body: "Create your operator identity on the network.",
    done: true,
  },
  {
    id: "II",
    title: "Open uplink",
    body: "Ground station clears capital. Loadout goes live.",
    doneKey: "capital" as const,
  },
  {
    id: "III",
    title: "Arm rails",
    body: "Execution, funds, commerce, and oracle unlock.",
    doneKey: "armed" as const,
  },
  {
    id: "IV",
    title: "Build your phase",
    body: "VIP curriculum: design your own deployment stack.",
    vip: true,
  },
];

export default function PhaseTrack() {
  const { phase, isArmed, balance } = useXEngine();

  const stepDone = (key?: "capital" | "armed") => {
    if (!key) return true;
    if (key === "capital") return balance > 0 || phase === "PENDING" || phase === "DETECTING";
    if (key === "armed") return isArmed;
    return false;
  };

  return (
    <MissionPanel title="Deployment phases" code="VIP">
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {PHASES.map((p) => {
          const active =
            p.id === "I" ||
            (p.id === "II" && (phase === "COLD" || phase === "DETECTING" || phase === "PENDING")) ||
            (p.id === "III" && (phase === "PENDING" || isArmed)) ||
            (p.id === "IV" && isArmed);
          const done = p.done || (p.doneKey ? stepDone(p.doneKey) : false);

          return (
            <div
              key={p.id}
              className={cn(
                "rounded-lg border p-4 transition-colors",
                active
                  ? "border-emerald-500/30 bg-emerald-500/[0.04]"
                  : "border-white/[0.06] bg-white/[0.02]",
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="engine-mono text-[10px] text-white/40">
                  PHASE {p.id}
                </span>
                {p.vip && (
                  <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400/80">
                    VIP
                  </span>
                )}
                {done && (
                  <span className="text-[9px] font-bold text-emerald-400">DONE</span>
                )}
              </div>
              <h3 className="text-sm font-semibold text-white">{p.title}</h3>
              <p className="text-xs text-white/45 mt-2 leading-relaxed">{p.body}</p>
            </div>
          );
        })}
      </div>
      {isArmed && (
        <Link
          href="/engine"
          className="inline-flex items-center gap-2 mt-6 text-sm font-semibold text-emerald-400 hover:text-white transition-colors"
        >
          <Rocket className="w-4 h-4" />
          Phase IV: learn to build your own stack
          <ArrowRight className="w-4 h-4" />
        </Link>
      )}
    </MissionPanel>
  );
}
