"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowRight, AlertCircle, TrendingUp, Shield, Wallet, CheckCircle2, RefreshCw, DollarSign, Lock } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

/* ═══════════════════════════════════════════════════════════════
   SpendToStakeBridge — Commerce-to-Yield Gateway
   Converts transactional expenditures into active capital positions.
   Dual-path: physical delivery + capital collateralization → 7 Rails
   ═══════════════════════════════════════════════════════════════ */

interface StakePosition {
  product: string;
  purchaseAmount: number;
  stakedAmount: number;
  stakedRail: string;
  estimatedApy: number;
  collateralMinted: number;
  status: "active" | "pending" | "settling";
  mintedAt: string;
}

const RAIL_YIELDS: Record<string, number> = {
  "Core Liquidity": 8.4,
  "Trade Settlement": 14.2,
  "Asset-Backed": 18.7,
  "AMM Pool": 22.1,
  "Liquidity Provision": 31.5,
  "Synthetic Derivatives": 42.8,
  "Multiplier Layer": 58.3,
};

const DEMO_STAKES: StakePosition[] = [
  {
    product: "Tesla Model X Plaid",
    purchaseAmount: 89990,
    stakedAmount: 4499.5,
    stakedRail: "Trade Settlement",
    estimatedApy: 14.2,
    collateralMinted: 4499.5,
    status: "active",
    mintedAt: "2026-07-15T10:30:00Z",
  },
  {
    product: "MacBook Pro M4 Max",
    purchaseAmount: 3499,
    stakedAmount: 349.9,
    stakedRail: "Core Liquidity",
    estimatedApy: 8.4,
    collateralMinted: 349.9,
    status: "active",
    mintedAt: "2026-07-22T14:15:00Z",
  },
];

export default function SpendToStakeBridge({
  onStake,
  positions = DEMO_STAKES,
  compact = false,
}: {
  onStake?: (amount: number, rail: string) => void;
  positions?: StakePosition[];
  compact?: boolean;
}) {
  const [selectedRail, setSelectedRail] = useState("Trade Settlement");
  const [animatingAmount, setAnimatingAmount] = useState(0);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const totalStaked = useMemo(() => positions.reduce((s, p) => s + p.stakedAmount, 0), [positions]);
  const totalYield = useMemo(() => positions.reduce((s, p) => s + (p.stakedAmount * p.estimatedApy) / 100, 0), [positions]);

  // Animate the counter on mount
  useEffect(() => {
    const target = totalStaked;
    const duration = 1500;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatingAmount(target * eased);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [totalStaked]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-emerald-900/30 bg-gradient-to-b from-[#080812] via-[#0a1018] to-[#080812]">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-60 h-60 rounded-full bg-cyan-500/3 blur-3xl pointer-events-none" />

      <div className="relative z-10 p-5 md:p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
          <div>
            <p className="text-[10px] font-mono tracking-[0.3em] text-emerald-400/60 uppercase mb-1 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Spend-to-Stake Gateway
            </p>
            <h3 className="text-lg font-black text-white tracking-tight">
              Commerce → Yield Bridge
            </h3>
          </div>
          <div className="text-right">
            <div className="text-xs font-mono text-emerald-400/80">
              Total Staked
            </div>
            <div className="text-xl font-black font-mono text-emerald-400 tabular-nums">
              {formatCurrency(animatingAmount)}
            </div>
          </div>
        </div>

        {/* How it works — institutional workflow */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          {[
            { step: "01", label: "Order Initiation", desc: "Select any product in the commerce catalog", icon: Wallet },
            { step: "02", label: "Dual-Path Settlement", desc: "Physical delivery + capital collateralization", icon: RefreshCw },
            { step: "03", label: "Active Yield Position", desc: "Staked into 7 Rails, generating real-time APY", icon: TrendingUp },
          ].map(({ step, label, desc, icon: Icon }) => (
            <div key={step} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 hover:border-emerald-500/20 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-mono text-emerald-400/60">{step}</span>
                <Icon className="w-3.5 h-3.5 text-white/30" />
              </div>
              <div className="text-sm font-bold text-white mb-1">{label}</div>
              <div className="text-[11px] text-white/40 leading-relaxed">{desc}</div>
            </div>
          ))}
        </div>

        {/* Active Stake Positions */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-mono tracking-[0.2em] text-white/30 uppercase">
              Active Positions
            </span>
            <span className="text-[10px] font-mono text-emerald-400/70">
              {positions.length} staked
            </span>
          </div>

          <div className="space-y-2">
            {positions.map((pos, i) => {
              const dailyYield = (pos.stakedAmount * pos.estimatedApy) / 100 / 365;
              return (
                <motion.div
                  key={`${pos.product}-${i}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 hover:border-emerald-500/20 transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-sm font-semibold text-white">{pos.product}</div>
                      <div className="text-[10px] font-mono text-white/30 mt-0.5">
                        Purchase: {formatCurrency(pos.purchaseAmount)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono font-bold text-emerald-400">
                        {formatCurrency(pos.stakedAmount)}
                      </div>
                      <div className="text-[9px] text-white/30">
                        staked
                      </div>
                    </div>
                  </div>

                  {/* Yield rail + APY */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80" />
                      <span className="text-white/50 font-mono">{pos.stakedRail}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-emerald-400/80 font-mono font-bold">
                        {pos.estimatedApy}% APY
                      </span>
                      <span className="text-white/30 font-mono text-[9px]">
                        ~{formatCurrency(dailyYield)}/day
                      </span>
                    </div>
                  </div>

                  {/* Collateral bar */}
                  <div className="mt-3 pt-3 border-t border-white/[0.04]">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-white/30">Collateral minted</span>
                      <span className="text-emerald-400/80">{formatCurrency(pos.collateralMinted)}</span>
                    </div>
                    <div className="h-1 bg-white/[0.05] rounded-full mt-1 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400"
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 1.5, delay: i * 0.2 }}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Stake Controls — compact footer */}
        {!compact && (
          <div className="border-t border-white/[0.06] pt-5">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4 text-emerald-400/70" />
              <span className="text-[10px] font-mono tracking-[0.2em] text-white/30 uppercase">
                Stake from purchase
              </span>
            </div>

            {/* Rail selector */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {Object.entries(RAIL_YIELDS).slice(0, 5).map(([rail, apy]) => (
                <button
                  key={rail}
                  onClick={() => setSelectedRail(rail)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[10px] font-mono border transition-all",
                    selectedRail === rail
                      ? "border-emerald-500/50 bg-emerald-950/40 text-emerald-300"
                      : "border-white/[0.06] text-white/40 hover:border-white/20 hover:text-white/60",
                  )}
                >
                  {rail} · {apy}%
                </button>
              ))}
            </div>

            {/* Projection */}
            <div className="flex items-center justify-between bg-white/[0.02] border border-white/[0.06] rounded-xl px-4 py-3 mb-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400/60" />
                <span className="text-xs text-white/50">
                  Staking 5% of purchase into <span className="text-white font-semibold">{selectedRail}</span>
                </span>
              </div>
              <div className="text-right">
                <div className="text-xs font-mono font-bold text-emerald-400">{RAIL_YIELDS[selectedRail]}% APY</div>
                <div className="text-[9px] text-white/30">est. annual yield</div>
              </div>
            </div>

            {showConfirmation && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-[11px] text-emerald-400/80 bg-emerald-950/30 border border-emerald-800/30 rounded-lg px-4 py-2.5 mb-4"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Collateral minted and routed to {selectedRail}. Position is active.</span>
              </motion.div>
            )}

            <button
              onClick={() => {
                setShowConfirmation(true);
                onStake?.(5000, selectedRail);
                setTimeout(() => setShowConfirmation(false), 4000);
              }}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-950/30 text-sm"
            >
              <Lock className="w-4 h-4" />
              Mint Collateral & Stake
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Summary bar */}
        <div className="mt-5 pt-4 border-t border-white/[0.04] flex items-center justify-between text-[10px] font-mono text-white/25">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-3 h-3" />
            <span>Collateral never leaves your wallet</span>
          </div>
          <span className="text-emerald-400/50">{formatCurrency(totalYield)}/yr projected yield</span>
        </div>
      </div>
    </div>
  );
}
