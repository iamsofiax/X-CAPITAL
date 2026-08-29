/**
 * Node Engine copy — infrastructure intelligence voice.
 * Compliance-safe: aspirational platform scale, not guaranteed personal returns.
 */

export type NodeUserState =
  | "unfunded"
  | "pending_deposit"
  | "funded"
  | "trading";

export const NODE_TRAJECTORY = {
  targetLabel: "$1T deployment trajectory",
  horizon: "36-month horizon",
  headline: "Network deployment target",
  subline:
    "Platform-scale capital routing infrastructure. Aspirational network capacity — not a personal return guarantee.",
} as const;

export const NODE_STATUS = {
  unfunded: "UNFUNDED",
  pending: "SIGNAL DETECTED",
  funded: "ARMED",
  routing: "ROUTING",
  nominal: "NOMINAL",
} as const;

export const NODE_LABELS = {
  capitalNode: "Capital node",
  treasuryClearance: "Treasury clearance",
  adminQueue: "Operator queue",
  initiateSignal: "Initiate capital signal",
  signalRouted: "Signal routed to treasury",
  adminClearance: "Operator clearance required",
  depositPending: "Inbound signal pending verification",
  zeroBalance: "Zero balance until operator confirmation",
} as const;

export const NODE_INTELLIGENCE: Record<NodeUserState, string[]> = {
  unfunded: [
    "Node registered. Awaiting treasury injection.",
    "Capital rails idle. Funding unlocks execution layer.",
    "Zero balance enforced. Operator clearance routes all inbound capital.",
  ],
  pending_deposit: [
    "Signal detected. Operator queue: HIGH.",
    "Treasury verification in progress. Do not close session.",
    "Inbound capital flagged for clearance review.",
  ],
  funded: [
    "Capital armed. Routing enabled across 5 rails.",
    "Execution layer nominal. All systems within tolerance.",
    "Node synchronized with orbital infrastructure mesh.",
  ],
  trading: [
    "Execution layer nominal. Latency within orbital tolerance.",
    "Order routing active. XLINK mesh synchronized.",
    "Market feed locked. Capital deployment authorized.",
  ],
};

export const NODE_EMPTY = {
  wallet: {
    title: "Capital node: UNFUNDED",
    body: "Treasury clearance routes through operator verification. Zero balance until confirmed.",
    cta: "Initiate capital signal",
  },
  portfolio: {
    title: "No deployed capital",
    body: "Fund your node to activate portfolio routing across public and private rails.",
    cta: "Route capital",
  },
  funds: {
    title: "Investment rails locked",
    body: "Operator-funded balance required before fund allocation. All positions start at zero.",
    cta: "Fund node first",
  },
} as const;

export const STARLINK_PROMO = {
  title: "Starlink Growth Accelerator",
  tagline: "Satellite-linked capital deployment",
  apy: "42–56% target yield architecture",
  cta: "Access XLINK markets",
  stats: {
    satellites: "7,200+",
    latency: "<25ms",
    coverage: "105+ countries",
  },
} as const;

export const STRUCTURAL_ARCHITECTURE = [
  {
    id: "01",
    title: "The Architecture of Leverage",
    body: "Every asset integrated into the Global Routing Engine converts liability into a generative node — Starlink bandwidth, AI inference, and global payment rails.",
  },
  {
    id: "02",
    title: "The Asset Bridge",
    body: "Professional acquisition of any asset class. Full cash value routes instantly to your digital wallet while yield architecture activates.",
  },
  {
    id: "03",
    title: "The Elevation Sequence",
    body: "After first successful route, the system cycles you into an upgraded deployment slot. Every asset class has its elevation path.",
  },
  {
    id: "04",
    title: "Structural Integrity",
    body: "Capital remains on the node. Linked to the X-CAPITAL feed for yield attribution. Possession stays with the book.",
  },
] as const;

export function getNodeIntelligenceMessage(state: NodeUserState): string {
  const messages = NODE_INTELLIGENCE[state];
  return messages[Math.floor(Date.now() / 8000) % messages.length];
}

export function formatNodeStatus(cash: number, hasPending: boolean): NodeUserState {
  if (hasPending) return "pending_deposit";
  if (cash > 0) return "funded";
  return "unfunded";
}
