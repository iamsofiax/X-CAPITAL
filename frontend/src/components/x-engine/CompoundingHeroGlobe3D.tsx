"use client";

import { useEffect, useRef, useState } from "react";
import { Flame } from "lucide-react";
import HeroGlobe3D from "@/components/brand/HeroGlobe3D";
import { cn, formatCurrency } from "@/lib/utils";

/* ══════════════════════════════════════════════════════════════════════════
   CompoundingHeroGlobe3D — the polished capital-engine core, spiced with
   REAL-TIME compounding and the SAME structural chrome as the main page.

   Used ONLY on the Uplink (post-login wallet).

   Visuals: identical 3D core as the landing hero (HeroGlobe3D), wrapped in
   the machined header + instrumentation bars + readout cards so it feels like
   the first page — not a bare floating globe.

   Difference:
   - machined header (CAPITAL ENGINE · LIVE / GATEWAY / NODE)
   - live A = P(1 + r)^(elapsedHours/24) accrual ticked every second
   - count-up balance
   - live 7 / 30 / 90-day projections
   - bottom instrumentation bar (same as landing chrome)
   ══════════════════════════════════════════════════════════════════════════ */

function realCompound(p: number, r: number, t: number): number {
  return p * Math.pow(1 + r, t);
}

function useCountUp(target: number, durationMs = 900): number {
  const [display, setDisplay] = useState(target);
  const prevRef = useRef(target);

  useEffect(() => {
    const from = prevRef.current;
    if (from === target) return;
    const start = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(from + (target - from) * eased);
      if (progress < 1) raf = requestAnimationFrame(step);
      else prevRef.current = target;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);

  return display;
}

interface CompoundingHeroGlobe3DProps {
  balance: number;
  dailyRate?: number;
  isArmed?: boolean;
  nodeId?: string;
  className?: string;
}

export default function CompoundingHeroGlobe3D({
  balance,
  dailyRate = 0.015,
  isArmed = false,
  nodeId,
  className,
}: CompoundingHeroGlobe3DProps) {
  const active = isArmed && balance > 0;
  const startRef = useRef(Date.now());

  // Live accrual — A = P(1 + r)^(elapsedHours / 24), ticked every second.
  const [liveAccrual, setLiveAccrual] = useState(0);
  const [ticks, setTicks] = useState(0);
  useEffect(() => {
    if (!active) {
      setLiveAccrual(0);
      return;
    }
    startRef.current = Date.now();
    const tick = () => {
      const elapsedHours = (Date.now() - startRef.current) / (1000 * 60 * 60);
      const accr =
        balance > 0
          ? realCompound(balance, dailyRate, elapsedHours / 24) - balance
          : 0;
      setLiveAccrual(Math.max(0, accr));
      setTicks((t) => t + 1);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [balance, dailyRate, active]);

  const animatedBalance = useCountUp(balance);
  const proj7d = balance * Math.pow(1 + dailyRate, 7);
  const proj30d = balance * Math.pow(1 + dailyRate, 30);
  const proj90d = balance * Math.pow(1 + dailyRate, 90);
  const animatedProj90d = useCountUp(proj90d);

  const shortNode =
    nodeId && nodeId !== "local"
      ? `NODE-${nodeId.toUpperCase().slice(0, 8)}`
      : "NODE-XC-001";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-[#020806]",
        active ? "border-emerald-500/25" : "border-white/[0.08]",
        className,
      )}
      style={{
        boxShadow: active
          ? "0 0 80px rgba(16,185,129,0.14), inset 0 0 60px rgba(16,185,129,0.03)"
          : "0 0 60px rgba(255,255,255,0.04)",
      }}
    >
      {/* ── MACHINED HEADER — same instrumentation strip as the main page ── */}
      <div className="relative flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <span className="relative flex w-1.5 h-1.5">
            <span
              className={cn(
                "absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping",
                active ? "bg-emerald-400" : "bg-white/20",
              )}
            />
            <span
              className={cn(
                "relative inline-flex rounded-full w-1.5 h-1.5",
                active ? "bg-emerald-400" : "bg-white/20",
              )}
            />
          </span>
          <span className="text-[9px] font-mono font-bold tracking-[0.2em] text-emerald-400/90">
            {active ? "CAPITAL ENGINE · LIVE" : "CAPITAL ENGINE"}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[9px] font-mono tracking-wider">
          <span className="text-white/25">GATEWAY</span>
          <span
            className={cn(
              "font-bold tabular-nums",
              active ? "text-emerald-400/90" : "text-white/40",
            )}
          >
            {shortNode}
          </span>
        </div>
      </div>

      {/* ── 3D CORE — identical to the main page, WebGL-safe. Bare mode:
          the wrapper below owns ALL chrome (header + bars + readouts). ── */}
      <div className="relative">
        <HeroGlobe3D active={active} bare className="w-full" />

        {/* Live accrual readout — inside the globe pane, non-obstructing */}
        {active && (
          <div className="absolute bottom-3 right-4 z-10 text-right pointer-events-none">
            <div className="text-[8px] font-mono text-emerald-400/60 tracking-widest uppercase">
              Live Accrual
            </div>
            <div
              key={Math.round(liveAccrual * 100)}
              className="text-sm md:text-base font-black font-mono text-emerald-300 tabular-nums"
              style={{ textShadow: "0 0 14px rgba(16,185,129,0.45)" }}
            >
              +{formatCurrency(liveAccrual)}
            </div>
            <div className="text-[8px] font-mono text-emerald-400/40">
              {ticks} ticks · A=P(1+r)<sup>t</sup>
            </div>
          </div>
        )}

        {/* Node tagline when cold — non-obstructing */}
        {!active && (
          <div className="absolute bottom-3 right-4 z-10 text-right pointer-events-none">
            <div className="text-[8px] font-mono text-white/25 tracking-widest uppercase">
              Fund to activate compounding
            </div>
          </div>
        )}
      </div>

      {/* ── BOTTOM INSTRUMENTATION BAR — same as landing chrome ── */}
      <div className="relative border-t border-emerald-500/15 bg-black/40 backdrop-blur px-4 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[9px] font-mono tracking-wider text-white/35">
          <span className="text-emerald-400">{"\u25CF"}</span> 7 RAILS ARMED
        </div>
        <div className="hidden sm:flex items-center gap-2 text-[9px] font-mono tracking-wider text-white/35">
          <span className="text-emerald-400">{"\u25CF"}</span> LATENCY {"<"}1MS
        </div>
        <div className="flex items-center gap-2 text-[9px] font-mono tracking-wider text-white/35">
          <span className="text-emerald-400">{"\u25CF"}</span> RESERVES 1:1
        </div>
      </div>

      {/* ── STRUCTURED READOUT CARDS — live compound math ── */}
      <div className="relative border-t border-white/[0.05] px-5 py-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-[9px] font-mono text-white/30 tracking-wider flex items-center gap-1">
              <Flame className="w-3 h-3 text-emerald-400/70" /> BALANCE
            </div>
            <div className="text-xl md:text-2xl font-black font-mono text-white tabular-nums mt-0.5">
              {formatCurrency(animatedBalance)}
            </div>
          </div>
          <div>
            <div className="text-[9px] font-mono text-white/30 tracking-wider">
              7-DAY PROJECTION
            </div>
            <div className="text-xl md:text-2xl font-black font-mono text-emerald-400 tabular-nums mt-0.5">
              {formatCurrency(proj7d)}
            </div>
          </div>
          <div>
            <div className="text-[9px] font-mono text-white/30 tracking-wider">
              30-DAY PROJECTION
            </div>
            <div className="text-xl md:text-2xl font-black font-mono text-emerald-400 tabular-nums mt-0.5">
              {formatCurrency(proj30d)}
            </div>
          </div>
          <div>
            <div className="text-[9px] font-mono text-white/30 tracking-wider">
              90-DAY PROJECTION
            </div>
            <div className="text-xl md:text-2xl font-black font-mono text-emerald-300 tabular-nums mt-0.5">
              {formatCurrency(animatedProj90d)}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.04]">
          <span className="text-[9px] font-mono text-white/20">
            A = P(1+r)<sup>t</sup> · {(dailyRate * 100).toFixed(2)}%/day
          </span>
          <span className="text-[9px] font-mono text-emerald-400/50">
            {active ? "REAL-TIME COMPOUNDING" : "FUND TO ACTIVATE"}
          </span>
        </div>
      </div>
    </div>
  );
}
