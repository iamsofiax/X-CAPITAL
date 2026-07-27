"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Zap, ArrowUp, Award } from "lucide-react";
import { cn } from "@/lib/utils";

interface VelocityTier {
  label: string;
  multiplier: number;
  minDeposits: number;
  description: string;
  color: string;
  icon: typeof TrendingUp;
}

const VELOCITY_TIERS: VelocityTier[] = [
  { label: "Base", multiplier: 1.0, minDeposits: 0, description: "Standard routing efficiency", color: "text-white/50", icon: TrendingUp },
  { label: "Bronze", multiplier: 1.1, minDeposits: 3, description: "Recurring deposit pipeline active", color: "text-amber-600", icon: ArrowUp },
  { label: "Silver", multiplier: 1.3, minDeposits: 8, description: "Velocity compounding engaged", color: "text-gray-300", icon: ArrowUp },
  { label: "Gold", multiplier: 1.5, minDeposits: 15, description: "Max velocity tier — continuous compounding", color: "text-yellow-400", icon: Zap },
  { label: "Pool Master", multiplier: 2.0, minDeposits: 25, description: "Dominance status — reduced commissions + priority routing", color: "text-emerald-400", icon: Award },
];

const DEMO_POOLS = [
  { rail: "Core Liquidity", owner: "NODE-XC-7A2B", share: 12.4, commissionDiscount: 15 },
  { rail: "Trade Settlement", owner: "NODE-XC-3F9C", share: 8.7, commissionDiscount: 10 },
  { rail: "AMM Pool", owner: "NODE-XC-1D4E", share: 6.2, commissionDiscount: 8 },
  { rail: "Multiplier Layer", owner: "NODE-XC-9G5H", share: 4.1, commissionDiscount: 5 },
];

export default function VelocityMultiplier({
  totalDeposits = 7,
  currentMultiplier = 1.3,
  onSelectTier,
}: {
  totalDeposits?: number;
  currentMultiplier?: number;
  onSelectTier?: (tier: VelocityTier) => void;
}) {
  const currentTier = useMemo(
    () => VELOCITY_TIERS.reduce((prev, curr) => (totalDeposits >= curr.minDeposits ? curr : prev), VELOCITY_TIERS[0]),
    [totalDeposits],
  );

  const nextTier = useMemo(
    () => VELOCITY_TIERS.find((t) => t.minDeposits > totalDeposits),
    [totalDeposits],
  );

  const progressToNext = nextTier
    ? ((totalDeposits - currentTier.minDeposits) / (nextTier.minDeposits - currentTier.minDeposits)) * 100
    : 100;

  const [multiplierValue, setMultiplierValue] = useState(currentMultiplier);

  useEffect(() => {
    const target = currentTier.multiplier;
    const duration = 800;
    const start = multiplierValue;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setMultiplierValue(start + (target - start) * eased);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [currentTier.multiplier]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#080812] p-5 md:p-8">
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <p className="text-[10px] font-mono tracking-[0.3em] text-white/30 uppercase mb-1">Velocity Multiplier</p>
          <h3 className="text-lg font-black text-white tracking-tight">Capital Velocity Incentives</h3>
        </div>
        <div className="text-right">
          <div className={cn("text-3xl font-black font-mono", currentTier.color)}>{multiplierValue.toFixed(2)}×</div>
          <div className="text-[10px] font-mono text-white/30 mt-0.5">Current Multiplier</div>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between text-[10px] font-mono text-white/30 mb-1.5">
          <span>{currentTier.label} ({currentTier.minDeposits} deposits)</span>
          {nextTier && <span>{nextTier.label} ({nextTier.minDeposits} deposits)</span>}
          {!nextTier && <span>MAX TIER</span>}
        </div>
        <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
          <motion.div
            className={cn("h-full rounded-full", currentTier.label === "Pool Master" ? "bg-emerald-500" : "bg-gradient-to-r from-amber-600 via-yellow-500 to-emerald-500")}
            initial={{ width: 0 }}
            animate={{ width: `${progressToNext}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
        <div className="text-[10px] font-mono text-white/20 mt-1.5">
          {totalDeposits} completed deposits · {nextTier ? `${nextTier.minDeposits - totalDeposits} more to ${nextTier.label}` : "Maximum velocity achieved"}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-6">
        {VELOCITY_TIERS.map((tier) => {
          const unlocked = totalDeposits >= tier.minDeposits;
          const isCurrent = tier.label === currentTier.label;
          return (
            <button
              key={tier.label}
              onClick={() => onSelectTier?.(tier)}
              className={cn(
                "relative rounded-xl border p-3 text-center transition-all duration-300",
                isCurrent ? "border-white/30 bg-white/[0.06] shadow-lg shadow-black/30" : unlocked ? "border-white/10 bg-white/[0.02] hover:border-white/20" : "border-white/[0.04] bg-black/20 opacity-40",
              )}
            >
              <tier.icon className={cn("w-4 h-4 mx-auto mb-1.5", tier.color)} />
              <div className={cn("text-sm font-black", unlocked ? "text-white" : "text-white/30")}>{tier.label}</div>
              <div className={cn("text-lg font-black font-mono", unlocked ? tier.color : "text-white/20")}>{tier.multiplier.toFixed(1)}×</div>
              {isCurrent && <span className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />}
              {unlocked && !isCurrent && <span className="text-[8px] font-mono text-emerald-400/60 mt-1 block">Unlocked</span>}
              {!unlocked && <span className="text-[8px] font-mono text-white/20 mt-1 block">{tier.minDeposits} dep.</span>}
            </button>
          );
        })}
      </div>

      <div className="border-t border-white/[0.06] pt-5">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-4 h-4 text-emerald-400/80" />
          <span className="text-[10px] font-mono tracking-[0.2em] text-white/30 uppercase">Pool Dominance Status</span>
        </div>
        <div className="grid md:grid-cols-2 gap-2">
          {DEMO_POOLS.map((pool) => (
            <div key={pool.rail} className="flex items-center justify-between bg-white/[0.02] border border-white/[0.06] rounded-lg px-3 py-2.5">
              <div>
                <div className="text-xs font-semibold text-white">{pool.rail}</div>
                <div className="text-[10px] font-mono text-white/30">{pool.owner}</div>
              </div>
              <div className="text-right">
                <div className="text-xs font-mono font-bold text-emerald-400">{pool.share}%</div>
                <div className="text-[9px] text-amber-400/70">-{pool.commissionDiscount}% fee</div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-white/20 mt-3 leading-relaxed">
          Acquire significant fractional ownership of a Rail liquidity pool to earn reduced commission tiers and priority routing status.
        </p>
      </div>
    </div>
  );
}
