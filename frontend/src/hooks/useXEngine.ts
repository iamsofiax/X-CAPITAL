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
    registeredUsers,
    wallet,
    accessToken,
    pendingTransactions,
    adminAlerts,
  } = useStore();

  // Always read from registeredUsers so admin changes (balance, unlockedRails, isFrozen)
  // reflect immediately without requiring a re-login.
  const freshUser = user
    ? (registeredUsers.find((u) => u.id === user.id) ?? user)
    : user;

  const balance = Number(wallet?.fiatBalance ?? freshUser?.balance ?? 0);

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
    isFrozen: freshUser?.isFrozen,
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
    canAccess: (rail: EngineRail) => canAccessRail(phase, rail, freshUser?.unlockedRails),
    lockReason: (rail: EngineRail) => railLockReason(phase, rail),
    isArmed: phase === "ARMED",
    isOnHold: phase === "PENDING" || phase === "DETECTING",
  };
}
