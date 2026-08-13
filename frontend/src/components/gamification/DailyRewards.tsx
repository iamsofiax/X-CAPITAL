'use client';

import React, { useEffect, useState } from 'react';
import { Check, RefreshCcw, ShieldCheck, Satellite, Activity, FlaskConical, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useDailyRewards,
  DAILY_REWARD_STEPS,
  STEP_META,
} from '@/store/useDailyRewards';
import type { DailyRewardStep } from '@/store/useDailyRewards';
import { formatCountdown } from '@/store/useStreakStore';

interface DailyRewardsProps {
  userId: string;
  onTopUp?: () => void;
}

const STEP_ICONS: Record<DailyRewardStep, React.ReactNode> = {
  syncGroundStation: <Satellite className="h-4 w-4" />,
  verifyMarketSignals: <Activity className="h-4 w-4" />,
  claimLiquidity: <FlaskConical className="h-4 w-4" />,
};

/**
 * Daily Telemetry Calibration — click-to-earn module.
 *
 * Guides the user through the systematic three-step sequence and rewards them
 * with a Daily Reward Tier. Skipping 24h drops the tier; a top-up instantly
 * restores + protects the streak for 72h (Streak Shield).
 */
export default function DailyRewards({ userId, onTopUp }: DailyRewardsProps) {
  const [now, setNow] = useState(() => Date.now());

  // Subscribe to the stable `records` slice only; derived values are computed
  // inline with the live `now` so the 1s tick never triggers selector loops.
  useDailyRewards((s) => s.records);
  const { completeStep, getStepState, getTierProgress } =
    useDailyRewards.getState();

  // Live countdown for streak shield + per-step clock
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const tierProgress = getTierProgress(userId, now);
  const stepStates = DAILY_REWARD_STEPS.map((step) =>
    getStepState(userId, step, now),
  );

  const handleComplete = (step: DailyRewardStep) => {
    completeStep(userId, step);
    setNow(Date.now());
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-black p-5">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-950/60 border border-emerald-800/40">
            <RefreshCcw className="h-4 w-4 text-emerald-400" />
          </div>
          <div>
            <p className="text-xs font-black text-white uppercase tracking-wider">
              Daily Telemetry Calibration
            </p>
            <p className="text-[10px] font-mono text-emerald-400/70">
              Click-to-earn · systemic daily rewards
            </p>
          </div>
        </div>

        {/* Daily Reward Tier badge */}
        <div className="flex items-center gap-2">
          <div className="rounded-lg border border-emerald-800/30 bg-emerald-950/30 px-2.5 py-1 text-right">
            <div className="text-[9px] font-mono uppercase text-emerald-400/60">
              Reward Tier
            </div>
            <div className="font-mono text-lg font-black text-emerald-400 leading-none">
              T{tierProgress.tier}
            </div>
          </div>
        </div>
      </div>

      {/* Streak shield status */}
      <div className="mb-4 flex items-center justify-between rounded-xl border border-amber-800/20 bg-amber-950/10 px-3 py-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
          <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400/90">
            {tierProgress.streakProtected ? 'Streak Shield Active' : 'Streak Shield Inactive'}
          </span>
        </div>
        {tierProgress.streakProtected ? (
          <span className="font-mono text-xs font-bold text-amber-400 tabular-nums">
            {formatCountdown(tierProgress.protectionRemainingMs)}
          </span>
        ) : (
          <button
            onClick={onTopUp}
            className="rounded-lg border border-amber-700/40 bg-amber-950/30 px-2.5 py-1 text-[10px] font-bold text-amber-300 transition-colors hover:bg-amber-900/40"
          >
            Top-up to shield
          </button>
        )}
      </div>

      {/* Three-step sequence */}
      <div className="space-y-2.5">
        {DAILY_REWARD_STEPS.map((step, idx) => {
          const state = stepStates[idx];
          const meta = STEP_META[step];
          const isLast = idx === DAILY_REWARD_STEPS.length - 1;
          // Sequential unlock: the first step is always available, later
          // steps unlock once the previous step is completed TODAY.
          const isLocked =
            !isLast && idx > 0 && !stepStates[idx - 1]?.completed;

          return (
            <div key={step} className="relative">
              {!isLast && (
                <div className="absolute left-[17px] top-9 bottom-[-11px] w-px bg-white/10" />
              )}
              <button
                onClick={() => !isLocked && handleComplete(step)}
                disabled={isLocked}
                className={cn(
                  'relative flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all',
                  state?.completed
                    ? 'border-emerald-700/40 bg-emerald-950/20'
                    : isLocked
                      ? 'border-white/5 bg-white/[0.01] opacity-50 cursor-not-allowed'
                      : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]',
                )}
              >
                {/* Step icon */}
                <div
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border',
                    state?.completed
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                      : isLocked
                        ? 'bg-white/[0.02] border-white/10 text-white/20'
                        : 'bg-white/[0.03] border-white/10 text-white/40',
                  )}
                >
                  {state?.completed ? (
                    <Check className="h-4 w-4" />
                  ) : isLocked ? (
                    <Lock className="h-3.5 w-3.5" />
                  ) : (
                    STEP_ICONS[step]
                  )}
                </div>

                {/* Step label */}
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      'text-sm font-bold',
                      state?.completed ? 'text-emerald-300' : 'text-white',
                    )}
                  >
                    {meta.label}
                  </p>
                  <p className="text-[10px] font-mono text-white/30">
                    {idx + 1} / {DAILY_REWARD_STEPS.length} · {meta.short}
                  </p>
                </div>

                {/* Step status */}
                <div
                  className={cn(
                    'shrink-0 rounded-lg px-2.5 py-1 text-[9px] font-mono',
                    state?.completed
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : isLocked
                        ? 'bg-white/[0.02] text-white/20'
                        : 'bg-emerald-950/30 text-emerald-400/80',
                  )}
                >
                  {state?.completed ? 'DONE' : isLocked ? 'LOCKED' : 'TAP TO RUN'}
                </div>
              </button>
            </div>
          );
        })}
      </div>

      {/* Daily liquidity claim CTA */}
      {!tierProgress.allClaimedToday ? (
        <div className="mt-4 rounded-xl border border-emerald-800/30 bg-gradient-to-r from-emerald-950/30 to-black p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-white">
                {tierProgress.completedSteps}/{tierProgress.totalSteps} steps complete
              </p>
              <p className="text-[10px] text-white/40">
                Complete all three to unlock your Daily Liquidity Allocation
              </p>
            </div>
            <span className="font-mono text-lg font-black text-emerald-400">
              {Math.round(
                (tierProgress.completedSteps / tierProgress.totalSteps) * 100,
              )}
              %
            </span>
          </div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-700 to-emerald-400 transition-all duration-700"
              style={{
                width: `${Math.round(
                  (tierProgress.completedSteps / tierProgress.totalSteps) * 100,
                )}%`,
              }}
            />
          </div>
        </div>
      ) : (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-600/40 bg-emerald-500/10 px-4 py-3">
          <Check className="h-4 w-4 text-emerald-400" />
          <span className="text-xs font-bold text-emerald-300">
            Daily Liquidity Allocation claimed — Tier {tierProgress.tier} locked
          </span>
        </div>
      )}
    </div>
  );
}
