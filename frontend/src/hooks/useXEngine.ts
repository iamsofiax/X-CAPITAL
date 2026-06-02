"use client";

import { useMemo } from "react";
import { useStore } from "@/store/useStore";
import {
  resolveNodePhase,
  canAccessRail,
  railLockReason,
  phaseFeedLine,
  nodeIdFromToken,
  type NodePhase,
  type EngineRail,
  PHASE_LABEL,
} from "@/lib/xEngine";

export function useXEngine() {
  const {
    user,
    wallet,
    accessToken,
    pendingTransactions,
    adminAlerts,
  } = useStore();

  const balance = Number(wallet?.fiatBalance ?? user?.balance ?? 0);

  const pendingCapital = useMemo(
    () =>
      pendingTransactions.filter(
        (t) =>
          t.userId === user?.id &&
          t.status === "PENDING" &&
          (t.type === "DEPOSIT" ||
            t.type === "WITHDRAWAL" ||
            t.type === "FUND_INVEST"),
      ),
    [pendingTransactions, user?.id],
  );

  const detectingSignal = useMemo(
    () =>
      adminAlerts.some(
        (a) =>
          a.userId === user?.id &&
          a.status === "PENDING" &&
          a.metadata?.stage === "DETECTED",
      ),
    [adminAlerts, user?.id],
  );

  const phase: NodePhase = resolveNodePhase({
    balance,
    isFrozen: user?.isFrozen,
    hasPendingCapital: pendingCapital.length > 0,
    hasDetectingSignal: detectingSignal,
  });

  const lastPending = pendingCapital[0];

  return {
    phase,
    phaseLabel: PHASE_LABEL[phase],
    feedLine: phaseFeedLine(phase),
    balance,
    nodeId: nodeIdFromToken(accessToken),
    pendingCapital,
    lastPending,
    canAccess: (rail: EngineRail) => canAccessRail(phase, rail, user?.unlockedRails),
    lockReason: (rail: EngineRail) => railLockReason(phase, rail),
    isArmed: phase === "ARMED",
    isOnHold: phase === "PENDING" || phase === "DETECTING",
  };
}
