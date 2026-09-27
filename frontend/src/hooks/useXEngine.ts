"use client";

import { useCallback } from "react";
import { useStore } from "@/store/useStore";
import { useSim } from "@/hooks/useSim";
import {
  PHASE_LABEL,
  canAccessRail,
  nodeIdFromToken,
  phaseFeedLine,
  railLockReason,
  resolveNodePhase,
  type EngineRail,
  type NodePhase,
} from "@/lib/xEngine";

/** Genesis-unlock adapter for leftover x-engine chrome. */
export function useXEngine() {
  const accessToken = useStore((s) => s.accessToken);
  const { claimed, metrics } = useSim();
  const phase: NodePhase = resolveNodePhase({ claimed, balance: metrics?.nav ?? 0 });

  const canAccess = useCallback(
    (rail: EngineRail) => canAccessRail(phase, rail),
    [phase],
  );
  const lockReason = useCallback(
    (rail: EngineRail) => railLockReason(phase, rail),
    [phase],
  );

  return {
    phase,
    phaseLabel: PHASE_LABEL[phase],
    feedLine: phaseFeedLine(phase),
    balance: metrics?.nav ?? 0,
    nodeId: nodeIdFromToken(accessToken),
    pendingCapital: [] as unknown[],
    lastPending: undefined,
    unlockedRails: claimed ? ["trading", "portfolio", "funds", "commerce", "oracle", "engine"] : [],
    canAccess,
    lockReason,
    isArmed: phase === "ARMED",
    isOnHold: false,
  };
}
