"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { formatCurrency, formatPercent, formatRelativeTime, cn } from "@/lib/utils";
import { useAccountStore } from "@/store/useAccountStore";
import { computeYield, DEFAULT_DAILY_RATE } from "@/store/useProfitEngine";
import type { WalletTransaction } from "@/types";

export default function DashboardNav({
  nav,
  cash,
}: {
  nav: number;
  cash: number;
}) {
  const snap = useAccountStore((s) => s.snapshot);
  const r = snap?.yieldConfig.dailyRate ?? DEFAULT_DAILY_RATE;
  const y24 = computeYield(cash, r, 1, snap?.yieldConfig.profitMode ?? "compound");
  const cap = snap?.ledger.approvedCapital ?? snap?.wallet.approvedCapital ?? 0;
  const ret = nav - cap;
  const pct = cap > 0 ? (ret / cap) * 100 : 0;
  const held = snap?.yieldConfig.profitHold;
  const idle = cash > 0.01 && cash === nav;

  return (
    <section className="rounded-2xl border border-white/[0.07] bg-[#08080c] p-5 md:p-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="engine-mono text-[10px] tracking-[0.18em] text-white/35 uppercase">
            Net asset value
          </p>
          <p className="mt-1 text-3xl md:text-4xl font-semibold tracking-tight text-white tabular-nums">
            {formatCurrency(nav)}
          </p>
          <p className="mt-1 text-xs text-white/40">
            {held ? "Accrual held by operator" : "Working · operator-governed rate"}
          </p>
        </div>
        <Link
          href="/wallet"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-white text-black px-5 py-2.5 text-sm font-semibold hover:bg-white/90"
        >
          Deploy <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-3">
          <p className="engine-mono text-[9px] tracking-wider text-white/30 uppercase">24h yield</p>
          <p className="mt-1 text-sm font-semibold tabular-nums text-emerald-400">{formatCurrency(y24)}</p>
        </div>
        <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-3">
          <p className="engine-mono text-[9px] tracking-wider text-white/30 uppercase">Approved capital</p>
          <p className="mt-1 text-sm font-semibold tabular-nums text-white">{formatCurrency(cap)}</p>
        </div>
        <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-3">
          <p className="engine-mono text-[9px] tracking-wider text-white/30 uppercase">Total return</p>
          <p className={cn("mt-1 text-sm font-semibold tabular-nums", ret >= 0 ? "text-emerald-400" : "text-red-400")}>
            {formatCurrency(ret)} {formatPercent(pct)}
          </p>
        </div>
        <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-3">
          <p className="engine-mono text-[9px] tracking-wider text-white/30 uppercase">{idle ? "Unallocated" : "Cash sleeve"}</p>
          <p className="mt-1 text-sm font-semibold tabular-nums text-white">{formatCurrency(cash)}</p>
        </div>
      </div>
    </section>
  );
}

export function ActivityList({ txs }: { txs: WalletTransaction[] }) {
  return (
    <section className="rounded-2xl border border-white/[0.07] bg-[#08080c] p-5 md:p-6">
      <p className="engine-mono text-[10px] tracking-[0.18em] text-white/35 uppercase">Activity</p>
      {txs.length === 0 ? (
        <p className="mt-4 text-sm text-white/40">No postings on this account.</p>
      ) : (
        <ul className="mt-4 divide-y divide-white/[0.05]">
          {txs.map((tx) => {
            const credit =
              tx.type === "YIELD" || tx.type === "DEPOSIT" || tx.type === "FUND_REDEMPTION" || tx.type === "DIVIDEND";
            return (
              <li key={tx.id} className="flex items-center justify-between py-3 gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-white/80 truncate">
                    {tx.type === "YIELD" ? "Yield" : tx.type === "FUND_INVESTMENT" ? "Deploy · fund" : tx.type}
                  </p>
                  <p className="engine-mono text-[10px] text-white/30">{formatRelativeTime(tx.createdAt)}</p>
                </div>
                <p className={cn("text-sm font-semibold tabular-nums shrink-0", credit ? "text-emerald-400" : "text-white/70")}>
                  {credit ? "+" : "−"}
                  {formatCurrency(Math.abs(Number(tx.amount)))}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
