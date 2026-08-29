'use client';

import React from 'react';
import { X, AlertTriangle, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface OpportunityCostVisualizerProps {
  currentBalance: number;
  dailyRate: number;
  onClose?: () => void;
}

function computeProjection(P: number, r: number, t: number): number {
  return P * Math.pow(1 + r, t);
}

const PERIODS = [
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
  { label: '365d', days: 365 },
] as const;

export default function OpportunityCostVisualizer({
  currentBalance,
  dailyRate,
  onClose,
}: OpportunityCostVisualizerProps) {
  const withdrawals = [currentBalance * 0.25, currentBalance * 0.5, currentBalance * 0.75, currentBalance];

  // Find the "most damaging" withdrawal scenario (full withdrawal)
  const fullWithdrawal = currentBalance;

  return (
    <div className="rounded-xl border border-emerald-900/50 bg-[#08080c] p-6 shadow-[0_0_30px_rgba(255,0,0,0.05)]">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-950/50">
            <AlertTriangle className="h-5 w-5 text-red-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              Opportunity Cost
            </h3>
            <p className="text-xs text-red-400/70">
              What you lose by withdrawing now
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/40 transition-colors hover:border-white/30 hover:text-white/70"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Main warning message */}
      <div className="mb-5 rounded-lg border border-red-900/30 bg-red-950/10 p-4">
        <p className="text-sm leading-relaxed text-white/80">
          If you withdraw{' '}
          <span className="font-mono font-bold text-red-400">
            {formatCurrency(currentBalance)}
          </span>{' '}
          now, you forfeit the exponential gains those funds would have
          generated. Below is what that capital could have been worth.
        </p>
      </div>

      {/* Period columns */}
      <div className="grid grid-cols-3 gap-3">
        {PERIODS.map((period) => {
          const projectedLoss = computeProjection(
            fullWithdrawal,
            dailyRate,
            period.days,
          );
          const projectedGain = projectedLoss - fullWithdrawal;

          return (
            <div
              key={period.label}
              className="flex flex-col items-center rounded-lg border border-emerald-900/20 bg-emerald-950/10 p-3"
            >
              <span className="mb-1 font-mono text-xs font-bold text-white/40">
                {period.label}
              </span>
              <span className="font-mono text-lg font-black text-red-400">
                {formatCurrency(projectedLoss, true)}
              </span>
              <div className="mt-1 flex items-center gap-1">
                <TrendingDown className="h-3 w-3 text-red-400/60" />
                <span className="font-mono text-[10px] text-red-400/60">
                  -{formatCurrency(projectedGain, true)} gains
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Withdrawal amount selector */}
      <div className="mt-4">
        <p className="mb-2 text-[10px] font-medium text-white/30 uppercase tracking-wider">
          See cost at different withdrawal amounts
        </p>
        <div className="grid grid-cols-4 gap-2">
          {withdrawals.map((amount, idx) => {
            const loss30d = computeProjection(amount, dailyRate, 30);
            const loss365d = computeProjection(amount, dailyRate, 365);

            return (
              <div
                key={idx}
                className="rounded-lg border border-emerald-900/15 bg-emerald-950/5 p-2 text-center"
              >
                <span className="block font-mono text-[10px] text-white/40">
                  {idx === 3 ? '100%' : `${25 * (idx + 1)}%`}
                </span>
                <span className="block font-mono text-[9px] text-white/20">
                  {formatCurrency(amount, true)}
                </span>
                <div className="mt-1 border-t border-emerald-900/20 pt-1">
                  <span className="block font-mono text-[8px] text-red-400/60">
                    30d: {formatCurrency(loss30d, true)}
                  </span>
                  <span className="block font-mono text-[8px] text-red-400/40">
                    1y: {formatCurrency(loss365d, true)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}