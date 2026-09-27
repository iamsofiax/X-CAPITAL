"use client";

import { useCallback, useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { walletAPI } from "@/lib/api";
import { pushNotice } from "@/lib/yieldDesk";
import { useStore } from "@/store/useStore";
import { FundDesk } from "@/components/desk/FundDesk";

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
    <DashboardLayout title="Ledger" subtitle="Cash accounts · on-chain deposits · withdrawals">
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

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {ASSETS.map((sym) => (
          <div key={sym} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
            <p className="text-[10px] font-mono text-white/35 tracking-widest">{sym}</p>
            <p className="text-xl font-black mt-1">{fmt(balances[sym]?.cash)}</p>
            <p className="text-[11px] text-white/40 mt-1">Reserved {fmt(balances[sym]?.reserved)}</p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-white/[0.08] p-5">
        <p className="font-black mb-3">Withdraw</p>
        <form onSubmit={submitWithdraw} className="grid md:grid-cols-4 gap-3">
          <select
            className="bg-black border border-white/15 rounded px-3 py-2 text-sm"
            value={asset}
            onChange={(e) => setAsset(e.target.value as (typeof ASSETS)[number])}
          >
            {ASSETS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <input className="sim-input" placeholder="Destination address" value={toAddress} onChange={(e) => setToAddress(e.target.value)} required />
          <input className="sim-input" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          <button type="submit" disabled={busy} className="sim-btn sim-btn-primary">Reserve &amp; broadcast</button>
        </form>
        <p className="text-[12px] text-white/40 mt-2">
          Cash is reserved first. The provider broadcasts. Settlement or fail is a second journal entry.
        </p>
      </section>

      <section className="rounded-2xl border border-white/[0.08] overflow-hidden">
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

      <section className="rounded-2xl border border-white/[0.08] overflow-hidden">
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

      <section className="rounded-2xl border border-white/[0.08] overflow-hidden">
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
