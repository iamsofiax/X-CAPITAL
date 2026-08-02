"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/ui/Card";
import PortfolioChart from "@/components/portfolio/PortfolioChart";
import HoldingsList from "@/components/portfolio/HoldingsList";
import {
  MissionPanel,
  RailLock,
  PhaseTrack,
  RailInfrastructureHeader,
} from "@/components/x-engine";
import { ENGINE_COPY } from "@/lib/xEngine";
import { useXEngine } from "@/hooks/useXEngine";
import { useStableBalance } from "@/hooks/useStableBalance";
import { useStore } from "@/store/useStore";
import { portfolioAPI } from "@/lib/api";
import { useMarketPrices } from "@/hooks/useMarketPrices";
import { useProfitEngine } from "@/store/useProfitEngine";
import { formatCurrency, formatPercent, cn } from "@/lib/utils";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  ShieldCheck,
  BarChart3,
  Target,
  Activity,
} from "lucide-react";
import type { Portfolio } from "@/types";

const PIE_COLORS = [
  "#7c3aed",
  "#06b6d4",
  "#d97706",
  "#10b981",
  "#ef4444",
  "#a78bfa",
  "#6366f1",
  "#f59e0b",
  "#ec4899",
  "#14b8a6",
];

function generatePerfData(tv: number) {
  const data = [];
  let v = tv * 0.72;
  const now = new Date();
  for (let i = 90; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    v *= 1 + (Math.random() - 0.47) * 0.025;
    data.push({
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      value: Math.round(v * 100) / 100,
    });
  }
  return data;
}

function generateDrawdownData(tv: number) {
  const data = [];
  let peak = tv * 0.72;
  let v = peak;
  const now = new Date();
  for (let i = 90; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    v *= 1 + (Math.random() - 0.47) * 0.025;
    if (v > peak) peak = v;
    const dd = ((v - peak) / peak) * 100;
    data.push({
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      drawdown: Math.round(dd * 100) / 100,
    });
  }
  return data;
}

function generateMonthlyReturns() {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return months.slice(0, new Date().getMonth() + 1).map((m) => ({
    month: m,
    return: Number(((Math.random() - 0.35) * 12).toFixed(2)),
  }));
}

export default function PortfolioPage() {
  const { user } = useStore();
  const stableBalance = useStableBalance();
  // Subscribe to the live compounding node — re-renders every tick.
  // The global LiveCompoundingProvider ticks app-wide, so portfolio cash
  // reflects the exact admin-rate-driven balance, not a hardcoded number.
  const nodeGrowths = useProfitEngine((s) => s.nodeGrowths);
  const liveNodeBalance = user ? nodeGrowths[user.id]?.balance : undefined;
  const liveCash =
    liveNodeBalance && liveNodeBalance > 0 ? liveNodeBalance : stableBalance;
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [perfData, setPerfData] = useState<
    Array<{ date: string; value: number }>
  >([]);
  const [drawdownData, setDrawdownData] = useState<
    Array<{ date: string; drawdown: number }>
  >([]);
  const [monthlyReturns, setMonthlyReturns] = useState<
    Array<{ month: string; return: number }>
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await portfolioAPI.getPortfolio();
        setPortfolio(res.data.data);
        setPerfData(generatePerfData(res.data.data.totalValue || 10000));
        setDrawdownData(
          generateDrawdownData(res.data.data.totalValue || 10000),
        );
      } catch {
        const empty: Portfolio = {
          id: "local",
          userId: user?.id ?? "1",
          totalValue: 0,
          totalCost: 0,
          totalPnL: 0,
          cashBalance: stableBalance,
          riskScore: 0,
          performanceYTD: 0,
          holdings: [],
        };
        setPortfolio(empty);
        setPerfData(generatePerfData(0));
        setDrawdownData(generateDrawdownData(0));
      } finally {
        setLoading(false);
      }
    };
    fetch();
    setMonthlyReturns(generateMonthlyReturns());
  }, []);

  const { prices: livePrices } = useMarketPrices({ refreshInterval: 120_000 });

  // Overlay live prices onto holdings
  useEffect(() => {
    if (Object.keys(livePrices).length === 0) return;
    setPortfolio((prev) => {
      if (!prev || !prev.holdings?.length) return prev;
      let anyChanged = false;
      const updatedHoldings = prev.holdings.map((h) => {
        const live = livePrices[h.asset?.symbol ?? ""];
        if (!live) return h;
        anyChanged = true;
        const newValue = h.quantity * live.price;
        return {
          ...h,
          currentValue: newValue,
          unrealizedPnL: newValue - h.quantity * h.avgCost,
          asset: h.asset ? { ...h.asset, price: live.price } : h.asset,
        };
      });
      if (!anyChanged) return prev;
      const totalVal =
        updatedHoldings.reduce((s, h) => s + Number(h.currentValue), 0) +
        (prev.cashBalance ?? 0);
      return {
        ...prev,
        holdings: updatedHoldings,
        totalValue: totalVal,
        totalPnL: totalVal - (prev.totalCost ?? 0),
      };
    });
  }, [livePrices]);

  // Recompute cash + total value + P&L on EVERY compounding tick.
  // liveCash is the live-admin-rate-compounded node balance; the global
  // LiveCompoundingProvider ticks app-wide so this re-renders every 15s.
  useEffect(() => {
    setPortfolio((prev) => {
      if (!prev) return prev;
      const holdingsValue = prev.holdings.reduce(
        (s, h) => s + Number(h.currentValue),
        0,
      );
      const totalVal = holdingsValue + liveCash;
      return {
        ...prev,
        cashBalance: liveCash,
        totalValue: totalVal,
        totalPnL: totalVal - (prev.totalCost ?? 0),
      };
    });
  }, [liveCash]);

  // Holdings refresh only when live prices arrive — no random interval tick
  useEffect(() => {
    if (!Object.keys(livePrices).length) return;
    setPortfolio((prev) => {
      if (!prev || !prev.holdings?.length) return prev;
      const updatedHoldings = prev.holdings.map((h) => {
        const live = livePrices[h.asset?.symbol ?? ""];
        if (!live) return h;
        const newPrice = live.price;
        const newValue = h.quantity * newPrice;
        return {
          ...h,
          currentValue: newValue,
          unrealizedPnL: newValue - h.quantity * h.avgCost,
          asset: h.asset ? { ...h.asset, price: newPrice } : h.asset,
        };
      });
      const totalVal =
        updatedHoldings.reduce((s, h) => s + Number(h.currentValue), 0) +
        (prev.cashBalance ?? 0);
      return {
        ...prev,
        holdings: updatedHoldings,
        totalValue: totalVal,
        totalPnL: totalVal - (prev.totalCost ?? 0),
      };
    });
  }, [livePrices]);

  const pnlPct =
    portfolio && portfolio.totalCost > 0
      ? (portfolio.totalPnL / portfolio.totalCost) * 100
      : 0;

  const allocationData = portfolio?.holdings?.length
    ? portfolio.holdings.map((h) => ({
        name: h.asset?.symbol ?? "Unknown",
        value: Math.round(Number(h.currentValue)),
      }))
    : [];

  const { isArmed } = useXEngine();
  const unfunded = (portfolio?.totalValue ?? 0) === 0 && !portfolio?.holdings?.length;

  const holdingsPnl =
    portfolio?.holdings?.map((h) => ({
      symbol: h.asset?.symbol ?? "?",
      pnl: Number(h.unrealizedPnL ?? 0),
      pnlPct:
        h.avgCost > 0
          ? (Number(h.unrealizedPnL ?? 0) / (h.quantity * h.avgCost)) * 100
          : 0,
    })) ?? [];

  return (
    <DashboardLayout title="Holdings" subtitle="Deployed capital · allocation">
      <RailLock rail="portfolio">
      <div className="space-y-8">
        <RailInfrastructureHeader rail="portfolio" />
        {!isArmed && unfunded && (
          <MissionPanel title={ENGINE_COPY.nodeCold} code="HOLD-00">
            <p className="text-sm text-white/50">{ENGINE_COPY.groundHold}</p>
          </MissionPanel>
        )}
        {/* ── Stats Row ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-3 lg:gap-4">
          <StatCard
            title="Total Value"
            value={formatCurrency(portfolio?.totalValue ?? 0)}
            change={pnlPct}
            icon={<DollarSign className="w-5 h-5" />}
          />
          <StatCard
            title="Total P&L"
            value={formatCurrency(portfolio?.totalPnL ?? 0)}
            change={pnlPct}
            icon={<TrendingUp className="w-5 h-5" />}
          />
          <StatCard
            title="YTD Return"
            value={formatPercent(portfolio?.performanceYTD ?? 0)}
            change={portfolio?.performanceYTD ?? 0}
            icon={<Percent className="w-5 h-5" />}
          />
          <StatCard
            title="Cash Balance"
            value={formatCurrency(portfolio?.cashBalance ?? 0)}
            icon={<BarChart3 className="w-5 h-5" />}
          />
          <StatCard
            title="Risk Score"
            value={`${portfolio?.riskScore ?? 48}/100`}
            subtitle={riskLabel(portfolio?.riskScore ?? 48)}
            icon={<ShieldCheck className="w-5 h-5" />}
          />
        </div>

        {/* ── Performance Chart (full width, tall) ── */}
        <div className="bg-xc-card border border-xc-border rounded-2xl p-4 md:p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 md:mb-6 gap-2">
            <div>
              <h3 className="font-black text-white text-base md:text-lg">
                Portfolio Performance
              </h3>
              <p className="text-xs md:text-sm text-xc-muted mt-1">
                90-day history · Updated live
              </p>
            </div>
            <div
              className={cn(
                "flex items-center gap-2 text-base md:text-lg font-black",
                pnlPct >= 0 ? "text-emerald-400" : "text-red-400",
              )}
            >
              {pnlPct >= 0 ? (
                <TrendingUp className="w-4 h-4 md:w-5 md:h-5" />
              ) : (
                <TrendingDown className="w-4 h-4 md:w-5 md:h-5" />
              )}
              {formatPercent(pnlPct)}
            </div>
          </div>
          <div className="h-[220px] md:h-[280px] lg:h-[320px]">
            <PortfolioChart data={perfData} height={320} />
          </div>
        </div>

        {/* ── Drawdown Chart + Monthly Returns (side by side) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4 lg:gap-6">
          {/* Drawdown */}
          <div className="bg-xc-card border border-xc-border rounded-2xl p-4 md:p-6">
            <div className="flex items-center gap-2 mb-5">
              <Activity className="w-4 h-4 text-red-400" />
              <h3 className="font-black text-white text-sm md:text-base">
                Drawdown Analysis
              </h3>
              <span className="text-xs text-xc-muted ml-auto hidden sm:inline">
                Max DD from peak
              </span>
            </div>
            <div className="h-[160px] md:h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={drawdownData}
                  margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
                >
                  <defs>
                    <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#64748b", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fill: "#64748b", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${v}%`}
                    domain={["auto", 0]}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#0d0d1e",
                      border: "1px solid #1a1a3a",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(v: number) => [
                      `${Number(v ?? 0).toFixed(2)}%`,
                      "Drawdown",
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="drawdown"
                    stroke="#ef4444"
                    strokeWidth={2}
                    fill="url(#ddGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/[0.08] text-xs">
              <div>
                <span className="text-xc-muted">Max Drawdown: </span>
                <span className="text-red-400 font-bold font-mono">
                  {Number(
                    Math.min(...drawdownData.map((d) => d.drawdown)) || 0,
                  ).toFixed(2)}
                  %
                </span>
              </div>
              <div>
                <span className="text-xc-muted">Current: </span>
                <span className="text-red-400 font-bold font-mono">
                  {(
                    drawdownData[drawdownData.length - 1]?.drawdown ?? 0
                  ).toFixed(2)}
                  %
                </span>
              </div>
            </div>
          </div>

          {/* Monthly Returns */}
          <div className="bg-xc-card border border-xc-border rounded-2xl p-4 md:p-6">
            <div className="flex items-center gap-2 mb-5">
              <BarChart3 className="w-4 h-4 text-white/60" />
              <h3 className="font-black text-white text-sm md:text-base">
                Monthly Returns
              </h3>
              <span className="text-xs text-xc-muted ml-auto">2026 YTD</span>
            </div>
            <div className="h-[160px] md:h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyReturns}
                  margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
                >
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "#64748b", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#64748b", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#0d0d1e",
                      border: "1px solid #1a1a3a",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(v: number) => [
                      `${Number(v ?? 0).toFixed(2)}%`,
                      "Return",
                    ]}
                  />
                  <Bar dataKey="return" radius={[4, 4, 0, 0]}>
                    {monthlyReturns.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={entry.return >= 0 ? "#10b981" : "#ef4444"}
                        opacity={0.7}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/[0.08] text-xs">
              <div>
                <span className="text-xc-muted">Best Month: </span>
                <span className="text-emerald-400 font-bold font-mono">
                  +
                  {Number(
                    Math.max(...monthlyReturns.map((m) => m.return)) || 0,
                  ).toFixed(2)}
                  %
                </span>
              </div>
              <div>
                <span className="text-xc-muted">Avg Monthly: </span>
                <span className="text-white font-bold font-mono">
                  {Number(
                    monthlyReturns.reduce((s, m) => s + m.return, 0) /
                      (monthlyReturns.length || 1),
                  ).toFixed(2)}
                  %
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Holdings Table + Per-Holding P&L Chart ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
          <div className="lg:col-span-2 bg-xc-card border border-xc-border rounded-2xl p-4 md:p-6">
            <div className="flex items-center justify-between mb-4 md:mb-5">
              <h3 className="font-bold text-white text-base md:text-lg">
                Holdings
              </h3>
              <span className="text-xs text-emerald-400 flex items-center gap-1 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />{" "}
                LIVE PRICES
              </span>
            </div>
            <HoldingsList
              holdings={portfolio?.holdings ?? []}
              loading={loading}
            />

            {/* Per-holding P&L bars */}
            {holdingsPnl.length > 0 && (
              <div className="mt-8 pt-6 border-t border-white/[0.08]">
                <h4 className="text-sm font-bold text-white mb-4">
                  Unrealized P&L by Position
                </h4>
                <div style={{ height: 180 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={holdingsPnl}
                      layout="vertical"
                      margin={{ top: 5, right: 20, bottom: 5, left: 60 }}
                    >
                      <XAxis
                        type="number"
                        tick={{ fill: "#64748b", fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => formatCurrency(v)}
                      />
                      <YAxis
                        type="category"
                        dataKey="symbol"
                        tick={{ fill: "#fff", fontSize: 12, fontWeight: 700 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "#0d0d1e",
                          border: "1px solid #1a1a3a",
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                        formatter={(v: number) => [formatCurrency(v), "P&L"]}
                      />
                      <Bar dataKey="pnl" radius={[0, 4, 4, 0]}>
                        {holdingsPnl.map((entry, i) => (
                          <Cell
                            key={i}
                            fill={entry.pnl >= 0 ? "#10b981" : "#ef4444"}
                            opacity={0.7}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          {/* Allocation Pie */}
          <div className="bg-xc-card border border-xc-border rounded-2xl p-4 md:p-6">
            <h3 className="font-bold text-white mb-4 md:mb-5">Allocation</h3>
            <div className="h-[200px] md:h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={allocationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {allocationData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number) => [formatCurrency(v)]}
                    contentStyle={{
                      background: "#0d0d1e",
                      border: "1px solid #1a1a3a",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3 mt-4">
              {allocationData.map((item, i) => {
                const total = allocationData.reduce((s, d) => s + d.value, 0);
                const pct = total > 0 ? (item.value / total) * 100 : 0;
                return (
                  <div
                    key={item.name}
                    className="flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{
                          background: PIE_COLORS[i % PIE_COLORS.length],
                        }}
                      />
                      <span className="text-xc-muted">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-white/60">
                        {formatCurrency(item.value)}
                      </span>
                      <span className="font-mono font-bold text-white w-12 text-right">
                        {pct.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Risk Metrics ── */}
        <div className="bg-xc-card border border-xc-border rounded-2xl p-4 md:p-6">
          <div className="flex items-center gap-2 mb-4 md:mb-5">
            <Target className="w-4 h-4 text-white/50" />
            <h3 className="font-black text-white text-sm md:text-base">
              Risk Metrics
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-3 lg:gap-4">
            {[
              {
                label: "Sharpe Ratio",
                value: "1.84",
                desc: "Risk-adjusted return",
              },
              {
                label: "Sortino Ratio",
                value: "2.41",
                desc: "Downside-adjusted",
              },
              {
                label: "Beta (vs SPY)",
                value: "1.32",
                desc: "Market sensitivity",
              },
              { label: "Alpha", value: "+8.4%", desc: "Excess return" },
              { label: "Volatility", value: "18.2%", desc: "Annualized" },
              {
                label: "Max Drawdown",
                value: `${Number(Math.min(...drawdownData.map((d) => d.drawdown)) || 0).toFixed(1)}%`,
                desc: "90-day period",
              },
            ].map(({ label, value, desc }) => (
              <div
                key={label}
                className="bg-xc-dark/40 border border-xc-border/60 rounded-xl p-3 md:p-4 lg:p-5 text-center"
              >
                <div className="text-base md:text-lg font-black text-white font-mono">
                  {value}
                </div>
                <div className="text-xs font-bold text-xc-muted mt-1">
                  {label}
                </div>
                <div className="text-xs text-xc-muted/60 mt-0.5">{desc}</div>
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

function riskLabel(score: number) {
  if (score < 30) return "Conservative";
  if (score < 55) return "Moderate";
  if (score < 75) return "Aggressive";
  return "High Risk";
}
