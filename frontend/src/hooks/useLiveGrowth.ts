"use client";

import { useEffect, useRef, useCallback } from "react";
import {
  useProfitEngine,
  NodeGrowth,
  LiveTxBreakdown,
  DEFAULT_DAILY_RATE,
} from "@/store/useProfitEngine";
import { useStore } from "@/store/useStore";
import { mergeUserFromRegistry } from "@/lib/mergeSessionUser";
import {
  realCompound,
  projectCompoundVariance as varianceProjection,
  projectReturns as rateAwareProjectReturns,
} from "@/lib/compoundMath";

/**
 * REAL COMPOUND MATH — A = P(1 + r)^t
 * Single source of truth lives in @/lib/compoundMath — these re-exports keep
 * the original hook API stable for existing callers.
 */
export function projectCompound(
  principal: number,
  dailyRate: number,
  days: number,
): number {
  return realCompound(principal, dailyRate, days);
}

/** Compound with realistic daily variance (admin-rate aware). */
export function projectCompoundVariance(principal: number, days: number): number {
  return varianceProjection(principal, DEFAULT_DAILY_RATE, days);
}

/** Deterministic projection with net return and percentage. */
export function projectReturns(
  balance: number,
  days: number,
): { gross: number; netReturn: number; netPct: number } {
  return rateAwareProjectReturns(balance, DEFAULT_DAILY_RATE, days);
}

/**
 * Rate-aware projection helper used by the dashboard's Capital Uplink.
 * Falls back to the live node rate (which already absorbs admin overrides).
 */
export function projectReturnsForNode(
  balance: number,
  days: number,
  nodeId: string,
): { gross: number; netReturn: number; netPct: number } {
  const state = useProfitEngine.getState();
  const node = state.nodeGrowths[nodeId];
  const dailyRate = node && node.dailyRate > 0 ? node.dailyRate : DEFAULT_DAILY_RATE;
  return rateAwareProjectReturns(balance, dailyRate, days);
}

/** Tick interval — steady, slow, but visibly alive */
export const COMPOUND_TICK_MS = 15_000;

/**
 * Resolve the effective daily rate for a node.
 *
 * Single source of truth, in priority order:
 * 1. Admin bullish-spike admin override via rateOverrides (already applied to the node)
 * 2. Admin per-user profitRate × profitMultiplier
 * 3. Node rate already recorded
 * 4. Base default 1.5%
 */
export function resolveNodeDailyRate(
  nodeId: string,
  user: { profitRate?: number; profitMultiplier?: number } | null,
): number {
  const state = useProfitEngine.getState();
  const override = state.rateOverrides[nodeId];
  if (override != null && override > 0) return override;

  const node = state.nodeGrowths[nodeId];
  if (node && node.dailyRate > 0) return node.dailyRate;

  if (user && user.profitRate != null && user.profitRate > 0) {
    const multiplier = Math.max(0.1, user.profitMultiplier ?? 1);
    return (user.profitRate / 100) * multiplier;
  }

  return DEFAULT_DAILY_RATE;
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

  // No catch‑up needed if less than one tick has passed
  if (elapsedHours < COMPOUND_TICK_MS / (1000 * 60 * 60)) return node;

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
    accruedPending: 0,
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
 * every 15s, and syncs growth back to the main store wallet.
 *
 * Call once per dashboard session.
 */
export function useLiveGrowth() {
  const user = useStore((s) => s.user);
  const registeredUsers = useStore((s) => s.registeredUsers);
  const wallet = useStore((s) => s.wallet);
  const { initNode, resetNode, tickCompound, hydrateDeposit, nodeGrowths } =
    useProfitEngine();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Merged session user (admin edits flow through automatically)
  const mergedUser = user ? mergeUserFromRegistry(user, registeredUsers) : null;

  const nodeId = user?.id ?? "anon";
  const balance = Number(wallet?.fiatBalance ?? mergedUser?.balance ?? 0);
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

    const dailyRate = resolveNodeDailyRate(nodeId, mergedUser);
    if (!useProfitEngine.getState().nodeGrowths[nodeId]) {
      initNode(nodeId, balance, dailyRate);
    }

    // ── Catch up any missed compounds since last visit ──────────────
    const caughtUp = catchUpMissedCompounds(nodeId);
    if (caughtUp) {
      syncGrowthToWallet(nodeId);
    }

    // ── Start the ongoing 15s compounding interval ──────────────────
    if (!intervalRef.current) {
      tickCompound(nodeId);
      intervalRef.current = setInterval(() => {
        const updated = tickCompound(nodeId);
        if (updated) {
          syncGrowthToWallet(nodeId);
        }
      }, COMPOUND_TICK_MS);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [nodeId, balance > 0, initNode, tickCompound, syncGrowthToWallet, mergedUser]);

  // Re-init if balance changes significantly (e.g. admin funded)
  useEffect(() => {
    if (!growth || balance === growth.balance) return;
    const diff = Math.abs(balance - growth.balance);
    if (diff > 1) {
      if (balance > growth.balance) {
        // Funds were added — hydrate the node instantly + emit DEPOSIT tx
        hydrateDeposit(nodeId, balance, balance - growth.balance);
        syncGrowthToWallet(nodeId);
      } else {
        resetNode(nodeId, balance);
      }
    }
  }, [balance, growth, hydrateDeposit, resetNode, nodeId, syncGrowthToWallet]);

  return {
    growth,
    balance,
    nodeId,
    isCompounding: balance > 0 && !!growth,
    nodeGrowth: growth,
  };
}
