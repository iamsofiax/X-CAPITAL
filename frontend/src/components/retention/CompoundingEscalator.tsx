'use client';

import React from 'react';
import { TrendingUp, ArrowRight, Plus } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface CompoundingEscalatorProps {
  currentBalance: number;
  dailyRate: number;
}

const ADDITIONS = [1000, 5000, 10000, 25000] as const;
const DAYS = 90;

function projectValue(P: number, r: number, t: number): number {
  return P * Math.pow(1 + r, t);
}

export default function CompoundingEscalator({
  currentBalance,
  dailyRate,
}: CompoundingEscalatorProps) {
  const baseProjection = projectValue(currentBalance, dailyRate, DAYS);

  return (
    <div className="rounded-xl border border-emerald-900/50 bg-[#08080c] p-6 shadow-[0_0_30px_rgba(16,185,129,0.04)]">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-950/50">
          <TrendingUp className="h-5 w-5 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white">
            Compounding Escalator
          </h3>
          <p className="text-xs text-emerald-400/70">
            See what happens when you add more capital
          </p>
        </div>
      </div>

      {/* Base projection */}
      <div className="mb-5 rounded-lg border border-emerald-900/20 bg-emerald-950/5 p-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/40">Current 90d projection</span>
          <span className="font-mono text-sm font-bold text-emerald-400">
            {formatCurrency(baseProjection)}
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between">
          <span className="text-xs text-white/20">Starting balance</span>
          <span className="font-mono text-xs text-white/40">
            {formatCurrency(currentBalance)}
          </span>
        </div>
      </div>

      {/* Escalator steps */}
      <div className="relative">
        {/* Vertical connector line */}
        <div className="absolute left-[11px] top-0 h-full w-px bg-gradient-to-b from-emerald-700/50 via-emerald-600/30 to-transparent" />

        <div className="space-y-3">
          {ADDITIONS.map((addition, idx) => {
            const newBalance = currentBalance + addition;
            const newProjection = projectValue(newBalance, dailyRate, DAYS);
            const difference = newProjection - baseProjection;
            const addedGain = newProjection - newBalance;
            const currentGain = baseProjection - currentBalance;
            const extraGain = addedGain - currentGain;

            return (
              <div key={idx} className="relative flex items-start gap-3 pl-7">
                {/* Step dot */}
                <div
                  className={`absolute left-0 top-1.5 flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 ${
                    idx < 2
                      ? 'border-emerald-500 bg-emerald-950'
                      : 'border-emerald-600/40 bg-emerald-950/30'
                  }`}
                >
                  <Plus className="h-3 w-3 text-emerald-400" />
                </div>

                {/* Content card */}
                <div className="flex-1 rounded-lg border border-emerald-900/15 bg-emerald-950/5 p-3 transition-colors hover:border-emerald-700/30 hover:bg-emerald-950/10">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-white">
                      +{formatCurrency(addition)}
                    </span>
                    <ArrowRight className="h-3 w-3 text-emerald-500/60" />
                    <span className="font-mono text-xs text-white/40">
                      {formatCurrency(newBalance)} total
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-2 overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-1.5 rounded-full bg-gradient-to-r from-emerald-700 to-emerald-400 transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          ((newProjection - baseProjection) / baseProjection) * 100 + 100,
                          100,
                        )}%`,
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-white/30">
                      New 90d projection
                    </span>
                    <span className="font-mono font-bold text-emerald-400">
                      {formatCurrency(newProjection)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-white/20">
                      vs current projection
                    </span>
                    <span className="font-mono text-emerald-400/70">
                      +{formatCurrency(difference)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-white/15">
                      Extra compounding gains
                    </span>
                    <span className="font-mono text-emerald-400/50">
                      +{formatCurrency(extraGain)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer note */}
      <p className="mt-4 text-center text-[10px] text-white/20">
        Based on 90-day continuous compounding at {(dailyRate * 100).toFixed(2)}%/day
      </p>
    </div>
  );
}
