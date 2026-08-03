"use client";

import { useEffect, useRef, useState } from "react";
import HeroGlobe3D from "@/components/brand/HeroGlobe3D";
import { cn, formatCurrency } from "@/lib/utils";

/* ══════════════════════════════════════════════════════════════════════════
   CompoundingHeroGlobe3D — the polished capital-engine core, spiced with
   REAL-TIME compounding. Used ONLY on the Uplink (post-login wallet).

   Visuals: identical 3D core as the landing hero (HeroGlobe3D).
   Difference: live A = P(1 + r)^(elapsedHours/24) accrual ticked every
   second, count-up balance, live 7/30/90-day projections, and a spinning
   "COMPOUNDING · LIVE" halo when capital is armed.
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
        balance > 0 ? realCompound(balance, dailyRate, elapsedHours / 24) - balance : 0;
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

  return (
    <div className={cn("relative", className)}>
      {/* Same polished core as the landing hero */}
      <HeroGlobe3D active={active} className="w-full" />

      {/* ── REAL-TIME COMPOUNDING OVERLAY — Uplink only ── */}
      {active && (
        <div className="absolute inset-0 pointer-events-none z-10">
          {/* LIVE compounding halo */}
          <div className="absolute top-16 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 backdrop-blur">
            <span className="relative flex w-1.5 h-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70 animate-ping" />
              <span className="relative inline-flex rounded-full w-1.5 h-1.5 bg-emerald-400" />
            </span>
            <span className="text-[9px] font-mono font-bold tracking-[0.22em] text-emerald-300">
              COMPOUNDING · LIVE
            </span>
          </div>

          {/* Top-left live balance */}
          <div className="absolute top-4 left-4 text-left">
            <div className="text-[9px] font-mono text-white/35 tracking-widest uppercase">
              Balance
            </div>
            <div className="text-xl md:text-2xl font-black font-mono text-white tabular-nums drop-shadow-[0_0_12px_rgba(16,185,129,0.4)]">
              {formatCurrency(animatedBalance)}
            </div>
          </div>

          {/* Top-right live accrual */}
          <div className="absolute top-4 right-4 text-right">
            <div className="text-[9px] font-mono text-emerald-400/70 tracking-widest uppercase">
              Live Accrual
            </div>
            <div
              key={Math.round(liveAccrual * 100)}
              className="text-lg md:text-xl font-black font-mono text-emerald-300 tabular-nums"
              style={{ textShadow: "0 0 16px rgba(16,185,129,0.45)" }}
            >
              +{formatCurrency(liveAccrual)}
            </div>
            <div className="text-[8px] font-mono text-emerald-400/50 mt-0.5">
              {ticks} ticks · A=P(1+r)<sup>t</sup>
            </div>
          </div>

          {/* Bottom projections strip */}
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-[92%]">
            <div className="grid grid-cols-3 gap-2 rounded-xl border border-emerald-500/25 bg-black/65 backdrop-blur px-3 py-2.5">
              <div className="text-center">
                <div className="text-[8px] font-mono text-white/40 tracking-widest uppercase">
                  7D
                </div>
                <div className="text-sm font-black font-mono text-emerald-300 tabular-nums">
                  {formatCurrency(proj7d)}
                </div>
              </div>
              <div className="text-center border-x border-white/[0.08]">
                <div className="text-[8px] font-mono text-white/40 tracking-widest uppercase">
                  30D
                </div>
                <div className="text-sm font-black font-mono text-emerald-300 tabular-nums">
                  {formatCurrency(proj30d)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-[8px] font-mono text-white/40 tracking-widest uppercase">
                  90D
                </div>
                <div className="text-sm font-black font-mono text-emerald-200 tabular-nums">
                  {formatCurrency(animatedProj90d)}
                </div>
              </div>
            </div>
          </div>

          {/* Node id signature */}
          {nodeId && (
            <div className="absolute bottom-4 right-4 text-[8px] font-mono text-white/25 tracking-widest uppercase">
              NODE {nodeId}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
