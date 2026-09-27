"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { LiveBook } from "@/components/desk/LiveBook";
import { walletAPI } from "@/lib/api";

type Balances = Record<string, { cash: string; reserved: string }>;

export default function CommandCenterPage() {
  const [balances, setBalances] = useState<Balances>({});
  const [mode, setMode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    walletAPI
      .getWallet()
      .then(({ data }) => {
        setBalances(data.data?.balances ?? {});
        setMode(data.data?.mode ?? "");
      })
      .catch(() => setError(""));
  }, []);

  return (
    <DashboardLayout title="Book" subtitle="Authoritative cash from the double-entry ledger">
      <div className="space-y-6">
        <LiveBook />
        {error && <p className="text-sm text-red-300">{error}</p>}
        <p className="text-[11px] font-mono uppercase tracking-widest text-white/35">Vault cash {mode ? `· ${mode}` : ""}</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {["USDT", "BTC", "ETH", "SOL"].map((sym) => (
            <div key={sym} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
              <p className="text-[10px] font-mono text-white/35 tracking-widest">{sym}</p>
              <p className="text-2xl font-black mt-1">{fmt(balances[sym]?.cash)}</p>
              <p className="text-[11px] text-white/40 mt-1">Reserved {fmt(balances[sym]?.reserved)}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/wallet" className="sim-btn sim-btn-primary">Open ledger</Link>
          <Link href="/wallet" className="sim-btn sim-btn-ghost">Deposit addresses</Link>
        </div>
      </div>
    </DashboardLayout>
  );
}

function fmt(v?: string) {
  if (!v) return "0";
  const n = Number(v);
  if (Number.isNaN(n)) return v;
  return n.toLocaleString(undefined, { maximumFractionDigits: 8 });
}
