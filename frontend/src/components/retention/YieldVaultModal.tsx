'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, Flame, TrendingUp, ShieldCheck, Zap, Clock } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useStreakStore } from '@/store/useStreakStore';
import { TOP_UP_BOOSTS } from '@/lib/compoundMath';

interface YieldVaultModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  balance: number;
  dailyRate: number;
  onConfirmWithdrawal: () => void;
}

/**
 * "Yield Maturity Milestone" withdrawal gate — loss-aversion modal.
 *
 * Instead of framing the withdrawal with an X-to-close warning, presents the
 * EXACT projected returns the user forfeits over the next 30 days plus the
 * streak level + APY multipliers they lose. Behavioral intent: the fear of
 * losing a known number (vs. an abstract warning) dramatically reduces
 * withdrawal conversion.
 */
export default function YieldVaultModal({
  open,
  onClose,
  userId,
  balance,
  dailyRate,
  onConfirmWithdrawal,
}: YieldVaultModalProps) {
  const [now, setNow] = useState(() => Date.now());

  // Subscribe to the stable records slice; derive forfeiture inline so the
  // ticking `now` never triggers selector-identity re-render loops.
  useStreakStore((s) => s.records);
  const { getForfeitedProjection, getActiveBoosts } = useStreakStore.getState();

  // Keep the numbers live while the modal is open
  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [open]);

  const forfeited = getForfeitedProjection(userId, balance, dailyRate);
  const activeBoosts = getActiveBoosts(userId, now);

  const forfeited30d = forfeited?.lostYield30d ?? 0;
  const projected = forfeited?.projected30d ?? balance;
  const level = forfeited?.level ?? 1;
  const lostToday = useMemo(() => {
    // Approximate next-24h surrender.
    return Math.max(0, forfeited30d / 30);
  }, [forfeited30d]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Vault Maturity Gate"
      subtitle="You're about to leave the compounding engine"
      size="lg"
      disableBackdropClose
    >
      <div className="space-y-5">
        {/* Lost-opportunity banner — not a warning, a number */}
        <div className="rounded-2xl border border-emerald-800/30 bg-gradient-to-br from-emerald-950/30 via-black to-emerald-950/10 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-950/60 border border-emerald-800/40">
              <Flame className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-white">
                Estimated next 30 days
              </p>
              <p className="text-[10px] font-mono text-white/40">
                Continuously compounding at current admin rate
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-white/40">
                Projected balance · 30d
              </div>
              <div className="font-mono text-3xl font-black text-emerald-400 tabular-nums">
                {formatCurrency(projected)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-mono uppercase tracking-wider text-white/40">
                You forfeit
              </div>
              <div className="font-mono text-3xl font-black text-amber-400 tabular-nums">
                -{formatCurrency(forfeited30d)}
              </div>
            </div>
          </div>

          {/* Live 24h loss ticker */}
          {lostToday > 0 && (
            <div className="mt-3 flex items-center justify-between rounded-xl border border-amber-800/25 bg-amber-950/20 px-4 py-2.5">
              <span className="text-[11px] text-white/50">
                <span className="text-amber-400 font-bold">Waiting even a day</span> costs you roughly:
              </span>
              <span className="font-mono text-sm font-black text-amber-400 tabular-nums">
                -{formatCurrency(lostToday)}
              </span>
            </div>
          )}
        </div>

        {/* What you lose */}
        <div className="space-y-3">
          <p className="text-xs font-black uppercase tracking-wider text-white/70">
            Withdrawing now also forfeits
          </p>

          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-950/50 border border-emerald-800/30">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Compound Velocity Streak</p>
                <p className="text-[10px] text-white/40">
                  {level === 1
                    ? 'Level 1 — deposit to start building'
                    : `Level ${level} — back to Level 1 on withdrawal`}
                </p>
              </div>
            </div>
            <span className="font-mono text-sm font-black text-emerald-400">
              L{level}
            </span>
          </div>

          {/* Active APY multipliers */}
          {activeBoosts.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {activeBoosts.map((key) => {
                const b = TOP_UP_BOOSTS[key];
                return (
                  <span
                    key={key}
                    className="flex items-center gap-1.5 rounded-full border border-emerald-700/40 bg-emerald-950/30 px-3 py-1.5"
                  >
                    <Zap className="h-3 w-3 text-emerald-400" />
                    <span className="text-[10px] font-bold text-emerald-300">
                      {b.label}
                    </span>
                    <span className="text-[9px] font-mono text-emerald-400/70">
                      {b.multiplier}×
                    </span>
                  </span>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-xl border border-amber-800/20 bg-amber-950/10 px-4 py-3">
              <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
              <p className="text-[11px] text-white/50">
                No active APY multipliers. You will forfeit the{' '}
                <span className="text-emerald-400 font-bold">
                  {formatCurrency(forfeited30d)}
                </span>{' '}
                over the next 30 days.
              </p>
            </div>
          )}

          {/* Explicit lost-opportunity text */}
          {activeBoosts.length > 0 && (
            <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
              <p className="text-[11px] leading-relaxed text-white/50">
                Withdrawing now forfeits your{' '}
                {activeBoosts.length === 1 ? 'active yield boost' : 'active yield boosts'} and{' '}
                <span className="text-emerald-400 font-bold">
                  {formatCurrency(forfeited30d)}
                </span>{' '}
                in projected returns over the next 30 days.
              </p>
            </div>
          )}
        </div>

        {/* Loss-aversion note */}
        <div className="flex items-start gap-2 rounded-xl border border-emerald-900/20 bg-emerald-950/10 px-4 py-3">
          <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-white/40">
            Projected compound returns you would forfeit by withdrawing now — illustrative modelling, not a guarantee of principal.
          </p>
        </div>

        {/* Settlement queue — balances keep compounding while in queue */}
        <div className="flex items-center gap-3 rounded-xl border border-emerald-800/30 bg-black/40 px-4 py-3">
          <Clock className="h-4 w-4 text-emerald-400 shrink-0" />
          <div>
            <p className="text-[11px] font-bold text-white/70">
              Institutional settlement queue
            </p>
            <p className="text-[10px] text-white/40">
              Withdrawal requests settle in 1–2 business days. Your full balance keeps
              compounding at the daily rate while the request is in queue — then the
              streak resets on approval.
            </p>
          </div>
        </div>
      </div>

      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          Keep Compounding
        </Button>
        <Button
          variant="danger"
          onClick={() => {
            onConfirmWithdrawal();
            onClose();
          }}
        >
          Withdraw Anyway
        </Button>
      </ModalFooter>
    </Modal>
  );
}
