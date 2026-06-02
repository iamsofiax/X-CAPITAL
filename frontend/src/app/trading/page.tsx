"use client";

import { useState, useMemo } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  MissionPanel,
  RailLock,
  PhaseTrack,
  RailInfrastructureHeader,
} from "@/components/x-engine";
import AssetList from "@/components/trading/AssetList";
import OrderForm from "@/components/trading/OrderForm";
import { Badge } from "@/components/ui/Badge";
import { BarChart, Bar, ResponsiveContainer, Cell } from "recharts";
import { Satellite, BarChart3, Activity, Flame } from "lucide-react";
import { useMarketPrices } from "@/hooks/useMarketPrices";
import { formatPercent, cn } from "@/lib/utils";
import {
  FOUNDER_HOT_SIGNALS,
  FOUNDER_SIGNAL_ATTRIBUTION,
} from "@/lib/founderSignals";
import type { Asset } from "@/types";

const DEMO_ASSETS: Asset[] = [
  {
    id: "aapl",
    symbol: "AAPL",
    name: "Apple Inc.",
    type: "STOCK",
    price: 245.5,
    priceChange24h: 2.3,
    isTradable: true,
  },
  {
    id: "tsla",
    symbol: "TSLA",
    name: "Tesla Inc.",
    type: "STOCK",
    price: 387.2,
    priceChange24h: 1.8,
    isTradable: true,
  },
  {
    id: "nvda",
    symbol: "NVDA",
    name: "NVIDIA Corp.",
    type: "STOCK",
    price: 1204.85,
    priceChange24h: 4.2,
    isTradable: true,
  },
  {
    id: "btc",
    symbol: "BTC",
    name: "Bitcoin",
    type: "CRYPTO",
    price: 89420,
    priceChange24h: 3.1,
    isTradable: true,
  },
  {
    id: "eth",
    symbol: "ETH",
    name: "Ethereum",
    type: "CRYPTO",
    price: 4282,
    priceChange24h: 2.8,
    isTradable: true,
  },
  {
    id: "gld",
    symbol: "GLD",
    name: "SPDR Gold Shares",
    type: "ETF",
    price: 198.75,
    priceChange24h: 0.9,
    isTradable: true,
  },
  {
    id: "qqq",
    symbol: "QQQ",
    name: "Invesco QQQ Trust",
    type: "ETF",
    price: 543.2,
    priceChange24h: 3.5,
    isTradable: true,
  },
  {
    id: "xlink",
    symbol: "XLINK",
    name: "Starlink Growth Token",
    type: "TOKEN",
    price: 95.24,
    priceChange24h: 12.4,
    isTradable: true,
  },
];

const volumeData = [
  { time: "09:30", volume: 2400 },
  { time: "10:00", volume: 1398 },
  { time: "10:30", volume: 9800 },
  { time: "11:00", volume: 3908 },
  { time: "11:30", volume: 4800 },
  { time: "12:00", volume: 3800 },
  { time: "12:30", volume: 4300 },
];

const orderBookData = [
  { price: 95.5, size: 1200, side: "ask" },
  { price: 95.4, size: 850, side: "ask" },
  { price: 95.3, size: 2100, side: "ask" },
  { price: 95.24, size: 0, side: "mid" },
  { price: 95.18, size: 1800, side: "bid" },
  { price: 95.1, size: 950, side: "bid" },
  { price: 94.95, size: 2300, side: "bid" },
];

export default function TradingPage() {
  const [selectedAsset, setSelectedAsset] = useState<Asset>(DEMO_ASSETS[7]); // XLINK
  const { prices: livePrices } = useMarketPrices({ refreshInterval: 30000 });

  const assetWithLivePrice = useMemo(() => {
    const live = livePrices[selectedAsset?.symbol ?? ""];
    return live
      ? {
          ...selectedAsset,
          price: live.price,
          priceChange24h: live.changePercent24h,
        }
      : selectedAsset;
  }, [selectedAsset, livePrices]);

  const isPositive = (assetWithLivePrice?.priceChange24h ?? 0) >= 0;

  return (
    <DashboardLayout
      title="Execution"
      subtitle="Live order routing · XLINK mesh"
      wide
    >
      <RailLock rail="trading">
      <div className="space-y-8">
        <RailInfrastructureHeader rail="trading" />
        <MissionPanel
          title="XLINK"
          code="EXEC-01"
          headerRight={
            <span className="engine-mono text-[10px] text-emerald-400">LIVE</span>
          }
        >
          <div className="grid md:grid-cols-3 gap-6 items-start">
            <div>
              <p className="text-xs text-xc-muted font-bold mb-1">XLINK</p>
              <p className="text-3xl font-black text-white mb-1">
                ${assetWithLivePrice.price.toFixed(2)}
              </p>
              <p
                className={cn(
                  "text-sm font-bold flex items-center gap-1",
                  isPositive ? "text-emerald-400" : "text-red-400",
                )}
              >
                {isPositive ? "↑" : "↓"}{" "}
                {formatPercent(Number(assetWithLivePrice.priceChange24h ?? 0))} 24h
              </p>
            </div>
            <div className="node-panel-inset p-4">
              <p className="text-xs text-xc-muted font-bold mb-2">24h volume</p>
              <p className="text-2xl font-black text-emerald-400">$285.4M</p>
            </div>
            <div className="node-panel-inset p-4">
              <p className="text-xs text-xc-muted font-bold mb-2">Network cap</p>
              <p className="text-2xl font-black text-emerald-400">$4.2B</p>
            </div>
          </div>
        </MissionPanel>

        {/* Main Trading Layout */}
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Left: Asset List & Chart */}
          <div className="lg:col-span-2 space-y-4">
            {/* Charts Grid */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Volume Chart */}
              <div className="bg-xc-card border border-xc-border rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-black text-white text-sm">
                    Volume Trend
                  </h3>
                  <BarChart3 className="w-4 h-4 text-xc-muted" />
                </div>
                <div style={{ height: 160 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={volumeData}>
                      <Bar dataKey="volume" radius={[4, 4, 0, 0]}>
                        {volumeData.map((_, i) => (
                          <Cell
                            key={i}
                            fill={
                              i === volumeData.length - 1
                                ? "#10b981"
                                : "#7c3aed"
                            }
                            opacity={i === volumeData.length - 1 ? 0.9 : 0.4}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Order Book */}
              <div className="bg-xc-card border border-xc-border rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-black text-white text-sm">Order Book</h3>
                  <Activity className="w-4 h-4 text-xc-muted" />
                </div>
                <div className="space-y-1 text-xs">
                  {orderBookData.map((row, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex justify-between px-2 py-1 rounded",
                        row.side === "ask"
                          ? "bg-red-500/10"
                          : row.side === "bid"
                            ? "bg-emerald-500/10"
                            : "border-t border-b border-white/10",
                      )}
                    >
                      <span
                        className={
                          row.side === "ask"
                            ? "text-red-400"
                            : row.side === "bid"
                              ? "text-emerald-400"
                              : "text-white font-bold"
                        }
                      >
                        {row.price.toFixed(2)}
                      </span>
                      <span className="text-xc-muted">
                        {row.size.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Asset List */}
            <AssetList
              assets={DEMO_ASSETS}
              selectedAsset={selectedAsset}
              onSelectAsset={setSelectedAsset}
            />
          </div>

          {/* Right: Order Form */}
          <div>
            <OrderForm asset={assetWithLivePrice} />
          </div>
        </div>

        {/* HOT SIGNALS */}
        <div className="bg-xc-card border border-xc-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-400" />
              <h3 className="font-black text-white">Hot Signals</h3>
            </div>
            <Badge variant="default">{FOUNDER_SIGNAL_ATTRIBUTION}</Badge>
          </div>
          <div className="space-y-3">
            {FOUNDER_HOT_SIGNALS.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-white/[0.02] border border-white/[0.05] rounded-xl p-3"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-black text-white text-sm">
                      {item.symbol}
                    </span>
                    <span
                      className={cn(
                        "text-xs font-black px-2 py-0.5 rounded",
                        item.signal === "BUY"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : item.signal === "SELL"
                            ? "bg-red-500/20 text-red-400"
                            : "bg-amber-500/20 text-amber-400",
                      )}
                    >
                      {item.signal}
                    </span>
                  </div>
                  <p className="text-xs text-xc-muted">{item.reason}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-black text-white">
                    {item.strength}%
                  </p>
                  <div className="w-16 h-1 bg-white/10 rounded-full mt-1 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                      style={{ width: `${item.strength}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <PhaseTrack />
      </div>
      </RailLock>
    </DashboardLayout>
  );
}
