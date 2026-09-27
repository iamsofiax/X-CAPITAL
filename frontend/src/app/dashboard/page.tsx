"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Coins, Link2, ShieldCheck } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { LiveBook } from "@/components/desk/LiveBook";
import { YieldWatch } from "@/components/desk/YieldWatch";
import { useLiveYield } from "@/hooks/useLiveYield";
import { CoinMark } from "@/components/desk/Marks";
import { RAILS } from "@/lib/rails";
import { walletAPI } from "@/lib/api";
import { fmtUsdc } from "@/lib/sim/format";

type Balances = Record<string, { cash: string; reserved: string }>;

const VAULT = ["USDT", "BTC", "ETH", "SOL"] as const;

export default function CommandCenterPage() {
  const [balances, setBalances] = useState<Balances>({});
  const [mode, setMode] = useState("");

  useEffect(() => {
    walletAPI
      .getWallet()
      .then(({ data }) => {
        setBalances(data.data?.balances ?? {});
        setMode(data.data?.mode ?? "");
      })
      .catch(() => setBalances({}));
  }, []);

  return (
    <DashboardLayout title="Command" subtitle="Profit and loss · allocation · lead sleeves">
      <div className="space-y-5">
        <CompileStrip />
        <LiveBook />
        <YieldWatch />

        <div>
          <p className="sim-label mb-3">Test the desk</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
            <Link href="/settings/kyc" className="sim-glass flex items-start gap-3 p-4 min-h-[108px]">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-300/40 bg-emerald-300/10 text-emerald-300">
                <ShieldCheck className="h-4 w-4" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="sim-label block text-[9px]">Identity</span>
                <span className="mt-1 block text-sm font-bold text-white">Full KYC packet</span>
                <span className="mt-1 block text-xs leading-snug text-white/45">Send name, address, and document for the operator to confirm.</span>
              </span>
            </Link>
            <Link href="/settings/links" className="sim-glass flex items-start gap-3 p-4 min-h-[108px]">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-300/40 bg-emerald-300/10 text-emerald-300">
                <Link2 className="h-4 w-4" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="sim-label block text-[9px]">Outside accounts</span>
                <span className="mt-1 block text-sm font-bold text-white">401(k), IRA, brokerage, pension</span>
                <span className="mt-1 block text-xs leading-snug text-white/45">Each plan has its own steps. Cash posts only after the operator confirms it.</span>
              </span>
            </Link>
          </div>
          <p className="sim-label mb-3">Rails</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {RAILS.map((rail) => {
              const Icon = rail.icon;
              return (
                <Link
                  key={rail.id}
                  href={rail.href}
                  className="sim-glass flex items-start gap-3 p-4 min-h-[108px]"
                >
                  <span
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"
                    style={{ color: rail.accent, borderColor: `${rail.accent}55`, background: `${rail.accent}18` }}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="sim-label block text-[9px]">{rail.code}</span>
                    <span className="mt-1 block text-sm font-bold text-white">{rail.label}</span>
                    <span className="mt-1 block text-xs leading-snug text-white/45">{rail.blurb}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        <div>
          <p className="sim-label mb-3 flex items-center gap-2">
            <Coins className="h-3.5 w-3.5" aria-hidden />
            Vault cash {mode ? `· ${mode}` : ""}
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {VAULT.map((sym) => (
              <div key={sym} className="sim-glass p-4">
                <div className="flex items-center gap-2">
                  <CoinMark asset={sym} size={32} />
                  <p className="sim-label">{sym}</p>
                </div>
                <p className="mt-3 text-xl sm:text-2xl font-black tabular-nums">{fmt(balances[sym]?.cash)}</p>
                <p className="text-[11px] text-white/40 mt-1">Reserved {fmt(balances[sym]?.reserved)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function CompileStrip() {
  const { active, rate, weekly, live, posted } = useLiveYield();
  const compiled = Math.max(0, live - posted);
  return (
    <section className="sim-glass sim-glass-edge p-5 md:p-6">
      <p className="sim-label text-emerald-300">Compile</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight">
            {active ? `${fmtUsdc(compiled)} compiling this cycle` : "The book compiles after the node is live"}
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-white/55 leading-relaxed">
            {active
              ? `The operated book is running at ${rate}% a day, ${weekly.toFixed(2)}% a week. Leave it funded and each cycle stacks on the last.`
              : "Fund the node, then wait for the operator to activate it. Until then the posted book stays at the confirmed cash."}
          </p>
        </div>
        {active && <p className="text-3xl font-black tabular-nums text-emerald-300">{fmtUsdc(live)}</p>}
      </div>
    </section>
  );
}

function fmt(v?: string) {
  if (!v) return "0";
  const n = Number(v);
  if (Number.isNaN(n)) return v;
  return n.toLocaleString(undefined, { maximumFractionDigits: 8 });
}
