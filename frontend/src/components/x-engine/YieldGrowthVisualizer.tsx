"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DollarSign, Activity, Cpu,
  Sparkles, Rocket, ChevronRight, Timer, Flame,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

interface YieldGrowthVisualizerProps {
  balance: number;
  dailyRate?: number;
  tier?: string;
  isArmed?: boolean;
  className?: string;
  compact?: boolean;
  nodeId?: string;
}

const YIELD_COLORS = {
  principal: "#10b981",
  yield: "#34d399",
  signal: "rgba(16, 185, 129, 0.5)",
  bgFrom: "rgba(16, 185, 129, 0.03)",
  bgTo: "rgba(0, 0, 0, 0.4)",
  border: "rgba(16, 185, 129, 0.15)",
};

/**
 * REAL COMPOUND MATH: A = P × (1 + r)^t
 * - P = principal (balance)
 * - r = daily rate (e.g. 0.015 = 1.5%)
 * - t = time in days
 */
function realCompound(principal: number, dailyRate: number, days: number): number {
  return principal * Math.pow(1 + dailyRate, days);
}

const TIME_SEGMENTS = [
  { label: "24h", days: 1 },
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
] as const;

function generateCompoundProjection(balance: number, dailyRate: number, days: number) {
  const data: { day: number; value: number; yield: number }[] = [];
  for (let i = 0; i <= days; i++) {
    const value = realCompound(balance, dailyRate, i);
    data.push({
      day: i,
      value: Math.round(value * 100) / 100,
      yield: Math.round((value - balance) * 100) / 100,
    });
  }
  return data;
}

const STARS_COUNT = 80;

export default function YieldGrowthVisualizer({
  balance,
  dailyRate = 0.015,
  tier = "Node",
  isArmed = false,
  className,
  compact = false,
  nodeId,
}: YieldGrowthVisualizerProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<number>(7);
  const [animatedBalance, setAnimatedBalance] = useState(balance);
  const [animatedYield, setAnimatedYield] = useState(0);
  const [liveAccruedYield, setLiveAccruedYield] = useState(0);
  const prevBalanceRef = useRef(balance);
  const [showCelebration, setShowCelebration] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const startTimeRef = useRef(Date.now());

  // Generate projection using REAL compound math
  const projectionData = useMemo(
    () => generateCompoundProjection(balance, dailyRate, 90),
    [balance, dailyRate],
  );

  const periodData = useMemo(
    () => projectionData.slice(0, selectedPeriod + 1),
    [projectionData, selectedPeriod],
  );

  const periodProjection = periodData[periodData.length - 1]?.value ?? balance;
  const totalYield = periodProjection - balance;
  const yieldPct = balance > 0 ? (totalYield / balance) * 100 : 0;

  // Real-time yield accrual using A = P(1+r)^t with fractional day
  useEffect(() => {
    if (!isArmed || balance <= 0) {
      setLiveAccruedYield(0);
      return;
    }
    const tick = () => {
      const elapsedHours = (Date.now() - startTimeRef.current) / (1000 * 60 * 60);
      const elapsedDays = elapsedHours / 24;
      const accr = balance > 0 ? realCompound(balance, dailyRate, elapsedDays) - balance : 0;
      setLiveAccruedYield(Math.max(0, accr));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [balance, dailyRate, isArmed]);

  // Celebrate balance change
  useEffect(() => {
    if (balance !== prevBalanceRef.current && balance > 0) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 2000);
      prevBalanceRef.current = balance;
    }
  }, [balance]);

  // Animate numbers
  useEffect(() => {
    const targetBalance = balance;
    const targetYield = totalYield;
    const duration = 1500;
    const startBalance = animatedBalance;
    const startYield = animatedYield;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedBalance(startBalance + (targetBalance - startBalance) * eased);
      setAnimatedYield(startYield + (targetYield - startYield) * eased);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [balance, totalYield]);

  // Canvas particle system
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf: number;
    let t = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth * devicePixelRatio;
      canvas.height = canvas.offsetHeight * devicePixelRatio;
      ctx.scale(devicePixelRatio, devicePixelRatio);
    };
    resize();
    window.addEventListener("resize", resize);

    const W = () => canvas!.offsetWidth;
    const H = () => canvas!.offsetHeight;

    type Particle = {
      x: number; y: number;
      vx: number; vy: number;
      size: number; alpha: number;
      life: number; maxLife: number;
      isDollar: boolean;
      char: string;
    };

    const particles: Particle[] = [];

    const spawnParticle = () => {
      const isDollar = Math.random() > 0.6;
      particles.push({
        x: W() * (0.15 + Math.random() * 0.7),
        y: H() + 10,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -(0.4 + Math.random() * 1.2),
        size: 6 + Math.random() * 10,
        alpha: 0.4 + Math.random() * 0.6,
        life: 0,
        maxLife: 80 + Math.random() * 120,
        isDollar,
        char: isDollar ? "$" : (["↑", "✦", "•", "+"][Math.floor(Math.random() * 4)]),
      });
    };

    let counter = 0;
    let lastSpawn = 0;

    const draw = () => {
      t += 0.016;
      counter++;

      ctx.clearRect(0, 0, W(), H());

      if (isArmed && balance > 0) {
        const glowIntensity = 0.04 + Math.sin(t * 0.3) * 0.02;
        const gradient = ctx.createLinearGradient(0, H() * 0.6, 0, H());
        gradient.addColorStop(0, "rgba(16, 185, 129, 0)");
        gradient.addColorStop(0.4, `rgba(16, 185, 129, ${(glowIntensity * 0.6).toFixed(3)})`);
        gradient.addColorStop(0.7, `rgba(52, 211, 153, ${glowIntensity.toFixed(3)})`);
        gradient.addColorStop(1, `rgba(16, 185, 129, ${(glowIntensity * 1.5).toFixed(3)})`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, H() * 0.6, W(), H() * 0.4);

        if (counter - lastSpawn > 2 && particles.length < 100) {
          spawnParticle();
          lastSpawn = counter;
        }

        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.life++;
          p.y += p.vy;
          p.x += p.vx + Math.sin(t * 0.5 + p.x * 0.01) * 0.2;
          p.alpha *= 0.997;

          if (p.isDollar) {
            ctx.font = `bold ${p.size}px Inter, sans-serif`;
            ctx.fillStyle = `rgba(16, 185, 129, ${Math.max(p.alpha, 0.05).toFixed(2)})`;
            ctx.textAlign = "center";
            ctx.fillText(p.char, p.x, p.y);
          } else {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 0.3, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(52, 211, 153, ${Math.max(p.alpha, 0.05).toFixed(2)})`;
            ctx.fill();
          }

          if (p.life > p.maxLife || p.alpha < 0.01 || p.y < -20) {
            particles.splice(i, 1);
          }
        }
      }

      // Compound progress line with REAL math indicator
      if (balance > 0) {
        const timeSinceStart = (Date.now() - startTimeRef.current) / (1000 * 60 * 60 * 24);
        const realProgressValue = realCompound(balance, dailyRate, timeSinceStart);
        const progress = Math.min((realProgressValue - balance) / Math.max(balance * 2, 1), 1);
        const lineY = H() * 0.35;
        const lineStart = W() * 0.1;
        const lineEnd = W() * 0.9;
        const lineW = lineEnd - lineStart;
        const currentX = lineStart + lineW * Math.min(progress, 1);

        const grad = ctx.createLinearGradient(lineStart, 0, lineEnd, 0);
        grad.addColorStop(0, "rgba(16, 185, 129, 0)");
        grad.addColorStop(0.3, `rgba(16, 185, 129, ${(0.06 + Math.sin(t * 0.4) * 0.03).toFixed(3)})`);
        grad.addColorStop(currentX / lineEnd, `rgba(52, 211, 153, ${(0.12 + Math.sin(t * 0.6) * 0.04).toFixed(3)})`);
        grad.addColorStop(1, "rgba(16, 185, 129, 0)");

        ctx.beginPath();
        ctx.moveTo(lineStart, lineY);
        ctx.lineTo(currentX, lineY);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(currentX, lineY, 5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(52, 211, 153, ${(0.5 + Math.sin(t * 2) * 0.3).toFixed(2)})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(currentX, lineY, 12, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(52, 211, 153, ${(0.1 + Math.sin(t * 1.5) * 0.06).toFixed(2)})`;
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [balance, isArmed, dailyRate]);

  if (compact) {
    // Professional long-term horizon panel — APY annualized, structured
    // columns, and a compounding track that reads like institutional research.
    const apyAnnual = (Math.pow(1 + dailyRate, 365) - 1) * 100;
    const horizon = [
      { label: "1M", days: 30 },
      { label: "3M", days: 90 },
      { label: "6M", days: 180 },
      { label: "1Y", days: 365 },
      { label: "3Y", days: 1095 },
      { label: "5Y", days: 1825 },
    ];
    return (
      <div className={cn("relative overflow-hidden rounded-xl border", className)}
        style={{ borderColor: YIELD_COLORS.border, background: `linear-gradient(135deg, ${YIELD_COLORS.bgFrom}, ${YIELD_COLORS.bgTo})` }}
      >
        <div className="relative z-10 p-3 md:p-4">
          {/* Header row — live accrual + APY */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Flame className="w-3 h-3 text-emerald-400" />
              <span className="text-[9px] font-mono text-white/40 uppercase tracking-wider">Yield Stream</span>
              {isArmed && balance > 0 && (
                <span className="flex items-center gap-1 text-[8px] font-mono text-emerald-400/70">
                  <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg md:text-xl font-black font-mono text-white tabular-nums">{formatCurrency(balance)}</span>
              {isArmed && liveAccruedYield > 0 && (
                <motion.span
                  key={`acc-${Math.round(liveAccruedYield * 100)}`}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[10px] font-mono font-bold text-emerald-400"
                >
                  +{formatCurrency(liveAccruedYield)}
                </motion.span>
              )}
            </div>
          </div>

          {/* APY + daily rate readouts */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2">
              <div className="text-[8px] font-mono text-white/25 uppercase tracking-wider">Annualized APY</div>
              <div className="text-sm md:text-base font-black font-mono text-emerald-400 tabular-nums">
                +{apyAnnual >= 1000 ? apyAnnual.toLocaleString("en-US", { maximumFractionDigits: 0 }) : apyAnnual.toFixed(0)}%
              </div>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2">
              <div className="text-[8px] font-mono text-white/25 uppercase tracking-wider">Daily Rate</div>
              <div className="text-sm md:text-base font-black font-mono text-white tabular-nums">
                {(dailyRate * 100).toFixed(2)}% <span className="text-[9px] text-white/30">/ day</span>
              </div>
            </div>
          </div>

          {/* Long-term horizon columns — institutional structure */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
            {horizon.map((h) => {
              const value = realCompound(balance, dailyRate, h.days);
              const gain = value - balance;
              const pct = balance > 0 ? (gain / balance) * 100 : 0;
              return (
                <div key={h.label} className="bg-white/[0.02] border border-white/[0.05] rounded-lg px-2 py-1.5 text-center">
                  <div className="text-[8px] font-mono text-white/25 uppercase">{h.label}</div>
                  <div className="text-[10px] md:text-xs font-mono font-bold text-emerald-400 tabular-nums truncate">
                    +{formatCurrency(gain)}
                  </div>
                  <div className="text-[8px] font-mono text-white/20">+{pct.toFixed(1)}%</div>
                </div>
              );
            })}
          </div>

          {/* Compounding track */}
          {balance > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-[8px] font-mono text-white/20 mb-1">
                <span>NOW</span>
                <span className="text-emerald-400/50">{(dailyRate * 100).toFixed(2)}%/day · A=P(1+r){'\u02E3'}</span>
                <span>5Y</span>
              </div>
              <div className="relative h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-600 via-emerald-400 to-emerald-300" style={{ width: `${Math.min(100, (balance > 0 ? 1 : 0) * 100)}%` }} />
                <div className="absolute top-1/2 -translate-y-1/2 left-[5%] w-1 h-3 bg-white/20 rounded-full" />
              </div>
              <p className="text-[9px] font-mono text-emerald-400/40 text-center mt-1.5 tracking-wider">
                {isArmed && balance > 0 ? `COMPOUNDING ${(dailyRate * 100).toFixed(2)}% DAILY · ${formatCurrency(liveAccruedYield)} ACCRUED` : "FUNDED NODE · COMPOUNDING PAUSED"}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden rounded-2xl border", className)}
      style={{
        borderColor: YIELD_COLORS.border,
        background: `linear-gradient(180deg, rgba(2,6,12,1) 0%, ${YIELD_COLORS.bgTo} 100%)`,
        minHeight: 580,
      }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />

      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {Array.from({ length: STARS_COUNT }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: `${0.5 + (i % 3) * 0.5}px`,
              height: `${0.5 + (i % 3) * 0.5}px`,
              left: `${((i * 13.7) % 100)}%`,
              top: `${((i * 7.3) % 100)}%`,
              opacity: 0.15 + (i % 5) * 0.12,
              animation: `glowPulse ${2 + (i % 4)}s ease-in-out infinite`,
              animationDelay: `${i * 0.3}s`,
            }}
          />
        ))}
      </div>

      <div className="absolute inset-0 constellation-mesh opacity-20 pointer-events-none z-0" />

      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.3 }}
            className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center"
          >
            <div className="text-center">
              <motion.div
                animate={{ scale: [1, 1.4, 1], rotate: [0, 180, 360] }}
                transition={{ duration: 1.4, ease: "easeInOut" }}
                className="flex items-center justify-center gap-3"
              >
                <Rocket className="w-12 h-12 text-emerald-400" style={{ filter: "drop-shadow(0 0 30px rgba(16,185,129,0.6))" }} />
                <Sparkles className="w-10 h-10 text-emerald-300" />
              </motion.div>
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm font-black text-emerald-400 mt-2 tracking-widest"
              >
                CAPITAL INJECTED
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 p-6 md:p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Rocket className="w-4 h-4 text-emerald-400/80" />
              <span className="text-[10px] font-mono tracking-[0.3em] text-white/25 uppercase">G R O W T H  E N G I N E</span>
            </div>
            <h3 className="text-xl md:text-2xl font-black text-white tracking-tight">
              Real-Time{" "}
              <span className="text-emerald-400">Compounding</span>
            </h3>
            <p className="text-[10px] font-mono text-white/20 mt-1">
              A = P(1 + r)<sup>t</sup> · {nodeId ? `Node ${nodeId}` : `${tier} tier`} · {(dailyRate * 100).toFixed(2)}% daily
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <span className={`w-1.5 h-1.5 rounded-full ${isArmed && balance > 0 ? "bg-emerald-400 animate-pulse" : "bg-white/20"}`} />
              <span className="text-[9px] font-mono text-emerald-400/80 font-bold tracking-wider">
                {isArmed && balance > 0 ? "COMPOUNDING" : "INACTIVE"}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono text-white/30 block leading-tight">DAILY RATE</span>
              <span className="text-sm font-black font-mono text-emerald-400/90">{(dailyRate * 100).toFixed(2)}%</span>
            </div>
          </div>
        </div>

        {/* Main display */}
        <div className="grid md:grid-cols-12 gap-4 md:gap-6 mb-6">
          {/* Principal */}
          <div className="md:col-span-4 bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-4 h-4 text-white/40" />
                <span className="text-[10px] font-mono text-white/25 uppercase tracking-wider">Principal</span>
                {balance > 0 && (
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                    {tier}
                  </span>
                )}
              </div>
              <motion.div
                key={`p-${Math.round(animatedBalance)}`}
                initial={{ opacity: 0.6 }}
                animate={{ opacity: 1 }}
                className="text-3xl md:text-4xl font-black text-white font-mono tabular-nums tracking-tight"
              >
                {formatCurrency(balance)}
              </motion.div>
              <div className="flex items-center gap-3 mt-2 text-[10px] font-mono">
                <span className="text-white/25">Loadout</span>
                <span className="text-white/10">|</span>
                <span className={isArmed ? "text-emerald-400/70" : "text-white/25"}>{isArmed ? "ARMED" : "COLD"}</span>
              </div>
            </div>
          </div>

          {/* Yield */}
          <div className="md:col-span-4 bg-emerald-950/15 border border-emerald-800/20 rounded-xl p-5 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <Flame className="w-4 h-4 text-emerald-400/70" />
                <span className="text-[10px] font-mono text-emerald-400/50 uppercase tracking-wider">Projected Yield</span>
                <span className="text-[8px] font-mono text-white/20">{selectedPeriod}d</span>
              </div>
              <motion.div
                key={`y-${Math.round(animatedYield)}`}
                initial={{ opacity: 0.6 }}
                animate={{ opacity: 1 }}
                className="text-3xl md:text-4xl font-black text-emerald-400 font-mono tabular-nums tracking-tight"
              >
                +{formatCurrency(animatedYield)}
              </motion.div>
              <div className="flex items-center gap-3 mt-2 text-[10px] font-mono">
                <span className="text-emerald-400/60">{yieldPct >= 0 ? "+" : ""}{yieldPct.toFixed(1)}%</span>
                <span className="text-white/10">|</span>
                <span className="text-white/25">Compound daily</span>
              </div>
            </div>
          </div>

          {/* Live accrual */}
          <div className="md:col-span-4 bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 relative overflow-hidden">
            <div className="absolute -top-10 -left-10 w-36 h-36 bg-white/5 rounded-full blur-3xl pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <Timer className="w-4 h-4 text-white/40" />
                <span className="text-[10px] font-mono text-white/25 uppercase tracking-wider">Live Accrual</span>
                {isArmed && balance > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[8px] font-mono font-bold bg-emerald-500/15 text-emerald-400 animate-pulse">
                    REAL-TIME
                  </span>
                )}
              </div>
              <motion.div
                key={`live-${Math.round(liveAccruedYield * 100)}`}
                initial={{ opacity: 0.6 }}
                animate={{ opacity: 1 }}
                className="text-3xl md:text-4xl font-black text-emerald-300 font-mono tabular-nums tracking-tight"
              >
                +{formatCurrency(liveAccruedYield)}
              </motion.div>
              <div className="flex items-center gap-3 mt-2 text-[10px] font-mono">
                <span className="text-white/25">Growing now</span>
                <span className="text-white/10">|</span>
                <span className="text-emerald-400/60">{(liveAccruedYield / Math.max(balance, 1) * 100).toFixed(4)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Time segment selector */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-white/25" />
              <span className="text-[10px] font-mono text-white/20 uppercase tracking-wider">Compound Projection</span>
            </div>
            <div className="flex gap-1.5 bg-white/[0.03] p-1 rounded-xl border border-white/[0.06]">
              {TIME_SEGMENTS.map((seg) => {
                const active = selectedPeriod === seg.days;
                return (
                  <button
                    key={seg.label}
                    onClick={() => setSelectedPeriod(seg.days)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all duration-200",
                      active
                        ? "bg-emerald-500/20 text-emerald-400 shadow-lg shadow-emerald-500/10 border border-emerald-500/30"
                        : "text-white/30 hover:text-white/60 border border-transparent hover:border-white/10",
                    )}
                  >
                    <span>{seg.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Projection bars — REAL COMPOUND MATH */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3">
            {TIME_SEGMENTS.map((seg) => {
              // REAL COMPOUND: A = P(1+r)^t
              const segValue = realCompound(balance, dailyRate, seg.days);
              const segYield = segValue - balance;
              const segPct = balance > 0 ? (segYield / balance) * 100 : 0;
              const maxVal = realCompound(balance, dailyRate, 90);
              const barHeight = maxVal > balance ? ((segValue - balance) / (maxVal - balance)) * 100 : 0;
              const active = selectedPeriod === seg.days;

              return (
                <div
                  key={seg.label}
                  className={cn(
                    "relative rounded-xl border p-3 transition-all duration-300 cursor-pointer",
                    active
                      ? "bg-emerald-950/20 border-emerald-500/40 shadow-lg shadow-emerald-950/30"
                      : "bg-white/[0.02] border-white/[0.06] hover:border-white/20",
                  )}
                  onClick={() => setSelectedPeriod(seg.days)}
                >
                  <div className="h-16 flex items-end mb-2">
                    <div
                      className={cn(
                        "w-full rounded-t-lg transition-all duration-700 ease-out",
                        active ? "bg-gradient-to-t from-emerald-600 to-emerald-400" : "bg-white/10",
                      )}
                      style={{
                        height: `${Math.max(barHeight, 2)}%`,
                        transitionDelay: `${seg.days * 10}ms`,
                      }}
                    />
                  </div>
                  <div className="text-center">
                    <div className="text-[9px] font-mono text-white/30 mb-1">
                      {seg.label}
                    </div>
                    <div className={cn(
                      "text-sm md:text-base font-black font-mono",
                      segYield > 0 ? "text-emerald-400" : "text-white/30",
                    )}>
                      +{formatCurrency(segYield)}
                    </div>
                    <div className="text-[9px] font-mono text-white/20 mt-0.5">
                      +{segPct.toFixed(1)}%
                    </div>
                    <div className="text-[7px] font-mono text-white/15 mt-1">
                      A=P(1+r)<sup>{seg.days}</sup>
                    </div>
                  </div>
                  {active && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 animate-ping" style={{ animationDuration: "1.5s" }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Yield stream */}
        <div className="border-t border-white/[0.06] pt-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-emerald-400/60" />
              <span className="text-[10px] font-mono text-white/20 uppercase tracking-wider">Yield Stream</span>
              {isArmed && balance > 0 && (
                <span className="text-[8px] font-mono text-emerald-400/50 flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE
                </span>
              )}
            </div>
            <span className="text-[9px] font-mono text-white/20">{(dailyRate * 100).toFixed(2)}%/DAY COMPOUND</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {TIME_SEGMENTS.map((seg) => {
              const segValue = realCompound(balance, dailyRate, seg.days);
              const segYield = segValue - balance;
              return (
                <div key={seg.label} className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-2.5 text-center">
                  <div className="text-[9px] font-mono text-white/25 mb-1">{seg.label} return</div>
                  <div className="text-sm md:text-base font-black font-mono text-emerald-400">
                    +{formatCurrency(segYield)}
                  </div>
                  <div className="flex items-center justify-center gap-1 mt-0.5">
                    <ChevronRight className="w-2.5 h-2.5 text-emerald-400/50" />
                    <span className="text-[8px] font-mono text-white/20">
                      {balance > 0 ? ((segYield / balance) * 100).toFixed(1) : "0"}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {isArmed && balance > 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[9px] font-mono text-emerald-400/30 text-center mt-3 tracking-wider"
            >
              COMPOUNDING {((dailyRate * 100)).toFixed(2)}% DAILY · {formatCurrency(liveAccruedYield)} ACCRUED THIS SESSION
            </motion.p>
          )}

          {/* Bullish spike indicator */}
          <div className="mt-3 pt-3 border-t border-white/[0.04]">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[8px] font-mono text-white/15">
              <div className="text-center">
                <span className="block text-emerald-400/60 font-bold">+{formatCurrency(realCompound(balance, dailyRate, 1) - balance)}</span>
                <span>24h</span>
              </div>
              <div className="text-center">
                <span className="block text-emerald-400/60 font-bold">+{formatCurrency(realCompound(balance, dailyRate, 7) - balance)}</span>
                <span>7d</span>
              </div>
              <div className="text-center">
                <span className="block text-emerald-400/60 font-bold">+{formatCurrency(realCompound(balance, dailyRate, 30) - balance)}</span>
                <span>30d</span>
              </div>
              <div className="text-center">
                <span className="block text-emerald-400/60 font-bold">+{formatCurrency(realCompound(balance, dailyRate, 90) - balance)}</span>
                <span>90d</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
