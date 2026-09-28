"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, RefreshCw, Shield, Ban } from "lucide-react";
import { useStore } from "@/store/useStore";
import { adminAPI } from "@/lib/api";
import { isAdminUser, type AdminUserRow } from "@/lib/apiUser";
import { loadDesks } from "@/lib/localDesk";
import { confirmDepositRecord, listDeposits, listKyc, listLinks, listMandates, pushNotice, setDailyGrowth, setKycStatus, setLinkStatus, weeklyOf, type ExternalLinkRequest, type KycPacket, type PendingDeposit } from "@/lib/yieldDesk";
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
  const [growth, setGrowth] = useState({ userId: "", dailyPct: "0.25", weeklyPct: "1.76", operatedPct: "40" });
  const [pending, setPending] = useState<PendingDeposit[]>([]);
  const [kycRows, setKycRows] = useState<KycPacket[]>([]);
  const [linkRows, setLinkRows] = useState<ExternalLinkRequest[]>([]);
  const [linkUsd, setLinkUsd] = useState<Record<string, string>>({});
  const [usdById, setUsdById] = useState<Record<string, string>>({});
  const [adj, setAdj] = useState({
    userId: "",
    asset: "USDT",
    amount: "",
    direction: "credit" as "credit" | "debit",
    reason: "",
    idempotencyKey: "",
  });

  const [ready, setReady] = useState(false);
  const allowed = ready && isAuthenticated && isAdminUser(user);

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
    const pull = () => {
      setPending(listDeposits().filter((d) => d.status === "pending"));
      setKycRows(listKyc().filter((row) => row.status === "pending"));
      setLinkRows(listLinks().filter((row) => row.status === "pending"));
    };
    pull();
    window.addEventListener("xc-yield", pull);
    return () => window.removeEventListener("xc-yield", pull);
  }, []);

  useEffect(() => {
    const finish = () => setReady(true);
    if (useStore.persist.hasHydrated()) finish();
    return useStore.persist.onFinishHydration(finish);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!isAuthenticated || !isAdminUser(user)) {
      router.replace("/admin/login");
      return;
    }
    void load();
  }, [ready, isAuthenticated, user, router, load]);

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
    const week = Number(growth.weeklyPct);
    const operated = Number(growth.operatedPct);
    if (!node || Number.isNaN(pct) || Number.isNaN(week) || Number.isNaN(operated)) {
      setFormMsg("Choose a node, the daily and weekly rates, and the operated percent.");
      return;
    }
    const book = useSimStore.getState().accounts[growth.userId];
    const principal = book?.genesisClaimedAt ? accountNav(book) : 0;
    try {
      setDailyGrowth({
        userId: growth.userId,
        email: node.label,
        dailyPct: pct,
        weeklyPct: week,
        operatedPct: operated,
        principal,
      });
      setFormMsg(
        principal > 0 && operated > 0
          ? `Node activated. ${operated}% operated at ${pct}% a day and ${week}% a week.`
          : `Path staged. Gains stay off until the book is funded and the operated percent is above zero.`,
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

  if (!ready) {
    return (
      <div className="min-h-screen bg-black text-white px-4 sm:px-6 py-16">
        <p className="text-sm text-white/55">Opening the desk</p>
      </div>
    );
  }

  if (!allowed) return null;

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-white/[0.06] px-4 sm:px-6 lg:px-8 min-h-16 py-3 flex flex-wrap items-center justify-between gap-3">
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

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="pnl-card pnl-card-pos flex items-center gap-3">
            <Shield className="w-4 h-4 text-white/35" />
            <div>
              <p className="text-[10px] font-mono text-white/35">Accounts</p>
              <p className="text-xl font-black">{rows.length}</p>
            </div>
          </div>
          <div className="pnl-card pnl-card-pos">
            <p className="text-[10px] font-mono text-white/35">Rule</p>
            <p className="text-sm text-white/60 mt-1">
              Admin never writes a balance column. Credit and debit are journal entries with actor, reason, and idempotency key.
            </p>
          </div>
        </div>

        <section className="sim-glass p-4 sm:p-5">
          <p className="font-black mb-1">Desk nodes</p>
          <p className="text-sm text-white/50 mb-4">Accounts on this desk. Activate, confirm, and book from here even when the network list is quiet.</p>
          {loadDesks().length === 0 ? (
            <p className="text-sm text-white/40">No desk nodes on this browser yet.</p>
          ) : (
            <ul className="space-y-2">
              {loadDesks().map((desk) => (
                <li key={desk.id} className="rounded-xl border border-white/[0.12] bg-black/40 px-4 py-3">
                  <p className="text-sm font-bold">{desk.firstName} {desk.lastName}</p>
                  <p className="text-[12px] font-mono text-white/55 mt-1 break-all">{desk.email}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {error && <p className="text-sm text-red-300">{error}</p>}
        {formMsg && <p className="text-sm text-white/60">{formMsg}</p>}

        <section className="pnl-stage p-5 md:p-6">
          <p className="font-black mb-1">Daily and weekly yield</p>
          <p className="text-sm text-white/50 mb-3">
            Set the day’s rate, the week’s target, and the percent of this user’s node the desk operates. Gains and execution stay closed until funds are confirmed and that percent is above zero.
          </p>
          <form onSubmit={applyGrowth} className="grid md:grid-cols-2 xl:grid-cols-[1fr_110px_110px_110px_auto] gap-3">
            <select
              className="sim-input"
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
            <input
              className="sim-input"
              inputMode="decimal"
              placeholder="Weekly %"
              value={growth.weeklyPct}
              onChange={(e) => setGrowth({ ...growth, weeklyPct: e.target.value })}
              required
            />
            <input
              className="sim-input"
              inputMode="decimal"
              placeholder="Node %"
              value={growth.operatedPct}
              onChange={(e) => setGrowth({ ...growth, operatedPct: e.target.value })}
              required
            />
            <button type="submit" className="sim-btn sim-btn-primary">Activate node</button>
          </form>
          {listMandates().length > 0 && (
            <ul className="mt-4 space-y-1 text-[12px] text-white/55">
              {listMandates().map((m) => (
                <li key={m.userId} className="font-mono">
                  {m.email} · {m.operatedPct ?? 0}% operated · {m.dailyPct}% day · {weeklyOf(m).toFixed(2)}% week · base {m.principal.toLocaleString(undefined, { maximumFractionDigits: 2 })} USD
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="sim-glass p-5">
          <p className="font-black mb-1">Confirm crypto deposits</p>
          <p className="text-sm text-white/50 mb-4">
            Books stay at 0 USD until you confirm the transfer and enter the USD value to credit.
          </p>
          {pending.length === 0 ? (
            <p className="text-sm text-white/40">No deposits waiting.</p>
          ) : (
            <ul className="space-y-3">
              {pending.map((row) => (
                <li key={row.id} className="rounded-xl border border-white/[0.12] bg-black/40 p-4 flex flex-col md:flex-row md:items-end gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-white">{row.email}</p>
                    <p className="text-[12px] text-white/50 mt-1">{row.asset} · {new Date(row.at).toLocaleString()}</p>
                    <p className="text-[11px] font-mono text-white/35 mt-1 break-all">{row.txHash}</p>
                  </div>
                  <input
                    className="sim-input md:max-w-[160px]"
                    inputMode="decimal"
                    placeholder="USD value"
                    value={usdById[row.id] ?? ""}
                    onChange={(e) => setUsdById((m) => ({ ...m, [row.id]: e.target.value }))}
                  />
                  <button
                    type="button"
                    className="sim-btn sim-btn-primary"
                    onClick={() => {
                      const usd = Number(usdById[row.id]);
                      if (!(usd > 0)) {
                        setError("Enter the USD value before confirming.");
                        return;
                      }
                      const res = useSimStore.getState().confirmDeposit(row.userId, usd, row.asset, row.txHash);
                      if (!res.ok) {
                        setError(res.error);
                        return;
                      }
                      confirmDepositRecord(row.id, usd);
                      pushNotice(row.userId, "Funds confirmed", `${row.asset} confirmed. ${usd.toLocaleString()} USD is on the book. Trades and gains start when this node is activated.`);
                      setError("");
                    }}
                  >
                    Confirm deposit
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="sim-glass p-5">
          <p className="font-black mb-1">Identity packets</p>
          <p className="text-sm text-white/50 mb-4">Approve or reject. This does not credit the book.</p>
          {kycRows.length === 0 ? (
            <p className="text-sm text-white/40">No identity packets waiting.</p>
          ) : (
            <ul className="space-y-3">
              {kycRows.map((row) => (
                <li key={row.id} className="rounded-xl border border-white/[0.12] bg-black/40 p-4">
                  <p className="text-sm font-bold">{row.legalFirst} {row.legalLast} · {row.email}</p>
                  <p className="text-[12px] text-white/55 mt-1">{row.address}, {row.city}, {row.region} {row.postal}, {row.country}</p>
                  <p className="text-[12px] text-white/55 mt-1">Born {row.dob} · {row.nationality} · {row.occupation} · {row.phone}</p>
                  <p className="text-[12px] text-white/55 mt-1">Funds: {row.sourceOfFunds}</p>
                  <p className="text-[12px] font-mono text-white/70 mt-1">{row.docType} · {row.docNumber}</p>
                  <div className="mt-3 flex gap-2">
                    <button type="button" className="sim-btn sim-btn-primary" onClick={() => { setKycStatus(row.id, "approved"); pushNotice(row.userId, "Identity approved", "The operator confirmed the identity packet."); }}>Approve</button>
                    <button type="button" className="sim-btn sim-btn-ghost" onClick={() => { setKycStatus(row.id, "rejected"); pushNotice(row.userId, "Identity rejected", "The operator rejected the identity packet. Send a corrected one from Settings."); }}>Reject</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="sim-glass p-5">
          <p className="font-black mb-1">External account links</p>
          <p className="text-sm text-white/50 mb-4">Confirm the link with no cash, or book the verified USD onto the node.</p>
          {linkRows.length === 0 ? (
            <p className="text-sm text-white/40">No link requests waiting.</p>
          ) : (
            <ul className="space-y-3">
              {linkRows.map((row) => (
                <li key={row.id} className="rounded-xl border border-white/[0.12] bg-black/40 p-4 flex flex-col gap-3">
                  <div>
                    <p className="text-sm font-bold">{row.email}</p>
                    <p className="text-[12px] text-white/55 mt-1">{row.kind} · {row.custodian} · {row.planName}</p>
                    <p className="text-[12px] text-white/55">{row.accountTitle} · ···{row.last4} · requested {row.requestedUsd.toLocaleString()} USD</p>
                  </div>
                  <div className="flex flex-col md:flex-row gap-2 md:items-center">
                    <button type="button" className="sim-btn sim-btn-ghost" onClick={() => { setLinkStatus(row.id, "linked"); pushNotice(row.userId, "Plan linked", `${row.kind} at ${row.custodian} is on file. No cash was booked.`); }}>Confirm link</button>
                    <input className="sim-input md:max-w-[160px]" inputMode="decimal" placeholder="USD to book" value={linkUsd[row.id] ?? String(row.requestedUsd)} onChange={(e) => setLinkUsd((m) => ({ ...m, [row.id]: e.target.value }))} />
                    <button
                      type="button"
                      className="sim-btn sim-btn-primary"
                      onClick={() => {
                        const usd = Number(linkUsd[row.id] ?? row.requestedUsd);
                        if (!(usd > 0)) {
                          setError("Enter the USD amount to book.");
                          return;
                        }
                        const res = useSimStore.getState().confirmDeposit(row.userId, usd, row.kind, `link-${row.id}`);
                        if (!res.ok) {
                          setError(res.error);
                          return;
                        }
                        setLinkStatus(row.id, "booked", usd);
                        pushNotice(row.userId, "Plan booked", `${usd.toLocaleString()} USD from ${row.custodian} is on the book.`);
                        setError("");
                      }}
                    >
                      Book cash
                    </button>
                    <button type="button" className="sim-btn sim-btn-ghost" onClick={() => { setLinkStatus(row.id, "rejected"); pushNotice(row.userId, "Link rejected", `${row.kind} at ${row.custodian} was not accepted.`); }}>Reject</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="sim-glass p-5">
          <p className="font-black mb-3">Post journal</p>
          <form onSubmit={postJournal} className="grid md:grid-cols-3 gap-3">
            <select
              className="sim-input"
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
              className="sim-input"
              value={adj.asset}
              onChange={(e) => setAdj({ ...adj, asset: e.target.value })}
            >
              {["USDT", "BTC", "ETH", "SOL", "USD"].map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
            <select
              className="sim-input"
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

        <section className="pnl-stage p-5 md:p-6">
          <p className="font-black mb-3">Create operator</p>
          <form onSubmit={create} className="grid md:grid-cols-5 gap-3">
            <input className="sim-input" placeholder="First" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
            <input className="sim-input" placeholder="Last" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
            <input className="sim-input" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            <input className="sim-input" type="password" placeholder="Password (8+)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} />
            <button type="submit" className="sim-btn sim-btn-primary">Create</button>
          </form>
        </section>

        <section className="pnl-stage overflow-hidden">
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
