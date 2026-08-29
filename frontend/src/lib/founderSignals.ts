/**
 * Founder-voice trading signals (Elon Musk tone) for Hot Signals & oracle copy.
 */

export type FounderSignalAction = "BUY" | "HOLD" | "SELL";

export interface FounderHotSignal {
  symbol: string;
  signal: FounderSignalAction;
  strength: number;
  reason: string;
}

export const FOUNDER_SIGNAL_ATTRIBUTION = "Operator desk";

/** Hot Signals panel on /trading */
export const FOUNDER_HOT_SIGNALS: FounderHotSignal[] = [
  {
    symbol: "XLINK",
    signal: "BUY",
    strength: 85,
    reason:
      "Low Earth orbit is the ultimate network effect. Starlink scales faster than bears can spreadsheet.",
  },
  {
    symbol: "NVDA",
    signal: "BUY",
    strength: 72,
    reason:
      "Compute is the new oil. If you're not building AI infrastructure, you're already obsolete.",
  },
  {
    symbol: "TSLA",
    signal: "HOLD",
    strength: 58,
    reason:
      "Short-term noise. Long-term: autonomy, energy, and manufacturing at scale. Patience is physics.",
  },
];

/** One-liner reasons keyed by symbol (oracle spotlight, tooltips, etc.) */
export const FOUNDER_REASON_BY_SYMBOL: Record<string, string> = {
  XLINK:
    "We're not betting on a token — we're betting on civilization-scale bandwidth. The rocket pays for the constellation.",
  NVDA: "The limiting factor for intelligence is silicon. Whoever ships the most compute wins the decade.",
  TSLA: "Production is hard. Competition is easy. Wait for the next step-change, not the next headline.",
  AAPL: "Ecosystem lock-in compounds. Services and on-device AI are underpriced by linear thinkers.",
  META: "Attention is finite; Llama makes it programmable. Ads plus open models is a unfair combo.",
  AMZN: "AWS is the profit engine. Retail is the distribution channel. Bears confuse the two.",
  PLTR: "Software that wins wars eventually wins enterprises. The moat is deployment, not slides.",
  XSPACE: "Reusable rockets change the unit economics of everything upstream — including capital.",
  MSFT: "Copilot turns every seat into a GPU customer. The enterprise bundle is the real product.",
  BTC: "Hard money is a hedge on fiat debasement. Volatility is the price of independence.",
  SOL: "Throughput matters when you want an actual economy, not a museum piece.",
  DOGE: "Memes move markets faster than committees. Risk accordingly.",
  AMD: "When one player owns the high end, the second source becomes strategic by default.",
};

export function getFounderReason(symbol: string, fallback?: string): string {
  return (
    FOUNDER_REASON_BY_SYMBOL[symbol] ??
    fallback ??
    "First principles beat consensus. Do the math yourself."
  );
}

/** Oracle XLINK spotlight — full paragraph */
export function getXlinkFounderSpotlight(confidence: number, horizon: string, targetPrice: number): string {
  return `${getFounderReason("XLINK")} Model confidence ${confidence}% · ${horizon} target $${targetPrice.toFixed(2)}.`;
}
