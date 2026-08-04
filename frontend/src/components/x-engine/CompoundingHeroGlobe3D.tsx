"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Flame } from "lucide-react";
import HeroGlobe3D from "@/components/brand/HeroGlobe3D";
import { cn, formatCurrency } from "@/lib/utils";
import { realCompound } from "@/lib/compoundMath";
import { useProfitEngine } from "@/store/useProfitEngine";
import { resolveNodeDailyRate } from "@/hooks/useLiveGrowth";

/* ══════════════════════════════════════════════════════════════════════════
   CompoundingHeroGlobe3D — the Uplink capital-engine centerpiece.

   Renders the SAME HeroGlobe3D chrome as the landing centerpiece — machined
   header strip, grid backdrop, bottom instrumentation bar — and overlays a
   REAL-TIME compounding readout on top of the 3D core.

   Admin-aware compounding:
   - dailyRate is resolved through resolveNodeDailyRate() (the profit engine),
     which honors, in priority order: bullish-spike override → node rate →
     admin profitRate × profitMultiplier → 1.5% base. So an admin setting a
     user's profit rate/multiplier changes this globe live.
   - profitHold pauses accrual entirely (balance still shows).
   ══════════════════════════════════════════════════════════════════════════ */

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
  /** Optional explicit daily rate (decimal). When omitted, resolved from the
   *  admin-aware profit engine via resolveNodeDailyRate. */
  dailyRate?: number;
  isArmed?: boolean;
  /** True while the user's compounding is paused by admin. */
  onHold?: boolean;
  nodeId?: string;
  className?: string;
}

export default function CompoundingHeroGlobe3D({
  balance,
  dailyRate,
  isArmed = false,
  onHold = false,
  nodeId,
  className,
}: CompoundingHeroGlobe3DProps) {
  // ── Admin-aware daily rate ────────────────────────────────────────────
  const nodeGrowths = useProfitEngine((s) => s.nodeGrowths);
  const rateOverrides = useProfitEngine((s) => s.rateOverrides);
  const effectiveNodeId = nodeId && nodeId !== "local" ? nodeId : undefined;

  const resolvedDailyRate = useMemo(() => {
    if (dailyRate != null && dailyRate > 0) return dailyRate;
    if (effectiveNodeId) {
      const rate = resolveNodeDailyRate(effectiveNodeId, null);
      if (rate > 0) return rate;
    }
    // Fall back to any recorded node rate for this id before the 1.5% base.
    const node = effectiveNodeId ? nodeGrowths[effectiveNodeId] : undefined;
    if (node && node.dailyRate > 0) return node.dailyRate;
    if (effectiveNodeId && rateOverrides[effectiveNodeId] > 0)
      return rateOverrides[effectiveNodeId];
    return 0.015;
  }, [dailyRate, effectiveNodeId, nodeGrowths, rateOverrides]);

  const compoundingAllowed = !onHold;
  const active = isArmed && balance > 0 && compoundingAllowed;
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
      const accr = realCompound(balance, resolvedDailyRate, elapsedHours / 24) - balance;
      setLiveAccrual(Math.max(0, accr));
      setTicks((t) => t + 1);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [balance, resolvedDailyRate, active]);

  const animatedBalance = useCountUp(balance);
  const proj7d = realCompound(balance, resolvedDailyRate, 7);
  const proj30d = realCompound(balance, resolvedDailyRate, 30);
  const proj90d = realCompound(balance, resolvedDailyRate, 90);
  const animatedProj90d = useCountUp(proj90d);

  const shortNode =
    nodeId && nodeId !== "local"
      ? `NODE-${nodeId.toUpperCase().slice(0, 8)}`
      : "NODE-XC-001";

  const rateLabel = `${(resolvedDailyRate * 100).toFixed(2)}%/day`;

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
      {/* ── 3D CORE — SAME chrome as the landing centerpiece (non-bare):
          machined header, grid backdrop, bottom instrumentation bar. The
          parent only adds the live compound readout + projection cards. ── */}
      <div className="relative">
        <HeroGlobe3D
          active={active}
          className="w-full"
          cameraDistance={4.6}
        />

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

        {/* Node tagline when cold or on hold — non-obstructing */}
        {!active && (
          <div className="absolute bottom-3 right-4 z-10 text-right pointer-events-none">
            <div className="text-[8px] font-mono text-white/25 tracking-widest uppercase">
              {onHold
                ? "Compounding paused by admin"
                : "Fund to activate compounding"}
            </div>
          </div>
        )}
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
            A = P(1+r)<sup>t</sup> · {rateLabel}{onHold ? " · ON HOLD" : ""}
          </span>
          <span className="text-[9px] font-mono text-emerald-400/50">
            {active ? "REAL-TIME COMPOUNDING" : onHold ? "PAUSED BY ADMIN" : "FUND TO ACTIVATE"}
          </span>
        </div>
      </div>
    </div>
  );
}
