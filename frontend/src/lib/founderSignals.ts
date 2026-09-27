/**
 * Oracle Desk model notes — quantitative copy, no celebrity attribution.
 */

export type OracleSignalAction = "BUY" | "HOLD" | "SELL";

export interface OracleHotSignal {
  symbol: string;
  signal: OracleSignalAction;
  strength: number;
  reason: string;
}

export const FOUNDER_SIGNAL_ATTRIBUTION = "Oracle Desk · model note";

export const FOUNDER_HOT_SIGNALS: OracleHotSignal[] = [
  {
    symbol: "BTC",
    signal: "HOLD",
    strength: 54,
    reason: "Funding is mixed and realized vol is mid-range. Size to the hedge, not the headline.",
  },
  {
    symbol: "NVDA",
    signal: "BUY",
    strength: 68,
    reason: "Compute capex still dominates the forward book. Treat drawdowns as vol, not a thesis change.",
  },
  {
    symbol: "TLT",
    signal: "HOLD",
    strength: 51,
    reason: "Duration is a ballast sleeve, not an alpha sleeve. Keep the ticket small versus beta vaults.",
  },
];

export const FOUNDER_REASON_BY_SYMBOL: Record<string, string> = {
  BTC: "Hard-asset beta. Pair with a hedge if the book already owns momentum.",
  NVDA: "AI infrastructure proxy. High realized vol — size from Sortino, not conviction.",
  TSLA: "Idiosyncratic. Do not let one name dominate the Execution sleeve.",
  AAPL: "Quality compounder. Useful ballast next to crypto beta.",
  META: "Ad + model mix. Treat as growth equity, not a hedge.",
  AMZN: "AWS is the cash engine. Retail is distribution.",
  PLTR: "Deployment-cycle name. Wide range of outcomes.",
  MSFT: "Enterprise AI bundle. Lower vol than pure silicon.",
  ETH: "Smart-contract beta. Correlated with BTC in stress.",
  SOL: "High-throughput L1. Size as a satellite, not the core.",
  AMD: "Second-source compute. Useful diversifier versus NVDA.",
};

export function getFounderReason(symbol: string, fallback?: string): string {
  return (
    FOUNDER_REASON_BY_SYMBOL[symbol] ??
    fallback ??
    "Oracle Desk: size from published vault physics and your book’s Sortino, not from a narrative."
  );
}

export function getXlinkFounderSpotlight(confidence: number, horizon: string, targetPrice: number): string {
  return `Oracle Desk model note. Confidence ${confidence}% · ${horizon} mark $${targetPrice.toFixed(2)}.`;
}
