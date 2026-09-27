"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, RefreshCw, Shield, Ban } from "lucide-react";
import { useStore } from "@/store/useStore";
import { adminAPI } from "@/lib/api";
import { isAdminUser, type AdminUserRow } from "@/lib/apiUser";
import { loadDesks } from "@/lib/localDesk";
import { listMandates, setDailyGrowth } from "@/lib/yieldDesk";
import { useSimStore } from "@/store/useSimStore";
import { accountNav } from "@/lib/sim/engine";
import { XCapitalLogoMark } from "@/components/brand/XCapitalLogo";
import { cn } from "@/lib/utils";

type Row = AdminUserRow & {
  balances?: Record<string, { cash: string; reserved: string }>;
};

export default function AdminPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useStore();
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "" });
  const [formMsg, setFormMsg] = useState("");
  const [growth, setGrowth] = useState({ userId: "", dailyPct: "0.25" });
  const [adj, setAdj] = useState({
    userId: "",
    asset: "USDT",
    amount: "",
    direction: "credit" as "credit" | "debit",
    reason: "",
    idempotencyKey: "",
  });

  const allowed = isAuthenticated && isAdminUser(user);

  const load = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const { data } = await adminAPI.listUsers();
      setRows((data.data ?? []) as Row[]);
    } catch {
      setRows([]);
      setError("");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/admin/login");
      return;
    }
    if (!isAdminUser(user)) {
      router.replace("/dashboard");
      return;
    }
    void load();
  }, [isAuthenticated, user, router, load]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(
      (r) =>
        r.email.toLowerCase().includes(s) ||
        `${r.firstName} ${r.lastName}`.toLowerCase().includes(s),
    );
  }, [rows, q]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg("");
    try {
      await adminAPI.createUser(form);
      setForm({ firstName: "", lastName: "", email: "", password: "" });
      setFormMsg("Account created.");
      await load();
    } catch (err) {
      setFormMsg(readErr(err, "Create failed."));
    }
  };

  const toggle = async (row: Row) => {
    if (row.id === user?.id) return;
    await adminAPI.setUserActive(row.id, !row.isActive);
    await load();
  };

  const localNodes = loadDesks();
  const growthNodes = [
    ...rows.map((r) => ({ id: r.id, label: `${r.firstName} ${r.lastName} · ${r.email}` })),
    ...localNodes
      .filter((d) => !rows.some((r) => r.email === d.email || r.id === d.id))
      .map((d) => ({ id: d.id, label: `${d.firstName} ${d.lastName} · ${d.email}` })),
  ];

  const applyGrowth = (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg("");
    const node = growthNodes.find((n) => n.id === growth.userId);
    const pct = Number(growth.dailyPct);
    if (!node || Number.isNaN(pct)) {
      setFormMsg("Choose a node and a daily percent.");
      return;
    }
    const book = useSimStore.getState().accounts[growth.userId];
    const principal = book?.genesisClaimedAt ? accountNav(book) : 0;
    try {
      setDailyGrowth({
        userId: growth.userId,
        email: node.label,
        dailyPct: pct,
        principal,
      });
      setFormMsg(
        principal > 0
          ? `Daily growth set at ${pct}% on ${principal.toLocaleString(undefined, { maximumFractionDigits: 2 })} USD.`
          : `Daily growth set at ${pct}%. It starts when that node has a posted book.`,
      );
    } catch (err) {
      setFormMsg(err instanceof Error ? err.message : "Could not set daily growth.");
    }
  };

  const postJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg("");
    try {
      await adminAPI.postJournal(adj.userId, {
        asset: adj.asset,
        amount: adj.amount,
        direction: adj.direction,
        reason: adj.reason,
        idempotencyKey: adj.idempotencyKey || `admin-${adj.direction}-${Date.now()}`,
      });
      setFormMsg("Journal posted.");
      setAdj({ ...adj, amount: "", reason: "", idempotencyKey: "" });
      await load();
    } catch (err) {
      setFormMsg(readErr(err, "Journal post failed."));
    }
  };

  if (!allowed) return null;

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-white/[0.06] px-5 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <XCapitalLogoMark size={26} />
          <div>
            <p className="font-black text-sm tracking-tight">X-CAPITAL Admin</p>
            <p className="text-[10px] font-mono uppercase tracking-widest text-white/35">Ground station</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => void load()} className="sim-btn sim-btn-ghost px-3 py-1.5 text-[12px]">
            <RefreshCw className={cn("w-3.5 h-3.5", busy && "animate-spin")} /> Refresh
          </button>
          <button
            type="button"
            onClick={() => {
              logout();
              router.push("/admin/login");
            }}
            className="sim-btn sim-btn-ghost px-3 py-1.5 text-[12px]"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 py-8 space-y-6">
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/[0.08] p-4 flex items-center gap-3">
            <Shield className="w-4 h-4 text-white/35" />
            <div>
              <p className="text-[10px] font-mono text-white/35">Accounts</p>
              <p className="text-xl font-black">{rows.length}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-white/[0.08] p-4">
            <p className="text-[10px] font-mono text-white/35">Rule</p>
            <p className="text-sm text-white/60 mt-1">
              Admin never writes a balance column. Credit and debit are journal entries with actor, reason, and idempotency key.
            </p>
          </div>
        </div>

        {error && <p className="text-sm text-red-300">{error}</p>}
        {formMsg && <p className="text-sm text-white/60">{formMsg}</p>}

        <section className="rounded-2xl border border-emerald-400/20 p-5">
          <p className="font-black mb-1">Daily growth</p>
          <p className="text-sm text-white/50 mb-3">
            Set a daily percent on a node. The book accrues every second and the day’s profit posts to cash and the portfolio at day close.
          </p>
          <form onSubmit={applyGrowth} className="grid md:grid-cols-[1fr_140px_auto] gap-3">
            <select
              className="bg-black border border-white/15 rounded px-3 py-2 text-sm"
              value={growth.userId}
              onChange={(e) => setGrowth({ ...growth, userId: e.target.value })}
              required
            >
              <option value="">Select node</option>
              {growthNodes.map((n) => (
                <option key={n.id} value={n.id}>{n.label}</option>
              ))}
            </select>
            <input
              className="sim-input"
              inputMode="decimal"
              placeholder="Daily %"
              value={growth.dailyPct}
              onChange={(e) => setGrowth({ ...growth, dailyPct: e.target.value })}
              required
            />
            <button type="submit" className="sim-btn sim-btn-primary">Set daily growth</button>
          </form>
          {listMandates().length > 0 && (
            <ul className="mt-4 space-y-1 text-[12px] text-white/55">
              {listMandates().map((m) => (
                <li key={m.userId} className="font-mono">
                  {m.email} · {m.dailyPct}% · base {m.principal.toLocaleString(undefined, { maximumFractionDigits: 2 })} USD
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-white/[0.08] p-5">
          <p className="font-black mb-3">Post journal</p>
          <form onSubmit={postJournal} className="grid md:grid-cols-3 gap-3">
            <select
              className="bg-black border border-white/15 rounded px-3 py-2 text-sm"
              value={adj.userId}
              onChange={(e) => setAdj({ ...adj, userId: e.target.value })}
              required
            >
              <option value="">Select node</option>
              {rows.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.firstName} {r.lastName} · {r.email}
                </option>
              ))}
            </select>
            <select
              className="bg-black border border-white/15 rounded px-3 py-2 text-sm"
              value={adj.asset}
              onChange={(e) => setAdj({ ...adj, asset: e.target.value })}
            >
              {["USDT", "BTC", "ETH", "SOL", "USD"].map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
            <select
              className="bg-black border border-white/15 rounded px-3 py-2 text-sm"
              value={adj.direction}
              onChange={(e) => setAdj({ ...adj, direction: e.target.value as "credit" | "debit" })}
            >
              <option value="credit">Credit (Dr profit pool / Cr user cash)</option>
              <option value="debit">Debit (Dr user cash / Cr house)</option>
            </select>
            <input className="sim-input" placeholder="Amount" value={adj.amount} onChange={(e) => setAdj({ ...adj, amount: e.target.value })} required />
            <input className="sim-input md:col-span-2" placeholder="Reason" value={adj.reason} onChange={(e) => setAdj({ ...adj, reason: e.target.value })} required minLength={3} />
            <input
              className="sim-input md:col-span-2"
              placeholder="Idempotency key"
              value={adj.idempotencyKey}
              onChange={(e) => setAdj({ ...adj, idempotencyKey: e.target.value })}
            />
            <button type="submit" className="sim-btn sim-btn-primary">Post entry</button>
          </form>
        </section>

        <section className="rounded-2xl border border-white/[0.08] p-5">
          <p className="font-black mb-3">Create operator</p>
          <form onSubmit={create} className="grid md:grid-cols-5 gap-3">
            <input className="sim-input" placeholder="First" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
            <input className="sim-input" placeholder="Last" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
            <input className="sim-input" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            <input className="sim-input" type="password" placeholder="Password (8+)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} />
            <button type="submit" className="sim-btn sim-btn-primary">Create</button>
          </form>
        </section>

        <section className="rounded-2xl border border-white/[0.08] overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between gap-3 border-b border-white/[0.05]">
            <p className="font-black">Directory</p>
            <input className="sim-input max-w-xs" placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="text-white/35 text-[10px] uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3 font-normal">Node</th>
                  <th className="px-5 py-3 font-normal">USDT</th>
                  <th className="px-5 py-3 font-normal">BTC</th>
                  <th className="px-5 py-3 font-normal">ETH</th>
                  <th className="px-5 py-3 font-normal">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-t border-white/[0.04]">
                    <td className="px-5 py-3">
                      <p className="font-semibold">{r.firstName} {r.lastName}</p>
                      <p className="font-mono text-[11px] text-white/40">{r.email}</p>
                    </td>
                    <td className="px-5 py-3 font-mono">{r.balances?.USDT?.cash ?? "0"}</td>
                    <td className="px-5 py-3 font-mono">{r.balances?.BTC?.cash ?? "0"}</td>
                    <td className="px-5 py-3 font-mono">{r.balances?.ETH?.cash ?? "0"}</td>
                    <td className="px-5 py-3">
                      <button
                        type="button"
                        disabled={r.id === user?.id}
                        onClick={() => void toggle(r)}
                        className={cn("sim-btn px-3 py-1.5 text-[11px]", r.isActive ? "sim-btn-ghost" : "sim-btn-primary")}
                      >
                        {r.isActive ? <><Ban className="w-3 h-3" /> Disable</> : "Enable"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

function readErr(err: unknown, fallback: string) {
  if (err && typeof err === "object" && "response" in err) {
    const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
    if (msg) return msg;
  }
  return fallback;
}
