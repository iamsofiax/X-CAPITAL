/**
 * Live Market Data Service
 * - Crypto: CoinGecko (free, no API key needed)
 * - Stocks/ETFs: Finnhub (free tier, needs NEXT_PUBLIC_FINNHUB_API_KEY)
 *
 * Get a free Finnhub key at https://finnhub.io/register (60 calls/min)
 */

const FINNHUB_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY || "";

// ─── CoinGecko symbol → id mapping ──────────────────────────────────────────
const CRYPTO_IDS: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  DOGE: "dogecoin",
  ADA: "cardano",
  AVAX: "avalanche-2",
  LINK: "chainlink",
  DOT: "polkadot",
  XRP: "ripple",
  BNB: "binancecoin",
  USDT: "tether",
  USDC: "usd-coin",
  MATIC: "matic-network",
  TRX: "tron",
};
// Reverse lookup
const ID_TO_SYMBOL: Record<string, string> = {};
Object.entries(CRYPTO_IDS).forEach(([sym, id]) => {
  ID_TO_SYMBOL[id] = sym;
});

export interface MarketPrice {
  price: number;
  change24h: number;
  changePercent24h: number;
  high24h?: number;
  low24h?: number;
  volume24h?: number;
  marketCap?: number;
  lastUpdated: number;
}

// ─── Module-level cache ─────────────────────────────────────────────────────
const priceCache: Record<string, MarketPrice> = {};
let lastCryptoFetch = 0;
const lastStockFetch: Record<string, number> = {};
const CRYPTO_TTL = 30_000;
const STOCK_TTL = 60_000;

// ─── Crypto: CoinGecko (free, no key) ──────────────────────────────────────
export async function fetchCryptoPrices(): Promise<
  Record<string, MarketPrice>
> {
  const now = Date.now();
  if (now - lastCryptoFetch < CRYPTO_TTL) {
    const cached: Record<string, MarketPrice> = {};
    Object.keys(CRYPTO_IDS).forEach((sym) => {
      if (priceCache[sym]) cached[sym] = priceCache[sym];
    });
    if (Object.keys(cached).length > 0) return cached;
  }

  try {
    const ids = Object.values(CRYPTO_IDS).join(",");
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=false&price_change_percentage=24h`,
      { signal: AbortSignal.timeout(10000) },
    );
    if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
    const data = await res.json();

    const result: Record<string, MarketPrice> = {};
    for (const coin of data) {
      const sym = ID_TO_SYMBOL[coin.id];
      if (!sym) continue;
      const mp: MarketPrice = {
        price: coin.current_price,
        change24h: coin.price_change_24h || 0,
        changePercent24h: coin.price_change_percentage_24h || 0,
        high24h: coin.high_24h,
        low24h: coin.low_24h,
        volume24h: coin.total_volume,
        marketCap: coin.market_cap,
        lastUpdated: now,
      };
      priceCache[sym] = mp;
      result[sym] = mp;
    }
    lastCryptoFetch = now;
    return result;
  } catch (e) {
    console.warn("[MarketData] CoinGecko fetch failed:", e);
    return {};
  }
}

// ─── Stocks: Finnhub (free tier, 60 calls/min) ─────────────────────────────
export async function fetchStockQuote(
  symbol: string,
): Promise<MarketPrice | null> {
  if (!FINNHUB_KEY) return null;

  const now = Date.now();
  if (priceCache[symbol] && now - (lastStockFetch[symbol] || 0) < STOCK_TTL) {
    return priceCache[symbol];
  }

  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${FINNHUB_KEY}`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) throw new Error(`Finnhub ${res.status}`);
    const data = await res.json();

    if (!data.c || data.c === 0) return null;

    const mp: MarketPrice = {
      price: data.c,
      change24h: data.d || 0,
      changePercent24h: data.dp || 0,
      high24h: data.h,
      low24h: data.l,
      lastUpdated: now,
    };
    priceCache[symbol] = mp;
    lastStockFetch[symbol] = now;
    return mp;
  } catch (e) {
    console.warn(`[MarketData] Finnhub fetch failed for ${symbol}:`, e);
    return null;
  }
}

export async function fetchStockQuotes(
  symbols: string[],
): Promise<Record<string, MarketPrice>> {
  if (!FINNHUB_KEY) return {};
  const results: Record<string, MarketPrice> = {};
  // Batch with small concurrency to respect rate limits
  const batchSize = 8;
  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize);
    const promises = batch.map(async (sym) => {
      const quote = await fetchStockQuote(sym);
      if (quote) results[sym] = quote;
    });
    await Promise.all(promises);
  }
  return results;
}

// ─── Convenience ────────────────────────────────────────────────────────────
export function getCachedPrice(symbol: string): MarketPrice | null {
  return priceCache[symbol] || null;
}

export function getAllCachedPrices(): Record<string, MarketPrice> {
  return { ...priceCache };
}

export function isCrypto(symbol: string): boolean {
  return symbol in CRYPTO_IDS;
}

export const STOCK_SYMBOLS = [
  "TSLA",
  "NVDA",
  "AAPL",
  "META",
  "AMZN",
  "MSFT",
  "GOOGL",
  "AMD",
  "PLTR",
  "CRM",
  "NFLX",
  "UBER",
  "COIN",
  "SQ",
  "SNAP",
];

export const ETF_SYMBOLS = ["ARKK", "QQQ", "SPY", "IBIT", "GLD"];

export const CRYPTO_SYMBOLS = Object.keys(CRYPTO_IDS);

const BINANCE_PAIRS: Record<string, string> = {
  BTC: "BTCUSDT",
  ETH: "ETHUSDT",
  SOL: "SOLUSDT",
  DOGE: "DOGEUSDT",
  ADA: "ADAUSDT",
  AVAX: "AVAXUSDT",
  LINK: "LINKUSDT",
  DOT: "DOTUSDT",
  XRP: "XRPUSDT",
  BNB: "BNBUSDT",
  TRX: "TRXUSDT",
};

/** Last sale on Binance. The vision host allows a browser to read the print. */
export async function fetchBinancePrices(): Promise<Record<string, MarketPrice>> {
  const now = Date.now();
  const symbols = Object.values(BINANCE_PAIRS);
  const path = `/api/v3/ticker/24hr?symbols=${encodeURIComponent(JSON.stringify(symbols))}`;
  const hosts = ["https://data-api.binance.vision", "https://api.binance.com"];
  let data: { symbol: string; lastPrice: string; priceChange: string; priceChangePercent: string; highPrice: string; lowPrice: string; quoteVolume: string }[] | null = null;
  for (const host of hosts) {
    try {
      const res = await fetch(`${host}${path}`, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) continue;
      data = (await res.json()) as NonNullable<typeof data>;
      break;
    } catch {
      data = null;
    }
  }
  if (!data) {
    console.warn("[MarketData] Binance fetch failed");
    return {};
  }
  try {
    const byPair = Object.fromEntries(Object.entries(BINANCE_PAIRS).map(([sym, pair]) => [pair, sym]));
    const result: Record<string, MarketPrice> = {
      USDT: { price: 1, change24h: 0, changePercent24h: 0, lastUpdated: now },
      USDC: { price: 1, change24h: 0, changePercent24h: 0, lastUpdated: now },
    };
    for (const row of data) {
      const sym = byPair[row.symbol];
      const price = Number(row.lastPrice);
      if (!sym || !(price > 0)) continue;
      const mp: MarketPrice = {
        price,
        change24h: Number(row.priceChange) || 0,
        changePercent24h: Number(row.priceChangePercent) || 0,
        high24h: Number(row.highPrice) || undefined,
        low24h: Number(row.lowPrice) || undefined,
        volume24h: Number(row.quoteVolume) || undefined,
        lastUpdated: now,
      };
      priceCache[sym] = mp;
      result[sym] = mp;
    }
    return result;
  } catch (e) {
    console.warn("[MarketData] Binance parse failed:", e);
    return {};
  }
}

let lastEquityFetch = 0;
const EQUITY_TTL = 25_000;

function yahooSymbol(symbol: string) {
  return symbol.replace(/\./g, "-");
}

async function fetchYahooChunk(symbols: string[]): Promise<Record<string, MarketPrice>> {
  const now = Date.now();
  const query = symbols.map(yahooSymbol).join(",");
  const res = await fetch(
    `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(query)}`,
    { signal: AbortSignal.timeout(8000) },
  );
  if (!res.ok) return {};
  const body = (await res.json()) as {
    quoteResponse?: { result?: { symbol?: string; regularMarketPrice?: number; regularMarketChange?: number; regularMarketChangePercent?: number }[] };
  };
  const back = Object.fromEntries(symbols.map((s) => [yahooSymbol(s), s]));
  const result: Record<string, MarketPrice> = {};
  for (const row of body.quoteResponse?.result ?? []) {
    const sym = back[row.symbol ?? ""] ?? row.symbol;
    const price = Number(row.regularMarketPrice);
    if (!sym || !(price > 0)) continue;
    const mp: MarketPrice = {
      price,
      change24h: Number(row.regularMarketChange) || 0,
      changePercent24h: Number(row.regularMarketChangePercent) || 0,
      lastUpdated: now,
    };
    priceCache[sym] = mp;
    result[sym] = mp;
  }
  return result;
}

async function fetchStooqChunk(symbols: string[]): Promise<Record<string, MarketPrice>> {
  const now = Date.now();
  const query = symbols.map((s) => `${yahooSymbol(s).toLowerCase()}.us`).join("+");
  const res = await fetch(`https://stooq.com/q/l/?s=${query}&f=sc&h&e=csv`, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) return {};
  const text = await res.text();
  const back = Object.fromEntries(symbols.map((s) => [`${yahooSymbol(s).toUpperCase()}.US`, s]));
  const result: Record<string, MarketPrice> = {};
  for (const line of text.trim().split(/\r?\n/).slice(1)) {
    const [raw, close] = line.split(",");
    const sym = back[(raw ?? "").trim().toUpperCase()];
    const price = Number(close);
    if (!sym || !(price > 0)) continue;
    const prev = priceCache[sym];
    const mp: MarketPrice = {
      price,
      change24h: prev?.change24h ?? 0,
      changePercent24h: prev?.changePercent24h ?? 0,
      lastUpdated: now,
    };
    priceCache[sym] = mp;
    result[sym] = mp;
  }
  return result;
}

/** Latest public print for listed equities and ETFs. A reference mark is used when no print returns. */
export async function fetchEquityPrints(symbols: string[]): Promise<Record<string, MarketPrice>> {
  const unique = [...new Set(symbols.map((s) => s.trim().toUpperCase()).filter(Boolean))];
  if (unique.length === 0) return {};
  const now = Date.now();
  if (now - lastEquityFetch < EQUITY_TTL) {
    const cached: Record<string, MarketPrice> = {};
    for (const sym of unique) if (priceCache[sym]) cached[sym] = priceCache[sym];
    if (Object.keys(cached).length > 0) return cached;
  }
  const chunks: string[][] = [];
  for (let i = 0; i < unique.length; i += 40) chunks.push(unique.slice(i, i + 40));
  const result: Record<string, MarketPrice> = {};
  for (let i = 0; i < chunks.length; i += 3) {
    const wave = chunks.slice(i, i + 3);
    const parts = await Promise.all(
      wave.map(async (chunk) => {
        try {
          const yahoo = await fetchYahooChunk(chunk);
          if (Object.keys(yahoo).length > 0) return yahoo;
        } catch {
          /* The quote host refused the browser. Try the second print. */
        }
        try {
          return await fetchStooqChunk(chunk);
        } catch {
          return {};
        }
      }),
    );
    for (const part of parts) Object.assign(result, part);
  }
  if (Object.keys(result).length > 0) lastEquityFetch = Date.now();
  return result;
}

/** Alpaca IEX snapshots via the Express desk API. Silent if the API is down. */
export async function fetchBrokerQuotes(
  symbols: string[],
): Promise<Record<string, MarketPrice>> {
  if (symbols.length === 0) return {};
  try {
    const { tradingAPI } = await import("./api");
    const { data } = await tradingAPI.getQuotes(symbols);
    const quotes = (data?.data?.quotes ?? {}) as Record<
      string,
      { last?: number; change?: number; changePercent?: number; timestamp?: string }
    >;
    const now = Date.now();
    const result: Record<string, MarketPrice> = {};
    for (const [sym, q] of Object.entries(quotes)) {
      if (!q.last || q.last <= 0) continue;
      const mp: MarketPrice = {
        price: q.last,
        change24h: q.change ?? 0,
        changePercent24h: q.changePercent ?? 0,
        lastUpdated: q.timestamp ? Date.parse(q.timestamp) || now : now,
      };
      priceCache[sym] = mp;
      result[sym] = mp;
    }
    return result;
  } catch {
    return {};
  }
}
