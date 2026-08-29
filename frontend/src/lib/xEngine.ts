/**

 * X Engine — capital deployment state machine & seven-rail infrastructure spec.

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

  PENDING: "CLEARANCE HOLD",

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



/** Canonical rail specification — codes, copy, and operational guarantees. */

export const RAIL_REGISTRY: Record<

  EngineRail,

  {

    code: string;

    title: string;

    subtitle: string;

    mission: string;

    capabilities: string[];

    sla: string;

  }

> = {

  wallet: {

    code: "UPL-07",

    title: "Capital Uplink",

    subtitle: "Fiat ingress · settlement · operator clearance",

    mission:

      "Primary capital interface between your node and X-CAPITAL custody. All loadout changes route through audited settlement queues before rails arm.",

    capabilities: [

      "ACH / wire deposit routing",

      "Withdrawal clearance queue",

      "Real-time loadout sync",

    ],

    sla: "Settlement ACK ≤ 24h business · Uplink always available",

  },

  trading: {

    code: "EXEC-01",

    title: "Execution Rail",

    subtitle: "XLINK order mesh · smart routing · compliance gate",

    mission:

      "Order entry with pre-trade risk checks, operator clearance on capital events, and quote propagation across listed and digital venues.",

    capabilities: [

      "Market & limit execution",

      "XLINK consolidated depth",

      "Buy-side capital hold until cleared",

    ],

    sla: "Quote refresh 1s · Order ACK < 200ms simulated",

  },

  portfolio: {

    code: "HOLD-02",

    title: "Holdings Rail",

    subtitle: "Positions · P&L · attribution · exposure",

    mission:

      "Consolidated book of record for every armed position. Marks, cost basis, and sector exposure update continuously once the node is capitalized.",

    capabilities: [

      "Multi-asset position ledger",

      "Realized / unrealized P&L",

      "Allocation & concentration views",

    ],

    sla: "Mark-to-market on session tick · Requires armed node",

  },

  funds: {

    code: "FUND-03",

    title: "Funds Rail",

    subtitle: "Private allocation · LP structures · mandate routing",

    mission:

      "Private-market sleeves with documented mandates, minimum tickets, and operator subscription workflow before capital is deployed.",

    capabilities: [

      "Mandate discovery matrix",

      "Subscription workflow",

      "NAV & commitment tracking",

    ],

    sla: "Subscription review ≤ 2 business days",

  },

  commerce: {

    code: "COMM-04",

    title: "Commerce Rail",

    subtitle: "Tokenized real assets · production nodes · inventory",

    mission:

      "Structured access to institutional product catalog — EV fleets, compute, space economy, and energy nodes — with documented yield architecture and custody metadata.",

    capabilities: [

      "Institutional product catalog",

      "Allocation & checkout flow",

      "Production-ramp disclosures",

    ],

    sla: "Catalog sync daily · Execution gated until armed",

  },

  oracle: {

    code: "INF-05",

    title: "Oracle Rail",

    subtitle: "Inference feed · sentiment · forward curves",

    mission:

      "Quantitative signal layer aggregating model forecasts, macro overlays, and founder-attributed alpha streams for informed deployment decisions.",

    capabilities: [

      "Multi-horizon forecasts",

      "Confidence-weighted signals",

      "Sector momentum matrix",

    ],

    sla: "Feed refresh 15m · Requires armed or cleared rail",

  },

  engine: {

    code: "CORE-06",

    title: "Core Engine",

    subtitle: "Asset integration · bandwidth · structural yield",

    mission:

      "Physical-digital integration layer: register collateral classes, route throughput across Starlink mesh, AI inference pools, and global settlement — converting balance-sheet items into revenue-bearing infrastructure nodes.",

    capabilities: [

      "Asset-class onboarding",

      "Yield architecture transparency",

      "Node capacity & throughput metrics",

    ],

    sla: "Node registry permanent · Integration review per asset class",

  },

};



export const ENGINE_COPY = {

  uplink: "Open capital uplink",

  groundHold:

    "Operator hold — capital event pending clearance",

  nodeCold: "Node cold — zero loadout on record",

  nodeArmed: "Node armed — execution rails nominal",

  signalDetected:

    "Inbound capital signal detected. Awaiting operator confirmation.",

  balance: "Loadout",

  module: "Module",

  missionControl: "Operator desk — inbound queue",

  inboundQueue: "Inbound capital signals",

  armNode: "Arm node",

  denySignal: "Deny signal",

  railLocked: "Rail secured — clearance required",

  railLive: "Rail nominal — execution authorized",

  networkScale: "$1T network capacity · 36mo deployment horizon",

  assetIntegrationTitle: "Asset integration into the core ledger",

  assetIntegrationBody:

    "Register any balance-sheet class — mobility, real assets, luxury, operating equipment, or financial instruments — and route it through the global mesh as a revenue-bearing infrastructure node with audited custody and yield attribution.",

} as const;



const RAIL_LOCK_REASON: Record<EngineRail, string> = {

  wallet: "Uplink remains available for capital injection",

  trading:

    "Execution rail secured until loadout is armed or the operator clears this module",

  portfolio:

    "Holdings rail requires positive loadout or explicit operator clearance",

  funds:

    "Funds rail requires armed node or per-rail operator clearance",

  commerce:

    "Commerce rail requires armed node or per-rail operator clearance",

  oracle:

    "Oracle feed requires armed node or per-rail operator clearance",

  engine: "Core engine registry is available upon node registration",

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



export function canAccessRail(

  phase: NodePhase,

  rail: EngineRail,

  unlockedRails?: string[],

): boolean {

  if (rail === "wallet" || rail === "engine") return true;

  if (unlockedRails && unlockedRails.includes(rail)) return true;

  if (phase === "FROZEN") return false;

  if (phase === "ARMED") return true;

  return false;

}



export function railLockReason(

  phase: NodePhase,

  rail: EngineRail,

  unlockedRails?: string[],

): string {

  if (unlockedRails?.includes(rail)) return "";

  if (phase === "FROZEN")

    return "Node frozen by operator — all execution rails secured";

  if (canAccessRail(phase, rail, unlockedRails)) return "";

  if (phase === "PENDING" || phase === "DETECTING")

    return "Operator hold — capital clearance in progress. Do not close session.";

  return RAIL_LOCK_REASON[rail];

}



export function phaseFeedLine(phase: NodePhase): string {

  switch (phase) {

    case "COLD":

      return "Node registered. Zero loadout. Open uplink to inject capital and sequence rail arming.";

    case "DETECTING":

      return "Inbound signal on scope. Operator reviewing capital event.";

    case "PENDING":

      return "Operator hold active. Settlement queue processing — rails remain secured.";

    case "ARMED":

      return "All rails nominal. Execution, holdings, and inference feeds authorized.";

    case "FROZEN":

      return "Node frozen. Contact the operator for reinstatement.";

  }

}



export function nodeIdFromToken(token: string | null): string {

  const tail = (token ?? "0000").slice(-4).toUpperCase();

  return `XC-${tail}`;

}



/** Ordered rails shown in infrastructure UI (excludes wallet/engine when needed). */

export const OPERATOR_RAILS: EngineRail[] = [

  "trading",

  "portfolio",

  "funds",

  "commerce",

  "oracle",

];


