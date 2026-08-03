"use client";

import { cn } from "@/lib/utils";
import MetricCell from "./MetricCell";
import TwinScene, { RAILS } from "./TwinScene";
import { useTwinTelemetry } from "./useTwinTelemetry";
import { useApiHealth } from "@/hooks/useApiHealth";

/* ══════════════════════════════════════════════════════════════════════
   CapitalNetworkTwin — the digital twin of the X-CAPITAL network.

   One institutional instrument:
   ┌─────────────────────────────────────────────────────────────┐
   │  CAPITAL NETWORK TWIN · LIVE                     SYNC 23ms │
   │  ┌───────────────────────────────────────────────┐         │
   │  │        (3D settlement core + 7 rails)         │         │
   │  └───────────────────────────────────────────────┘         │
   │  9 institutional metrics  ·  7-rail legend                │
   └─────────────────────────────────────────────────────────────┘

   Every readout is a live, damped channel — the twin feels
   like infrastructure telemetry, not a space animation.
   ══════════════════════════════════════════════════════════════════════ */

const SEGMENTS = [
  { label: "Core", color: "#10b981", value: 0.52 },
  { label: "Rails", color: "#34d399", value: 0.46 },
  { label: "Nodes", color: "#6ee7b7", value: 0.4 },
];

export default function CapitalNetworkTwin({ className }: { className?: string }) {
  const { channels, values, specs } = useTwinTelemetry();
  const { health } = useApiHealth(30_000);
  const latency = health?.latencyMs ?? "—";

  const networkChannel = channels.network;
  const syncLabel =
    networkChannel >= 0.82 ? "SYNC STABLE" : networkChannel >= 0.55 ? "SYNC LINKING" : "SYNC REQUESTED";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-[#020806]",
        "shadow-[0_0_80px_rgba(16,185,129,0.10)]",
        className,
      )}
    >
      {/* Grid + constellation backdrop */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.08]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(16,185,129,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.4) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
          maskImage: "radial-gradient(ellipse at center, black 0%, transparent 82%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 0%, transparent 82%)",
        }}
      />

      {/* Header strip */}
      <div className="relative flex items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </span>
          <span className="text-[9px] font-mono font-bold tracking-[0.2em] text-emerald-400/90">
            CAPITAL NETWORK TWIN · LIVE
          </span>
        </div>
        <div className="flex items-center gap-3 text-[8px] font-mono uppercase tracking-widest text-white/30">
          <span className="hidden sm:inline">GATEWAY {health?.status ?? "REQUEST"}</span>
          <span className="text-emerald-400/80">{syncLabel} {latency === "—" ? "" : `· ${latency}ms`}</span>
        </div>
      </div>

      {/* 3D scene */}
      <div className="relative h-[300px] sm:h-[360px]">
        <TwinScene className="absolute inset-0" />
        {/* Scene corner chips */}
        <div className="pointer-events-none absolute left-3 top-3 z-10 rounded border border-white/[0.08] bg-black/50 px-2 py-1 backdrop-blur">
          <div className="font-mono text-[7px] uppercase tracking-[0.2em] text-white/35">Network Twin</div>
          <div className="font-mono text-[9px] font-bold text-emerald-400">{syncLabel}</div>
        </div>
        <div className="pointer-events-none absolute right-3 top-3 z-10 hidden rounded border border-white/[0.08] bg-black/50 px-2 py-1 text-right backdrop-blur sm:block">
          <div className="font-mono text-[7px] uppercase tracking-[0.2em] text-white/35">Settlement</div>
          <div className="font-mono text-[9px] font-bold text-emerald-400 tabular-nums">7/7 ARMED</div>
        </div>
        {/* Bottom scene legend — the seven rails */}
        <div className="pointer-events-none absolute inset-x-0 bottom-2 z-10 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-3">
          {RAILS.map((rail) => (
            <span key={rail.label} className="flex items-center gap-1 font-mono text-[7px] uppercase tracking-wider text-white/40">
              <span className="h-1 w-1 rounded-full" style={{ background: rail.accent }} />
              {rail.label}
            </span>
          ))}
        </div>
      </div>

      {/* Metric grid — 9 institutional readouts */}
      <div className="relative grid grid-cols-2 gap-2 border-t border-white/[0.06] bg-black/30 p-3 sm:grid-cols-3 sm:gap-2.5">
        {specs.map((spec, i) => (
          <MetricCell
            key={spec.id}
            spec={spec}
            channel={channels[spec.id]}
            value={values[spec.id]}
            index={i}
          />
        ))}
      </div>

      {/* Footer strip */}
      <div className="relative flex items-center justify-between border-t border-white/[0.06] px-4 py-2 font-mono text-[8px] uppercase tracking-widest text-white/25">
        <span className="flex items-center gap-1.5">
          <span className="h-1 w-1 animate-pulse rounded-full bg-emerald-400" />
          SUB-30MS SETTLEMENT MESH
        </span>
        <span className="hidden items-center gap-1.5 sm:flex">
          {SEGMENTS.map((s) => (
            <span key={s.label} className="flex items-center gap-1">
              <span className="h-1 w-1 rounded-full" style={{ background: s.color }} />
              {s.label}
            </span>
          ))}
        </span>
        <span className="text-emerald-400/60">RESERVES 1:1</span>
      </div>
    </div>
  );
}
