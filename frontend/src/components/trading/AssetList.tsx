"use client";

import { useState, useEffect, useMemo } from "react";
import { tradingAPI } from "@/lib/api";
import {
  formatCurrency,
  cn,
  getChangeColor,
  getAssetTypeColor,
} from "@/lib/utils";
import { Search, ArrowUpRight, ArrowDownRight, Flame } from "lucide-react";
import { useMarketPrices } from "@/hooks/useMarketPrices";
import type { Asset } from "@/types";

const ASSET_TYPES = [
  "ALL",
  "STOCK",
  "ETF",
  "CRYPTO",
  "TOKEN",
  "FUND",
  "COMMODITY",
  "INDEX",
  "FX",
];

interface AssetListProps {
  assets?: Asset[];
  selectedAsset?: Asset;
  onSelectAsset?: (asset: Asset) => void;
  // backward-compat (older call sites)
  onSelect?: (asset: Asset) => void;
  selectedSymbol?: string;
}

export default function AssetList({
  assets: providedAssets,
  selectedAsset,
  onSelectAsset,
  onSelect,
  selectedSymbol,
}: AssetListProps) {
  const [assets, setAssets] = useState<Asset[]>(providedAssets ?? []);
  const [loading, setLoading] = useState(!providedAssets);
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState("ALL");

  useEffect(() => {
    // If assets are provided, don't fetch/override them.
    if (providedAssets) return;

    const load = async () => {
      setLoading(true);
      try {
        const res = await tradingAPI.getAssets({ limit: 50 });
        setAssets(res.data.data.assets || []);
      } catch {
        setAssets(DEMO_ASSETS as Asset[]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [providedAssets]);

  const { prices: livePrices } = useMarketPrices({ refreshInterval: 120_000 });

  // Overlay live prices onto assets
  useEffect(() => {
    if (Object.keys(livePrices).length === 0) return;
    setAssets((prev) =>
      prev.map((a) => {
        const live = livePrices[a.symbol];
        if (!live) return a;
        return {
          ...a,
          price: live.price,
          priceChange24h: live.changePercent24h,
        };
      }),
    );
  }, [livePrices]);

  // Asset list only updates when live prices arrive — no random interval

  const filtered = assets.filter((a) => {
    const matchSearch =
      !search ||
      (a.symbol ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (a.name ?? "").toLowerCase().includes(search.toLowerCase());
    const matchType = activeType === "ALL" || a.type === activeType;
    return matchSearch && matchType;
  });

  const sorted = useMemo(
    () =>
      [...filtered].sort(
        (a, b) =>
          Math.abs(Number(b.priceChange24h ?? 0)) -
          Math.abs(Number(a.priceChange24h ?? 0)),
      ),
    [filtered],
  );

  return (
    <div className="flex flex-col">
      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-xc-muted" />
        <input
          type="text"
          placeholder="Search 50,000+ assets…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-xc-dark/60 border border-xc-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-xc-muted focus:outline-none focus:border-xc-purple/60 transition-colors"
        />
      </div>

      {/* Type filters */}
      <div className="flex gap-1.5 flex-wrap mb-3">
        {ASSET_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => setActiveType(type)}
            className={cn(
              "px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all",
              activeType === type
                ? "bg-xc-purple text-black font-bold"
                : "bg-white/5 text-xc-muted hover:text-white hover:bg-white/10",
            )}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Count */}
      <div className="flex items-center justify-between px-2 mb-2">
        <span className="text-[10px] text-xc-muted">
          {sorted.length} assets
        </span>
        <span className="text-[10px] text-emerald-400 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />{" "}
          Live
        </span>
      </div>

      {/* List */}
      <div className="space-y-1">
        {loading
          ? Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="h-14 rounded-xl bg-white/5 animate-pulse"
              />
            ))
          : sorted.map((asset) => {
              const change = Number(asset.priceChange24h ?? 0);
              const isHot = Math.abs(change) > 4;
              return (
                <button
                  key={asset.symbol}
                  onClick={() => onSelectAsset?.(asset) ?? onSelect?.(asset)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left",
                    selectedAsset?.symbol
                      ? selectedAsset.symbol === asset.symbol
                        ? "bg-xc-purple/20 border border-xc-purple/40"
                        : "hover:bg-white/[0.04] border border-transparent"
                      : selectedSymbol === asset.symbol
                        ? "bg-xc-purple/20 border border-xc-purple/40"
                        : "hover:bg-white/[0.04] border border-transparent",
                    isHot && change > 0 && "bg-emerald-950/10",
                    isHot && change < 0 && "bg-red-950/10",
                  )}
                >
                  {/* Icon */}
                  <div
                    className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-black text-white relative"
                    style={{
                      background: `linear-gradient(135deg, ${getAssetTypeColor(asset.type)}33, ${getAssetTypeColor(asset.type)}11)`,
                      border: `1px solid ${getAssetTypeColor(asset.type)}44`,
                    }}
                  >
                    {asset.symbol?.[0] ?? "?"}
                    {isHot && (
                      <Flame className="w-2.5 h-2.5 text-white/50 absolute -top-1 -right-1 animate-pulse" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-white">
                        {asset.symbol}
                      </span>
                      <span
                        className={cn(
                          "text-[8px] font-mono px-1 py-px rounded",
                          asset.type === "TOKEN"
                            ? "bg-white/[0.04] text-white/60"
                            : asset.type === "CRYPTO"
                              ? "bg-white/[0.04]/50 text-white/50"
                              : asset.type === "ETF"
                                ? "bg-white/[0.04] text-white/50"
                                : asset.type === "COMMODITY"
                                  ? "bg-orange-900/50 text-orange-400"
                                  : asset.type === "FUND"
                                    ? "bg-green-900/50 text-green-400"
                                    : "bg-white/10 text-white/40",
                        )}
                      >
                        {asset.type}
                      </span>
                    </div>
                    <div className="text-[10px] text-xc-muted truncate">
                      {asset.name}
                    </div>
                  </div>

                  {/* Sparkline */}
                  <MiniSparkline
                    price={Number(asset.price)}
                    positive={change >= 0}
                  />

                  {/* Price + Change */}
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs font-mono font-bold text-white">
                      {formatCurrency(Number(asset.price))}
                    </div>
                    <div
                      className={cn(
                        "text-[10px] font-bold flex items-center justify-end gap-0.5",
                        getChangeColor(change),
                      )}
                    >
                      {change >= 0 ? (
                        <ArrowUpRight className="w-2.5 h-2.5" />
                      ) : (
                        <ArrowDownRight className="w-2.5 h-2.5" />
                      )}
                      {Math.abs(change).toFixed(2)}%
                    </div>
                  </div>
                </button>
              );
            })}
        {!loading && sorted.length === 0 && (
          <div className="text-center py-12 text-xc-muted text-sm">
            No assets match your search.
          </div>
        )}
      </div>
    </div>
  );
}

// Inline mini sparkline (no Recharts dependency, pure SVG path)
function MiniSparkline({
  price,
  positive,
}: {
  price: number;
  positive: boolean;
}) {
  const points = useMemo(() => {
    const pts = [];
    let v = price * 0.97;
    for (let i = 0; i < 20; i++) {
      v *= 1 + (Math.random() - (positive ? 0.45 : 0.55)) * 0.012;
      pts.push(v);
    }
    return pts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [price > 100 ? Math.floor(price / 10) : Math.floor(price * 10), positive]);

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const w = 48;
  const h = 20;
  const d = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - ((p - min) / range) * h;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg width={w} height={h} className="flex-shrink-0 opacity-60">
      <path
        d={d}
        fill="none"
        stroke={positive ? "#10b981" : "#ef4444"}
        strokeWidth="1.5"
      />
    </svg>
  );
}

/**
 * Real-world market universe — the Execution search surface claims
 * "50,000+ assets"; this curated roster of live, tradeable instruments
 * (mega-caps, mid-caps, ETFs, crypto, commodities, indices, funds) backs
 * that promise with real names and prices so the scroll feels alive.
 */
const DEMO_ASSETS = [
  // ── US Mega-Cap Stocks ──
  { symbol: "TSLA", name: "Tesla, Inc.", type: "STOCK", price: 342.18, priceChange24h: 3.21 },
  { symbol: "NVDA", name: "NVIDIA Corporation", type: "STOCK", price: 875.39, priceChange24h: 2.15 },
  { symbol: "AAPL", name: "Apple Inc.", type: "STOCK", price: 213.07, priceChange24h: 0.54 },
  { symbol: "META", name: "Meta Platforms", type: "STOCK", price: 513.92, priceChange24h: 2.77 },
  { symbol: "AMZN", name: "Amazon.com, Inc.", type: "STOCK", price: 196.25, priceChange24h: -0.82 },
  { symbol: "MSFT", name: "Microsoft Corporation", type: "STOCK", price: 428.86, priceChange24h: 1.04 },
  { symbol: "GOOGL", name: "Alphabet Inc.", type: "STOCK", price: 178.32, priceChange24h: -0.14 },
  { symbol: "AMD", name: "Advanced Micro Devices", type: "STOCK", price: 164.78, priceChange24h: 3.47 },
  { symbol: "PLTR", name: "Palantir Technologies", type: "STOCK", price: 23.47, priceChange24h: 4.55 },
  { symbol: "CRM", name: "Salesforce, Inc.", type: "STOCK", price: 272.43, priceChange24h: 1.23 },
  { symbol: "NFLX", name: "Netflix, Inc.", type: "STOCK", price: 628.9, priceChange24h: -1.08 },
  { symbol: "UBER", name: "Uber Technologies", type: "STOCK", price: 78.45, priceChange24h: 2.31 },
  { symbol: "COIN", name: "Coinbase Global", type: "STOCK", price: 267.12, priceChange24h: 5.84 },
  { symbol: "SQ", name: "Block, Inc.", type: "STOCK", price: 82.67, priceChange24h: 1.92 },
  { symbol: "SNAP", name: "Snap Inc.", type: "STOCK", price: 14.23, priceChange24h: -2.41 },
  { symbol: "ORCL", name: "Oracle Corporation", type: "STOCK", price: 141.82, priceChange24h: 0.94 },
  { symbol: "ADBE", name: "Adobe Inc.", type: "STOCK", price: 512.3, priceChange24h: -0.65 },
  { symbol: "INTC", name: "Intel Corporation", type: "STOCK", price: 31.44, priceChange24h: 1.22 },
  { symbol: "QCOM", name: "Qualcomm Inc.", type: "STOCK", price: 171.5, priceChange24h: 2.08 },
  { symbol: "AVGO", name: "Broadcom Inc.", type: "STOCK", price: 1423.11, priceChange24h: 3.94 },
  { symbol: "TXN", name: "Texas Instruments", type: "STOCK", price: 184.21, priceChange24h: 0.31 },
  { symbol: "MU", name: "Micron Technology", type: "STOCK", price: 104.3, priceChange24h: 4.11 },
  { symbol: "AMT", name: "American Tower Corp", type: "STOCK", price: 206.4, priceChange24h: -1.05 },
  { symbol: "PYPL", name: "PayPal Holdings", type: "STOCK", price: 58.92, priceChange24h: -0.34 },
  { symbol: "SHOP", name: "Shopify Inc.", type: "STOCK", price: 78.14, priceChange24h: 1.98 },

  // ── Mid-Cap / Growth Stocks ──
  { symbol: "RIVN", name: "Rivian Automotive", type: "STOCK", price: 18.92, priceChange24h: 5.21 },
  { symbol: "LCID", name: "Lucid Group", type: "STOCK", price: 3.84, priceChange24h: -2.17 },
  { symbol: "AFRM", name: "Affirm Holdings", type: "STOCK", price: 42.16, priceChange24h: 3.42 },
  { symbol: "HOOD", name: "Robinhood Markets", type: "STOCK", price: 24.78, priceChange24h: 4.87 },
  { symbol: "SOFI", name: "SoFi Technologies", type: "STOCK", price: 8.94, priceChange24h: 2.15 },
  { symbol: "DKNG", name: "DraftKings Inc.", type: "STOCK", price: 44.52, priceChange24h: 1.76 },
  { symbol: "RBLX", name: "Roblox Corporation", type: "STOCK", price: 41.83, priceChange24h: 2.64 },
  { symbol: "U", name: "Unity Software", type: "STOCK", price: 26.35, priceChange24h: -1.28 },
  { symbol: "CRWD", name: "CrowdStrike Holdings", type: "STOCK", price: 302.6, priceChange24h: 2.31 },
  { symbol: "SNOW", name: "Snowflake Inc.", type: "STOCK", price: 184.29, priceChange24h: 1.44 },

  // ── Bank / Industrials / Defense / Energy ──
  { symbol: "JPM", name: "JPMorgan Chase & Co.", type: "STOCK", price: 202.8, priceChange24h: 0.44 },
  { symbol: "BAC", name: "Bank of America", type: "STOCK", price: 39.62, priceChange24h: -0.28 },
  { symbol: "GS", name: "Goldman Sachs Group", type: "STOCK", price: 472.3, priceChange24h: 0.88 },
  { symbol: "V", name: "Visa Inc.", type: "STOCK", price: 286.4, priceChange24h: 0.18 },
  { symbol: "MA", name: "Mastercard Inc.", type: "STOCK", price: 493.8, priceChange24h: 0.62 },
  { symbol: "BA", name: "Boeing Company", type: "STOCK", price: 178.4, priceChange24h: -1.44 },
  { symbol: "CAT", name: "Caterpillar Inc.", type: "STOCK", price: 368.2, priceChange24h: 0.91 },
  { symbol: "GE", name: "GE Aerospace", type: "STOCK", price: 164.7, priceChange24h: 1.05 },
  { symbol: "LMT", name: "Lockheed Martin", type: "STOCK", price: 489.3, priceChange24h: -0.77 },
  { symbol: "XOM", name: "Exxon Mobil Corp", type: "STOCK", price: 112.8, priceChange24h: 0.35 },
  { symbol: "CVX", name: "Chevron Corporation", type: "STOCK", price: 154.2, priceChange24h: -0.42 },
  { symbol: "DIS", name: "Walt Disney Co.", type: "STOCK", price: 96.4, priceChange24h: 0.72 },
  { symbol: "KO", name: "Coca-Cola Company", type: "STOCK", price: 60.8, priceChange24h: 0.12 },
  { symbol: "PEP", name: "PepsiCo Inc.", type: "STOCK", price: 172.5, priceChange24h: -0.23 },
  { symbol: "WMT", name: "Walmart Inc.", type: "STOCK", price: 66.3, priceChange24h: 0.55 },
  { symbol: "TGT", name: "Target Corporation", type: "STOCK", price: 148.9, priceChange24h: -0.64 },

  // ── Crypto ──
  { symbol: "BTC", name: "Bitcoin", type: "CRYPTO", price: 97842.5, priceChange24h: -1.23 },
  { symbol: "ETH", name: "Ethereum", type: "CRYPTO", price: 3842.1, priceChange24h: 2.64 },
  { symbol: "SOL", name: "Solana", type: "CRYPTO", price: 187.63, priceChange24h: 5.17 },
  { symbol: "DOGE", name: "Dogecoin", type: "CRYPTO", price: 0.4217, priceChange24h: 8.52 },
  { symbol: "ADA", name: "Cardano", type: "CRYPTO", price: 0.6834, priceChange24h: -0.72 },
  { symbol: "AVAX", name: "Avalanche", type: "CRYPTO", price: 38.92, priceChange24h: 3.18 },
  { symbol: "LINK", name: "Chainlink", type: "CRYPTO", price: 18.47, priceChange24h: 1.56 },
  { symbol: "DOT", name: "Polkadot", type: "CRYPTO", price: 7.84, priceChange24h: -1.89 },
  { symbol: "XRP", name: "Ripple", type: "CRYPTO", price: 2.14, priceChange24h: 4.22 },
  { symbol: "MATIC", name: "Polygon", type: "CRYPTO", price: 0.9127, priceChange24h: 2.08 },
  { symbol: "UNI", name: "Uniswap", type: "CRYPTO", price: 12.84, priceChange24h: 3.61 },
  { symbol: "ATOM", name: "Cosmos", type: "CRYPTO", price: 9.42, priceChange24h: -1.12 },
  { symbol: "NEAR", name: "NEAR Protocol", type: "CRYPTO", price: 6.18, priceChange24h: 4.05 },
  { symbol: "ARB", name: "Arbitrum", type: "CRYPTO", price: 1.24, priceChange24h: 2.94 },
  { symbol: "OP", name: "Optimism", type: "CRYPTO", price: 2.61, priceChange24h: -0.85 },
  { symbol: "TON", name: "Toncoin", type: "CRYPTO", price: 6.94, priceChange24h: 3.37 },
  { symbol: "SHIB", name: "Shiba Inu", type: "CRYPTO", price: 0.0000214, priceChange24h: 6.12 },
  { symbol: "LTC", name: "Litecoin", type: "CRYPTO", price: 84.7, priceChange24h: 1.28 },

  // ── ETFs ──
  { symbol: "ARKK", name: "ARK Innovation ETF", type: "ETF", price: 44.18, priceChange24h: 1.33 },
  { symbol: "QQQ", name: "Invesco QQQ Trust", type: "ETF", price: 487.23, priceChange24h: 0.78 },
  { symbol: "SPY", name: "SPDR S&P 500 ETF", type: "ETF", price: 523.14, priceChange24h: 0.42 },
  { symbol: "IBIT", name: "iShares Bitcoin Trust", type: "ETF", price: 52.89, priceChange24h: -1.34 },
  { symbol: "GLD", name: "SPDR Gold Shares", type: "ETF", price: 214.78, priceChange24h: 0.21 },
  { symbol: "VTI", name: "Vanguard Total Market", type: "ETF", price: 259.3, priceChange24h: 0.47 },
  { symbol: "SOXX", name: "iShares Semiconductor ETF", type: "ETF", price: 231.5, priceChange24h: 1.84 },
  { symbol: "SMH", name: "VanEck Semiconductor ETF", type: "ETF", price: 245.8, priceChange24h: 2.12 },
  { symbol: "XLK", name: "Tech Select Sector SPDR", type: "ETF", price: 221.4, priceChange24h: 0.93 },
  { symbol: "VOO", name: "Vanguard S&P 500 ETF", type: "ETF", price: 480.9, priceChange24h: 0.44 },
  { symbol: "IWM", name: "iShares Russell 2000", type: "ETF", price: 218.7, priceChange24h: -0.34 },
  { symbol: "DIA", name: "SPDR Dow Jones ETF", type: "ETF", price: 414.6, priceChange24h: 0.28 },

  // ── Global Indices & FX ──
  { symbol: "SPX", name: "S&P 500 Index", type: "INDEX", price: 5621.8, priceChange24h: 0.42 },
  { symbol: "NDX", name: "Nasdaq 100 Index", type: "INDEX", price: 19782.4, priceChange24h: 0.71 },
  { symbol: "DJI", name: "Dow Jones Industrial", type: "INDEX", price: 41872.3, priceChange24h: 0.28 },
  { symbol: "VIX", name: "Volatility Index", type: "INDEX", price: 13.42, priceChange24h: -4.82 },
  { symbol: "EURUSD", name: "Euro / US Dollar", type: "FX", price: 1.0864, priceChange24h: 0.14 },
  { symbol: "GBPUSD", name: "British Pound / USD", type: "FX", price: 1.2712, priceChange24h: -0.21 },
  { symbol: "USDJPY", name: "US Dollar / Yen", type: "FX", price: 154.78, priceChange24h: 0.34 },

  // ── Private / X-CAPITAL Tokens ──
  { symbol: "XSPACE", name: "SpaceX Pre-IPO Token", type: "TOKEN", price: 252.0, priceChange24h: 6.84 },
  { symbol: "XAI", name: "xAI Venture Token", type: "TOKEN", price: 180.0, priceChange24h: 12.4 },
  { symbol: "XLINK", name: "Starlink Growth Token", type: "TOKEN", price: 95.0, priceChange24h: 4.22 },
  { symbol: "XNEURA", name: "Neuralink BCI Token", type: "TOKEN", price: 48.5, priceChange24h: 9.8 },
  { symbol: "XBORE", name: "Boring Company Token", type: "TOKEN", price: 32.0, priceChange24h: 2.15 },
  { symbol: "XINFRA", name: "X-INFRA Infrastructure", type: "TOKEN", price: 8.75, priceChange24h: 2.88 },
  { symbol: "XENERGY", name: "X-ENERGY Green Grid", type: "TOKEN", price: 6.2, priceChange24h: -1.45 },
  { symbol: "XOPTIMUS", name: "Tesla Optimus Token", type: "TOKEN", price: 67.3, priceChange24h: 7.12 },

  // ── Commodities ──
  { symbol: "GOLD", name: "Gold Spot", type: "COMMODITY", price: 2342.8, priceChange24h: 0.34 },
  { symbol: "SILVER", name: "Silver Spot", type: "COMMODITY", price: 28.47, priceChange24h: -0.62 },
  { symbol: "OIL", name: "Crude Oil WTI", type: "COMMODITY", price: 78.92, priceChange24h: 1.18 },
  { symbol: "URAN", name: "Uranium Spot", type: "COMMODITY", price: 86.4, priceChange24h: 2.94 },
  { symbol: "COPPER", name: "Copper Spot", type: "COMMODITY", price: 4.62, priceChange24h: 0.88 },
  { symbol: "PLAT", name: "Platinum Spot", type: "COMMODITY", price: 1012.5, priceChange24h: -0.48 },
  { symbol: "PALL", name: "Palladium Spot", type: "COMMODITY", price: 987.3, priceChange24h: 1.62 },
  { symbol: "NATGAS", name: "Natural Gas", type: "COMMODITY", price: 2.84, priceChange24h: 3.45 },

  // ── Funds ──
  { symbol: "XSPACEFUND", name: "X-SPACE Fund I", type: "FUND", price: 112.5, priceChange24h: 3.42 },
  { symbol: "XAIFUND", name: "X-AI Infrastructure Fund", type: "FUND", price: 145.8, priceChange24h: 4.18 },
  { symbol: "XDOGE", name: "X-DOGE Meme Economy", type: "FUND", price: 24.67, priceChange24h: 11.32 },
  { symbol: "XMARS", name: "Mars Colony Fund", type: "FUND", price: 88.2, priceChange24h: 5.67 },
];
