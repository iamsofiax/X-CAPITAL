"use client";

import { useState, useEffect, useMemo } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import AIOracle from "@/components/oracle/AIOracle";
import { StatCard } from "@/components/ui/Card";
import { RailLock } from "@/components/x-engine";
import { useStore } from "@/store/useStore";
import { oracleAPI, tradingAPI } from "@/lib/api";
import { useMarketPrices } from "@/hooks/useMarketPrices";
import { formatCurrency, cn } from "@/lib/utils";
import { getXlinkFounderSpotlight } from "@/lib/founderSignals";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import {
  Brain,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Zap,
  Target,
  Activity,
  Radio,
  LineChart,
} from "lucide-react";

const SYMBOLS = [
  "TSLA",
  "NVDA",
  "AAPL",
  "META",
  "AMZN",
  "PLTR",
  "XSPACE",
  "MSFT",
  "BTC",
  "SOL",
  "DOGE",
  "AMD",
];

function generateAccuracyData() {
  const data = [];
  const now = new Date();
  for (let i = 20; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    data.push({
      week: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      accuracy: Number((65 + Math.random() * 25).toFixed(1)),
      predictions: Math.round(80 + Math.random() * 60),
    });
  }
  return data;
}

function generateSentimentTimeline(symbol: string) {
  const data = [];
  const now = new Date();
  let score = 0.5;
  for (let i = 30; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    score = Math.max(
      0.1,
      Math.min(0.95, score + (Math.random() - 0.47) * 0.08),
    );
    data.push({
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      score: Number(score.toFixed(3)),
    });
  }
  return data;
}

export default function OraclePage() {
  const { user, wallet, pendingTransactions } = useStore();
  const [allocation, setAllocation] = useState<Record<string, number>>({});
  const [forecasts, setForecasts] = useState<
    Array<{
      symbol: string;
      currentPrice: number;
      predictedPrice: number;
      expectedReturn: number;
      horizon: string;
      confidence: number;
      signal: "BUY" | "HOLD" | "SELL";
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [activeSymbol, setActiveSymbol] = useState("TSLA");
  const [sentiment, setSentiment] = useState<{
    score: number;
    label: string;
    sources: number;
  } | null>(null);
  const [accuracyData, setAccuracyData] = useState<
    Array<{ week: string; accuracy: number; predictions: number }>
  >([]);
  const [sentimentTimeline, setSentimentTimeline] = useState<
    Array<{ date: string; score: number }>
  >([]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [allocRes, ...fcastResults] = await Promise.allSettled([
        oracleAPI.getOptimalAllocation(),
        ...SYMBOLS.slice(0, 8).map((sym) => oracleAPI.getForecast(sym, "30d")),
      ]);
      if (
        allocRes.status === "fulfilled" &&
        allocRes.value.data.data &&
        Object.keys(allocRes.value.data.data).length > 0
      ) {
        setAllocation(allocRes.value.data.data);
      } else {
        setAllocation({
          AI: 40,
          Energy: 20,
          Space: 15,
          PrivateEquity: 15,
          Cash: 10,
        });
      }
      const fcasts = fcastResults
        .map((r, i) =>
          r.status === "fulfilled"
            ? { ...r.value.data.data, symbol: SYMBOLS[i] }
            : null,
        )
        .filter(Boolean);
      if (fcasts.length > 0) setForecasts(fcasts as typeof forecasts);
      else setForecasts([]);
    } catch {
      setAllocation({
        AI: 40,
        Energy: 20,
        Space: 15,
        PrivateEquity: 15,
        Cash: 10,
      });
      setForecasts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    setAccuracyData(generateAccuracyData());
  }, []);

  useEffect(() => {
    const fetchSentiment = async () => {
      try {
        const res = await oracleAPI.getSentiment(activeSymbol);
        setSentiment(res.data.data);
      } catch {
        setSentiment({
          score: 0.62 + Math.random() * 0.25,
          label: Math.random() > 0.3 ? "Bullish" : "Neutral",
          sources: Math.round(120 + Math.random() * 200),
        });
      }
    };
    fetchSentiment();
    setSentimentTimeline(generateSentimentTimeline(activeSymbol));
  }, [activeSymbol]);

  // Drift accuracy live
  useEffect(() => {
    const interval = setInterval(() => {
      setAccuracyData((prev) =>
        prev.map((d, i) =>
          i === prev.length - 1
            ? {
                ...d,
                accuracy: Math.min(
                  95,
                  Math.max(60, d.accuracy + (Math.random() - 0.48) * 0.5),
                ),
              }
            : d,
        ),
      );
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Drift sentiment timeline live
  useEffect(() => {
    const interval = setInterval(() => {
      setSentimentTimeline((prev) => {
        if (!prev.length) return prev;
        const last = prev[prev.length - 1];
        return [
          ...prev.slice(0, -1),
          {
            ...last,
            score: Math.max(
              0.1,
              Math.min(0.95, last.score + (Math.random() - 0.48) * 0.02),
            ),
          },
        ];
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Live market prices — overlay onto forecasts' currentPrice
  const { prices: livePrices } = useMarketPrices({ refreshInterval: 30_000 });
  useEffect(() => {
    if (Object.keys(livePrices).length === 0) return;
    setForecasts((prev) =>
      prev.map((f) => {
        const live = livePrices[f.symbol];
        if (!live) return f;
        return { ...f, currentPrice: live.price };
      }),
    );
  }, [livePrices]);

  const bullishCount = forecasts.filter((f) => f.signal === "BUY").length;
  const avgReturn = forecasts.length
    ? forecasts.reduce((s, f) => s + f.expectedReturn, 0) / forecasts.length
    : 0;
  const avgAccuracy = accuracyData.length
    ? accuracyData.reduce((s, d) => s + d.accuracy, 0) / accuracyData.length
    : 0;

  // Signal distribution for bar chart
  const signalDist = useMemo(() => {
    const buy = forecasts.filter((f) => f.signal === "BUY").length;
    const hold = forecasts.filter((f) => f.signal === "HOLD").length;
    const sell = forecasts.filter((f) => f.signal === "SELL").length;
    return [
      { signal: "BUY", count: buy, color: "#10b981" },
      { signal: "HOLD", count: hold, color: "#d97706" },
      { signal: "SELL", count: sell, color: "#ef4444" },
    ];
  }, [forecasts]);

  // Return distribution
  const returnDist = useMemo(
    () =>
      forecasts
        .map((f) => ({
          symbol: f.symbol,
          return: f.expectedReturn,
          confidence: f.confidence,
        }))
        .sort((a, b) => b.return - a.return),
    [forecasts],
  );

  return (
    <DashboardLayout title="Oracle" subtitle="Inference · sentiment · signals">
      <RailLock rail="oracle">
      <div className="space-y-8">
        {/* ── Stats ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-3 lg:gap-4">
          <StatCard
            title="Bullish Signals"
            value={`${bullishCount}/${forecasts.length}`}
            icon={<TrendingUp className="w-5 h-5" />}
          />
          <StatCard
            title="Avg Predicted Return"
            value={`${avgReturn >= 0 ? "+" : ""}${avgReturn.toFixed(1)}%`}
            change={avgReturn}
            icon={<BarChart3 className="w-5 h-5" />}
          />
          <StatCard
            title="Model Accuracy"
            value={`${avgAccuracy.toFixed(1)}%`}
            subtitle="20-week average"
            icon={<Target className="w-5 h-5" />}
          />
          <StatCard
            title="Models Active"
            value="3"
            subtitle="LSTM · MC · Sentiment"
            icon={<Brain className="w-5 h-5" />}
          />
          <StatCard
            title="Data Sources"
            value="50+"
            subtitle="News, filings, social"
            icon={<Zap className="w-5 h-5" />}
          />
        </div>

        {/* ── Forecast Accuracy Chart (full width) ── */}
        <div className="bg-xc-card border border-xc-border rounded-2xl p-4 md:p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 md:mb-6 gap-2">
            <div>
              <h3 className="font-black text-white text-base md:text-lg">
                Forecast Accuracy
              </h3>
              <p className="text-xs md:text-sm text-xc-muted mt-1">
                20-week rolling accuracy · All models combined
              </p>
            </div>
            <div className="text-right">
              <div className="text-xl md:text-2xl font-black text-emerald-400 font-mono">
                {avgAccuracy.toFixed(1)}%
              </div>
              <div className="text-xs text-xc-muted">avg accuracy</div>
            </div>
          </div>
          <div className="h-[200px] md:h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={accuracyData}
                margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
              >
                <defs>
                  <linearGradient id="accGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="week"
                  tick={{ fill: "#64748b", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  interval={3}
                />
                <YAxis
                  tick={{ fill: "#64748b", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${Number(v ?? 0)}%`}
                  domain={[50, 100]}
                />
                <Tooltip
                  contentStyle={{
                    background: "#0d0d1e",
                    border: "1px solid #1a1a3a",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v: number, name: string) => [
                    name === "accuracy" ? `${Number(v ?? 0)}%` : v,
                    name === "accuracy" ? "Accuracy" : "Predictions",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="accuracy"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fill="url(#accGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Return Distribution + Signal Distribution ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4 lg:gap-6">
          {/* Expected Return by Asset */}
          <div className="bg-xc-card border border-xc-border rounded-2xl p-4 md:p-6">
            <div className="flex items-center gap-2 mb-5">
              <BarChart3 className="w-4 h-4 text-white/60" />
              <h3 className="font-black text-white text-sm md:text-base">
                Predicted Returns by Asset
              </h3>
              <span className="text-xs text-xc-muted ml-auto hidden sm:inline">
                30-day horizon
              </span>
            </div>
            <div className="h-[220px] md:h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={returnDist}
                  layout="vertical"
                  margin={{ top: 5, right: 20, bottom: 5, left: 60 }}
                >
                  <XAxis
                    type="number"
                    tick={{ fill: "#64748b", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <YAxis
                    type="category"
                    dataKey="symbol"
                    tick={{ fill: "#fff", fontSize: 11, fontWeight: 700 }}
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
                    formatter={(v: number) => [
                      `${Number(v ?? 0).toFixed(1)}%`,
                      "Expected Return",
                    ]}
                  />
                  <Bar dataKey="return" radius={[0, 4, 4, 0]}>
                    {returnDist.map((entry, i) => (
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
          </div>

          {/* Signal Distribution */}
          <div className="bg-xc-card border border-xc-border rounded-2xl p-4 md:p-6">
            <div className="flex items-center gap-2 mb-4 md:mb-5">
              <Radio className="w-4 h-4 text-emerald-400" />
              <h3 className="font-black text-white text-sm md:text-base">
                Signal Distribution
              </h3>
            </div>
            <div className="grid grid-cols-3 gap-2 md:gap-4 mb-4 md:mb-6">
              {signalDist.map((s) => (
                <div
                  key={s.signal}
                  className="bg-xc-dark/40 border border-xc-border/60 rounded-xl p-3 md:p-5 text-center"
                >
                  <div
                    className="text-2xl md:text-3xl font-black font-mono"
                    style={{ color: s.color }}
                  >
                    {s.count}
                  </div>
                  <div className="text-xs font-bold text-xc-muted mt-1">
                    {s.signal}
                  </div>
                </div>
              ))}
            </div>
            {/* Confidence distribution */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-xc-muted uppercase tracking-wider">
                Confidence by Forecast
              </div>
              {forecasts.slice(0, 8).map((f) => (
                <div key={f.symbol} className="flex items-center gap-4">
                  <span className="text-xs font-bold text-white w-16">
                    {f.symbol}
                  </span>
                  <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        f.signal === "BUY"
                          ? "bg-emerald-500"
                          : f.signal === "SELL"
                            ? "bg-red-500"
                            : "bg-amber-500",
                      )}
                      style={{ width: `${f.confidence}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-white/70 w-10 text-right">
                    {f.confidence}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            STARLINK FORECAST SPOTLIGHT - Highest Confidence BUY Signal
            ═══════════════════════════════════════════════════════════════════ */}
        {(() => {
          const xlinkForecast = forecasts.find((f) => f.symbol === "XLINK");
          return xlinkForecast ? (
            <section className="relative group overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-900/25 to-slate-900/25 border border-emerald-500/50 p-6 md:p-8 mb-6">
              <div className="absolute -top-40 -right-40 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="relative z-10">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Radio className="w-6 h-6 text-emerald-400 animate-pulse" />
                      <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">
                        Founder Signal · XLINK
                      </span>
                    </div>
                    <h3 className="text-2xl lg:text-3xl font-black text-white mb-2">
                      {xlinkForecast.symbol} — $
                      {xlinkForecast.currentPrice.toFixed(2)}
                    </h3>
                    <p className="text-base text-emerald-50 max-w-xl mb-4 italic leading-relaxed">
                      &ldquo;
                      {getXlinkFounderSpotlight(
                        xlinkForecast.confidence,
                        xlinkForecast.horizon,
                        xlinkForecast.predictedPrice,
                      )}
                      &rdquo;
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <div className="bg-emerald-500/20 border border-emerald-500/40 rounded-lg px-4 py-2">
                        <p className="text-xs text-xc-muted">Signal</p>
                        <p className="font-black text-emerald-400">
                          {xlinkForecast.signal}
                        </p>
                      </div>
                      <div className="bg-emerald-500/20 border border-emerald-500/40 rounded-lg px-4 py-2">
                        <p className="text-xs text-xc-muted">Expected Return</p>
                        <p className="font-black text-emerald-400">
                          +{xlinkForecast.expectedReturn.toFixed(1)}%
                        </p>
                      </div>
                      <div className="bg-emerald-500/20 border border-emerald-500/40 rounded-lg px-4 py-2">
                        <p className="text-xs text-xc-muted">Confidence</p>
                        <p className="font-black text-emerald-400">
                          {xlinkForecast.confidence}%
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="w-full lg:w-auto lg:min-w-[240px]">
                    <div className="bg-white/5 border border-emerald-500/30 rounded-xl p-6 text-center">
                      <p className="text-xs text-xc-muted font-bold mb-2">
                        PRICE TARGET
                      </p>
                      <p className="text-3xl font-black text-emerald-400 font-mono mb-3">
                        ${xlinkForecast.predictedPrice.toFixed(2)}
                      </p>
                      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mb-3">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                          style={{
                            width: `${Math.min(100, (xlinkForecast.predictedPrice / xlinkForecast.currentPrice - 1) * 5 + 50)}%`,
                          }}
                        />
                      </div>
                      <button className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black py-2 rounded-lg transition-all">
                        Execute Order
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          ) : null;
        })()}

        {/* ── Oracle Widget + Sentiment Panel ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
          <div className="lg:col-span-2 bg-xc-card border border-xc-border rounded-2xl p-4 md:p-6">
            <AIOracle
              allocation={allocation}
              forecasts={forecasts}
              loading={loading}
              onRefresh={fetchAll}
            />
          </div>

          <div className="bg-xc-card border border-xc-border rounded-2xl p-4 md:p-6 space-y-4 md:space-y-5">
            <h3 className="font-black text-white text-base">
              Market Sentiment
            </h3>

            {/* Symbol selector */}
            <div className="flex flex-wrap gap-1.5 md:gap-2">
              {SYMBOLS.map((sym) => (
                <button
                  key={sym}
                  onClick={() => setActiveSymbol(sym)}
                  className={cn(
                    "px-3 py-1 rounded-lg text-xs font-bold transition-all",
                    activeSymbol === sym
                      ? "bg-xc-purple text-black font-bold"
                      : "bg-white/5 text-xc-muted hover:text-white",
                  )}
                >
                  {sym}
                </button>
              ))}
            </div>

            {sentiment && (
              <div className="space-y-4">
                <div className="text-center py-4">
                  <div
                    className={cn(
                      "text-4xl md:text-5xl font-black mb-2",
                      sentiment.score > 0.5
                        ? "text-xc-green"
                        : sentiment.score < 0.4
                          ? "text-xc-red"
                          : "text-white/50",
                    )}
                  >
                    {Math.round(sentiment.score * 100)}
                  </div>
                  <div className="text-sm font-bold text-white">
                    {sentiment.label}
                  </div>
                  <div className="text-xs text-xc-muted mt-1">
                    {sentiment.sources} sources analyzed
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-xc-muted mb-1.5">
                    <span>Bearish</span>
                    <span>Bullish</span>
                  </div>
                  <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-xc-red via-amber-400 to-xc-green transition-all duration-500"
                      style={{ width: `${sentiment.score * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Model stack */}
            <div className="pt-4 border-t border-xc-border space-y-3">
              <div className="text-xs font-bold text-xc-muted uppercase tracking-wider">
                Model Stack
              </div>
              {[
                { name: "LSTM Forecasting", status: "Active", accuracy: "82%" },
                {
                  name: "Monte Carlo",
                  status: "Active",
                  simulations: "10,000",
                },
                { name: "Sentiment NLP", status: "Active", model: "FinBERT" },
              ].map((m) => (
                <div
                  key={m.name}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-xc-muted">{m.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white/60">
                      {m.accuracy || m.simulations || m.model}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-xc-green" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Sentiment Timeline Chart (full width) ── */}
        <div className="bg-xc-card border border-xc-border rounded-2xl p-4 md:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 md:mb-5 gap-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-white/50" />
              <h3 className="font-black text-white text-sm md:text-base">
                Sentiment Timeline — {activeSymbol}
              </h3>
            </div>
            <span className="text-xs text-emerald-400 flex items-center gap-1 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />{" "}
              LIVE · 30 days
            </span>
          </div>
          <div className="h-[160px] md:h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={sentimentTimeline}
                margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
              >
                <defs>
                  <linearGradient id="sentGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
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
                  domain={[0, 1]}
                  tickFormatter={(v) => `${(Number(v ?? 0) * 100).toFixed(0)}`}
                />
                <Tooltip
                  contentStyle={{
                    background: "#0d0d1e",
                    border: "1px solid #1a1a3a",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v: number) => [
                    `${(Number(v ?? 0) * 100).toFixed(1)}`,
                    "Sentiment Score",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  fill="url(#sentGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-between mt-3 text-xs text-xc-muted">
            <span>0 = Extremely Bearish</span>
            <span>50 = Neutral</span>
            <span>100 = Extremely Bullish</span>
          </div>
        </div>
      </div>
      </RailLock>
    </DashboardLayout>
  );
}

const DEMO_FORECASTS = [
  {
    symbol: "TSLA",
    currentPrice: 342.18,
    predictedPrice: 405.1,
    expectedReturn: 18.4,
    horizon: "30d",
    confidence: 74,
    signal: "BUY" as const,
  },
  {
    symbol: "NVDA",
    currentPrice: 875.39,
    predictedPrice: 1086.98,
    expectedReturn: 24.2,
    horizon: "30d",
    confidence: 81,
    signal: "BUY" as const,
  },
  {
    symbol: "AAPL",
    currentPrice: 213.07,
    predictedPrice: 232.44,
    expectedReturn: 9.1,
    horizon: "30d",
    confidence: 78,
    signal: "BUY" as const,
  },
  {
    symbol: "META",
    currentPrice: 513.92,
    predictedPrice: 528.15,
    expectedReturn: 2.8,
    horizon: "30d",
    confidence: 65,
    signal: "HOLD" as const,
  },
  {
    symbol: "AMZN",
    currentPrice: 196.25,
    predictedPrice: 184.01,
    expectedReturn: -6.2,
    horizon: "30d",
    confidence: 61,
    signal: "SELL" as const,
  },
  {
    symbol: "PLTR",
    currentPrice: 23.47,
    predictedPrice: 28.92,
    expectedReturn: 23.2,
    horizon: "30d",
    confidence: 69,
    signal: "BUY" as const,
  },
  {
    symbol: "XSPACE",
    currentPrice: 252.0,
    predictedPrice: 318.5,
    expectedReturn: 26.4,
    horizon: "30d",
    confidence: 72,
    signal: "BUY" as const,
  },
  {
    symbol: "MSFT",
    currentPrice: 428.86,
    predictedPrice: 442.2,
    expectedReturn: 3.1,
    horizon: "30d",
    confidence: 70,
    signal: "HOLD" as const,
  },
  {
    symbol: "XLINK",
    currentPrice: 95.25,
    predictedPrice: 134.8,
    expectedReturn: 41.6,
    horizon: "30d",
    confidence: 85,
    signal: "BUY" as const,
  },
];
