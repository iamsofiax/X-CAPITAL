"use client";

import { useMemo } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/ui/Card";
import HoldingsList from "@/components/portfolio/HoldingsList";
import {
  MissionPanel,
  RailLock,
  PhaseTrack,
  RailInfrastructureHeader,
} from "@/components/x-engine";
import { ENGINE_COPY } from "@/lib/xEngine";
import { useXEngine } from "@/hooks/useXEngine";
import { useStableBalance, useStableNav } from "@/hooks/useStableBalance";
import { useAccountStore, selectSeries } from "@/store/useAccountStore";
import { useMarketPrices } from "@/hooks/useMarketPrices";
import { formatCurrency, formatPercent } from "@/lib/utils";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import DashboardNav from "@/components/overview/DashboardNav";
import type { PortfolioHolding } from "@/types";

const PIE = ["#10b981", "#34d399", "#6ee7b7", "#a7f3d0", "#059669", "#047857"];

export default function PortfolioPage() {
  const { isArmed } = useXEngine();
  const cash = useStableBalance();
  const nav = useStableNav();
  const snapshot = useAccountStore((s) => s.snapshot);
  const { prices } = useMarketPrices({ refreshInterval: 120_000 });

  const holdings: PortfolioHolding[] = useMemo(() => {
    const raw = snapshot?.portfolio.holdings ?? [];
    return raw.map((h) => {
      const live = prices[h.asset?.symbol ?? ""];
      if (!live) return h;
      const currentValue = h.quantity * live.price;
      return {
        ...h,
        currentValue,
        unrealizedPnL: currentValue - h.quantity * h.avgCost,
        asset: h.asset ? { ...h.asset, price: live.price } : h.asset,
      };
    });
  }, [snapshot, prices]);

  const holdingsValue = holdings.reduce((s, h) => s + Number(h.currentValue), 0);
  const fundsValue = Number(snapshot?.portfolio.fundsValue ?? 0);
  const workingLine =
    holdings.length === 0 && cash > 0
      ? [{ name: "Working capital", value: Math.round(cash) }]
      : [];
  const allocation = holdings.length
    ? [
        ...holdings.map((h) => ({
          name: h.asset?.symbol ?? "Holding",
          value: Math.round(Number(h.currentValue)),
        })),
        ...(cash > 0.01 ? [{ name: "Cash", value: Math.round(cash) }] : []),
      ]
    : workingLine;

  const series = useMemo(() => {
    const base = selectSeries(snapshot);
    return base.map((p, i) => (i === base.length - 1 ? { ...p, value: nav } : p));
  }, [snapshot, nav]);

  const approved = snapshot?.ledger.approvedCapital ?? 0;
  const ret = nav - approved;
  const retPct = approved > 0 ? (ret / approved) * 100 : 0;

  return (
    <DashboardLayout title="Holdings" subtitle="HOLD-02 · live NAV">
      <RailLock rail="portfolio">
        <div className="space-y-6">
          <RailInfrastructureHeader rail="portfolio" />
          {!isArmed && holdings.length === 0 && cash <= 0 && (
            <MissionPanel title={ENGINE_COPY.nodeCold} code="HOLD-00">
              <p className="text-sm text-white/50">{ENGINE_COPY.groundHold}</p>
            </MissionPanel>
          )}

          <DashboardNav nav={nav} cash={cash} />

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard title="NAV" value={formatCurrency(nav)} change={retPct} />
            <StatCard title="Holdings" value={formatCurrency(holdingsValue)} />
            <StatCard title="Funds" value={formatCurrency(fundsValue)} />
            <StatCard title="Return" value={formatPercent(retPct)} change={retPct} />
          </div>

          <section className="rounded-2xl border border-white/[0.07] bg-[#08080c] p-5">
            <p className="engine-mono text-[10px] tracking-[0.18em] text-white/35 uppercase">
              Trajectory
            </p>
            {series.length === 0 ? (
              <p className="mt-4 text-sm text-white/40">No ledger history yet.</p>
            ) : (
              <div className="mt-4 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={series}>
                    <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.28)", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "rgba(255,255,255,0.28)", fontSize: 10 }} axisLine={false} tickLine={false} width={52} />
                    <Tooltip contentStyle={{ background: "#0a0a0e", border: "1px solid rgba(255,255,255,0.08)" }} formatter={(v: number) => [formatCurrency(v), "NAV"]} />
                    <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={1.75} fill="#10b98133" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>

          <div className="grid lg:grid-cols-2 gap-5">
            <section className="rounded-2xl border border-white/[0.07] bg-[#08080c] p-5">
              {holdings.length === 0 ? (
                <div>
                  <p className="engine-mono text-[10px] tracking-[0.18em] text-white/35 uppercase">Positions</p>
                  <p className="mt-3 text-sm text-white/70">Working capital {formatCurrency(cash)}</p>
                  <p className="mt-1 text-xs text-white/40">Unallocated cash is accruing. Deploy into a rail when ready.</p>
                  <Link href="/wallet" className="inline-block mt-4 text-sm font-semibold text-white underline">Deploy</Link>
                </div>
              ) : (
                <HoldingsList holdings={holdings} />
              )}
            </section>
            <section className="rounded-2xl border border-white/[0.07] bg-[#08080c] p-5">
              <p className="engine-mono text-[10px] tracking-[0.18em] text-white/35 uppercase mb-4">Allocation</p>
              {allocation.length === 0 ? (
                <p className="text-sm text-white/40">Empty book.</p>
              ) : (
                <>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={allocation} dataKey="value" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
                          {allocation.map((_, i) => (
                            <Cell key={i} fill={PIE[i % PIE.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: number) => [formatCurrency(v)]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <ul className="mt-3 space-y-2">
                    {allocation.map((item, i) => {
                      const total = allocation.reduce((s, d) => s + d.value, 0);
                      return (
                        <li key={item.name} className="flex justify-between text-xs">
                          <span className="text-white/50">
                            <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ background: PIE[i % PIE.length] }} />
                            {item.name}
                          </span>
                          <span className="font-mono text-white">{total > 0 ? ((item.value / total) * 100).toFixed(1) : "0.0"}%</span>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </section>
          </div>
          <PhaseTrack />
        </div>
      </RailLock>
    </DashboardLayout>
  );
}
