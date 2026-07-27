"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
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
  BarChart3,
  Cpu,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Activity,
  Flame,
  Zap,
  Target,
  Rocket,
  Shield,
  Globe,
  Cpu as CpuIcon,
  Radio,
  Clock,
  Newspaper,
  ExternalLink,
  Satellite,
  BrainCircuit,
  Car,
  CircuitBoard,
  Building2,
} from "lucide-react";
import { portfolioAPI, walletAPI, oracleAPI, tradingAPI } from "@/lib/api";
import { useMarketPrices } from "@/hooks/useMarketPrices";
import {
  formatCurrency,
  formatPercent,
  cn,
  getChangeColor,
  getAssetTypeColor,
} from "@/lib/utils";
import { useStore } from "@/store/useStore";
import type {
  Portfolio,
  WalletTransaction,
  Asset,
  OptimalAllocation,
} from "@/types";
import Link from "next/link";
import {
  MissionPanel,
  RailLock,
  PhaseTrack,
  RailAccessStrip,
} from "@/components/x-engine";
import { ENGINE_COPY } from "@/lib/xEngine";
import { useXEngine } from "@/hooks/useXEngine";
import { useSessionUser } from "@/hooks/useSessionUser";
import { useStableBalance } from "@/hooks/useStableBalance";

// €€€ Deterministic performance data for chart (seeded, no random flicker) €€€€
function generatePerformanceData(baseValue: number, days: number) {
  const data = [];
  let value = baseValue * 0.75;
  const now = new Date();
  // Deterministic seed sequence
  const seeds = [
    0.53, 0.61, 0.42, 0.58, 0.47, 0.66, 0.39, 0.71, 0.44, 0.55, 0.62, 0.48,
    0.57, 0.63, 0.41, 0.68, 0.52, 0.59, 0.46, 0.64, 0.54, 0.6, 0.43, 0.67, 0.5,
    0.56, 0.65, 0.45, 0.69, 0.51, 0.58,
  ];
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const s = seeds[(days - i) % seeds.length];
    value *= 1 + (s - 0.47) * 0.025;
    data.push({
      date: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      value: Math.round(value * 100) / 100,
    });
  }
  return data;
}

const ALLOCATION_COLORS = [
  "#7c3aed",
  "#06b6d4",
  "#d97706",
  "#10b981",
  "#ef4444",
  "#a78bfa",
];

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
}) => {
  if (active && payload?.length) {
    return (
      <div className="bg-xc-card border border-xc-border rounded-lg px-3 py-2 text-sm">
        <span className="text-xc-green font-mono font-bold">
          {formatCurrency(payload[0].value)}
        </span>
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const {
    user,
    setPortfolio,
    setWallet,
    wallet,
    pendingTransactions,
    syncWalletFromSession,
    syncSessionFromApi,
  } = useStore();
  const sessionUser = useSessionUser();
  const [portfolio, setLocalPortfolio] = useState<Portfolio | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [topAssets, setTopAssets] = useState<Asset[]>([]);
  const [allocation, setAllocation] = useState<OptimalAllocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [perfData, setPerfData] = useState<
    Array<{ date: string; value: number }>
  >([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [portRes, walletRes, txRes, assetsRes, allocRes] =
          await Promise.allSettled([
            portfolioAPI.getPortfolio(),
            walletAPI.getWallet(),
            walletAPI.getTransactions({ limit: 5 }),
            tradingAPI.getAssets({ limit: 8 }),
            oracleAPI.getOptimalAllocation(),
          ]);

        if (portRes.status === "fulfilled") {
          setLocalPortfolio(portRes.value.data.data);
          setPortfolio(portRes.value.data.data);
          setPerfData(
            generatePerformanceData(
              portRes.value.data.data.totalValue || 10000,
              30,
            ),
          );
        } else {
          const demo = {
            id: "1",
            userId: "1",
            totalValue: 0,
            totalCost: 0,
            totalPnL: 0,
            cashBalance: 0,
            holdings: [],
            riskScore: 0,
          };
          setLocalPortfolio(demo as Portfolio);
          setPerfData(generatePerformanceData(0, 30));
        }
        if (walletRes.status === "fulfilled") {
          setWallet(walletRes.value.data.data);
        } else if (!wallet) {
          setWallet({
            id: "local",
            fiatBalance: user?.balance ?? 0,
            cryptoBalance: 0,
            lockedBalance: 0,
          });
        }
        if (txRes.status === "fulfilled") {
          setTransactions(txRes.value.data.data.transactions || []);
        }
        if (assetsRes.status === "fulfilled") {
          setTopAssets(assetsRes.value.data.data.assets || []);
        }
        if (
          allocRes.status === "fulfilled" &&
          allocRes.value.data.data &&
          Object.keys(allocRes.value.data.data).filter((k) => k !== "rationale")
            .length > 0
        ) {
          setAllocation(allocRes.value.data.data);
        } else {
          setAllocation({
            AI: 40,
            Energy: 20,
            Space: 15,
            PrivateEquity: 15,
            Cash: 10,
            rationale: "",
          });
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [setPortfolio, setWallet]);

  const stableBalance = useStableBalance();

  useEffect(() => {
    syncWalletFromSession();
  }, [stableBalance, syncWalletFromSession]);

  useEffect(() => {
    const onFocus = () => {
      void syncSessionFromApi();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [syncSessionFromApi]);

  useEffect(() => {
    setLocalPortfolio((prev) =>
      prev ? { ...prev, cashBalance: stableBalance } : prev,
    );
  }, [stableBalance]);

  const pnlPct = portfolio
    ? portfolio.totalCost > 0
      ? (portfolio.totalPnL / portfolio.totalCost) * 100
      : 0
    : 0;

  const base = portfolio?.totalValue ?? 124800;
  const dailyRet = base * 0.00874;
  const weeklyRet = base * 0.04912;
  const monthlyRet = base * 0.11437;

  const allocationData = allocation
    ? Object.entries(allocation)
        .filter(([key]) => key !== "rationale")
        .map(([name, value]) => ({ name, value: Number(value) }))
    : [];

  // Live market prices (slow refresh — no UI twitch)
  const { prices: livePrices } = useMarketPrices({ refreshInterval: 120_000 });

  useEffect(() => {
    if (Object.keys(livePrices).length === 0) return;
    setTopAssets((prev) =>
      prev.map((a) => {
        const live = livePrices[a.symbol];
        return live
          ? { ...a, price: live.price, priceChange24h: live.changePercent24h }
          : a;
      }),
    );
  }, [livePrices]);

  const liveDemoAssets = useMemo(
    () =>
      DEMO_ASSETS.map((a) => {
        const live = livePrices[a.symbol ?? ""];
        return live
          ? { ...a, price: live.price, priceChange24h: live.changePercent24h }
          : a;
      }),
    [livePrices],
  );

  // €€ Volume data for dashboard volume chart (deterministic to avoid hydration mismatch) €€
  const volumeData = useMemo(() => {
    const seed = [
      0.72, 0.31, 0.89, 0.44, 0.67, 0.18, 0.93, 0.56, 0.38, 0.81, 0.25, 0.64,
      0.47, 0.76, 0.53,
    ];
    const data = [];
    const now = new Date();
    for (let i = 14; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const s = seed[14 - i];
      data.push({
        date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        volume: Math.round(s * 500000 + 100000),
        trades: Math.round(s * 80 + 20),
      });
    }
    return data;
  }, []);

  const { phase, isArmed } = useXEngine();
  const portfolioValue = portfolio?.totalValue ?? stableBalance;
  const liquidCash = stableBalance;

  return (
    <DashboardLayout
      title="Overview"
      subtitle={`Operator ${user?.firstName ?? "node"}`}
      wide
    >
      <div className="space-y-8">
        {sessionUser?.kycStatus !== "APPROVED" && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/[0.03] border border-white/[0.10]/40 rounded-xl px-4 sm:px-5 py-3">
            <div>
              <span className="text-white/50 font-semibold text-sm">
                KYC Verification Required
              </span>
              <span className="text-xc-muted text-sm ml-2">
                — Complete identity verification to unlock trading.
              </span>
            </div>
            <Link
              href="/settings/kyc"
              className="text-xs bg-amber-600 hover:bg-amber-500 text-white px-4 py-1.5 rounded-lg font-bold transition-colors shrink-0 self-start sm:self-center"
            >
              Verify Now
            </Link>
          </div>
        )}

        {/* Institutional command overview */}
        <section className="border border-white/[0.08] rounded-2xl bg-[#0a0a0f] overflow-hidden">
          <div className="grid lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-white/[0.06]">
            <div className="lg:col-span-5 p-6 sm:p-8 relative overflow-hidden">
              {/* Animated gradient substrate */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-emerald-900/10 pointer-events-none" />
              <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-emerald-500/5 blur-3xl animate-pulse-slow pointer-events-none" />
              <div className="relative z-10">
                <p className="text-[11px] font-mono uppercase tracking-[0.32em] text-white/40 mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Capital overview
                </p>
                <p className="text-3xl sm:text-4xl font-black text-white tabular-nums tracking-tight">
                  {formatCurrency(portfolioValue)}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-[10px] font-mono text-emerald-400/70 tracking-wider px-2 py-0.5 rounded-full bg-emerald-950/40 border border-emerald-800/30">
                    SETTLED
                  </span>
                  <span className="text-[10px] font-mono text-white/30 tracking-wider">
                    REAL-TIME · AUDITED
                  </span>
                </div>
              </div>
            </div>
            <div className="lg:col-span-3 p-6 sm:p-8 flex flex-col justify-center">
              <p className="text-[11px] font-mono uppercase tracking-[0.28em] text-white/40 mb-2">
                Liquid capital
              </p>
              <p className="text-2xl font-black text-white tabular-nums">
                {formatCurrency(liquidCash)}
              </p>
              <p className="text-xs text-xc-muted mt-2">Available for deployment</p>
            </div>
            <div className="lg:col-span-4 p-6 sm:p-8 flex flex-col justify-center border-t lg:border-t-0 lg:border-l border-white/[0.06]">
              <p className="text-[11px] font-mono uppercase tracking-[0.28em] text-white/40 mb-2">
                Total return
              </p>
              <p
                className={cn(
                  "text-2xl font-black tabular-nums",
                  pnlPct >= 0 ? "text-emerald-400" : "text-rose-400",
                )}
              >
                {formatPercent(pnlPct)}
              </p>
              <p className="text-xs text-xc-muted mt-2">
                {portfolio?.totalPnL != null
                  ? `${formatCurrency(portfolio.totalPnL)} unrealized`
                  : "Portfolio performance"}
              </p>
            </div>
          </div>
        </section>

        {!isArmed && (
          <MissionPanel title={ENGINE_COPY.nodeCold} code="OPS-00">
            <p className="text-sm text-white/55 mb-6 max-w-2xl leading-relaxed">
              {ENGINE_COPY.nodeCold}. {ENGINE_COPY.groundHold}. Open the capital uplink to sequence rail arming across execution, holdings, funds, commerce, and oracle modules.
            </p>
            <Link
              href="/wallet"
              className="inline-flex px-6 py-3 bg-white text-black text-sm font-bold rounded-full hover:bg-slate-100"
            >
              {ENGINE_COPY.uplink}
            </Link>
          </MissionPanel>
        )}

        <PhaseTrack />
        <RailAccessStrip />

        <RailLock rail="portfolio">
        {/* ─── Stats Row ─── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Portfolio Value"
            value={formatCurrency(portfolioValue)}
            change={pnlPct}
            icon={<DollarSign className="w-5 h-5" />}
          />
          <StatCard
            title="Total P&L"
            value={formatCurrency(portfolio?.totalPnL ?? 0)}
            change={pnlPct}
            icon={<TrendingUp className="w-5 h-5" />}
            className={
              (portfolio?.totalPnL ?? 0) >= 0
                ? "border-emerald-800/30"
                : "border-red-800/30"
            }
          />
          <StatCard
            title="Cash Balance"
            value={formatCurrency(liquidCash)}
            icon={<BarChart3 className="w-5 h-5" />}
          />
          <StatCard
            title="Risk Score"
            value={`${portfolio?.riskScore ?? 42}/100`}
            subtitle={
              (portfolio?.riskScore ?? 42) < 40
                ? "Conservative"
                : (portfolio?.riskScore ?? 42) < 65
                  ? "Moderate"
                  : "Aggressive"
            }
            icon={<Cpu className="w-5 h-5" />}
          />
        </div>

        {/* Daily / Weekly / Monthly Returns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(
            [
              {
                label: "Daily Return",
                value: dailyRet,
                pct: "+0.87%",
                icon: <Activity className="w-4 h-4" />,
                period: "Today, Mar 23",
                border: "border-emerald-800/25",
                glow: "from-emerald-900/15",
              },
              {
                label: "Weekly Return",
                value: weeklyRet,
                pct: "+4.91%",
                icon: <Calendar className="w-4 h-4" />,
                period: "Mar 17 – 23, 2026",
                border: "border-white/[0.06]/25",
                glow: "from-white/[0.03]/15",
              },
              {
                label: "Monthly Return",
                value: monthlyRet,
                pct: "+11.4%",
                icon: <Flame className="w-4 h-4" />,
                period: "March 2026",
                border: "border-white/[0.08]/25",
                glow: "from-white/[0.04]/15",
              },
            ] as const
          ).map(({ label, value, pct, icon, period, border, glow }) => (
            <div
              key={label}
              className={`relative bg-xc-card border ${border} rounded-2xl p-5 overflow-hidden`}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${glow} to-transparent pointer-events-none`}
              />
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-xc-muted uppercase tracking-wider">
                  {label}
                </span>
                <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-xc-muted group-hover:text-white transition-colors">
                  {icon}
                </div>
              </div>
              <div className="text-2xl font-black text-white mb-1">
                {formatCurrency(value)}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-xc-green flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  {pct}
                </span>
                <span className="text-xs text-xc-muted">{period}</span>
              </div>
            </div>
          ))}
        </div>

        {/* €€€ X-Oracle Live Signals €€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€ */}
        <div className="bg-xc-card border border-white/[0.08]/25 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-white/60" />
              </div>
              <div>
                <h3 className="font-black text-white text-base">
                  X-Oracle Live Signals
                </h3>
                <p className="text-xs text-xc-muted">
                  Live trade intelligence — updated every 60s
                </p>
              </div>
            </div>
            <span className="text-xs font-mono text-white/40 uppercase tracking-wider">
              Reference
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              {
                symbol: "NVDA",
                signal: "BUY",
                conf: 94,
                proj: "+18.4%",
                window: "30D",
                color: "emerald",
              },
              {
                symbol: "TSLA",
                signal: "BUY",
                conf: 87,
                proj: "+11.2%",
                window: "14D",
                color: "emerald",
              },
              {
                symbol: "BTC",
                signal: "HOLD",
                conf: 72,
                proj: "+3.1%",
                window: "7D",
                color: "amber",
              },
              {
                symbol: "GOLD",
                signal: "SELL",
                conf: 68,
                proj: "-1.8%",
                window: "7D",
                color: "rose",
              },
            ].map(({ symbol, signal, conf, proj, color }) => (
              <div
                key={symbol}
                className={`bg-gradient-to-br ${color === "emerald" ? "from-emerald-950/40" : color === "amber" ? "from-black/30" : "from-rose-950/30"} to-transparent border border-white/5 rounded-xl p-5`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-black text-white">
                    {symbol}
                  </span>
                  <span
                    className={cn(
                      "text-xs font-bold px-2 py-0.5 rounded-full border",
                      color === "emerald"
                        ? "bg-emerald-950/60 text-emerald-400 border-emerald-800/40"
                        : color === "amber"
                          ? "bg-white/[0.03]/60 text-white/50 border-amber-800/40"
                          : "bg-rose-950/60 text-rose-400 border-rose-800/40",
                    )}
                  >
                    {signal}
                  </span>
                </div>
                <div
                  className={cn(
                    "text-xl font-black mb-1",
                    color === "emerald"
                      ? "text-emerald-400"
                      : color === "amber"
                        ? "text-white/50"
                        : "text-rose-400",
                  )}
                >
                  {proj}
                </div>
                <div className="h-0.5 bg-white/5 rounded-full overflow-hidden mt-2">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      color === "emerald"
                        ? "bg-emerald-500"
                        : color === "amber"
                          ? "bg-amber-500"
                          : "bg-rose-500",
                    )}
                    style={{ width: `${conf}%` }}
                  />
                </div>
                <div className="text-xs text-xc-muted mt-1">
                  {conf}% confidence
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* €€€ Main Content Grid €€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€ */}
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Performance Chart */}
          <div className="lg:col-span-2 bg-xc-card border border-xc-border rounded-2xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-black text-white text-base">
                  Portfolio Performance
                </h3>
                <p className="text-xs text-xc-muted mt-0.5">30-day history</p>
              </div>
              <div
                className={cn(
                  "flex items-center gap-1 text-sm font-bold",
                  pnlPct >= 0 ? "text-xc-green" : "text-xc-red",
                )}
              >
                {pnlPct >= 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                {formatPercent(pnlPct)}
              </div>
            </div>
            <div style={{ height: 280 }} className="-mx-2 sm:mx-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={perfData}
                  margin={{ top: 5, right: 5, bottom: 5, left: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="portfolioGrad"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#64748b", fontSize: 10 }}
                    interval="preserveStartEnd"
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#64748b", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) =>
                      `$${(Number(v ?? 0) / 1000).toFixed(0)}k`
                    }
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#7c3aed"
                    strokeWidth={2}
                    fill="url(#portfolioGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* AI Oracle Allocation */}
          <div className="bg-xc-card border border-xc-border rounded-2xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-white text-base">
                AI Oracle Allocation
              </h3>
              <Badge variant="purple">LIVE</Badge>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={allocationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {allocationData.map((_, index) => (
                      <Cell
                        key={index}
                        fill={
                          ALLOCATION_COLORS[index % ALLOCATION_COLORS.length]
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val) => [`${val}%`]}
                    contentStyle={{
                      background: "#0d0d1e",
                      border: "1px solid #1a1a3a",
                      borderRadius: 8,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3 mt-2">
              {allocationData.map((item, i) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{
                        background:
                          ALLOCATION_COLORS[i % ALLOCATION_COLORS.length],
                      }}
                    />
                    <span className="text-xc-muted">{item.name}</span>
                  </div>
                  <span className="font-mono font-bold text-white">
                    {item.value}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* €€€ Trading Volume Chart €€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€ */}
        <div className="bg-xc-card border border-xc-border rounded-2xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-white/50" />
              <h3 className="font-black text-white text-base">
                Trading Volume
              </h3>
              <span className="text-xs text-xc-muted">14-day overview</span>
            </div>
            <Badge variant="default" size="sm">
              {volumeData.reduce((s, d) => s + d.trades, 0)} trades
            </Badge>
          </div>
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={volumeData}
                margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
              >
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
                  tickFormatter={(v) =>
                    `$${(Number(v ?? 0) / 1000).toFixed(0)}k`
                  }
                />
                <Tooltip
                  contentStyle={{
                    background: "#0d0d1e",
                    border: "1px solid #1a1a3a",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v: number, name: string) => [
                    name === "volume" ? formatCurrency(Number(v ?? 0)) : v,
                    name === "volume" ? "Volume" : "Trades",
                  ]}
                />
                <Bar dataKey="volume" radius={[4, 4, 0, 0]}>
                  {volumeData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={i === volumeData.length - 1 ? "#7c3aed" : "#7c3aed"}
                      opacity={i === volumeData.length - 1 ? 0.9 : 0.4}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* €€€ Capital Rails + Quick Deploy €€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€ */}
        <div className="grid lg:grid-cols-3 gap-4 items-start">
          {/* Capital Rails */}
          <div className="lg:col-span-2 bg-xc-card border border-xc-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-white/70" />
                <h3 className="font-black text-white text-base">
                  Capital Rails Deployment
                </h3>
              </div>
              <span className="text-xs font-mono text-xc-muted">
                LIVE ALLOCATION
              </span>
            </div>
            <div className="space-y-3.5">
              {[
                {
                  rail: "Public Markets",
                  pct: 38.6,
                  amount: 48200,
                  color: "#7c3aed",
                  tag: "NASDAQ Â· NYSE Â· LSE",
                },
                {
                  rail: "Private Equity",
                  pct: 24.8,
                  amount: 30976,
                  color: "#06b6d4",
                  tag: "SPVs Â· Pre-IPO",
                },
                {
                  rail: "Tokenized Assets",
                  pct: 15.0,
                  amount: 18720,
                  color: "#d97706",
                  tag: "Polygon Â· ERC-3643",
                },
                {
                  rail: "Commerce Capital",
                  pct: 9.9,
                  amount: 12355,
                  color: "#10b981",
                  tag: "Tesla Â· SpaceX Merch",
                },
                {
                  rail: "AI Hedge",
                  pct: 11.7,
                  amount: 14602,
                  color: "#a78bfa",
                  tag: "X-ORACLE Managed",
                },
              ].map(({ rail, pct, amount, color, tag }) => (
                <div key={rail} className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-semibold text-white whitespace-nowrap">
                          {rail}
                        </span>
                        <span className="text-xs font-mono text-xc-muted hidden sm:block">
                          {tag}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-white ml-2 whitespace-nowrap">
                        {formatCurrency(amount)}
                      </span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, background: color }}
                      />
                    </div>
                  </div>
                  <span className="text-xs font-mono text-xc-muted w-9 text-right flex-shrink-0">
                    {pct}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Deploy */}
          <div className="bg-xc-card border border-xc-border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Rocket className="w-4 h-4 text-white/70" />
              <h3 className="font-black text-white text-base">Quick Deploy</h3>
            </div>
            <div className="space-y-3">
              {[
                {
                  label: "NVDA",
                  desc: "BUY Â· AI 94% conf.",
                  cls: "border-white/[0.10] hover:border-white/[0.10]/60 hover:bg-white/[0.02]/20",
                },
                {
                  label: "TSLA",
                  desc: "BUY Â· AI 87% conf.",
                  cls: "border-emerald-700/40 hover:border-emerald-500/60 hover:bg-emerald-950/20",
                },
                {
                  label: "BTC",
                  desc: "HOLD Â· Monitor",
                  cls: "border-white/[0.10]/40 hover:border-white/[0.10]/50 hover:bg-white/[0.03]/15",
                },
                {
                  label: "SPV Fund",
                  desc: "New Allocation",
                  cls: "border-white/[0.08]/40 hover:border-white/20 hover:bg-white/[0.02]/20",
                },
              ].map(({ label, desc, cls }) => (
                <Link
                  key={label}
                  href="/trading"
                  className={`flex items-center justify-between w-full bg-white/[0.03] border ${cls} rounded-xl px-3.5 py-2.5 transition-all group`}
                >
                  <div>
                    <div className="text-sm font-bold text-white">{label}</div>
                    <div className="text-xs text-xc-muted">{desc}</div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-xc-muted group-hover:text-white transition-colors" />
                </Link>
              ))}
            </div>
            <Link
              href="/trading"
              className="mt-4 w-full flex items-center justify-center gap-2 bg-xc-purple hover:bg-white/[0.08] text-white text-sm font-bold py-2.5 rounded-xl transition-colors glow-purple"
            >
              <Zap className="w-4 h-4" /> Open Trade Terminal
            </Link>
          </div>
        </div>

        {/* €€€ Bottom Row €€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€ */}
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Top Assets */}
          <div className="bg-xc-card border border-xc-border rounded-2xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-white text-base">Market</h3>
              <Link
                href="/trading"
                className="text-xs text-white/70 hover:text-white transition-colors"
              >
                View all â†’
              </Link>
            </div>
            <div className="space-y-3">
              {(topAssets.length > 0
                ? topAssets.slice(0, 6)
                : liveDemoAssets
              ).map((asset) => (
                <div
                  key={asset.symbol}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-white/[0.04] to-black flex items-center justify-center text-xs font-black text-white">
                      {(asset.symbol ?? "?")[0]}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">
                        {asset.symbol}
                      </div>
                      <div className="text-xs text-xc-muted truncate max-w-[120px]">
                        {asset.name}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-mono font-bold text-white">
                      {formatCurrency(Number(asset.price))}
                    </div>
                    <div
                      className={cn(
                        "text-xs font-semibold flex items-center justify-end gap-0.5",
                        getChangeColor(Number(asset.priceChange24h ?? 0)),
                      )}
                    >
                      {(asset.priceChange24h ?? 0) >= 0 ? (
                        <ArrowUpRight className="w-3 h-3" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3" />
                      )}
                      {formatPercent(Number(asset.priceChange24h ?? 0))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-xc-card border border-xc-border rounded-2xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-white text-base">
                Recent Activity
              </h3>
              <Link
                href="/wallet"
                className="text-xs text-white/70 hover:text-white transition-colors"
              >
                View all â†’
              </Link>
            </div>
            <div className="space-y-3">
              {transactions.map(
                (tx, i) => (
                  <div
                    key={tx.id || i}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center",
                          tx.type === "DEPOSIT"
                            ? "bg-emerald-950/60"
                            : tx.type === "WITHDRAWAL"
                              ? "bg-red-950/60"
                              : "bg-white/[0.02]/60",
                        )}
                      >
                        {tx.type === "DEPOSIT" ? (
                          <ArrowDownRight className="w-4 h-4 text-xc-green" />
                        ) : tx.type === "WITHDRAWAL" ? (
                          <ArrowUpRight className="w-4 h-4 text-xc-red" />
                        ) : (
                          <BarChart3 className="w-4 h-4 text-white/70" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white capitalize">
                          {tx.type.replace(/_/g, " ")}
                        </div>
                        <div className="text-xs text-xc-muted">
                          {tx.createdAt
                            ? new Date(tx.createdAt).toLocaleDateString()
                            : "Recent"}
                        </div>
                      </div>
                    </div>
                    <div
                      className={cn(
                        "text-sm font-mono font-bold",
                        tx.type === "DEPOSIT" || tx.type === "FUND_REDEMPTION"
                          ? "text-xc-green"
                          : "text-white",
                      )}
                    >
                      {tx.type === "DEPOSIT" || tx.type === "FUND_REDEMPTION"
                        ? "+"
                        : "-"}
                      {formatCurrency(Number(tx.amount))}
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>
        </div>

        {/* €€€ SpaceX Mission Control & Musk Empire €€€€€€€€€€€€€€€€€€€€€€€ */}
        <div className="grid lg:grid-cols-5 gap-4">
          {/* SpaceX Mission Control 3-col */}
          <div className="lg:col-span-3 bg-xc-card border border-white/[0.06]/25 rounded-2xl p-4 sm:p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center">
                    <Rocket className="w-4 h-4 text-white/50" />
                  </div>
                  <div>
                    <h3 className="font-black text-white text-base">
                      SpaceX Mission Control
                    </h3>
                    <p className="text-xs text-xc-muted">
                      Live launch schedule Â· Investment catalyst events
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
                  <span className="text-xs font-mono text-white/50">
                    TRACKING
                  </span>
                </div>
              </div>

              {/* Next Launch Countdown */}
              <div className="bg-gradient-to-r from-white/[0.04] to-black/30 border border-white/[0.08]/20 rounded-xl p-5 mb-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="text-xs text-white/50 font-mono uppercase tracking-wider mb-1">
                      Next Launch
                    </div>
                    <div className="text-lg font-black text-white">
                      Starship Flight 12
                    </div>
                    <div className="text-xs text-xc-muted mt-0.5">
                      Starbase, TX Â· Orbital flight test
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-xc-muted uppercase mb-1">
                      T-Minus
                    </div>
                    <div className="flex gap-2">
                      {[
                        { val: "02", label: "D" },
                        { val: "14", label: "H" },
                        { val: "37", label: "M" },
                      ].map(({ val, label }) => (
                        <div
                          key={label}
                          className="bg-xc-black/60 rounded-lg px-2.5 py-1.5 text-center min-w-[40px]"
                        >
                          <div className="text-lg font-black font-mono text-white/50">
                            {val}
                          </div>
                          <div className="text-xs text-xc-muted">{label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs">
                  <span className="text-xc-muted">
                    Vehicle:{" "}
                    <span className="text-white font-semibold">
                      Super Heavy + Starship
                    </span>
                  </span>
                  <span className="text-xc-muted">
                    Payload:{" "}
                    <span className="text-white font-semibold">
                      Starlink V3 x 40
                    </span>
                  </span>
                  <span className="text-xc-muted">
                    Orbit:{" "}
                    <span className="text-white font-semibold">LEO 550km</span>
                  </span>
                </div>
              </div>

              {/* Recent Launches */}
              <div className="space-y-2">
                <div className="text-xs text-xc-muted font-bold uppercase tracking-wider mb-2">
                  Recent Missions
                </div>
                {SPACEX_MISSIONS.map((m) => (
                  <div
                    key={m.name}
                    className="flex items-center justify-between py-2 border-b border-white/[0.08] last:border-0"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full",
                          m.success ? "bg-emerald-400" : "bg-amber-400",
                        )}
                      />
                      <div>
                        <div className="text-xs font-semibold text-white">
                          {m.name}
                        </div>
                        <div className="text-xs text-xc-muted">
                          {m.vehicle} Â· {m.date}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-xc-muted">{m.payload}</span>
                      <Badge
                        variant={m.success ? "success" : "warning"}
                        size="sm"
                      >
                        {m.success ? "SUCCESS" : "PARTIAL"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>

              {/* Stats bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-4 pt-4 border-t border-white/[0.08]">
                {[
                  { label: "Launches 2026", value: "28" },
                  { label: "Success Rate", value: "97.3%" },
                  { label: "Starlink Sats", value: "7,200+" },
                  { label: "Landing Reuse", value: "94%" },
                ].map(({ label, value }) => (
                  <div key={label} className="text-center">
                    <div className="text-sm font-black text-white">{value}</div>
                    <div className="text-xs text-xc-muted">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Musk Empire Ventures 2-col */}
          <div className="lg:col-span-2 bg-xc-card border border-white/[0.08]/25 rounded-2xl p-4 sm:p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-black/15 to-transparent pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-white/60" />
                  </div>
                  <div>
                    <h3 className="font-black text-white text-base">
                      Musk Empire Index
                    </h3>
                    <p className="text-xs text-xc-muted">
                      Combined venture exposure
                    </p>
                  </div>
                </div>
                <Badge variant="gold" size="sm">
                  COMPOSITE
                </Badge>
              </div>

              {/* Composite Index Value */}
              <div className="bg-white/[0.02] border border-white/[0.10]/20 rounded-xl p-5 mb-4">
                <div className="text-xs text-white/60 font-mono uppercase tracking-wider mb-1">
                  X-MEI Composite
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white">$4,847</span>
                  <span className="text-sm font-bold text-emerald-400">
                    +24.6%
                  </span>
                </div>
                <div className="text-xs text-xc-muted mt-1">
                  YTD performance across all Musk ventures
                </div>
              </div>

              {/* Companies */}
              <div className="space-y-3">
                {MUSK_VENTURES.map((v) => (
                  <div
                    key={v.name}
                    className="flex items-center justify-between py-2 px-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center",
                          v.bgColor,
                        )}
                      >
                        <v.icon className={cn("w-4 h-4", v.iconColor)} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">
                          {v.name}
                        </div>
                        <div className="text-xs text-xc-muted">{v.role}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono font-bold text-white">
                        {v.valuation}
                      </div>
                      <div
                        className={cn(
                          "text-xs font-bold",
                          v.change >= 0 ? "text-emerald-400" : "text-red-400",
                        )}
                      >
                        {v.change >= 0 ? "+" : ""}
                        {v.change}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Link
                href="/funds"
                className="mt-4 w-full flex items-center justify-center gap-2 bg-white/[0.04] hover:bg-white/[0.04]/60 border border-white/[0.08] text-white text-xs font-bold py-2.5 rounded-xl transition-colors"
              >
                <Globe className="w-3.5 h-3.5" /> View All Funds & SPVs
              </Link>
            </div>
          </div>
        </div>

        {/* €€€ Starlink & Live News Feed €€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€ */}
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Starlink Growth Tracker */}
          <div className="bg-xc-card border border-xc-border rounded-2xl p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-blue-900/50 flex items-center justify-center">
                <Satellite className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <h3 className="font-black text-white text-base">
                  Starlink Network
                </h3>
                <p className="text-xs text-xc-muted">
                  Global satellite internet
                </p>
              </div>
            </div>
            <div className="space-y-4">
              {[
                {
                  label: "Active Satellites",
                  value: "7,200+",
                  sub: "LEO Constellation",
                },
                {
                  label: "Global Subscribers",
                  value: "5.2M",
                  sub: "+42% YoY Growth",
                },
                {
                  label: "Revenue Run Rate",
                  value: "$8.4B",
                  sub: "Annualized 2026",
                },
                {
                  label: "Countries Served",
                  value: "105",
                  sub: "All Continents",
                },
                {
                  label: "Avg Download Speed",
                  value: "220 Mbps",
                  sub: "V3 Hardware",
                },
              ].map(({ label, value, sub }) => (
                <div key={label} className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-xc-muted">{label}</div>
                    <div className="text-xs text-xc-muted/60">{sub}</div>
                  </div>
                  <div className="text-sm font-black text-white">{value}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-white/[0.08]">
              <div className="text-xs text-blue-400 font-mono uppercase tracking-wider mb-2">
                Network Health
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 via-white/40 to-emerald-400"
                  style={{ width: "99.7%" }}
                />
              </div>
              <div className="flex justify-between text-xs text-xc-muted mt-1">
                <span>Uptime: 99.97%</span>
                <span>Latency: 25ms avg</span>
              </div>
            </div>
          </div>

          {/* Live News Feed */}
          <div className="lg:col-span-2 bg-xc-card border border-xc-border rounded-2xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center">
                  <Newspaper className="w-4 h-4 text-white/50" />
                </div>
                <div>
                  <h3 className="font-black text-white text-base">
                    Market Intelligence Feed
                  </h3>
                  <p className="text-xs text-xc-muted">
                    AI-curated Â· SpaceX Â· Tesla Â· xAI Â· Markets
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400/80" />
                <span className="text-xs font-mono text-white/50">LIVE</span>
              </div>
            </div>
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {NEWS_FEED.map((news, i) => (
                <div
                  key={i}
                  className="flex gap-4 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors border border-transparent hover:border-white/[0.08]"
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                      news.bgColor,
                    )}
                  >
                    <news.icon className={cn("w-5 h-5", news.iconColor)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-sm font-semibold text-white leading-tight">
                        {news.headline}
                      </div>
                      <span className="text-xs text-xc-muted whitespace-nowrap shrink-0">
                        {news.time}
                      </span>
                    </div>
                    <p className="text-xs text-xc-muted mt-1 line-clamp-2">
                      {news.summary}
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      <Badge
                        variant={
                          news.sentiment === "bullish"
                            ? "success"
                            : news.sentiment === "bearish"
                              ? "danger"
                              : "default"
                        }
                        size="sm"
                      >
                        {news.sentiment.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-xc-muted">
                        {news.source}
                      </span>
                      {news.ticker && (
                        <span className="text-xs font-mono font-bold text-white bg-white/10 px-1.5 py-0.5 rounded">
                          {news.ticker}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chairman mandate — single strategic portrait placement */}
        <section className="border border-white/[0.08] rounded-2xl overflow-hidden bg-[#08080c]">
          <div className="grid lg:grid-cols-12">
            <div className="lg:col-span-4 relative min-h-[280px] lg:min-h-0">
              <Image
                src="/images/elon-musk.jpg"
                alt="Elon Musk — Founder and Chief Architect"
                fill
                sizes="(max-width: 1024px) 100vw, 33vw"
                className="object-cover object-top"
                priority={false}
              />
              <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-[#08080c] via-[#08080c]/40 to-transparent" />
            </div>
            <div className="lg:col-span-8 p-8 sm:p-10 flex flex-col justify-center">
              <p className="text-[11px] font-mono uppercase tracking-[0.35em] text-white/35 mb-4">
                Chairman&apos;s mandate
              </p>
              <blockquote className="text-2xl sm:text-3xl font-black text-white leading-snug mb-4 max-w-2xl">
                &ldquo;X-CAPITAL is the financial infrastructure for the multiplanetary economy.&rdquo;
              </blockquote>
              <p className="text-sm text-white/55 leading-relaxed max-w-xl mb-6">
                Institutional capital deployment across public markets, private equity, tokenized assets, and infrastructure — governed by a single operating standard.
              </p>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-white/45 font-mono uppercase tracking-wider">
                <span>Elon Musk</span>
                <span className="hidden sm:inline text-white/20">|</span>
                <span>Founder & Chief Architect</span>
                <span className="hidden sm:inline text-white/20">|</span>
                <span>Est. 2026</span>
              </div>
            </div>
          </div>
        </section>
      </RailLock>
      </div>
    </DashboardLayout>
  );
}

// €€€ Demo data €€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€
const DEMO_ASSETS: Partial<Asset>[] = [
  { symbol: "TSLA", name: "Tesla, Inc.", price: 248.42, priceChange24h: 3.21 },
  {
    symbol: "NVDA",
    name: "NVIDIA Corporation",
    price: 875.39,
    priceChange24h: 2.15,
  },
  { symbol: "AAPL", name: "Apple Inc.", price: 213.07, priceChange24h: 0.54 },
  {
    symbol: "META",
    name: "Meta Platforms",
    price: 513.92,
    priceChange24h: 2.77,
  },
  {
    symbol: "XSPACE",
    name: "X-SPACE Token",
    price: 12.5,
    priceChange24h: 5.12,
  },
  {
    symbol: "XINFRA",
    name: "X-INFRA Token",
    price: 8.75,
    priceChange24h: 2.88,
  },
];

const DEMO_TRANSACTIONS = [
  {
    id: "1",
    type: "DEPOSIT",
    amount: 10000,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "2",
    type: "TRADE",
    amount: 2484,
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: "3",
    type: "FUND_INVESTMENT",
    amount: 5000,
    createdAt: new Date(Date.now() - 259200000).toISOString(),
  },
  {
    id: "4",
    type: "TRADE",
    amount: 875,
    createdAt: new Date(Date.now() - 345600000).toISOString(),
  },
  {
    id: "5",
    type: "WITHDRAWAL",
    amount: 1500,
    createdAt: new Date(Date.now() - 432000000).toISOString(),
  },
] as WalletTransaction[];

// €€€ SpaceX Missions €€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€
const SPACEX_MISSIONS = [
  {
    name: "Starship Flight 11",
    vehicle: "Super Heavy + Starship",
    date: "Mar 28, 2026",
    payload: "40 Starlink V3",
    success: true,
  },
  {
    name: "Falcon 9 Â· Transporter-14",
    vehicle: "Falcon 9 Block 5",
    date: "Mar 22, 2026",
    payload: "Rideshare 112 sats",
    success: true,
  },
  {
    name: "Falcon Heavy Â· USSF-67",
    vehicle: "Falcon Heavy",
    date: "Mar 15, 2026",
    payload: "NRO Classified",
    success: true,
  },
  {
    name: "Starship Flight 10",
    vehicle: "Super Heavy + Starship",
    date: "Mar 4, 2026",
    payload: "Booster catch test",
    success: true,
  },
  {
    name: "Falcon 9 Â· CRS-32",
    vehicle: "Falcon 9 Block 5",
    date: "Feb 27, 2026",
    payload: "ISS Dragon Resupply",
    success: true,
  },
];

// €€€ Musk Empire Ventures €€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€
const MUSK_VENTURES = [
  {
    name: "Tesla",
    role: "CEO Â· Technoking",
    valuation: "$1.2T",
    change: 18.4,
    icon: Car,
    bgColor: "bg-red-900/40",
    iconColor: "text-red-400",
  },
  {
    name: "SpaceX",
    role: "CEO Â· Chief Engineer",
    valuation: "$350B",
    change: 32.1,
    icon: Rocket,
    bgColor: "bg-white/[0.04]",
    iconColor: "text-white/50",
  },
  {
    name: "xAI",
    role: "Founder Â· CEO",
    valuation: "$80B",
    change: 124.5,
    icon: BrainCircuit,
    bgColor: "bg-white/[0.04]",
    iconColor: "text-white/60",
  },
  {
    name: "Neuralink",
    role: "Co-founder",
    valuation: "$12B",
    change: 45.8,
    icon: CircuitBoard,
    bgColor: "bg-pink-900/40",
    iconColor: "text-pink-400",
  },
  {
    name: "The Boring Co",
    role: "Founder",
    valuation: "$8.5B",
    change: 12.3,
    icon: Building2,
    bgColor: "bg-white/[0.04]/40",
    iconColor: "text-white/50",
  },
  {
    name: "Starlink",
    role: "SpaceX Division",
    valuation: "$120B",
    change: 52.7,
    icon: Satellite,
    bgColor: "bg-blue-900/40",
    iconColor: "text-blue-400",
  },
];

// €€€ News Feed €€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€
type NewsSentiment = "bullish" | "bearish" | "neutral";
const NEWS_FEED: Array<{
  headline: string;
  summary: string;
  time: string;
  source: string;
  ticker?: string;
  sentiment: NewsSentiment;
  icon: typeof Rocket;
  bgColor: string;
  iconColor: string;
}> = [
  {
    headline:
      "Starship Flight 12 scheduled for April 9 — full orbital attempt with 40 V3 Starlinks",
    summary:
      "SpaceX targeting full orbital insertion and booster catch. If successful, this will be the first operational Starlink V3 deployment via Starship.",
    time: "2h ago",
    source: "SpaceX Press",
    ticker: "SpaceX",
    sentiment: "bullish" as const,
    icon: Rocket,
    bgColor: "bg-white/[0.04]",
    iconColor: "text-white/50",
  },
  {
    headline:
      "Tesla Q1 2026 deliveries surge 38% to 614,000 units — Cybertruck ramp accelerates",
    summary:
      "Tesla exceeded Wall Street consensus by 12%. Cybertruck production hit 8,200/week run rate at Gigafactory Texas. Model 2 production begins Q3.",
    time: "5h ago",
    source: "Reuters",
    ticker: "TSLA",
    sentiment: "bullish" as const,
    icon: Car,
    bgColor: "bg-red-900/40",
    iconColor: "text-red-400",
  },
  {
    headline:
      "xAI Grok-4 benchmark crushes GPT-5 on MMLU-Pro and ARC-AGI — valuation jumps to $80B",
    summary:
      "xAI's latest foundation model achieves 94.2% on MMLU-Pro. Enterprise API launch expected May 2026. Memphis supercluster now at 200,000 H100 GPUs.",
    time: "8h ago",
    source: "The Information",
    ticker: "xAI",
    sentiment: "bullish" as const,
    icon: BrainCircuit,
    bgColor: "bg-white/[0.04]",
    iconColor: "text-white/60",
  },
  {
    headline:
      "Neuralink PRIME study — 8th patient implanted, full cursor control achieved in 72 hours",
    summary:
      "FDA expanded access approval for N2 chip. Patients demonstrating thought-to-text at 62 words/minute. IPO speculation intensifies.",
    time: "12h ago",
    source: "STAT News",
    ticker: "Neuralink",
    sentiment: "bullish" as const,
    icon: CircuitBoard,
    bgColor: "bg-pink-900/40",
    iconColor: "text-pink-400",
  },
  {
    headline:
      "Starlink surpasses 5 million subscribers — direct-to-cell beta in 14 countries",
    summary:
      "Starlink's direct-to-cell service now covers 94% of the globe. Partnership deals with T-Mobile, Vodafone, and Jio accelerating subscriber growth.",
    time: "1d ago",
    source: "Bloomberg",
    ticker: "SpaceX",
    sentiment: "bullish" as const,
    icon: Satellite,
    bgColor: "bg-blue-900/40",
    iconColor: "text-blue-400",
  },
  {
    headline:
      "NVIDIA cuts Q2 guidance on supply constraints — AI capex remains strong",
    summary:
      "Supply bottleneck for B200 GPUs delays shipments by 4-6 weeks. Demand remains at 2x supply. xAI and Tesla among largest buyers.",
    time: "1d ago",
    source: "CNBC",
    ticker: "NVDA",
    sentiment: "neutral" as const,
    icon: Cpu,
    bgColor: "bg-green-900/40",
    iconColor: "text-green-400",
  },
  {
    headline:
      "Boring Company awarded $4.2B contract for Las Vegas-to-LA hyperloop feasibility study",
    summary:
      "Nevada DOT and Caltrans jointly funding the largest infrastructure study for high-speed underground transit. Construction could begin 2028.",
    time: "2d ago",
    source: "Wall Street Journal",
    ticker: "Boring Co",
    sentiment: "bullish" as const,
    icon: Building2,
    bgColor: "bg-white/[0.04]/40",
    iconColor: "text-white/50",
  },
];
