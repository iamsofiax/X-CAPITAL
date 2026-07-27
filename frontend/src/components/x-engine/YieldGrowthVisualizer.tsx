"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, Zap, DollarSign, Activity, Satellite, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import OrbitalConstellation from "@/components/starlink/OrbitalConstellation";

interface YieldGrowthVisualizerProps {
  /** Current cash balance in USD */
  balance: number;
  /** Daily profit rate as decimal (e.g. 0.015 = 1.5%) */
  dailyRate?: number;
  /** Node tier label */
  tier?: string;
  /** Whether the node is armed */
  isArmed?: boolean;
  className?: string;
  compact?: boolean;
}

const YIELD_COLORS = {
  principal: "#10b981",
  yield: "#34d399",
  signal: "rgba(16, 185, 129, 0.5)",
  bgFrom: "rgba(16, 185, 129, 0.03)",
  bgTo: "rgba(0, 0, 0, 0.4)",
  border: "rgba(16, 185, 129, 0.15)",
};

/** Deterministic pseudo-random seed for yield data */
function seededRandom(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

/** Generate smooth yield projection data */
function generateYieldProjection(balance: number, dailyRate: number, days: number) {
  const rng = seededRandom(42);
  const data = [];
  let value = balance;
  for (let i = 0; i <= days; i++) {
    const noise = (rng() - 0.45) * 0.02;
    value *= 1 + dailyRate + noise;
    data.push({
      day: i,
      value: Math.round(value * 100) / 100,
      yield: Math.round((value - balance) * 100) / 100,
    });
  }
  return data;
}

/** Time segments for display */
const TIME_SEGMENTS = [
  { label: "24h", multiplier: 1 },
  { label: "7d", multiplier: 7 },
  { label: "30d", multiplier: 30 },
  { label: "90d", multiplier: 90 },
] as const;

export default function YieldGrowthVisualizer({
  balance,
  dailyRate = 0.015,
  tier = "Node",
  isArmed = false,
  className,
  compact = false,
}: YieldGrowthVisualizerProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<number>(30);
  const [animatedBalance, setAnimatedBalance] = useState(balance);
  const [animatedYield, setAnimatedYield] = useState(0);
  const prevBalanceRef = useRef(balance);
  const [showCelebration, setShowCelebration] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Projection data
  const projectionData = useMemo(
    () => generateYieldProjection(balance, dailyRate, 90),
    [balance, dailyRate],
  );

  // Current period data
  const periodData = useMemo(
    () => projectionData.slice(0, selectedPeriod + 1),
    [projectionData, selectedPeriod],
  );

  const finalValue = periodData[periodData.length - 1]?.value ?? balance;
  const totalYield = finalValue - balance;
  const yieldPct = balance > 0 ? ((totalYield / balance) * 100) : 0;

  // Animate balance on change
  useEffect(() => {
    if (balance !== prevBalanceRef.current) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 1800);
      prevBalanceRef.current = balance;
    }
  }, [balance]);

  // Simulated yield counter animation
  useEffect(() => {
    const targetBalance = balance;
    const targetYield = totalYield;
    const duration = 2000;
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

  // Canvas-based yield particle system
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || compact) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf: number;
    let t = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener("resize", resize);

    const W = () => canvas!.offsetWidth;
    const H = () => canvas!.offsetHeight;

    type YieldParticle = {
      x: number; y: number;
      vx: number; vy: number;
      size: number; alpha: number;
      life: number; maxLife: number;
      color: string;
    };

    const particles: YieldParticle[] = [];

    const spawnParticle = () => {
      const isYield = Math.random() > 0.4;
      particles.push({
        x: W() / 2 + (Math.random() - 0.5) * W() * 0.6,
        y: H() * 0.7 + Math.random() * H() * 0.2,
        vx: (Math.random() - 0.5) * 0.8,
        vy: -0.3 - Math.random() * 1.2,
        size: 1.5 + Math.random() * 2.5,
        alpha: 0.3 + Math.random() * 0.5,
        life: 0,
        maxLife: 60 + Math.random() * 100,
        color: isYield
          ? `rgba(52, 211, 153, ${(0.3 + Math.random() * 0.5).toFixed(2)})`
          : `rgba(16, 185, 129, ${(0.2 + Math.random() * 0.4).toFixed(2)})`,
      });
    };

    let spawnCounter = 0;
    const draw = () => {
      t += 0.016;
      spawnCounter++;

      ctx.clearRect(0, 0, W(), H());

      // Draw rising yield particles
      if (isArmed && balance > 0 && !compact) {
        if (spawnCounter % 3 === 0 && particles.length < 120) {
          spawnParticle();
        }

        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.life++;
          p.y += p.vy;
          p.x += p.vx + Math.sin(t + p.x * 0.01) * 0.3;
          p.alpha *= 0.995;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color.replace(/[\d.]+\)$/, `${Math.max(p.alpha, 0).toFixed(2)})`);
          ctx.fill();

          // Trail
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - p.vx * 8, p.y - p.vy * 8);
          ctx.strokeStyle = p.color.replace(/[\d.]+\)$/, `${(p.alpha * 0.3).toFixed(2)})`);
          ctx.lineWidth = p.size * 0.5;
          ctx.stroke();

          if (p.life > p.maxLife || p.alpha < 0.01) {
            particles.splice(i, 1);
          }
        }

        // Rising glow at bottom
        const bottomGlow = ctx.createLinearGradient(0, H() * 0.6, 0, H());
        bottomGlow.addColorStop(0, "rgba(16, 185, 129, 0)");
        bottomGlow.addColorStop(0.5, `rgba(16, 185, 129, ${(0.03 + Math.sin(t * 0.5) * 0.02).toFixed(3)})`);
        bottomGlow.addColorStop(1, `rgba(16, 185, 129, ${(0.06 + Math.sin(t * 0.3) * 0.03).toFixed(3)})`);
        ctx.fillStyle = bottomGlow;
        ctx.fillRect(0, H() * 0.6, W(), H() * 0.4);
      }

      // Yield accumulation line
      if (balance > 0) {
        const progress = Math.min(totalYield / (balance * 2), 1);
        const gradient = ctx.createLinearGradient(W() * 0.1, 0, W() * 0.9, 0);
        gradient.addColorStop(0, "rgba(16, 185, 129, 0)");
        gradient.addColorStop(0.3, `rgba(16, 185, 129, ${(0.08 + Math.sin(t * 0.4) * 0.04).toFixed(3)})`);
        gradient.addColorStop(progress, `rgba(52, 211, 153, ${(0.15 + Math.sin(t * 0.6) * 0.05).toFixed(3)})`);
        gradient.addColorStop(1, "rgba(16, 185, 129, 0)");

        ctx.beginPath();
        ctx.moveTo(W() * 0.1, H() * 0.5);
        ctx.lineTo(W() * 0.1 + (W() * 0.8) * progress, H() * 0.5);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Pulse dot at the edge
        ctx.beginPath();
        ctx.arc(W() * 0.1 + (W() * 0.8) * progress, H() * 0.5, 4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(52, 211, 153, ${(0.4 + Math.sin(t * 2) * 0.3).toFixed(2)})`;
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [balance, isArmed, dailyRate, compact]);

  // Chart dimensions
  const chartW = 320;
  const chartH = 120;
  const chartPadding = { top: 10, right: 10, bottom: 20, left: 40 };

  const chartPath = useMemo(() => {
    if (periodData.length < 2) return "";
    const maxVal = Math.max(...periodData.map(d => d.value), balance * 1.01);
    const minVal = Math.min(...periodData.map(d => d.value), balance * 0.99);
    const range = maxVal - minVal || 1;
    const chartW_ = chartW - chartPadding.left - chartPadding.right;
    const chartH_ = chartH - chartPadding.top - chartPadding.bottom;

    return periodData.map((d, i) => {
      const x = chartPadding.left + (i / (periodData.length - 1)) * chartW_;
      const y = chartPadding.top + chartH_ - ((d.value - minVal) / range) * chartH_;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
  }, [periodData, balance]);

  const chartAreaPath = useMemo(() => {
    if (!chartPath) return "";
    const w = chartW - chartPadding.left - chartPadding.right;
    const h = chartH - chartPadding.top - chartPadding.bottom;
    const lastX = chartPadding.left + w;
    return `${chartPath} L${lastX.toFixed(1)},${(chartPadding.top + h).toFixed(1)} L${chartPadding.left.toFixed(1)},${(chartPadding.top + h).toFixed(1)} Z`;
  }, [chartPath]);

  // Y-axis labels
  const yLabels = useMemo(() => {
    const maxVal = Math.max(...periodData.map(d => d.value), balance * 1.01);
    const minVal = Math.min(...periodData.map(d => d.value), balance * 0.99);
    const steps = 4;
    return Array.from({ length: steps + 1 }, (_, i) => {
      const val = minVal + ((maxVal - minVal) / steps) * i;
      return { value: val, label: formatCurrency(val) };
    });
  }, [periodData, balance]);

  if (compact) {
    return (
      <div className={cn("relative overflow-hidden rounded-xl border", className)}
        style={{ borderColor: YIELD_COLORS.border, background: `linear-gradient(135deg, ${YIELD_COLORS.bgFrom}, ${YIELD_COLORS.bgTo})` }}
      >
        <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" style={{ opacity: 0.4 }} />
        <div className="relative z-10 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${isArmed && balance > 0 ? "bg-emerald-400 animate-pulse" : "bg-white/30"}`} />
              <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider">Yield Growth</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400/80">{yieldPct >= 0 ? "+" : ""}{yieldPct.toFixed(1)}% projected</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-black font-mono text-white tabular-nums">{formatCurrency(animatedBalance)}</span>
            <AnimatePresence>
              {totalYield > 0 && (
                <motion.span
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs font-mono font-bold text-emerald-400"
                >
                  +{formatCurrency(animatedYield)} yield
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden rounded-2xl border", className)}
      style={{
        borderColor: YIELD_COLORS.border,
        background: `linear-gradient(135deg, ${YIELD_COLORS.bgFrom}, ${YIELD_COLORS.bgTo})`,
        minHeight: 480,
      }}
    >
      {/* Canvas particle layer */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />

      {/* Background mesh */}
      <div className="absolute inset-0 constellation-mesh opacity-30 pointer-events-none z-0" />

      {/* Celebration overlay */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center"
          >
            <div className="text-center">
              <motion.div
                animate={{ scale: [1, 1.3, 1], rotate: [0, 180, 360] }}
                transition={{ duration: 1.2, ease: "easeInOut" }}
              >
                <Zap className="w-16 h-16 text-emerald-400 mx-auto" style={{ filter: "drop-shadow(0 0 30px rgba(16,185,129,0.6))" }} />
              </motion.div>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm font-bold text-emerald-400 mt-2"
              >
                Capital Injected
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 p-6 md:p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Satellite className="w-4 h-4 text-emerald-400/70" />
              <span className="text-[10px] font-mono tracking-[0.3em] text-white/30 uppercase">Yield Architecture</span>
            </div>
            <h3 className="text-lg font-black text-white tracking-tight">Real-Time Growth Engine</h3>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isArmed && balance > 0 ? "bg-emerald-400 animate-pulse" : "bg-white/20"}`} />
            <span className="text-[10px] font-mono text-white/40">{isArmed ? "ARMED · COMPOUNDING" : "NODE COLD"}</span>
          </div>
        </div>

        {/* Main value display */}
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          {/* Principal */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-3.5 h-3.5 text-white/40" />
              <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider">Principal</span>
            </div>
            <motion.div
              key={`principal-${Math.round(animatedBalance)}`}
              initial={{ opacity: 0.5, y: 2 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-black text-white font-mono tabular-nums"
            >
              {formatCurrency(balance)}
            </motion.div>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-[10px] text-white/30 font-mono">{tier} tier</span>
              <span className="text-[10px] text-white/20">·</span>
              <span className="text-[10px] text-white/30 font-mono">{(dailyRate * 100).toFixed(1)}% daily</span>
            </div>
          </div>

          {/* Yield Earned */}
          <div className="bg-emerald-950/20 border border-emerald-800/25 rounded-xl p-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400/70" />
                <span className="text-[10px] font-mono text-emerald-400/60 uppercase tracking-wider">Projected Yield</span>
              </div>
              <motion.div
                key={`yield-${Math.round(animatedYield)}`}
                initial={{ opacity: 0.5, y: 2 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl font-black text-emerald-400 font-mono tabular-nums"
              >
                +{formatCurrency(animatedYield)}
              </motion.div>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-[10px] text-emerald-400/60 font-mono">{yieldPct >= 0 ? "+" : ""}{yieldPct.toFixed(1)}%</span>
                <span className="text-[10px] text-emerald-400/30">·</span>
                <span className="text-[10px] text-emerald-400/60 font-mono">{selectedPeriod}d projection</span>
              </div>
            </div>
          </div>

          {/* Orbital Visual */}
          <div className="flex items-center justify-center bg-white/[0.01] border border-white/[0.06] rounded-xl py-2">
            <OrbitalConstellation size={100} dense />
          </div>
        </div>

        {/* Projection Chart */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-white/30" />
              <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider">Growth Projection</span>
            </div>
            <div className="flex gap-1">
              {TIME_SEGMENTS.map((seg) => (
                <button
                  key={seg.label}
                  onClick={() => setSelectedPeriod(seg.multiplier)}
                  className={cn(
                    "px-2 py-1 rounded text-[10px] font-mono font-bold transition-all",
                    selectedPeriod === seg.multiplier
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "text-white/30 hover:text-white/60 border border-transparent",
                  )}
                >
                  {seg.label}
                </button>
              ))}
            </div>
          </div>

          <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-auto" style={{ maxHeight: 140 }}>
            <defs>
              <linearGradient id="yieldAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(16, 185, 129, 0.3)" />
                <stop offset="100%" stopColor="rgba(16, 185, 129, 0)" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            {yLabels.map((yl, i) => (
              <g key={i}>
                <line
                  x1={chartPadding.left} y1={chartPadding.top + (chartH - chartPadding.top - chartPadding.bottom) * (i / yLabels.length)}
                  x2={chartW - chartPadding.right} y2={chartPadding.top + (chartH - chartPadding.top - chartPadding.bottom) * (i / yLabels.length)}
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth={0.5}
                />
                <text
                  x={chartPadding.left - 4}
                  y={chartPadding.top + (chartH - chartPadding.top - chartPadding.bottom) * (i / yLabels.length) + 3}
                  textAnchor="end"
                  fill="rgba(255,255,255,0.25)"
                  fontSize={8}
                  fontFamily="JetBrains Mono, monospace"
                >
                  {yl.label}
                </text>
              </g>
            ))}

            {/* Area fill */}
            {chartAreaPath && (
              <path d={chartAreaPath} fill="url(#yieldAreaGrad)" />
            )}

            {/* Line */}
            {chartPath && (
              <path d={chartPath} fill="none" stroke="#10b981" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
            )}

            {/* End dot */}
            {periodData.length > 0 && (() => {
              const last = periodData[periodData.length - 1];
              const maxVal = Math.max(...periodData.map(d => d.value), balance * 1.01);
              const minVal = Math.min(...periodData.map(d => d.value), balance * 0.99);
              const range = maxVal - minVal || 1;
              const chartW_ = chartW - chartPadding.left - chartPadding.right;
              const chartH_ = chartH - chartPadding.top - chartPadding.bottom;
              const x = chartPadding.left + chartW_;
              const y = chartPadding.top + chartH_ - ((last.value - minVal) / range) * chartH_;
              return (
                <g>
                  <circle cx={x} cy={y} r={3} fill="#34d399" />
                  <circle cx={x} cy={y} r={6} fill="rgba(52, 211, 153, 0.2)" />
                  <circle cx={x} cy={y} r={10} fill="rgba(52, 211, 153, 0.08)" className="animate-ping" style={{ animationDuration: "3s" }} />
                </g>
              );
            })()}
          </svg>
        </div>

        {/* Yield stream ticker */}
        <div className="border-t border-white/[0.06] pt-4">
          <div className="flex items-center gap-2 mb-3">
            <Cpu className="w-3.5 h-3.5 text-emerald-400/60" />
            <span className="text-[10px] font-mono text-white/25 uppercase tracking-wider">Yield Stream</span>
            <span className="text-[8px] font-mono text-emerald-400/50">{(dailyRate * 100).toFixed(2)}%/DAY</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {TIME_SEGMENTS.map((seg) => {
              const periodProjection = projectionData[seg.multiplier];
              if (!periodProjection) return null;
              const periodYield = periodProjection.value - balance;
              return (
                <div key={seg.label} className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-2.5 text-center">
                  <div className="text-[9px] font-mono text-white/30 mb-1">{seg.label}</div>
                  <div className="text-sm font-black font-mono text-emerald-400">
                    +{formatCurrency(periodYield)}
                  </div>
                  <div className="text-[8px] font-mono text-white/20">
                    {balance > 0 ? ((periodYield / balance) * 100).toFixed(1) : 0}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
