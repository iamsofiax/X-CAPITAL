'use client';

import React from 'react';
import { Trophy, Zap, Clock, Scale, TrendingDown } from 'lucide-react';
import { formatNumber } from '@/lib/utils';

interface NextCivilizationScoreProps {
  daysSinceFirstDeposit: number;
  completedDeposits: number;
  totalDeployed: number;
}

function computeScore(
  days: number,
  deposits: number,
  deployed: number,
): number {
  const longevity = days * 2;
  const velocity = deposits * 12;
  const scale = deployed / 1000;
  // Impatience penalty: if fewer deposits relative to days, penalize
  const expectedDeposits = Math.max(1, Math.floor(days / 7));
  const impatienceRatio = deposits / expectedDeposits;
  const impatiencePenalty = impatienceRatio < 1 ? (1 - impatienceRatio) * 150 : 0;

  const raw = longevity + velocity + scale - impatiencePenalty;
  return Math.max(0, Math.min(1000, Math.round(raw)));
}

function getPercentile(score: number): string {
  // Thresholds calibrated for 0-1000 scale
  if (score >= 950) return 'Top 1%';
  if (score >= 850) return 'Top 5%';
  if (score >= 700) return 'Top 10%';
  if (score >= 500) return 'Top 25%';
  if (score >= 300) return 'Top 50%';
  return 'Bottom 50%';
}

function getBadgeColor(score: number): string {
  if (score >= 850) return 'border-emerald-500 text-emerald-400 bg-emerald-950/30';
  if (score >= 500) return 'border-emerald-600 text-emerald-300 bg-emerald-950/20';
  if (score >= 300) return 'border-yellow-600 text-yellow-300 bg-yellow-950/20';
  return 'border-red-700 text-red-400 bg-red-950/20';
}

function getScoreColor(score: number): string {
  if (score >= 850) return 'text-emerald-400';
  if (score >= 500) return 'text-emerald-300';
  if (score >= 300) return 'text-yellow-300';
  return 'text-red-400';
}

export default function NextCivilizationScore({
  daysSinceFirstDeposit,
  completedDeposits,
  totalDeployed,
}: NextCivilizationScoreProps) {
  const score = computeScore(daysSinceFirstDeposit, completedDeposits, totalDeployed);
  const percentile = getPercentile(score);
  const badgeColor = getBadgeColor(score);
  const scoreColor = getScoreColor(score);

  const longevityPts = daysSinceFirstDeposit * 2;
  const velocityPts = completedDeposits * 12;
  const scalePts = Math.round(totalDeployed / 1000);
  const expectedDeposits = Math.max(1, Math.floor(daysSinceFirstDeposit / 7));
  const impatienceRatio = completedDeposits / expectedDeposits;
  const impatiencePenalty = impatienceRatio < 1 ? Math.round((1 - impatienceRatio) * 150) : 0;

  return (
    <div className="rounded-xl border border-emerald-900/50 bg-black p-6">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-950/50">
            <Trophy className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              Next Civilization Score
            </h3>
            <p className="text-xs text-emerald-400/70">
              Your capital evolution rating
            </p>
          </div>
        </div>
        {/* Percentile badge */}
        <div
          className={`rounded-lg border px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider ${badgeColor}`}
        >
          {percentile}
        </div>
      </div>

      {/* Large score display */}
      <div className="mb-6 text-center">
        <div
          className={`font-mono text-6xl font-black tracking-tight ${scoreColor} drop-shadow-[0_0_15px_rgba(16,185,129,0.15)]`}
        >
          {score}
        </div>
        <div className="mt-1 text-[10px] uppercase tracking-widest text-white/20">
          out of 1000
        </div>
      </div>

      {/* Score breakdown */}
      <div className="space-y-2">
        {/* Longevity */}
        <div className="flex items-center justify-between rounded-lg border border-emerald-900/15 bg-emerald-950/5 px-3 py-2">
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-emerald-500/60" />
            <span className="text-xs text-white/60">Longevity</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-white/40">
              {daysSinceFirstDeposit}d × 2
            </span>
            <span className="font-mono text-xs font-bold text-emerald-400">
              +{longevityPts}
            </span>
          </div>
        </div>

        {/* Velocity */}
        <div className="flex items-center justify-between rounded-lg border border-emerald-900/15 bg-emerald-950/5 px-3 py-2">
          <div className="flex items-center gap-2">
            <Zap className="h-3.5 w-3.5 text-emerald-500/60" />
            <span className="text-xs text-white/60">Velocity</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-white/40">
              {completedDeposits} dep × 12
            </span>
            <span className="font-mono text-xs font-bold text-emerald-400">
              +{velocityPts}
            </span>
          </div>
        </div>

        {/* Scale */}
        <div className="flex items-center justify-between rounded-lg border border-emerald-900/15 bg-emerald-950/5 px-3 py-2">
          <div className="flex items-center gap-2">
            <Scale className="h-3.5 w-3.5 text-emerald-500/60" />
            <span className="text-xs text-white/60">Scale</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-white/40">
              ${formatNumber(totalDeployed)} / 1000
            </span>
            <span className="font-mono text-xs font-bold text-emerald-400">
              +{scalePts}
            </span>
          </div>
        </div>

        {/* Impatience penalty (if any) */}
        {impatiencePenalty > 0 && (
          <div className="flex items-center justify-between rounded-lg border border-red-900/20 bg-red-950/10 px-3 py-2">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-3.5 w-3.5 text-red-400/60" />
              <span className="text-xs text-white/60">Impatience Penalty</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-red-400">
                -{impatiencePenalty}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}