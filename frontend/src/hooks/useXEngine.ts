"use client";

import { useMemo, useCallback } from "react";
import { useStore } from "@/store/useStore";
import { mergeUserFromRegistry } from "@/lib/mergeSessionUser";
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
    registeredUsers,
    wallet,
    accessToken,
    pendingTransactions,
    adminAlerts,
  } = useStore();

  const freshUser = useMemo(
    () => mergeUserFromRegistry(user, registeredUsers),
    [user, registeredUsers],
  );

  const balance = Number(wallet?.fiatBalance ?? freshUser?.balance ?? 0);

  const pendingCapital = useMemo(
    () =>
      pendingTransactions.filter(
        (t) =>
          t.userId === freshUser?.id &&
          t.status === "PENDING" &&
          (t.type === "DEPOSIT" ||
            t.type === "WITHDRAWAL" ||
            t.type === "FUND_INVEST"),
      ),
    [pendingTransactions, freshUser?.id],
  );

  const detectingSignal = useMemo(
    () =>
      adminAlerts.some(
        (a) =>
          a.userId === freshUser?.id &&
          a.status === "PENDING" &&
          a.metadata?.stage === "DETECTED",
      ),
    [adminAlerts, freshUser?.id],
  );

  const phase: NodePhase = resolveNodePhase({
    balance,
    isFrozen: freshUser?.isFrozen,
    hasPendingCapital: pendingCapital.length > 0,
    hasDetectingSignal: detectingSignal,
  });

  const lastPending = pendingCapital[0];
  const unlockedRails = freshUser?.unlockedRails;

  const canAccess = useCallback(
    (rail: EngineRail) => canAccessRail(phase, rail, unlockedRails),
    [phase, unlockedRails],
  );

  const lockReason = useCallback(
    (rail: EngineRail) => railLockReason(phase, rail, unlockedRails),
    [phase, unlockedRails],
  );

  return {
    phase,
    phaseLabel: PHASE_LABEL[phase],
    feedLine: phaseFeedLine(phase),
    balance,
    nodeId: nodeIdFromToken(accessToken),
    pendingCapital,
    lastPending,
    unlockedRails,
    canAccess,
    lockReason,
    isArmed: phase === "ARMED",
    isOnHold: phase === "PENDING" || phase === "DETECTING",
  };
}
