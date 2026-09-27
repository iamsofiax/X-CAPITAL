"use client";

import { useCallback, useEffect, useState } from "react";
import { Lock } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { walletAPI } from "@/lib/api";
import { pushNotice } from "@/lib/yieldDesk";
import { useStore } from "@/store/useStore";
import { useSim } from "@/hooks/useSim";
import { useMarketPrices } from "@/hooks/useMarketPrices";
import { nodeTradeFill, withdrawalsOpen } from "@/lib/nodeTrade";
import { FundDesk } from "@/components/desk/FundDesk";
import { CoinMark } from "@/components/desk/Marks";

type Balances = Record<string, { cash: string; reserved: string }>;

type DepositRow = {
  txHash: string;
  asset: string;
  amount: string;
  confirmations: number;
  requiredConf: number;
  status: string;
};

type WithdrawalRow = {
  id: string;
  asset: string;
  amount: string;
  toAddress: string;
  status: string;
  txHash?: string | null;
};

type JournalEntry = {
  id: string;
  type: string;
  reason: string;
  actorId: string;
  idempotencyKey: string;
  externalRef?: string | null;
  createdAt: string;
};

const ASSETS = ["BTC", "ETH", "USDT", "BNB", "DOGE", "TRX"] as const;

export default function WalletPage() {
  return (
    <DashboardLayout title="Fund node" subtitle="Treasury · cash, deposits, and the node ledger">
      <LedgerDesk />
    </DashboardLayout>
  );
}

function LedgerDesk() {
  const [balances, setBalances] = useState<Balances>({});
  const [deposits, setDeposits] = useState<DepositRow[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRow[]>([]);
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [mode, setMode] = useState("");
  const [error, setError] = useState("");
  const [asset, setAsset] = useState<(typeof ASSETS)[number]>("USDT");
  const [toAddress, setToAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const userId = useStore((s) => s.user?.id);
  const { account } = useSim();
  const fill = nodeTradeFill(account);
  const canWithdraw = withdrawalsOpen(account);
  const { prices } = useMarketPrices({ stocks: false, etfs: false, refreshInterval: 20_000 });

  const load = useCallback(async () => {
    setError("");
    try {
      const [{ data: w }, { data: j }] = await Promise.all([
        walletAPI.getWallet(),
        walletAPI.getJournal({ limit: 40 }),
      ]);
      setMode(w.data?.mode ?? "");
      setBalances(w.data?.balances ?? {});
      setDeposits(w.data?.deposits ?? []);
      setWithdrawals(w.data?.withdrawals ?? []);
      setJournal(j.data?.entries ?? []);
    } catch {
      setError("");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const submitWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWithdraw) {
      setError("Withdrawals stay paused until the node trade is filled 100%.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await walletAPI.withdraw({
        asset,
        toAddress,
        amount,
        idempotencyKey: `wd-${asset}-${Date.now()}`,
        reason: "User withdrawal",
      });
      setToAddress("");
      setAmount("");
      if (userId) pushNotice(userId, "Withdrawal requested", `${amount} ${asset} reserved for ${toAddress}. Broadcast follows desk confirmation.`);
      await load();
    } catch (err) {
      setError(readErr(err, "Withdrawal failed."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <FundDesk />
      {error && <p className="text-sm text-red-300">{error}</p>}
      <p className="text-[11px] font-mono uppercase tracking-widest text-white/35">
        MODE {mode || "—"} · balances from journal lines · deposits credit after confirmation
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {ASSETS.map((sym) => {
          const px = prices[sym]?.price;
          const cash = Number(balances[sym]?.cash);
          const usd = px && Number.isFinite(cash) ? cash * px : null;
          return (
            <div key={sym} className="sim-glass p-4 sm:p-5">
              <div className="flex items-center gap-2.5">
                <CoinMark asset={sym} size={32} />
                <div>
                  <p className="text-sm font-bold text-white">{sym}</p>
                  <p className="text-[11px] text-white/40 tabular-nums">
                    {px ? `$${px.toLocaleString(undefined, { maximumFractionDigits: px >= 100 ? 2 : 4 })} confirmed` : "Awaiting print"}
                  </p>
                </div>
              </div>
              <p className="text-xl font-black mt-3 tabular-nums">{fmt(balances[sym]?.cash)}</p>
              <p className="text-[11px] text-white/40 mt-1">
                Reserved {fmt(balances[sym]?.reserved)}
                {usd != null ? ` · ${usd.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 })}` : ""}
              </p>
            </div>
          );
        })}
      </div>

      <section className="sim-glass p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div>
            <p className="font-black flex items-center gap-2">
              {!canWithdraw && <Lock className="h-4 w-4 text-amber-300" aria-hidden />}
              Withdraw
            </p>
            <p className="text-[12px] text-white/45 mt-1 max-w-xl">
              {canWithdraw
                ? "The node trade is filled. Cash is reserved first. The provider broadcasts after desk confirmation."
                : `Paused. The node trade is ${(fill * 100).toFixed(0)}%. Cash leaves only after that sleeve is filled 100% on Execution.`}
            </p>
          </div>
          <p className="sim-label">{(fill * 100).toFixed(0)}% filled</p>
        </div>
        <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
          <div className="h-full rounded-full bg-emerald-400" style={{ width: `${Math.min(100, fill * 100)}%` }} />
        </div>
        <form onSubmit={submitWithdraw} className="grid md:grid-cols-4 gap-3">
          <select
            className="sim-input"
            value={asset}
            disabled={!canWithdraw}
            onChange={(e) => setAsset(e.target.value as (typeof ASSETS)[number])}
          >
            {ASSETS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <input className="sim-input" placeholder="Destination address" value={toAddress} onChange={(e) => setToAddress(e.target.value)} required disabled={!canWithdraw} />
          <input className="sim-input" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} required disabled={!canWithdraw} />
          <button type="submit" disabled={busy || !canWithdraw} className="sim-btn sim-btn-primary">
            {canWithdraw ? "Reserve and broadcast" : "Withdrawals paused"}
          </button>
        </form>
      </section>

      <section className="sim-glass overflow-hidden">
        <p className="px-5 py-3 font-black border-b border-white/[0.06]">On-chain deposits</p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="text-white/35 text-[10px] uppercase tracking-wider">
              <tr>
                <th className="px-5 py-2 font-normal">Tx</th>
                <th className="px-5 py-2 font-normal">Asset</th>
                <th className="px-5 py-2 font-normal">Amount</th>
                <th className="px-5 py-2 font-normal">Confirms</th>
                <th className="px-5 py-2 font-normal">Status</th>
              </tr>
            </thead>
            <tbody>
              {deposits.length === 0 && (
                <tr><td className="px-5 py-6 text-white/40" colSpan={5}>No inbound transactions yet.</td></tr>
              )}
              {deposits.map((d) => (
                <tr key={d.txHash} className="border-t border-white/[0.04]">
                  <td className="px-5 py-2 font-mono text-[11px] break-all">{d.txHash}</td>
                  <td className="px-5 py-2">{d.asset}</td>
                  <td className="px-5 py-2">{d.amount}</td>
                  <td className="px-5 py-2">{d.confirmations}/{d.requiredConf}</td>
                  <td className="px-5 py-2">{d.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="sim-glass overflow-hidden">
        <p className="px-5 py-3 font-black border-b border-white/[0.06]">Withdrawals</p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="text-white/35 text-[10px] uppercase tracking-wider">
              <tr>
                <th className="px-5 py-2 font-normal">Id</th>
                <th className="px-5 py-2 font-normal">Asset</th>
                <th className="px-5 py-2 font-normal">Amount</th>
                <th className="px-5 py-2 font-normal">Status</th>
                <th className="px-5 py-2 font-normal">Tx</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.length === 0 && (
                <tr><td className="px-5 py-6 text-white/40" colSpan={5}>No withdrawals.</td></tr>
              )}
              {withdrawals.map((w) => (
                <tr key={w.id} className="border-t border-white/[0.04]">
                  <td className="px-5 py-2 font-mono text-[11px]">{w.id}</td>
                  <td className="px-5 py-2">{w.asset}</td>
                  <td className="px-5 py-2">{w.amount}</td>
                  <td className="px-5 py-2">{w.status}</td>
                  <td className="px-5 py-2 font-mono text-[11px]">{w.txHash || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="sim-glass overflow-hidden">
        <p className="px-5 py-3 font-black border-b border-white/[0.06]">Journal</p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="text-white/35 text-[10px] uppercase tracking-wider">
              <tr>
                <th className="px-5 py-2 font-normal">When</th>
                <th className="px-5 py-2 font-normal">Type</th>
                <th className="px-5 py-2 font-normal">Reason</th>
                <th className="px-5 py-2 font-normal">Actor</th>
                <th className="px-5 py-2 font-normal">Ref</th>
              </tr>
            </thead>
            <tbody>
              {journal.length === 0 && (
                <tr><td className="px-5 py-6 text-white/40" colSpan={5}>No journal entries.</td></tr>
              )}
              {journal.map((e) => (
                <tr key={e.id} className="border-t border-white/[0.04]">
                  <td className="px-5 py-2 text-white/50">{new Date(e.createdAt).toLocaleString()}</td>
                  <td className="px-5 py-2">{e.type}</td>
                  <td className="px-5 py-2">{e.reason}</td>
                  <td className="px-5 py-2 font-mono text-[11px]">{e.actorId}</td>
                  <td className="px-5 py-2 font-mono text-[11px]">{e.externalRef || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function fmt(v?: string) {
  if (!v) return "0";
  const n = Number(v);
  if (Number.isNaN(n)) return v;
  return n.toLocaleString(undefined, { maximumFractionDigits: 8 });
}

function readErr(err: unknown, fallback: string) {
  if (err && typeof err === "object" && "response" in err) {
    const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
    if (msg) return msg;
  }
  return fallback;
}
