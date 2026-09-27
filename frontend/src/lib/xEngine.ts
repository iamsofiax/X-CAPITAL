/**
 * Compatibility layer over the seven-rail Genesis model.
 * Rails arm when the opening credit is posted to the node ledger.
 */

import { RAILS } from "./rails";

export type NodePhase = "COLD" | "ARMED";

export type EngineRail =
  | "wallet"
  | "trading"
  | "portfolio"
  | "funds"
  | "commerce"
  | "oracle"
  | "engine";

const RAIL_ID: Record<EngineRail, string> = {
  wallet: "treasury",
  trading: "execution",
  portfolio: "book",
  funds: "vaults",
  commerce: "rwa",
  oracle: "oracle",
  engine: "conviction",
};

export const PHASE_LABEL: Record<NodePhase, string> = {
  COLD: "GENESIS PENDING",
  ARMED: "DESK LIVE",
};

export const PHASE_COLOR: Record<NodePhase, string> = {
  COLD: "text-white/40",
  ARMED: "text-emerald-400",
};

export const RAIL_REGISTRY = Object.fromEntries(
  (Object.keys(RAIL_ID) as EngineRail[]).map((key) => {
    const spec = RAILS.find((r) => r.id === RAIL_ID[key])!;
    return [
      key,
      {
        code: spec.code,
        title: spec.label,
        subtitle: spec.blurb,
        mission: spec.blurb,
        capabilities: [spec.blurb],
        sla: "Arms with the opening credit",
      },
    ];
  }),
) as Record<
  EngineRail,
  { code: string; title: string; subtitle: string; mission: string; capabilities: string[]; sla: string }
>;

export const ENGINE_COPY = {
  uplink: "Post opening credit",
  groundHold: "Post the opening credit in Treasury to arm the remaining rails",
  nodeCold: "Desk cold — opening credit not posted",
  nodeArmed: "Desk live — all seven rails nominal",
  signalDetected: "Cash posts only against a confirmed instruction on the node.",
  balance: "NAV",
  module: "Rail",
  missionControl: "Command",
  inboundQueue: "Ledger",
  armNode: "Arm desk",
  denySignal: "Dismiss",
  railLocked: "Rail closed — opening credit required",
  railLive: "Rail live",
  networkScale: "USD cash · node ledger · seven rails",
  assetIntegrationTitle: "Conviction locks",
  assetIntegrationBody:
    "Locked units share protocol fees from vault high-water marks and execution spread, pro-rata. Nothing is issued outside the book.",
} as const;

export function resolveNodePhase(input: { claimed?: boolean; balance?: number }): NodePhase {
  return input.claimed || (input.balance ?? 0) > 0 ? "ARMED" : "COLD";
}

export function canAccessRail(phase: NodePhase, rail: EngineRail): boolean {
  if (rail === "wallet") return true;
  return phase === "ARMED";
}

export function railLockReason(phase: NodePhase, rail: EngineRail): string {
  if (canAccessRail(phase, rail)) return "";
  return "Post the opening credit in Treasury to arm this rail.";
}

export function phaseFeedLine(phase: NodePhase): string {
  return phase === "ARMED"
    ? "All rails live. Returns come from marks and fees only."
    : "Claim Genesis to arm Execution, Book, Vaults, RWA, Oracle and Conviction.";
}

export function nodeIdFromToken(token: string | null): string {
  const tail = (token ?? "0000").slice(-4).toUpperCase();
  return `XC-${tail}`;
}

export const OPERATOR_RAILS: EngineRail[] = [
  "trading",
  "portfolio",
  "funds",
  "commerce",
  "oracle",
  "engine",
];
