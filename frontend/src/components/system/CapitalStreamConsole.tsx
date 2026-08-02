"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useApiHealth } from "@/hooks/useApiHealth";

/* ══════════════════════════════════════════════════════════════════════════
   CapitalStreamConsole — the live boot-to-flow uplink.

   Part 1 — BOOT SEQUENCE: the institutional "INITIALIZING SYSTEMS" check
   (REST API / AI ORACLE / POSTGRES / RAIL SYNC) plays once, styled like the
   old splash so the loading experience lives HERE, not blocking the site.

   Part 2 — CAPITAL FLOW: an endless stream of real-time-looking settlements
   — capital visibly moving across the seven rails with live amounts.

   Compact by design: this is the professional "money is flowing" readout,
   not a wide billboard.
   ══════════════════════════════════════════════════════════════════════════ */

const BOOT_CHECKS = [
  { label: "REST API", ok: true },
  { label: "AI ORACLE", ok: true },
  { label: "POSTGRES", ok: true },
  { label: "RAIL SYNC", ok: true },
];

const FLOW_MODES = [
  { sym: "TSLA-NODE", amount: 4820, rail: "PUBLIC MKTS" },
  { sym: "RE-NYC", amount: 12600, rail: "PRIVATE EQ" },
  { sym: "STRLINK-12", amount: 2105, rail: "ORBITAL" },
  { sym: "GPU-CLUSTER", amount: 8940, rail: "INFRA" },
  { sym: "AI-INFER", amount: 3670, rail: "AI ORACLE" },
  { sym: "LUX-VAULT", amount: 1520, rail: "TOKENIZED" },
  { sym: "FIN-ROUTE", amount: 2410, rail: "COMMERCE" },
  { sym: "ELEC-MESH", amount: 7330, rail: "INFRA" },
  { sym: "BIZ-ASSET", amount: 5100, rail: "PRIVATE EQ" },
  { sym: "TSLA-RELAY", amount: 9650, rail: "PUBLIC MKTS" },
];

const RAIL_COLOR: Record<string, string> = {
  "PUBLIC MKTS": "#ffffff",
  "PRIVATE EQ": "#f59e0b",
  "ORBITAL": "#22d3ee",
  "INFRA": "#818cf8",
  "AI ORACLE": "#fb7185",
  "TOKENIZED": "#a78bfa",
  "COMMERCE": "#34d399",
};

interface FlowRow {
  id: string;
  sym: string;
  amount: string;
  rail: string;
  time: string;
}

function buildRow(time: string): FlowRow {
  const pick = FLOW_MODES[Math.floor(Math.random() * FLOW_MODES.length)];
  const amt = (pick.amount + Math.floor(Math.random() * 400)).toLocaleString();
  return {
    id: `${Date.now()}-${Math.random()}`,
    sym: pick.sym,
    amount: `$${amt}`,
    rail: pick.rail,
    time,
  };
}

interface CapitalStreamConsoleProps {
  className?: string;
  /** Height of the console body (canvas area). */
  compact?: boolean;
}

export default function CapitalStreamConsole({
  className,
  compact = false,
}: CapitalStreamConsoleProps) {
  const { health, loading } = useApiHealth(15_000);
  const [bootDone, setBootDone] = useState(false);
  const [checkIdx, setCheckIdx] = useState(0);
  const [stream, setStream] = useState<FlowRow[]>([]);

  // Boot sequence — reveals each system check, then unlocks the flow
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    BOOT_CHECKS.forEach((_, i) => {
      timers.push(
        setTimeout(() => setCheckIdx(i + 1), 350 + i * 450),
      );
    });
    timers.push(setTimeout(() => setBootDone(true), 350 + BOOT_CHECKS.length * 450 + 350));
    return () => timers.forEach(clearTimeout);
  }, []);

  // Live capital flow once booted
  useEffect(() => {
    if (!bootDone) return;
    const seed = () => {
      const now = new Date().toLocaleTimeString("en-US", { hour12: false });
      setStream((prev) => [buildRow(now), ...prev.slice(0, 7)]);
    };
    seed();
    seed();
    const interval = setInterval(seed, 2600);
    return () => clearInterval(interval);
  }, [bootDone]);

  const gatewayOk =
    !loading && (health?.status === "healthy" || health?.status === "degraded");
  const gatewayLabel = loading
    ? "LINKING API…"
    : gatewayOk
      ? "GATEWAY STABLE"
      : "GATEWAY STANDALONE";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-emerald-500/25 bg-[#020806]",
        "shadow-[0_0_60px_rgba(16,185,129,0.14)]",
        compact ? "max-w-[420px]" : "max-w-[520px]",
        className,
      )}
    >
      {/* Constellation + grid backdrop */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.10]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(16,185,129,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.4) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
          maskImage: "radial-gradient(ellipse at center, black 0%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 0%, transparent 80%)",
        }}
      />

      {/* Header strip */}
      <div className="relative flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <span className="relative flex w-1.5 h-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
            <span className="relative inline-flex rounded-full w-1.5 h-1.5 bg-emerald-400" />
          </span>
          <span className="text-[9px] font-mono font-bold tracking-[0.2em] text-emerald-400/90">
            {bootDone ? "CAPITAL STREAM · LIVE" : "CAPITAL UPLINK"}
          </span>
        </div>
        <span className="text-[8px] font-mono text-white/25 tracking-widest uppercase">
          {gatewayLabel}
        </span>
      </div>

      {/* ── PART 1 · BOOT SEQUENCE ───────────────────────────────────── */}
      <div className="relative px-4 pt-3 transition-opacity duration-500" style={{ opacity: bootDone ? 0 : 1, height: bootDone ? 0 : "auto", overflow: "hidden" }}>
        <div className="flex items-center justify-between text-[8px] font-mono text-emerald-400/75 tracking-[0.25em]">
          <span>INITIALIZING SYSTEMS</span>
          <span className="xc-splash-dots" />
        </div>
        <div className="mt-2 mb-2 h-[2px] rounded bg-white/[0.06] overflow-hidden">
          <div
            className="h-full rounded bg-gradient-to-r from-transparent via-emerald-400 to-transparent"
            style={{
              width: `${(checkIdx / BOOT_CHECKS.length) * 100}%`,
              transition: "width 0.45s ease",
            }}
          />
        </div>
        <div className="pb-2 space-y-1 font-mono text-[8px] tracking-[0.18em]">
          {BOOT_CHECKS.map((check, i) => (
            <div
              key={check.label}
              className="flex items-center justify-between gap-6"
              style={{ opacity: i < checkIdx ? 1 : 0.25, transition: "opacity 0.3s ease" }}
            >
              <span className={i < checkIdx ? "text-white/60" : "text-white/25"}>{check.label}</span>
              <span className={i < checkIdx ? "text-emerald-400" : "text-white/20"}>
                {i < checkIdx ? "OK" : "···"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── PART 2 · LIVE CAPITAL FLOW ───────────────────────────────── */}
      <div className={cn("relative px-4 py-3", compact ? "h-[240px]" : "h-[300px]", bootDone ? "opacity-100" : "opacity-0", "transition-opacity duration-500")}>
        {/* Column headers */}
        <div className="grid grid-cols-[1fr_auto_auto] gap-2 mb-2 text-[7px] font-mono tracking-[0.2em] text-white/20 uppercase">
          <span>{bootDone ? "Node → Rail" : "Establishing stream…"}</span>
          <span className="text-right">Settled</span>
          <span className="text-right">UTC</span>
        </div>
        <div className="space-y-1.5 font-mono">
          {stream.map((row, i) => (
            <div
              key={row.id}
              className={cn(
                "grid grid-cols-[1fr_auto_auto] gap-2 items-center text-[9px] animate-reveal-up",
                i === 0 ? "text-white/90" : "text-white/50",
              )}
            >
              <span className="flex items-center gap-1.5 min-w-0">
                <span
                  className="w-1 h-1 rounded-full shrink-0"
                  style={{ backgroundColor: RAIL_COLOR[row.rail] ?? "#34d399" }}
                />
                <span className="truncate font-bold">{row.sym}</span>
                <span className="text-white/25 hidden sm:inline truncate">{row.rail}</span>
              </span>
              <span className="text-emerald-400/90 font-bold tabular-nums text-right">{row.amount}</span>
              <span className="text-white/25 tabular-nums text-right">{row.time}</span>
            </div>
          ))}
          {stream.length === 0 && (
            <div className="text-[9px] font-mono text-white/30 animate-pulse">
              {bootDone ? "Awaiting settlements…" : "Warming uplink…"}
            </div>
          )}
        </div>
      </div>

      {/* Footer strip */}
      <div className="relative border-t border-white/[0.06] px-4 py-2 flex items-center justify-between text-[8px] font-mono text-white/25">
        <span className="flex items-center gap-1.5">
          <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
          SUB-30MS SETTLEMENT MESH
        </span>
        <span>7 RAILS · ESCROW 1:1</span>
      </div>
    </div>
  );
}
