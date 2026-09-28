"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Panel } from "@/components/sim/Panel";
import { useSim } from "@/hooks/useSim";
import { useStore } from "@/store/useStore";
import { listReceipts, type TradeReceipt as Slip } from "@/lib/yieldDesk";
import { TradeReceipt } from "@/components/desk/TradeReceipt";
import { VAULT_BY_ID, navAt } from "@/lib/sim/vaults";
import { INSTRUMENTS, INSTRUMENT_BY_SYMBOL } from "@/lib/sim/instruments";
import { useSimQuotes } from "@/hooks/useSimQuotes";
import { CATALOG_BY_SKU, incomePerMinute } from "@/lib/commerceDesk";
import { LiveBook } from "@/components/desk/LiveBook";
import { YieldWatch } from "@/components/desk/YieldWatch";
import { useLiveYield } from "@/hooks/useLiveYield";
import { fmtUsdc, signClass } from "@/lib/sim/format";
import { cn } from "@/lib/utils";

export default function BookPage() {
  return (
    <DashboardLayout title="Book" subtitle="Profit and loss, allocation, and lead sleeves" requireGenesis>
      <Book />
    </DashboardLayout>
  );
}

function Book() {
  const { account, metrics, epoch } = useSim();
  const { quotes, liveCount } = useSimQuotes();
  const { active } = useLiveYield();
  const userId = useStore((s) => s.user?.id);
  const [slips, setSlips] = useState<Slip[]>([]);
  const [openSlip, setOpenSlip] = useState<Slip | null>(null);

  useEffect(() => {
    const pull = () => setSlips(userId ? listReceipts(userId).slice(0, 8) : []);
    pull();
    const id = window.setInterval(pull, 1500);
    window.addEventListener("xc-yield", pull);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("xc-yield", pull);
    };
  }, [userId]);

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
      <div className="sim-glass p-6 text-sm text-white/55">
        Opening the book
      </div>
    );
  }
  const total = metrics.nav || 1;

  return (
    <div className="space-y-5">
      <LiveBook />
      <Panel code="Tape" title={`${INSTRUMENTS.length} listed names`} edge bodyClassName="p-0">
        <p className="px-4 sm:px-5 pt-4 text-[12px] text-white/45">
          {liveCount} printing from the market. The rest move with the index so the book does not sit still.
        </p>
        <div className="mt-3 max-h-[28rem] overflow-auto">
          <table className="w-full min-w-[520px] text-left">
            <thead className="sticky top-0 bg-[#121816]">
              <tr className="sim-label text-[9px] border-b border-white/[0.05]">
                <th className="font-normal px-4 sm:px-5 py-3">Name</th>
                <th className="font-normal px-3 py-3 text-right">Last</th>
                <th className="font-normal px-4 sm:px-5 py-3 text-right">Session</th>
              </tr>
            </thead>
            <tbody className="sim-num text-[12px]">
              {INSTRUMENTS.map((inst) => {
                const q = quotes[inst.symbol];
                const chg = q?.change24h ?? 0;
                return (
                  <tr key={inst.symbol} className="border-b border-white/[0.04]">
                    <td className="px-4 sm:px-5 py-2.5">
                      <span className="text-white font-semibold">{inst.symbol}</span>
                      <span className="block text-[11px] text-white/40 font-sans">{inst.name}</span>
                    </td>
                    <td className="px-3 py-2.5 text-right text-white">{q ? fmtUsdc(q.mid, { decimals: q.mid >= 100 ? 2 : 4 }) : "—"}</td>
                    <td className={cn("px-4 sm:px-5 py-2.5 text-right", signClass(chg))}>
                      {q ? `${chg >= 0 ? "+" : ""}${chg.toFixed(2)}%` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
      <YieldWatch />
      <Panel code="Settlements" title="Receipts" edge>
        {slips.length === 0 ? (
          <p className="text-sm text-white/45">
            {active ? "A settlement slip prints at the end of each fill." : "Slips print after the desk activates the node and a fill is made."}
          </p>
        ) : (
          <ul className="grid sm:grid-cols-2 gap-3">
            {slips.map((s) => (
              <li key={s.id}>
                <button type="button" onClick={() => setOpenSlip(s)} className="pnl-sleeve w-full text-left">
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-white">{s.side} {s.symbol}</span>
                    <span className="font-mono text-[11px] text-white/45">{s.id}</span>
                  </span>
                  <span className="mt-1 block text-[12px] text-white/55">{fmtUsdc(s.notional)} · {new Date(s.at).toLocaleString()}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {openSlip && <TradeReceipt slip={openSlip} onClose={() => setOpenSlip(null)} />}
      </Panel>
      <Panel code="Holdings" title="Portfolio" edge bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem] text-left">
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
    </div>
  );
}
