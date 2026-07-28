"use client";

import { useEffect, useRef, useCallback } from "react";
import { useProfitEngine } from "@/store/useProfitEngine";
import { useStore } from "@/store/useStore";

/**
 * REAL COMPOUND MATH — A = P(1 + r)^t
 */
export function projectCompound(
  principal: number,
  dailyRate: number,
  days: number,
): number {
  return principal * Math.pow(1 + dailyRate, days);
}

/**
 * Deterministic daily variance seeds — ~25% of days have slight drawdowns
 * for institutional credibility, but net trend is strongly positive.
 */
const DAILY_VARIANCE: number[] = [
  1.015, 1.022, 0.997, 1.018, 1.024, 0.998, 1.016, 1.021, 1.013, 0.996,
  1.019, 1.025, 1.012, 1.017, 0.995, 1.023, 1.014, 1.020, 0.999, 1.026,
  1.011, 1.018, 1.022, 1.015, 0.997, 1.024, 1.016, 1.013, 1.021, 1.019,
  1.010, 1.023, 1.017, 1.014, 0.998, 1.020, 1.025, 1.012, 1.018, 1.016,
];

function getDailyFactor(daysElapsed: number): number {
  return DAILY_VARIANCE[daysElapsed % DAILY_VARIANCE.length];
}

/** Compound with realistic daily variance */
export function projectCompoundVariance(principal: number, days: number): number {
  let value = principal;
  for (let i = 0; i < days; i++) {
    value *= getDailyFactor(days - i);
  }
  return value;
}

/** Deterministic projection with net return and percentage */
export function projectReturns(
  balance: number,
  days: number,
): { gross: number; netReturn: number; netPct: number } {
  if (balance <= 0 || days <= 0) {
    return { gross: 0, netReturn: 0, netPct: 0 };
  }
  const projected = projectCompoundVariance(balance, days);
  const netReturn = projected - balance;
  const netPct = (netReturn / balance) * 100;
  return { gross: projected, netReturn, netPct };
}

/**
 * Live compounding hook — initialises the profit engine node, ticks
 * every 60s, and syncs growth back to the main store wallet.
 *
 * Call once per dashboard session.
 */
export function useLiveGrowth() {
  const user = useStore((s) => s.user);
  const wallet = useStore((s) => s.wallet);
  const { initNode, tickCompound, nodeGrowths } = useProfitEngine();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const nodeId = user?.id ?? "anon";
  const balance = Number(wallet?.fiatBalance ?? user?.balance ?? 0);
  const growth = nodeGrowths[nodeId];

  // Sync profit engine growth back to main store wallet
  const syncGrowthToWallet = useCallback((nid: string) => {
    const g = useProfitEngine.getState().nodeGrowths[nid];
    if (!g || g.balance <= 0) return;
    const storeState = useStore.getState();
    const currentWallet = storeState.wallet;
    if (!currentWallet) return;
    const diff = Math.abs(g.balance - currentWallet.fiatBalance);
    if (diff < 0.01) return;
    useStore.getState().setWallet({
      ...currentWallet,
      fiatBalance: g.balance,
    });
  }, []);

  // Initialise node and start ticking
  useEffect(() => {
    if (!user || balance <= 0) return;

    const avgDailyRate =
      DAILY_VARIANCE.reduce((a, b) => a + b, 0) / DAILY_VARIANCE.length - 1;
    initNode(nodeId, balance, avgDailyRate);

    if (!intervalRef.current) {
      tickCompound(nodeId);
      intervalRef.current = setInterval(() => {
        const updated = tickCompound(nodeId);
        if (updated) {
          syncGrowthToWallet(nodeId);
        }
      }, 60_000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [nodeId, balance > 0, initNode, tickCompound, syncGrowthToWallet]);

  // Re-init if balance changes significantly
  useEffect(() => {
    if (!growth || balance === growth.balance) return;
    const diff = Math.abs(balance - growth.balance);
    if (diff > 1) {
      initNode(nodeId, balance, growth.dailyRate);
    }
  }, [balance, growth, initNode, nodeId]);

  return {
    growth,
    balance,
    nodeId,
    isCompounding: balance > 0 && !!growth,
    nodeGrowth: growth,
  };
}
