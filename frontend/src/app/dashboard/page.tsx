"use client";

import { useMemo } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { MissionPanel, PhaseTrack, RailAccessStrip } from "@/components/x-engine";
import { ENGINE_COPY } from "@/lib/xEngine";
import { useXEngine } from "@/hooks/useXEngine";
import { useSessionUser } from "@/hooks/useSessionUser";
import { useStableBalance, useStableNav } from "@/hooks/useStableBalance";
import { useAccountStore, selectSeries } from "@/store/useAccountStore";
import CompoundingEscalator from "@/components/retention/CompoundingEscalator";
import OpportunityCostVisualizer from "@/components/retention/OpportunityCostVisualizer";
import DashboardNav, { ActivityList } from "@/components/overview/DashboardNav";
import { getNodeProgress } from "@/lib/nodeLadder";
import { cn, formatCurrency } from "@/lib/utils";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function DashboardPage() {
  const { isArmed } = useXEngine();
  const user = useSessionUser();
  const cash = useStableBalance();
  const nav = useStableNav();
  const snapshot = useAccountStore((s) => s.snapshot);
  const dailyRate = snapshot?.yieldConfig.dailyRate ?? 0.015;
  const series = useMemo(() => {
    const base = selectSeries(snapshot);
    if (!base.length) return [];
    return base.map((p, i) => (i === base.length - 1 ? { ...p, value: nav } : p));
  }, [snapshot, nav]);
  const prog = getNodeProgress(nav, user);

  return (
    <DashboardLayout title="Overview" subtitle="OPS-00 · capital terminal">
      <div className="space-y-5">
        {!isArmed && (
          <MissionPanel title={ENGINE_COPY.nodeCold} code="OPS-00">
            <p className="text-sm text-white/50">{ENGINE_COPY.groundHold}</p>
          </MissionPanel>
        )}
        <DashboardNav nav={nav} cash={cash} />
        <div className="grid lg:grid-cols-5 gap-5">
          <div className="lg:col-span-3 space-y-5">
            <section className="rounded-2xl border border-white/[0.07] bg-[#08080c] p-5 md:p-6">
              <p className="engine-mono text-[10px] tracking-[0.18em] text-white/35 uppercase">
                Trajectory
              </p>
              {series.length === 0 ? (
                <p className="mt-4 text-sm text-white/40">No ledger history yet.</p>
              ) : (
                <div className="mt-4 h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={series}>
                      <XAxis
                        dataKey="date"
                        tick={{ fill: "rgba(255,255,255,0.28)", fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: "rgba(255,255,255,0.28)", fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                        width={52}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "#0a0a0e",
                          border: "1px solid rgba(255,255,255,0.08)",
                        }}
                        formatter={(v: number) => [formatCurrency(v), "NAV"]}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#10b981"
                        strokeWidth={1.75}
                        fill="#10b98133"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>
            <ActivityList txs={(snapshot?.transactions ?? []).slice(0, 12)} />
          </div>
          <div className="lg:col-span-2 space-y-5">
            <section className="rounded-2xl border border-white/[0.07] bg-[#08080c] p-5 space-y-4">
              <div className="flex items-baseline justify-between">
                <span className={cn("text-lg font-semibold", prog.current.color)}>
                  {prog.current.code}
                </span>
                <span className="engine-mono text-xs text-white/40">
                  {(dailyRate * 100).toFixed(2)}% / day
                </span>
              </div>
              {prog.next && (
                <p className="text-xs text-white/40">
                  {formatCurrency(Math.max(0, prog.remaining))} to {prog.next.code}
                </p>
              )}
              <PhaseTrack />
              <RailAccessStrip />
            </section>
            <CompoundingEscalator currentBalance={nav} dailyRate={dailyRate} />
            <OpportunityCostVisualizer currentBalance={nav} dailyRate={dailyRate} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
