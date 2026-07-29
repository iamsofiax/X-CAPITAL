"use client";

import { useEffect, useRef, useCallback } from "react";
import { useProfitEngine, NodeGrowth, LiveTxBreakdown } from "@/store/useProfitEngine";
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
 * Catch up all missed compound ticks since the last recorded compound.
 *
 * Reads the ProfitEngine store directly (non-hook context via getState())
 * so it can be called from anywhere — inside useLiveGrowth, or from other
 * components that need to catch up a specific node on mount.
 *
 * @param nodeId - The profit engine node to catch up.
 * @returns The updated NodeGrowth, or null if the node doesn't exist.
 */
export function catchUpMissedCompounds(nodeId: string): NodeGrowth | null {
  const state = useProfitEngine.getState();
  const node = state.nodeGrowths[nodeId];
  if (!node || node.balance <= 0) return null;

  const now = Date.now();
  const last = new Date(node.lastCompoundAt).getTime();
  const elapsedHours = Math.max(0, (now - last) / (1000 * 60 * 60));

  // No catch‑up needed if less than one hour has passed
  if (elapsedHours < 1) return node;

  // Apply the real compound formula across the entire missed period
  const dailyRate = node.dailyRate;
  const compoundFactor = Math.pow(1 + dailyRate, elapsedHours / 24);
  const rawBalance = node.balance * compoundFactor;
  const rawYield = rawBalance - node.balance;

  // Apply any active bullish spike for this node
  const spike = state.bullishSpikes.find(
    (s) => s.targetUserId === nodeId && s.active,
  );
  const spikeMultiplier = spike ? 1 + spike.percentage / 100 : 1;
  const finalBalance = node.balance + rawYield * spikeMultiplier;
  const finalYield = rawYield * spikeMultiplier;

  const updated: NodeGrowth = {
    ...node,
    balance: finalBalance,
    lastCompoundAt: new Date().toISOString(),
    compoundCount: node.compoundCount + 1,
    totalYieldGenerated: node.totalYieldGenerated + finalYield,
  };

  const tx: LiveTxBreakdown = {
    id: `catchup-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    time: new Date().toISOString(),
    type: "PROFIT",
    amount: finalYield,
    balanceAfter: finalBalance,
    source: "catch-up",
  };

  useProfitEngine.setState((s) => ({
    nodeGrowths: { ...s.nodeGrowths, [nodeId]: updated },
    txBreakdown: [tx, ...s.txBreakdown].slice(0, 500),
  }));

  return updated;
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

  // Initialise node, catch up missed compounds, and start ticking
  useEffect(() => {
    if (!user || balance <= 0) return;

    const avgDailyRate =
      DAILY_VARIANCE.reduce((a, b) => a + b, 0) / DAILY_VARIANCE.length - 1;
    initNode(nodeId, balance, avgDailyRate);

    // ── Catch up any missed compounds since last visit ──────────────
    // This runs before the interval so the balance is correct instantly
    // when the user returns to the tab after hours away.
    const caughtUp = catchUpMissedCompounds(nodeId);
    if (caughtUp) {
      syncGrowthToWallet(nodeId);
    }

    // ── Start the ongoing 60s compounding interval ──────────────────
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