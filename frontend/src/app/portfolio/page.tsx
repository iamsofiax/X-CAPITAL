"use client";

import { useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Panel, Stat } from "@/components/sim/Panel";
import { NavChart } from "@/components/sim/NavChart";
import { ProjectionFan } from "@/components/sim/ProjectionFan";
import { Achievements } from "@/components/sim/Achievements";
import { TierLadder } from "@/components/sim/TierBadge";
import { useProjectionInput, useSim } from "@/hooks/useSim";
import { VAULT_BY_ID, navAt } from "@/lib/sim/vaults";
import { INSTRUMENT_BY_SYMBOL } from "@/lib/sim/instruments";
import { CATALOG_BY_SKU, incomePerMinute } from "@/lib/commerceDesk";
import { LiveBook } from "@/components/desk/LiveBook";
import { useLiveYield } from "@/hooks/useLiveYield";
import { fmtPct, fmtUsdc, signClass } from "@/lib/sim/format";
import { cn } from "@/lib/utils";

const HORIZONS = [30, 90, 180, 365];

export default function BookPage() {
  return (
    <DashboardLayout title="Portfolio" subtitle="Holdings, cash, and income on the book" requireGenesis>
      <Book />
    </DashboardLayout>
  );
}

function Book() {
  const { account, metrics, epoch } = useSim();
  const { live, rate, accruing } = useLiveYield();
  const [horizon, setHorizon] = useState(90);
  const projection = useProjectionInput(horizon);

  const sleeves = useMemo(() => {
    if (!account || !metrics) return [];
    const rows: { id: string; label: string; kind: string; value: number; cost: number; color: string }[] = [];
    for (const [id, p] of Object.entries(account.vaults)) {
      const spec = VAULT_BY_ID[id];
      if (!spec) continue;
      rows.push({ id, label: spec.name, kind: spec.kind === "rwa" ? "RWA" : "Vault", value: p.shares * navAt(id, epoch), cost: p.costBasis, color: spec.accent });
    }
    for (const [sym, p] of Object.entries(account.positions)) {
      const mark = account.marks[sym] ?? p.avgCost;
      rows.push({ id: sym, label: `${sym} · ${INSTRUMENT_BY_SYMBOL[sym]?.name ?? ""}`, kind: "Spot", value: p.qty * mark, cost: p.qty * p.avgCost, color: "#22d3ee" });
    }
    if (account.fleet && account.fleet.units > 0) {
      rows.push({
        id: "fleet",
        label: `Robotaxi fleet · ${account.fleet.units}`,
        kind: "Fleet",
        value: account.fleet.cost,
        cost: account.fleet.cost,
        color: "#34d399",
      });
    }
    for (const h of account.commerce ?? []) {
      const item = CATALOG_BY_SKU[h.sku];
      rows.push({
        id: h.sku,
        label: item ? `${item.name} · ${h.qty}` : h.sku,
        kind: "Atelier",
        value: h.cost,
        cost: h.cost,
        color: "#93c5fd",
      });
    }
    rows.push({ id: "cash", label: "Cash USD", kind: "Cash", value: account.cash, cost: account.cash, color: "#64748b" });
    return rows.sort((a, b) => b.value - a.value);
  }, [account, metrics, epoch]);

  if (!account || !metrics) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 text-sm text-white/55">
        Opening the book
      </div>
    );
  }
  const total = metrics.nav || 1;

  return (
    <div className="space-y-5">
      <LiveBook />
      <Panel code="Holdings" title="Portfolio" edge bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="sim-label text-[9px] border-b border-white/[0.05]">
                <th className="font-normal px-5 py-3">Holding</th>
                <th className="font-normal px-3 py-3">Sleeve</th>
                <th className="font-normal px-3 py-3 text-right">Market value</th>
                <th className="font-normal px-3 py-3 text-right">Cost</th>
                <th className="font-normal px-3 py-3 text-right">Gain</th>
                <th className="font-normal px-5 py-3 text-right">Weight</th>
              </tr>
            </thead>
            <tbody className="sim-num text-[12px]">
              {sleeves.map((s) => {
                const pnl = s.value - s.cost;
                const weight = (s.value / total) * 100;
                return (
                  <tr key={s.id} className="border-b border-white/[0.04]">
                    <td className="px-5 py-3">
                      <span className="text-white font-semibold">{s.label}</span>
                      {s.id === "fleet" && account.fleet && (
                        <span className="block text-[10px] text-emerald-300/80 font-sans">
                          +{fmtUsdc(incomePerMinute(account.fleet.cost), { decimals: 4 })} USD / minute
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-white/45">{s.kind}</td>
                    <td className="px-3 py-3 text-right text-white">{fmtUsdc(s.value)}</td>
                    <td className="px-3 py-3 text-right text-white/55">{fmtUsdc(s.cost)}</td>
                    <td className={cn("px-3 py-3 text-right", s.kind === "Cash" || s.kind === "Fleet" || s.kind === "Atelier" ? "text-white/40" : signClass(pnl))}>
                      {s.kind === "Cash" || s.kind === "Fleet" || s.kind === "Atelier" ? "—" : `${pnl >= 0 ? "+" : ""}${fmtUsdc(pnl)}`}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="text-white/70">{weight.toFixed(1)}%</span>
                      <span className="mt-1 block h-1 rounded-full bg-white/[0.06] overflow-hidden">
                        <span className="block h-full rounded-full" style={{ width: `${Math.min(100, weight)}%`, background: s.color }} />
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel code="Book" title="Net asset value" edge>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-5 mb-5">
          <Stat
            label="NAV"
            value={fmtUsdc(rate > 0 ? live : metrics.nav, { decimals: rate > 0 ? 4 : 2 })}
            sub={rate > 0 ? `Today +${fmtUsdc(accruing, { decimals: 4 })}` : "USD"}
          />
          <Stat label="Since inception" value={fmtPct(metrics.lifetimeReturn)} tone={metrics.lifetimeReturn >= 0 ? "pos" : "neg"} sub="Node book" />
          <Stat label="Season Sortino" value={metrics.sortino?.toFixed(2) ?? "—"} sub={metrics.sortino === null ? "Needs 6+ epochs" : `${metrics.seasonEpochs} epochs`} />
          <Stat label="Max drawdown" value={fmtPct(metrics.maxDrawdown, 1)} tone="neg" sub="Season, epoch-close" />
          <Stat label="Realized vol" value={fmtPct(metrics.vol, 1, false)} sub="Annualized" />
        </div>
        <NavChart history={account.navHistory} />
      </Panel>

      <div className="grid lg:grid-cols-5 gap-5">
        <Panel code="Allocation" title="Sleeves" className="lg:col-span-2">
          <div className="flex h-2.5 rounded-full overflow-hidden bg-white/[0.05] mb-4">
            {sleeves.map((s) => (
              <span key={s.id} style={{ width: `${(s.value / total) * 100}%`, background: s.color }} title={s.label} />
            ))}
          </div>
          <ul className="space-y-2">
            {sleeves.map((s) => {
              const pnl = s.value - s.cost;
              return (
                <li key={s.id} className="flex items-center gap-3 text-[12px]">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
                  <span className="flex-1 min-w-0">
                    <span className="block text-white font-semibold truncate">{s.label}</span>
                    <span className="sim-label text-[8px]">{s.kind}</span>
                  </span>
                  <span className="sim-num text-right">
                    <span className="block text-white">{fmtUsdc(s.value, { compact: true })}</span>
                    {s.kind !== "Cash" && (
                      <span className={cn("block text-[10px]", signClass(pnl))}>{pnl >= 0 ? "+" : ""}{fmtUsdc(pnl, { compact: true })}</span>
                    )}
                  </span>
                  <span className="sim-num text-white/40 w-12 text-right">{((s.value / total) * 100).toFixed(1)}%</span>
                </li>
              );
            })}
          </ul>
        </Panel>

        <Panel
          code="Monte Carlo"
          title="Projected book range"
          className="lg:col-span-3"
          action={
            <div className="flex gap-1">
              {HORIZONS.map((h) => (
                <button key={h} type="button" onClick={() => setHorizon(h)} className={cn("sim-chip cursor-pointer", horizon === h && "sim-chip-live")}>
                  {h}D
                </button>
              ))}
            </div>
          }
        >
          {projection && <ProjectionFan input={projection} />}
        </Panel>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <Panel code="Career" title="Track record">
          <TierLadder xp={account.xp} />
          <dl className="grid grid-cols-3 gap-3 mt-5 sim-num text-[12px]">
            <div><dt className="sim-label text-[8.5px]">Trades</dt><dd className="text-white font-bold">{account.totals.trades}</dd></div>
            <div><dt className="sim-label text-[8.5px]">Spread paid</dt><dd className="text-amber-300 font-bold">{fmtUsdc(account.totals.spreadPaid)}</dd></div>
            <div><dt className="sim-label text-[8.5px]">Fee share earned</dt><dd className="sim-pos font-bold">{fmtUsdc(account.totals.feeShare)}</dd></div>
          </dl>
        </Panel>
        <Panel code="Milestones" title="Achievements">
          <Achievements earned={account.achievements} />
        </Panel>
      </div>
    </div>
  );
}
