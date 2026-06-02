/**
 * X Engine — single capital deployment state machine.
 * Sci-fi operator voice. Admin holds capital rails; execution unlocks when ARMED.
 */

export type NodePhase = "COLD" | "DETECTING" | "PENDING" | "ARMED" | "FROZEN";

export type EngineRail =
  | "wallet"
  | "trading"
  | "portfolio"
  | "funds"
  | "commerce"
  | "oracle"
  | "engine";

export const PHASE_LABEL: Record<NodePhase, string> = {
  COLD: "NODE COLD",
  DETECTING: "UPLINK OPEN",
  PENDING: "GROUND HOLD",
  ARMED: "ARMED",
  FROZEN: "FROZEN",
};

export const PHASE_COLOR: Record<NodePhase, string> = {
  COLD: "text-white/40",
  DETECTING: "text-amber-400",
  PENDING: "text-amber-400",
  ARMED: "text-emerald-400",
  FROZEN: "text-red-400",
};

export const ENGINE_COPY = {
  uplink: "Open uplink",
  groundHold: "Ground station hold",
  nodeCold: "Node cold — awaiting injection",
  nodeArmed: "Node armed — rails live",
  signalDetected: "Signal on scope. Ground station reviewing.",
  balance: "Loadout",
  module: "Module",
  missionControl: "Mission control",
  inboundQueue: "Inbound signals",
  armNode: "Arm node",
  denySignal: "Deny signal",
  railLocked: "Rail locked",
  networkScale: "$1T network capacity · 36mo horizon",
} as const;

const RAIL_LOCK_REASON: Record<EngineRail, string> = {
  wallet: "Uplink always available",
  trading: "Arm node to unlock execution",
  portfolio: "Deploy capital to activate holdings",
  funds: "Fund node before allocation",
  commerce: "Arm node to access commerce rail",
  oracle: "Arm node to access inference feed",
  engine: "Register node to view engine",
};

export function resolveNodePhase(input: {
  balance: number;
  isFrozen?: boolean;
  hasPendingCapital: boolean;
  hasDetectingSignal?: boolean;
}): NodePhase {
  if (input.isFrozen) return "FROZEN";
  if (input.hasPendingCapital) return "PENDING";
  if (input.hasDetectingSignal && input.balance <= 0) return "DETECTING";
  if (input.balance > 0) return "ARMED";
  return "COLD";
}

/** Capital in/out = admin. Trading & rails auto once ARMED.
 *  unlockedRails allows admin to grant per-rail access regardless of phase. */
export function canAccessRail(
  phase: NodePhase,
  rail: EngineRail,
  unlockedRails?: string[],
): boolean {
  if (phase === "FROZEN") return false;
  if (rail === "wallet" || rail === "engine") return true;
  if (unlockedRails && unlockedRails.includes(rail)) return true;
  if (phase === "ARMED") return true;
  return false;
}

export function railLockReason(phase: NodePhase, rail: EngineRail): string {
  if (phase === "FROZEN") return "Node frozen by ground station";
  if (canAccessRail(phase, rail)) return "";
  if (phase === "PENDING" || phase === "DETECTING")
    return "Ground station hold — clearance in progress";
  return RAIL_LOCK_REASON[rail];
}

export function phaseFeedLine(phase: NodePhase): string {
  switch (phase) {
    case "COLD":
      return "Node registered. Zero loadout. Open uplink to inject capital.";
    case "DETECTING":
      return "Signal detected on scope. Awaiting operator confirmation.";
    case "PENDING":
      return "Ground station hold. Do not close session.";
    case "ARMED":
      return "All rails nominal. Execution authorized.";
    case "FROZEN":
      return "Node frozen. Contact ground station.";
  }
}

export function nodeIdFromToken(token: string | null): string {
  const tail = (token ?? "0000").slice(-4).toUpperCase();
  return `XC-${tail}`;
}
