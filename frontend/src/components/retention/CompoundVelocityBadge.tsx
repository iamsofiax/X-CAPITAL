'use client';

import React, { useEffect, useState } from 'react';
import { Zap, ShieldAlert, Flame, TrendingUp } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { useStreakStore, formatCountdown } from '@/store/useStreakStore';
import type { TopUpBoostKey } from '@/lib/compoundMath';
import { TOP_UP_BOOSTS } from '@/lib/compoundMath';

interface CompoundVelocityBadgeProps {
  userId: string;
  balance: number;
  onQuickDeposit?: (amount: number) => void;
}

const TICK_MS = 1000;

/**
 * "Compound Velocity Engine" badge — the unclaimed-compound streak counter.
 *
 * Shows:
 *  - Current streak level L1–L5
 *  - Active APY boost multipliers (Daily 1.15×, 48h 1.10×, Weekly vault)
 *  - Live countdown to the next tier target so the deposit action feels urgent
 *  - A one-tap quick-deposit row that immediately unlocks the engine
 *
 * Behavioral intent: making the streak visible + the countdown ticking trains
 * the deposit habit loop. Withdrawing (registered via the wallet page) resets
 * the streak back to Level 1 and strips these multipliers.
 */
export default function CompoundVelocityBadge({
  userId,
  balance,
  onQuickDeposit,
}: CompoundVelocityBadgeProps) {
  const [now, setNow] = useState(() => Date.now());

  // Subscribe to the stable records slice; derived values are computed inline
  // with the live `now` so the 1s countdown tick never triggers selector loops.
  useStreakStore((s) => s.records);
  const { getStreakLevel, getNextTierTarget, getActiveBoostDetails } =
    useStreakStore.getState();

  const streakLevel = getStreakLevel(userId);

  // Recompute every second so the countdown and boost expiry stay live.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(id);
  }, []);

  // Re-read with the fresh timestamp so expired boosts drop off the badge.
  const liveTarget = getNextTierTarget(userId, now);
  const liveBoosts = getActiveBoostDetails(userId, now);
  const boosts = liveBoosts;

  const activeBoostKeys: TopUpBoostKey[] = liveBoosts.map((b) => b.key);
  const hasBoosts = activeBoostKeys.length > 0;
  const multiplier = liveBoosts.reduce((prod, b) => prod * b.multiplier, 1);
  const lvl = streakLevel;

  const quickAmounts = [50, 100, 250];

  return (
    <div
      className={cn(
        'rounded-2xl border p-5 transition-all',
        hasBoosts
          ? 'border-emerald-600/40 bg-gradient-to-br from-emerald-950/40 via-black to-emerald-950/20 shadow-[0_0_30px_rgba(16,185,129,0.08)]'
          : 'border-white/10 bg-black',
      )}
    >
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-950/60 border border-emerald-800/40">
            <Zap className="h-4.5 w-4.5 text-emerald-400" />
          </div>
          <div>
            <p className="text-xs font-black text-white uppercase tracking-wider">
              Compound Velocity Engine
            </p>
            <p className="text-[10px] text-emerald-400/70 font-mono">
              Unclaimed compound streak · active daily
            </p>
          </div>
        </div>

        {/* Stream shield note */}
        {boosts.length === 0 && (
          <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-amber-700/30 bg-amber-950/20 px-2.5 py-1">
            <ShieldAlert className="h-3 w-3 text-amber-400" />
            <span className="text-[9px] font-mono text-amber-400/90">STREAK SHIELD ARMED</span>
          </div>
        )}
      </div>

      {/* Level + multiplier row */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-center">
          <div className="text-[9px] font-mono uppercase text-white/30">Streak Level</div>
          <div className="mt-1 font-mono text-2xl font-black text-white">
            L{lvl}
          </div>
          <div className="mt-0.5 text-[9px] font-mono text-white/20">LEVEL {lvl} · CONSECUTIVE DAYS</div>
        </div>

        <div className="rounded-xl border border-emerald-800/25 bg-emerald-950/20 p-3 text-center">
          <div className="text-[9px] font-mono uppercase text-emerald-400/60">APY Multiplier</div>
          <div className="mt-1 font-mono text-2xl font-black text-emerald-400">
            {multiplier.toFixed(2)}×
          </div>
          <div className="mt-0.5 text-[9px] font-mono text-emerald-400/40">ACTIVE BOOSTS</div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-center">
          <div className="text-[9px] font-mono uppercase text-white/30">Node Loadout</div>
          <div className="mt-1 font-mono text-lg font-black text-white tabular-nums">
            {formatCurrency(balance)}
          </div>
          <div className="mt-0.5 text-[9px] font-mono text-white/20">COMPOUNDING BASE</div>
        </div>
      </div>

      {/* Active boost pills */}
      {hasBoosts ? (
        <div className="mb-3 flex flex-wrap gap-2">
          {activeBoostKeys.map((key) => {
            const b = TOP_UP_BOOSTS[key];
            return (
              <span
                key={key}
                className="flex items-center gap-1.5 rounded-full border border-emerald-700/40 bg-emerald-950/40 px-3 py-1"
              >
                <Flame className="h-3 w-3 text-emerald-400" />
                <span className="text-[10px] font-bold text-emerald-300">
                  {b.label}
                </span>
                <span className="text-[9px] font-mono text-emerald-400/70">
                  +{(b.addedPct * 100).toFixed(2)}% · {b.multiplier}×
                </span>
              </span>
            );
          })}
        </div>
      ) : (
        <p className="mb-3 text-[11px] text-white/40">
          No boosts active. Make a top-up to unlock the{' '}
          <span className="text-emerald-400 font-bold">1.15× Daily Accelerator</span>.
        </p>
      )}

      {/* Next tier fuel gauge */}
      {liveTarget && (
        <div className="mb-3 rounded-xl border border-white/10 bg-white/[0.02] p-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-[10px] font-mono uppercase tracking-wider text-white/50">
                Next tier · {liveTarget.label}
              </span>
            </div>
            <span className="font-mono text-[10px] font-bold text-emerald-400">
              {liveTarget.multiplier > 1 ? `${liveTarget.multiplier.toFixed(2)}×` : 'VAULT'}
            </span>
          </div>

          {/* Progress ring / bar */}
          <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-700 via-emerald-500 to-emerald-400 transition-all duration-700"
              style={{ width: `${Math.round(Math.max(0, Math.min(1, liveTarget.progress)) * 100)}%` }}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[10px] text-white/40">{liveTarget.required}</span>
            {liveTarget.mode === 'maintain' && liveTarget.remainingMs > 0 && (
              <span className="font-mono text-xs font-black text-emerald-400 tabular-nums">
                {formatCountdown(liveTarget.remainingMs)}
              </span>
            )}
          </div>
        </div>
      )}

      {/* One-tap quick deposit */}
      {onQuickDeposit && (
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono uppercase tracking-wider text-white/30">
            Quick top-up
          </span>
          {quickAmounts.map((amount) => (
            <button
              key={amount}
              onClick={() => onQuickDeposit(amount)}
              className="flex-1 rounded-lg border border-emerald-700/40 bg-emerald-950/30 px-2 py-1.5 text-xs font-bold text-emerald-300 transition-colors hover:bg-emerald-900/40 hover:border-emerald-500/60"
            >
              ${amount}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
