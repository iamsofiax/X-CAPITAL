"use client";

import { useEffect, useRef } from "react";
import { useProfitEngine } from "@/store/useProfitEngine";
import { useStore } from "@/store/useStore";

/**
 * Live compounding hook — initialises the profit engine node for the current user
 * and ticks compound every 60 seconds so growth is visible in real-time.
 *
 * Call once in DashboardLayout or the Overview page.
 */
export function useLiveGrowth() {
  const user = useStore((s) => s.user);
  const wallet = useStore((s) => s.wallet);
  const { initNode, tickCompound, nodeGrowths } = useProfitEngine();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const nodeId = user?.id ?? "anon";
  const balance = Number(wallet?.fiatBalance ?? user?.balance ?? 0);
  const growth = nodeGrowths[nodeId];

  // Initialise node and start ticking
  useEffect(() => {
    if (!user || balance <= 0) return;

    initNode(nodeId, balance);

    // Tick every 60s for live compounding
    if (!intervalRef.current) {
      tickCompound(nodeId); // first tick immediately
      intervalRef.current = setInterval(() => {
        tickCompound(nodeId);
      }, 60_000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [nodeId, balance > 0]);

  // Re-init if balance changes significantly (capital injection detected)
  useEffect(() => {
    if (!growth || balance === growth.balance) return;
    const diff = Math.abs(balance - growth.balance);
    if (diff > 1) {
      initNode(nodeId, balance, growth.dailyRate);
    }
  }, [balance]);

  return {
    growth,
    balance,
    nodeId,
    isCompounding: balance > 0 && !!growth,
  };
}

/**
 * REAL COMPOUND MATH — A = P(1 + r)^t
 * Pure function, no hook deps. Safe to call anywhere.
 */
export function projectCompound(principal: number, dailyRate: number, days: number): number {
  return principal * Math.pow(1 + dailyRate, days);
}
