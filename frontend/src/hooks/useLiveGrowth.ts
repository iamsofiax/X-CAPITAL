"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  useProfitEngine,
  NodeGrowth,
  DEFAULT_DAILY_RATE,
  computeYield,
} from "@/store/useProfitEngine";
import { useStore } from "@/store/useStore";
import { useAccountStore } from "@/store/useAccountStore";
import { hasApiToken } from "@/lib/apiUser";
import {
  realCompound,
  projectCompoundVariance as varianceProjection,
  projectReturns as rateAwareProjectReturns,
} from "@/lib/compoundMath";
import { getNodeProgress } from "@/lib/nodeLadder";

export function projectCompound(
  principal: number,
  dailyRate: number,
  days: number,
): number {
  return realCompound(principal, dailyRate, days);
}

export function projectCompoundVariance(principal: number, days: number): number {
  return varianceProjection(principal, DEFAULT_DAILY_RATE, days);
}

export function projectReturns(
  balance: number,
  days: number,
): { gross: number; netReturn: number; netPct: number } {
  return rateAwareProjectReturns(balance, DEFAULT_DAILY_RATE, days);
}

export function projectReturnsForNode(
  balance: number,
  days: number,
  _nodeId: string,
): { gross: number; netReturn: number; netPct: number } {
  const snapshot = useAccountStore.getState().snapshot;
  const dailyRate =
    snapshot && snapshot.yieldConfig.dailyRate > 0
      ? snapshot.yieldConfig.dailyRate
      : DEFAULT_DAILY_RATE;
  return rateAwareProjectReturns(balance, dailyRate, days);
}

export const COMPOUND_TICK_MS = 15_000;

export function resolveNodeDailyRate(
  _nodeId: string,
  user: {
    profitRate?: number;
    profitMultiplier?: number;
    balance?: number;
    nodeTier?: number;
    nodeGoal?: number;
    nextNodeRate?: number;
  } | null,
): number {
  const snapshot = useAccountStore.getState().snapshot;
  if (snapshot?.yieldConfig?.dailyRate > 0) {
    const multiplier = Math.max(0.1, snapshot.yieldConfig.profitMultiplier ?? 1);
    const balance = useAccountStore.getState().interpolatedCash;
    if (
      snapshot.yieldConfig.nodeGoal &&
      snapshot.yieldConfig.nodeGoal > 0 &&
      snapshot.yieldConfig.nextNodeRate &&
      snapshot.yieldConfig.nextNodeRate > 0 &&
      balance >= snapshot.yieldConfig.nodeGoal
    ) {
      return Math.min(0.15, snapshot.yieldConfig.nextNodeRate / 100);
    }
    return Math.min(0.15, snapshot.yieldConfig.dailyRate * multiplier);
  }

  const balance = Math.max(0, Number(user?.balance ?? 0));
  if (
    user &&
    typeof user.nodeGoal === "number" &&
    user.nodeGoal > 0 &&
    typeof user.nextNodeRate === "number" &&
    user.nextNodeRate > 0 &&
    balance >= user.nodeGoal
  ) {
    return Math.min(0.15, user.nextNodeRate / 100);
  }
  if (user && user.profitRate != null && user.profitRate > 0) {
    const multiplier = Math.max(0.1, user.profitMultiplier ?? 1);
    return Math.min(0.15, (user.profitRate / 100) * multiplier);
  }
  const { current } = getNodeProgress(balance, user);
  return current.dailyRatePct / 100;
}

/** Catch-up is server-side. Kept as a no-op so existing callers compile. */
export function catchUpMissedCompounds(_nodeId: string): NodeGrowth | null {
  return null;
}

/**
 * Instrument panel: hydrates Accrual Core snapshots and interpolates cash
 * between polls so the readout never sits still. Never writes the ledger.
 */
export function useLiveGrowth() {
  const user = useStore((s) => s.user);
  const snapshot = useAccountStore((s) => s.snapshot);
  const interpolatedCash = useAccountStore((s) => s.interpolatedCash);
  const displayNav = useAccountStore((s) => s.displayNav);
  const fetchSnapshot = useAccountStore((s) => s.fetchSnapshot);
  const interpolate = useAccountStore((s) => s.interpolate);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const interpRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!user) {
      useAccountStore.getState().reset();
      return;
    }
    useProfitEngine.getState().setActiveUser(user.id);
  }, [user?.id, user]);

  useEffect(() => {
    if (!user || !hasApiToken()) return;

    const run = () => {
      if (document.hidden) return;
      void fetchSnapshot().then((snap) => {
        if (!snap) return;
        const cash = useAccountStore.getState().interpolatedCash;
        const store = useStore.getState();
        if (store.wallet) {
          store.setWallet({ ...store.wallet, fiatBalance: cash });
        } else {
          store.setWallet({
            id: snap.wallet.id,
            fiatBalance: cash,
            cryptoBalance: snap.wallet.cryptoBalance,
            lockedBalance: snap.wallet.lockedBalance,
            walletAddress: snap.wallet.walletAddress ?? undefined,
          });
        }
        store.updateUser({
          balance: cash,
          profitRate: snap.yieldConfig.profitRate,
          profitMode: snap.yieldConfig.profitMode,
          profitMultiplier: snap.yieldConfig.profitMultiplier,
          profitHold: snap.yieldConfig.profitHold,
          nodeGoal: snap.yieldConfig.nodeGoal ?? undefined,
          nextNodeRate: snap.yieldConfig.nextNodeRate ?? undefined,
        });
      });
    };

    void run();
    intervalRef.current = setInterval(run, COMPOUND_TICK_MS);
    const onVisible = () => {
      if (!document.hidden) void run();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [user?.id, fetchSnapshot, user]);

  useEffect(() => {
    if (!snapshot) return;
    interpolate();
    interpRef.current = setInterval(interpolate, 1000);
    return () => {
      if (interpRef.current) clearInterval(interpRef.current);
      interpRef.current = null;
    };
  }, [snapshot, interpolate]);

  const dailyRate = snapshot?.yieldConfig.dailyRate ?? DEFAULT_DAILY_RATE;
  const growth: NodeGrowth | undefined = useMemo(() => {
    if (!user) return undefined;
    return {
      nodeId: user.id,
      balance: interpolatedCash,
      dailyRate,
      lastCompoundAt: snapshot?.wallet.lastAccruedAt ?? new Date().toISOString(),
      compoundCount: 0,
      totalYieldGenerated: snapshot?.wallet.totalYieldGenerated ?? 0,
      profitMode: snapshot?.yieldConfig.profitMode ?? "compound",
    };
  }, [user, interpolatedCash, dailyRate, snapshot]);

  return {
    growth,
    balance: interpolatedCash,
    nav: displayNav,
    nodeId: user?.id ?? "anon",
    isCompounding:
      interpolatedCash > 0 && !snapshot?.yieldConfig.profitHold,
    nodeGrowth: growth,
  };
}

export { computeYield };
