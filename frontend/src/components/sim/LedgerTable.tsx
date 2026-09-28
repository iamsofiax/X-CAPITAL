"use client";

import { useMemo, useState } from "react";
import type { LedgerEntry, LedgerKind } from "@/lib/sim/types";
import { fmtNum, shortHash, signClass } from "@/lib/sim/format";
import { cn } from "@/lib/utils";

const KIND_TONE: Partial<Record<LedgerKind, string>> = {
  GENESIS: "text-emerald-300",
  RESET: "text-amber-300",
  FEE_SHARE: "text-emerald-300",
  YIELD: "text-emerald-300",
  DEPOSIT: "text-emerald-300",
  EMISSION: "text-indigo-300",
  COMPOUND: "text-cyan-300",
  LOCK: "text-violet-300",
  UNLOCK: "text-violet-300",
  CARRY: "text-white/40",
};

const FILTERS: { id: string; label: string; kinds?: LedgerKind[] }[] = [
  { id: "all", label: "All" },
  { id: "trades", label: "Trades", kinds: ["TRADE_BUY", "TRADE_SELL"] },
  { id: "vaults", label: "Vaults", kinds: ["VAULT_DEPOSIT", "VAULT_WITHDRAW", "COMPOUND"] },
  { id: "yield", label: "Growth", kinds: ["FEE_SHARE", "EMISSION", "YIELD"] },
  { id: "conviction", label: "Conviction", kinds: ["LOCK", "UNLOCK"] },
];

export function LedgerTable({ ledger, limit = 50 }: { ledger: LedgerEntry[]; limit?: number }) {
  const [filter, setFilter] = useState("all");
  const [shown, setShown] = useState(limit);
  const rows = useMemo(() => {
    const f = FILTERS.find((x) => x.id === filter);
    return f?.kinds ? ledger.filter((e) => f.kinds!.includes(e.kind)) : ledger;
  }, [ledger, filter]);

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => { setFilter(f.id); setShown(limit); }}
            className={cn("sim-chip cursor-pointer", filter === f.id && "sim-chip-live")}
          >
            {f.label}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-white/40 py-6 text-center">No entries yet.</p>
      ) : (
        <div className="overflow-x-auto -mx-4 sm:-mx-5 lg:-mx-6">
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="sim-label text-[9px] border-b border-white/[0.05]">
                <th className="font-normal px-5 py-2">Tx hash</th>
                <th className="font-normal px-2 py-2">Epoch</th>
                <th className="font-normal px-2 py-2">Type</th>
                <th className="font-normal px-2 py-2">Route</th>
                <th className="font-normal px-2 py-2 text-right">Amount</th>
                <th className="font-normal px-5 py-2">Memo</th>
              </tr>
            </thead>
            <tbody className="sim-num text-[11.5px]">
              {rows.slice(0, shown).map((e) => (
                <tr key={e.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                  <td className="px-5 py-2 text-white/55" title={e.hash}>0x{shortHash(e.hash)}</td>
                  <td className="px-2 py-2 text-white/55">{e.epoch.toLocaleString()}</td>
                  <td className={cn("px-2 py-2 font-bold", KIND_TONE[e.kind] ?? "text-white/80")}>{e.kind}</td>
                  <td className="px-2 py-2 text-white/40 whitespace-nowrap">{e.from} → {e.to}</td>
                  <td className={cn("px-2 py-2 text-right font-bold whitespace-nowrap", signClass(e.amount))}>
                    {e.amount > 0 ? "+" : ""}{fmtNum(e.amount, e.asset === "sXC" ? 4 : 2)} {e.asset === "sUSDC" ? "USD" : e.asset === "sXC" ? "XC" : e.asset}
                  </td>
                  <td className="px-5 py-2 text-white/45 max-w-[340px] truncate" title={e.memo}>{e.memo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {rows.length > shown && (
        <button type="button" onClick={() => setShown((n) => n + limit)} className="sim-btn sim-btn-ghost w-full mt-3 text-[12px]">
          Load {Math.min(limit, rows.length - shown)} more of {rows.length - shown}
        </button>
      )}
    </div>
  );
}
