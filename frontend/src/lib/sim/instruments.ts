import { hashString } from "./prng";
import { EQUITY_UNIVERSE } from "./universe";

export type InstrumentClass = "crypto" | "equity" | "etf";

export interface Instrument {
  symbol: string;
  name: string;
  cls: InstrumentClass;
  /** Reference price used by the deterministic SIM FEED when no live quote is available. */
  ref: number;
  /** Annualized vol used to scale the SIM FEED. */
  vol: number;
  /** Half of this is paid on each side of a fill. */
  spreadBps: number;
  sector: string;
}

const FEATURED_BOOK: Instrument[] = [
  { symbol: "BTC", name: "Bitcoin", cls: "crypto", ref: 95_000, vol: 0.55, spreadBps: 8, sector: "Digital Assets" },
  { symbol: "ETH", name: "Ethereum", cls: "crypto", ref: 3_400, vol: 0.7, spreadBps: 8, sector: "Digital Assets" },
  { symbol: "SOL", name: "Solana", cls: "crypto", ref: 180, vol: 0.9, spreadBps: 10, sector: "Digital Assets" },
  { symbol: "LINK", name: "Chainlink", cls: "crypto", ref: 18, vol: 0.85, spreadBps: 12, sector: "Digital Assets" },
  { symbol: "AVAX", name: "Avalanche", cls: "crypto", ref: 35, vol: 0.9, spreadBps: 12, sector: "Digital Assets" },
  { symbol: "NVDA", name: "NVIDIA", cls: "equity", ref: 140, vol: 0.5, spreadBps: 3, sector: "Semiconductors" },
  { symbol: "AMD", name: "Advanced Micro Devices", cls: "equity", ref: 150, vol: 0.5, spreadBps: 3, sector: "Semiconductors" },
  { symbol: "TSLA", name: "Tesla", cls: "equity", ref: 250, vol: 0.6, spreadBps: 3, sector: "Autos & Energy" },
  { symbol: "AAPL", name: "Apple", cls: "equity", ref: 225, vol: 0.25, spreadBps: 2, sector: "Consumer Tech" },
  { symbol: "MSFT", name: "Microsoft", cls: "equity", ref: 430, vol: 0.25, spreadBps: 2, sector: "Software" },
  { symbol: "AMZN", name: "Amazon", cls: "equity", ref: 200, vol: 0.32, spreadBps: 2, sector: "Internet" },
  { symbol: "META", name: "Meta Platforms", cls: "equity", ref: 580, vol: 0.38, spreadBps: 2, sector: "Internet" },
  { symbol: "PLTR", name: "Palantir", cls: "equity", ref: 60, vol: 0.65, spreadBps: 4, sector: "Software" },
  { symbol: "SPY", name: "S&P 500 ETF", cls: "etf", ref: 580, vol: 0.16, spreadBps: 1, sector: "Broad Market" },
  { symbol: "QQQ", name: "Nasdaq-100 ETF", cls: "etf", ref: 500, vol: 0.21, spreadBps: 1, sector: "Broad Market" },
  { symbol: "GLD", name: "Gold ETF", cls: "etf", ref: 240, vol: 0.14, spreadBps: 1, sector: "Commodities" },
];

const CORE_SYMBOLS = new Set(FEATURED_BOOK.map((i) => i.symbol));

const BROAD_BOOK: Instrument[] = EQUITY_UNIVERSE.filter((row) => !CORE_SYMBOLS.has(row.symbol)).map((row) => ({
  symbol: row.symbol,
  name: row.name,
  cls: "equity" as const,
  ref: row.ref,
  vol: row.vol,
  spreadBps: row.ref >= 80 ? 2 : 4,
  sector: row.sector,
}));

export const FEATURED: Instrument[] = FEATURED_BOOK;
export const INSTRUMENTS: Instrument[] = [...FEATURED_BOOK, ...BROAD_BOOK];

export const INSTRUMENT_BY_SYMBOL: Record<string, Instrument> = Object.fromEntries(
  INSTRUMENTS.map((i) => [i.symbol, i]),
);

const HOUR = 3_600_000;
const CYCLES_H = [36, 24 * 7, 24 * 30, 24 * 90];

/** Deterministic, smooth, bounded synthetic price: a sum of phase-shifted sinusoids scaled by vol. */
export function simFeedPrice(inst: Instrument, ts: number): number {
  const t = ts / HOUR;
  const seed = hashString(inst.symbol);
  let x = 0;
  CYCLES_H.forEach((period, k) => {
    const phase = ((seed >>> (k * 5)) % 360) * (Math.PI / 180);
    const amp = inst.vol * Math.sqrt(period / (24 * 365)) * 0.6;
    x += amp * Math.sin((2 * Math.PI * t) / period + phase);
  });
  return inst.ref * Math.exp(x);
}

export interface Quote {
  symbol: string;
  mid: number;
  bid: number;
  ask: number;
  change24h: number;
  source: "LIVE" | "INDICATIVE";
}

export function buildQuote(inst: Instrument, mid: number, change24h: number, source: Quote["source"]): Quote {
  const half = (inst.spreadBps / 2) * 1e-4;
  return {
    symbol: inst.symbol,
    mid,
    bid: mid * (1 - half),
    ask: mid * (1 + half),
    change24h,
    source,
  };
}

export function simQuote(inst: Instrument, now = Date.now()): Quote {
  const mid = simFeedPrice(inst, now);
  const prev = simFeedPrice(inst, now - 24 * HOUR);
  return buildQuote(inst, mid, (mid / prev - 1) * 100, "INDICATIVE");
}
