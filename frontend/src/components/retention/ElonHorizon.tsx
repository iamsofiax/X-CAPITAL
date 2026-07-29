'use client';

import React from 'react';
import { Rocket, Target, Star, Globe, Infinity } from 'lucide-react';
import { formatNumber } from '@/lib/utils';

interface ElonHorizonProps {
  projected90dValue: number;
}

interface Milestone {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  highlightColor: string;
}

const MILESTONES: Milestone[] = [
  {
    label: 'Freedom',
    value: 100_000,
    icon: <Rocket className="h-3.5 w-3.5" />,
    color: 'border-emerald-700 bg-emerald-950/50 text-emerald-400',
    highlightColor: 'border-emerald-400 bg-emerald-500 text-black',
  },
  {
    label: 'Legacy',
    value: 1_000_000,
    icon: <Star className="h-3.5 w-3.5" />,
    color: 'border-emerald-700 bg-emerald-950/50 text-emerald-400',
    highlightColor: 'border-emerald-400 bg-emerald-500 text-black',
  },
  {
    label: 'Starship',
    value: 10_000_000,
    icon: <Rocket className="h-3.5 w-3.5" />,
    color: 'border-emerald-700 bg-emerald-950/50 text-emerald-400',
    highlightColor: 'border-emerald-400 bg-emerald-500 text-black',
  },
  {
    label: 'Civilization',
    value: 100_000_000,
    icon: <Globe className="h-3.5 w-3.5" />,
    color: 'border-emerald-700 bg-emerald-950/50 text-emerald-400',
    highlightColor: 'border-emerald-400 bg-emerald-500 text-black',
  },
  {
    label: 'Type II',
    value: 1_000_000_000,
    icon: <Infinity className="h-3.5 w-3.5" />,
    color: 'border-emerald-700 bg-emerald-950/50 text-emerald-400',
    highlightColor: 'border-emerald-400 bg-emerald-500 text-black',
  },
];

function formatShort(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(0)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

export default function ElonHorizon({
  projected90dValue,
}: ElonHorizonProps) {
  const maxValue = MILESTONES[MILESTONES.length - 1].value;
  const progress = Math.min(projected90dValue / maxValue, 1);

  // Find which milestones the user has reached/passed
  const reachedMilestones = MILESTONES.filter(
    (m) => projected90dValue >= m.value,
  );
  const highestIndex = MILESTONES.findIndex(
    (m) => projected90dValue < m.value,
  );
  const activeIndex = highestIndex === -1 ? MILESTONES.length - 1 : highestIndex - 1;

  // Where each milestone sits as a percentage along the line
  const maxExponent = Math.log10(maxValue);
  const minExponent = Math.log10(MILESTONES[0].value);

  return (
    <div className="rounded-xl border border-emerald-900/50 bg-black p-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-950/50">
          <Target className="h-5 w-5 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white">
            Elon Horizon
          </h3>
          <p className="text-xs text-emerald-400/70">
            Your trajectory to civilization-scale wealth
          </p>
        </div>
      </div>

      {/* Current value */}
      <div className="mb-6 text-center">
        <span className="font-mono text-2xl font-black text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.1)]">
          {formatShort(projected90dValue)}
        </span>
        <span className="ml-2 text-xs text-white/30">projected 90d</span>
      </div>

      {/* Timeline */}
      <div className="relative mb-4">
        {/* Progress track background */}
        <div className="absolute left-0 right-0 top-1/2 h-0.5 -translate-y-1/2 bg-white/10" />

        {/* Filled progress */}
        <div
          className="absolute left-0 top-1/2 h-0.5 -translate-y-1/2 bg-gradient-to-r from-emerald-700 via-emerald-500 to-emerald-400 transition-all duration-1000 ease-out"
          style={{ width: `${progress * 100}%` }}
        />

        {/* Milestone dots */}
        <div className="relative flex justify-between">
          {MILESTONES.map((milestone, idx) => {
            const reached = projected90dValue >= milestone.value;
            const isHighest = idx === activeIndex && reached;

            return (
              <div key={milestone.label} className="flex flex-col items-center">
                {/* Dot */}
                <div
                  className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-500 ${
                    reached
                      ? 'border-emerald-400 bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                      : 'border-emerald-800/40 bg-black text-emerald-600/40'
                  }`}
                >
                  {milestone.icon}
                </div>

                {/* Value label */}
                <span
                  className={`mt-2 font-mono text-[10px] ${
                    reached ? 'font-bold text-emerald-400' : 'text-white/30'
                  }`}
                >
                  {formatShort(milestone.value)}
                </span>

                {/* Milestone name */}
                <span
                  className={`mt-0.5 text-[9px] uppercase tracking-wider ${
                    reached ? 'font-bold text-white' : 'text-white/20'
                  }`}
                >
                  {milestone.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reached milestones list */}
      {reachedMilestones.length > 0 && (
        <div className="mt-6 rounded-lg border border-emerald-900/20 bg-emerald-950/5 p-3">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-emerald-400/60">
            Milestones Reached
          </p>
          <div className="flex flex-wrap gap-2">
            {reachedMilestones.map((ms) => (
              <div
                key={ms.label}
                className="flex items-center gap-1.5 rounded-full border border-emerald-800/30 bg-emerald-950/30 px-2.5 py-1"
              >
                <span className="text-emerald-400">{ms.icon}</span>
                <span className="font-mono text-[10px] font-bold text-emerald-400">
                  {ms.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next milestone */}
      {activeIndex < MILESTONES.length - 1 && (
        <div className="mt-3 rounded-lg border border-white/5 bg-white/[0.02] p-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] text-white/30">Next milestone</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-white">
                  {MILESTONES[activeIndex + 1].label}
                </span>
                <span className="font-mono text-xs text-emerald-400/60">
                  {formatShort(MILESTONES[activeIndex + 1].value)}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-white/20">Gap</span>
              <div className="font-mono text-sm font-bold text-emerald-400">
                {formatShort(
                  MILESTONES[activeIndex + 1].value - projected90dValue,
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* All milestones reached */}
      {activeIndex === MILESTONES.length - 1 && (
        <div className="mt-3 rounded-lg border border-emerald-700/30 bg-emerald-950/20 p-3 text-center">
          <span className="font-mono text-xs font-bold text-emerald-400">
            🚀 All milestones achieved — civilization-scale trajectory!
          </span>
        </div>
      )}
    </div>
  );
}