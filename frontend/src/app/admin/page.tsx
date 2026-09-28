"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, RefreshCw, Ban, Play, Pause } from "lucide-react";
import { useStore } from "@/store/useStore";
import { adminAPI } from "@/lib/api";
import { isAdminUser, type AdminUserRow } from "@/lib/apiUser";
import { findDesk, hashDeskSecret, loadDesks, loadRegistry, newDeskId, rememberRegistry, upsertDesk, type RegistryUser } from "@/lib/localDesk";
import { confirmDepositRecord, latestKyc, listDeposits, listDeskJournal, listKyc, listLinks, listMandates, listNotices, nodeActivated, pushNotice, readMandate, saveDeskJournal, setDailyGrowth, setKycStatus, setLinkStatus, setTradeGate, touchMandate, tradesPaused, weeklyOf, type ExternalLinkRequest, type KycPacket, type PendingDeposit } from "@/lib/yieldDesk";
import { useSimStore } from "@/store/useSimStore";
import { accountNav } from "@/lib/sim/engine";
import { XCapitalLogoMark } from "@/components/brand/XCapitalLogo";
import { cn } from "@/lib/utils";

type Row = AdminUserRow & {
  balances?: Record<string, { cash: string; reserved: string }>;
};

type NodeRef = {
  id: string;
  email: string;
  name: string;
  label: string;
  source: string;
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
  const [hit, setHit] = useState("");
  const [tick, setTick] = useState(0);
  const [lane, setLane] = useState<"all" | "live" | "paused" | "closed">("all");
  const [focusId, setFocusId] = useState("");
  const [resetForm, setResetForm] = useState({ email: "", password: "" });
  const [bookUsd, setBookUsd] = useState<Record<string, string>>({});
  const [note, setNote] = useState<Record<string, string>>({});
  const accounts = useSimStore((s) => s.accounts);
  const allowed = ready && isAuthenticated && isAdminUser(user);

  const ack = (id: string, text: string) => {
    setHit(id);
    setFormMsg(text);
    window.setTimeout(() => setHit((cur) => (cur === id ? "" : cur)), 480);
  };

  const press = (id: string, tone: "primary" | "ghost" = "primary") =>
    cn(
      "sim-btn active:scale-95 active:brightness-125",
      tone === "primary" ? "sim-btn-primary" : "sim-btn-ghost",
      hit === id && "ring-2 ring-emerald-300 shadow-[0_0_18px_rgba(52,211,153,0.45)]",
    );

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
    const bump = () => {
      pull();
      setTick((n) => n + 1);
    };
    window.addEventListener("xc-yield", bump);
    return () => window.removeEventListener("xc-yield", bump);
  }, []);

  useEffect(() => {
    const finish = () => setReady(true);
    if (useStore.persist.hasHydrated()) finish();
    const unsub = useStore.persist.onFinishHydration(finish);
    void useStore.persist.rehydrate();
    return unsub;
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!isAuthenticated || !isAdminUser(user)) {
      router.replace("/admin/login");
      return;
    }
    void load();
  }, [ready, isAuthenticated, user, router, load]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    ack("create", "Creating the node");
    const key = form.email.trim().toLowerCase();
    const desk = {
      id: newDeskId(),
      email: key,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      passwordHash: await hashDeskSecret(form.password),
      createdAt: new Date().toISOString(),
      provider: "password" as const,
    };
    try {
      await adminAPI.createUser({ ...form, email: key });
      upsertDesk(desk);
      ack("create", "Account created on the network and on this desk.");
      await load();
    } catch {
      upsertDesk(desk);
      ack("create", "The network did not take the account. It is open on this desk and can be managed now.");
    }
    setForm({ firstName: "", lastName: "", email: "", password: "" });
    setTick((n) => n + 1);
  };

  const toggle = async (row: Row) => {
    if (row.id === user?.id) return;
    await adminAPI.setUserActive(row.id, !row.isActive);
    await load();
  };

  useEffect(() => {
    if (!ready) return;
    const seen: RegistryUser[] = [
      ...rows.map((row) => ({ id: row.id, email: row.email, firstName: row.firstName, lastName: row.lastName })),
      ...loadDesks().map((desk) => ({ id: desk.id, email: desk.email, firstName: desk.firstName, lastName: desk.lastName })),
      ...listKyc().map((row) => ({ id: row.userId, email: row.email, firstName: row.legalFirst, lastName: row.legalLast })),
      ...listLinks().map((row) => ({ id: row.userId, email: row.email, firstName: row.accountTitle, lastName: "" })),
      ...listDeposits().map((row) => ({ id: row.userId, email: row.email, firstName: "", lastName: "" })),
    ];
    if (user?.email) seen.push({ id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName });
    rememberRegistry(seen);
  }, [ready, rows, tick, user]);

  const nodes = useMemo(() => {
    const byKey = new Map<string, NodeRef>();
    const put = (id: string, email: string, name: string, source: string) => {
      const mail = email.trim().toLowerCase();
      const key = mail.includes("@") ? mail : id;
      if (!key) return;
      const prev = [...byKey.values()].find((n) => n.id === id || (mail.includes("@") && n.email === mail));
      const display = name.trim() || (mail.includes("@") ? mail.split("@")[0] : "Book");
      if (prev) {
        if (name.trim()) prev.name = name.trim();
        if (id && (prev.source !== "Network" || source === "Network")) prev.id = id;
        if (mail.includes("@")) prev.email = mail;
        if (source === "Network" || source === "Desk") prev.source = source;
        prev.label = prev.email ? `${prev.name} · ${prev.email}` : prev.name;
        return;
      }
      byKey.set(key, {
        id: id || mail,
        email: mail.includes("@") ? mail : "",
        name: display,
        label: mail.includes("@") ? `${display} · ${mail}` : display,
        source,
      });
    };
    for (const row of rows) put(row.id, row.email, `${row.firstName} ${row.lastName}`, "Network");
    for (const row of loadRegistry()) put(row.id, row.email, `${row.firstName} ${row.lastName}`, "Registry");
    for (const desk of loadDesks()) put(desk.id, desk.email, `${desk.firstName} ${desk.lastName}`, "Desk");
    for (const row of listKyc()) put(row.userId, row.email, `${row.legalFirst} ${row.legalLast}`, "Identity");
    for (const row of listLinks()) put(row.userId, row.email, row.accountTitle, "Link");
    for (const row of listDeposits()) put(row.userId, row.email, "", "Deposit");
    for (const row of listDeskJournal()) put(row.userId, row.email, "", "Journal");
    if (user) put(user.id, user.email, `${user.firstName} ${user.lastName}`, "Desk");
    return [...byKey.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [rows, tick, user]);

  const listed = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return nodes;
    return nodes.filter((n) => `${n.name} ${n.email} ${n.source}`.toLowerCase().includes(s));
  }, [nodes, q]);

  const visibleNodes = useMemo(() => {
    return listed.filter((n) => {
      const book = accounts[n.id];
      const mandate = readMandate(n.id);
      const paused = tradesPaused(mandate) || !!book?.tradingHalted;
      const live = nodeActivated(mandate) && !paused;
      if (lane === "live") return live;
      if (lane === "paused") return paused;
      if (lane === "closed") return !live && !paused;
      return true;
    });
  }, [listed, lane, accounts, tick]);

  const pulse = useMemo(() => {
    let live = 0;
    let paused = 0;
    for (const n of nodes) {
      const mandate = readMandate(n.id);
      const book = accounts[n.id];
      const isPaused = tradesPaused(mandate) || !!book?.tradingHalted;
      if (nodeActivated(mandate) && !isPaused) live += 1;
      else if (isPaused) paused += 1;
    }
    return { live, paused, waiting: pending.length + kycRows.length + linkRows.length };
  }, [nodes, accounts, pending.length, kycRows.length, linkRows.length, tick]);

  const activity = useMemo(() => {
    const items: { id: string; at: number; text: string }[] = [];
    for (const row of listDeskJournal()) items.push({ id: row.id, at: row.at, text: `Journal ${row.direction} ${row.amount} ${row.asset} · ${row.email}` });
    for (const row of listDeposits()) items.push({ id: row.id, at: row.at, text: `Deposit ${row.status} · ${row.asset} · ${row.email}` });
    for (const row of listKyc()) items.push({ id: row.id, at: row.at, text: `Identity ${row.status} · ${row.email}` });
    for (const row of listLinks()) items.push({ id: row.id, at: row.at, text: `Link ${row.status} · ${row.kind} · ${row.email}` });
    return items.sort((a, b) => b.at - a.at).slice(0, 12);
  }, [tick]);

  const focus = nodes.find((n) => n.id === focusId) ?? null;

  const applyGrowth = (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg("");
    const node = nodes.find((n) => n.id === growth.userId);
    const pct = Number(growth.dailyPct);
    const week = Number(growth.weeklyPct);
    const operated = Number(growth.operatedPct);
    if (!node || Number.isNaN(pct) || Number.isNaN(week) || Number.isNaN(operated)) {
      ack("activate", "Choose a registered user, the daily and weekly rates, and the operated percent.");
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
      ack(
        "activate",
        principal > 0 && operated > 0
          ? `Node activated. ${operated}% operated at ${pct}% a day and ${week}% a week.`
          : `Path staged. Gains stay off until the book is funded and the operated percent is above zero.`,
      );
    } catch (err) {
      ack("activate", err instanceof Error ? err.message : "Could not set daily growth.");
    }
  };

  const syncPrincipal = (userId: string) => {
    const book = useSimStore.getState().accounts[userId];
    const nav = book?.genesisClaimedAt ? accountNav(book) : 0;
    if (readMandate(userId) && nav > 0) touchMandate(userId, { principal: nav });
  };

  const postJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    const node = nodes.find((n) => n.id === adj.userId);
    const amount = Number(adj.amount);
    if (!node || !(amount > 0) || adj.reason.trim().length < 3) {
      ack("journal", "Choose a node, an amount, and a reason.");
      return;
    }
    ack("journal", "Posting the entry");
    const cash = adj.asset === "USD" || adj.asset === "USDT";
    try {
      await adminAPI.postJournal(adj.userId, {
        asset: adj.asset,
        amount: adj.amount,
        direction: adj.direction,
        reason: adj.reason,
        idempotencyKey: adj.idempotencyKey || `admin-${adj.direction}-${Date.now()}`,
      });
      saveDeskJournal({ userId: node.id, email: node.email, asset: adj.asset, amount, direction: adj.direction, reason: adj.reason, where: "network" });
      ack("journal", `Journal posted for ${node.email}.`);
      setAdj({ ...adj, amount: "", reason: "", idempotencyKey: "" });
      await load();
    } catch {
      if (cash && adj.direction === "credit") {
        const res = useSimStore.getState().confirmDeposit(node.id, amount, adj.asset, `journal-${Date.now()}`);
        if (!res.ok) {
          ack("journal", res.error);
          return;
        }
        syncPrincipal(node.id);
      } else if (cash && adj.direction === "debit") {
        const res = useSimStore.getState().debitCash(node.id, amount, adj.reason);
        if (!res.ok) {
          ack("journal", res.error);
          return;
        }
        syncPrincipal(node.id);
      }
      saveDeskJournal({ userId: node.id, email: node.email, asset: adj.asset, amount, direction: adj.direction, reason: adj.reason, where: "desk" });
      ack(
        "journal",
        cash
          ? `${adj.direction === "credit" ? "Credited" : "Debited"} ${amount.toLocaleString()} USD on ${node.email}.`
          : `Recorded ${adj.asset} on this desk. The network ledger is offline, so only USD cash moves the book.`,
      );
      setAdj({ ...adj, amount: "", reason: "", idempotencyKey: "" });
      setTick((n) => n + 1);
    }
  };

  const startTrade = (id: string, email: string) => {
    useSimStore.getState().setHalt(id, false);
    const book = useSimStore.getState().accounts[id];
    const nav = book?.genesisClaimedAt ? accountNav(book) : 0;
    const prev = readMandate(id);
    if (prev) {
      const operated = prev.operatedPct ?? 0;
      touchMandate(id, {
        tradesOpen: true,
        email,
        principal: nav > 0 ? nav : prev.principal,
        activatedAt: nav > 0 && operated > 0 ? prev.activatedAt ?? Date.now() : prev.activatedAt,
      });
    } else {
      setTradeGate({ userId: id, email, open: true });
    }
    const live = nodeActivated(readMandate(id));
    ack(id + ":start", live ? `Trading is live for ${email}.` : `Trading is armed for ${email}. Fills open once the book is funded and the node percent is above zero.`);
    setTick((n) => n + 1);
  };

  const pauseTrade = (id: string, email: string) => {
    useSimStore.getState().setHalt(id, true);
    setTradeGate({ userId: id, email, open: false });
    ack(id + ":pause", `Trading paused for ${email}.`);
    setTick((n) => n + 1);
  };

  const bookCash = (id: string, email: string) => {
    const usd = Number(bookUsd[id]);
    if (!(usd > 0)) {
      ack(id + ":book", "Enter the USD amount to book.");
      return;
    }
    const res = useSimStore.getState().confirmDeposit(id, usd, "USD", `desk-${Date.now()}`);
    if (!res.ok) {
      ack(id + ":book", res.error);
      return;
    }
    syncPrincipal(id);
    pushNotice(id, "Funds booked", `${usd.toLocaleString()} USD is on the book.`);
    setBookUsd((m) => ({ ...m, [id]: "" }));
    ack(id + ":book", `Booked ${usd.toLocaleString()} USD on ${email}.`);
    setTick((n) => n + 1);
  };

  const resetDeskPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const desk = findDesk(resetForm.email);
    if (!desk) {
      ack("reset", "That email is not registered on this desk.");
      return;
    }
    if (resetForm.password.length < 8) {
      ack("reset", "Use at least 8 characters.");
      return;
    }
    upsertDesk({ ...desk, passwordHash: await hashDeskSecret(resetForm.password) });
    setResetForm({ email: "", password: "" });
    ack("reset", `Password updated for ${desk.email} on this desk.`);
  };

  const sendNote = (id: string, email: string) => {
    const body = (note[id] ?? "").trim();
    if (body.length < 2) {
      ack(id + ":note", "Write the note first.");
      return;
    }
    pushNotice(id, "Desk note", body);
    setNote((m) => ({ ...m, [id]: "" }));
    ack(id + ":note", `Note sent to ${email}.`);
  };

  const navOf = (id: string) => {
    const book = accounts[id];
    return book?.genesisClaimedAt ? accountNav(book) : 0;
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
          <button type="button" onClick={() => { ack("refresh", "Directory refreshed."); void load(); }} className={press("refresh", "ghost")}>
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

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="pnl-card pnl-card-pos">
            <p className="text-[10px] font-mono text-white/35">Registered</p>
            <p className="text-xl font-black">{nodes.length}</p>
          </div>
          <div className="pnl-card pnl-card-pos">
            <p className="text-[10px] font-mono text-white/35">Trading live</p>
            <p className="text-xl font-black">{pulse.live}</p>
          </div>
          <div className="pnl-card pnl-card-pos">
            <p className="text-[10px] font-mono text-white/35">Paused</p>
            <p className="text-xl font-black">{pulse.paused}</p>
          </div>
          <div className="pnl-card pnl-card-pos">
            <p className="text-[10px] font-mono text-white/35">Waiting</p>
            <p className="text-xl font-black">{pulse.waiting}</p>
          </div>
        </div>

        <section className="sim-glass p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-4">
            <div>
              <p className="font-black mb-1">Nodes</p>
              <p className="text-sm text-white/50">Every registered user. Start or pause trading, book cash, and send a note from the row.</p>
            </div>
            <input className="sim-input sm:max-w-xs" placeholder="Search registered users" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {(["all", "live", "paused", "closed"] as const).map((key) => (
              <button key={key} type="button" className={press("lane:" + key, lane === key ? "primary" : "ghost")} onClick={() => setLane(key)}>
                {key}
              </button>
            ))}
          </div>
          {visibleNodes.length === 0 ? (
            <p className="text-sm text-white/40">No registered users in this view. Create one below, or clear the search.</p>
          ) : (
            <ul className="space-y-3">
              {visibleNodes.map((node) => {
                const mandate = readMandate(node.id);
                const book = accounts[node.id];
                const nav = book?.genesisClaimedAt ? accountNav(book) : 0;
                const paused = tradesPaused(mandate) || !!book?.tradingHalted;
                const live = nodeActivated(mandate) && !paused;
                return (
                  <li key={node.id} className="rounded-xl border border-white/[0.12] bg-black/40 px-4 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold">{node.name}</p>
                        <p className="text-[12px] font-mono text-white/55 mt-1 break-all">{node.email}</p>
                        <p className="text-[12px] text-white/45 mt-2">
                          Book {nav.toLocaleString(undefined, { maximumFractionDigits: 2 })} USD
                          {mandate ? ` · ${mandate.operatedPct ?? 0}% operated · ${mandate.dailyPct}% day` : ""}
                          {` · ${node.source}`}
                          {latestKyc(node.id) ? ` · identity ${latestKyc(node.id)?.status}` : ""}
                        </p>
                      </div>
                      <span className={cn("sim-chip", live ? "sim-chip-live" : paused ? "sim-chip-warn" : "")}>
                        {live ? "Trading live" : paused ? "Trading paused" : "Trading closed"}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button type="button" className={press(node.id + ":start")} onClick={() => startTrade(node.id, node.email)}>
                        <Play className="w-3.5 h-3.5" /> Start trade
                      </button>
                      <button type="button" className={press(node.id + ":pause", "ghost")} onClick={() => pauseTrade(node.id, node.email)}>
                        <Pause className="w-3.5 h-3.5" /> Pause trade
                      </button>
                      <button type="button" className={press(node.id + ":pick", "ghost")} onClick={() => { setFocusId(node.id); setGrowth({ ...growth, userId: node.id }); setAdj({ ...adj, userId: node.id }); ack(node.id + ":pick", `${node.email || node.name} is selected for yield and the journal.`); }}>
                        Select node
                      </button>
                    </div>
                    <div className="mt-3 flex flex-col sm:flex-row gap-2">
                      <input className="sim-input sm:max-w-[160px]" inputMode="decimal" placeholder="USD to book" value={bookUsd[node.id] ?? ""} onChange={(e) => setBookUsd((m) => ({ ...m, [node.id]: e.target.value }))} />
                      <button type="button" className={press(node.id + ":book")} onClick={() => bookCash(node.id, node.email)}>Book cash</button>
                      <input className="sim-input" placeholder="Note to this node" value={note[node.id] ?? ""} onChange={(e) => setNote((m) => ({ ...m, [node.id]: e.target.value }))} />
                      <button type="button" className={press(node.id + ":note", "ghost")} onClick={() => sendNote(node.id, node.email)}>Send note</button>
                    </div>
                  </li>
                );
              })}
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
            <NodePicker
              nodes={nodes}
              value={growth.userId}
              onPick={(id) => {
                setFocusId(id);
                setGrowth({ ...growth, userId: id });
              }}
            />
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
            <button type="submit" className={press("activate")}>Activate node</button>
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
                    className={press(row.id + ":deposit")}
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
                      syncPrincipal(row.userId);
                      pushNotice(row.userId, "Funds confirmed", `${row.asset} confirmed. ${usd.toLocaleString()} USD is on the book. Trades and gains start when this node is activated.`);
                      setError("");
                      ack(row.id + ":deposit", `Confirmed ${usd.toLocaleString()} USD for ${row.email}.`);
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
                    <button type="button" className={press(row.id + ":kyc-yes")} onClick={() => { setKycStatus(row.id, "approved"); pushNotice(row.userId, "Identity approved", "The operator confirmed the identity packet."); ack(row.id + ":kyc-yes", `Identity approved for ${row.email}.`); }}>Approve</button>
                    <button type="button" className={press(row.id + ":kyc-no", "ghost")} onClick={() => { setKycStatus(row.id, "rejected"); pushNotice(row.userId, "Identity rejected", "The operator rejected the identity packet. Send a corrected one from Settings."); ack(row.id + ":kyc-no", `Identity rejected for ${row.email}.`); }}>Reject</button>
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
                    <button type="button" className={press(row.id + ":link", "ghost")} onClick={() => { setLinkStatus(row.id, "linked"); pushNotice(row.userId, "Plan linked", `${row.kind} at ${row.custodian} is on file. No cash was booked.`); ack(row.id + ":link", `Link confirmed for ${row.email}.`); }}>Confirm link</button>
                    <input className="sim-input md:max-w-[160px]" inputMode="decimal" placeholder="USD to book" value={linkUsd[row.id] ?? String(row.requestedUsd)} onChange={(e) => setLinkUsd((m) => ({ ...m, [row.id]: e.target.value }))} />
                    <button
                      type="button"
                      className={press(row.id + ":booklink")}
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
                    <button type="button" className={press(row.id + ":rej", "ghost")} onClick={() => { setLinkStatus(row.id, "rejected"); pushNotice(row.userId, "Link rejected", `${row.kind} at ${row.custodian} was not accepted.`); ack(row.id + ":rej", `Link rejected for ${row.email}.`); }}>Reject</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="sim-glass p-5">
          <p className="font-black mb-1">Post journal</p>
          <p className="text-sm text-white/50 mb-3">Select node opens every registered user. Pick one, then post the credit or debit.</p>
          <form onSubmit={postJournal} className="grid md:grid-cols-3 gap-3">
            <NodePicker
              nodes={nodes}
              value={adj.userId}
              onPick={(id) => {
                setFocusId(id);
                setAdj({ ...adj, userId: id });
              }}
            />
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
            <button type="submit" className={press("journal")}>Post entry</button>
          </form>
          {listDeskJournal().length > 0 && (
            <ul className="mt-4 space-y-1 text-[12px] font-mono text-white/55">
              {listDeskJournal().slice(0, 8).map((row) => (
                <li key={row.id}>{row.direction} {row.amount} {row.asset} · {row.email} · {row.reason}</li>
              ))}
            </ul>
          )}
        </section>

        {focus && (
          <section className="sim-glass p-5">
            <p className="font-black mb-1">Watching {focus.name}</p>
            <p className="text-[12px] font-mono text-white/55 break-all">{focus.email || focus.id}</p>
            <p className="text-sm text-white/50 mt-2">
              Book {navOf(focus.id).toLocaleString(undefined, { maximumFractionDigits: 2 })} USD
              {readMandate(focus.id) ? ` · ${readMandate(focus.id)?.operatedPct ?? 0}% operated` : " · no yield path yet"}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className={press(focus.id + ":start")} onClick={() => startTrade(focus.id, focus.email || focus.name)}><Play className="w-3.5 h-3.5" /> Start trade</button>
              <button type="button" className={press(focus.id + ":pause", "ghost")} onClick={() => pauseTrade(focus.id, focus.email || focus.name)}><Pause className="w-3.5 h-3.5" /> Pause trade</button>
            </div>
            <ul className="mt-4 space-y-1 text-[12px] text-white/55">
              {listNotices(focus.id).slice(0, 4).map((row) => (
                <li key={row.id}>{row.title} — {row.body}</li>
              ))}
              {listDeskJournal().filter((row) => row.userId === focus.id).slice(0, 4).map((row) => (
                <li key={row.id} className="font-mono">{row.direction} {row.amount} {row.asset} · {row.reason}</li>
              ))}
              {listNotices(focus.id).length === 0 && listDeskJournal().every((row) => row.userId !== focus.id) && (
                <li>No notes or journal lines for this user yet.</li>
              )}
            </ul>
          </section>
        )}

        <section className="sim-glass p-5">
          <p className="font-black mb-1">Activity</p>
          <p className="text-sm text-white/50 mb-3">Latest deposits, identity packets, links, and journal lines on this desk.</p>
          {activity.length === 0 ? (
            <p className="text-sm text-white/40">Nothing has moved yet.</p>
          ) : (
            <ul className="space-y-1 text-[12px] font-mono text-white/60">
              {activity.map((row) => (
                <li key={row.id}>{new Date(row.at).toLocaleString()} · {row.text}</li>
              ))}
            </ul>
          )}
        </section>

        <section className="pnl-stage p-5 md:p-6">
          <p className="font-black mb-3">Create operator</p>
          <form onSubmit={create} className="grid md:grid-cols-5 gap-3">
            <input className="sim-input" placeholder="First" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
            <input className="sim-input" placeholder="Last" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
            <input className="sim-input" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            <input className="sim-input" type="password" placeholder="Password (8+)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} />
            <button type="submit" className={press("create")}>Create</button>
          </form>
          <form onSubmit={resetDeskPassword} className="grid md:grid-cols-3 gap-3 mt-4">
            <input className="sim-input" type="email" placeholder="Registered email" value={resetForm.email} onChange={(e) => setResetForm({ ...resetForm, email: e.target.value })} required />
            <input className="sim-input" type="password" placeholder="New password (8+)" value={resetForm.password} onChange={(e) => setResetForm({ ...resetForm, password: e.target.value })} required minLength={8} />
            <button type="submit" className={press("reset", "ghost")}>Reset desk password</button>
          </form>
        </section>

        <section className="pnl-stage overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.05]">
            <p className="font-black">Directory</p>
            <p className="text-sm text-white/45 mt-1">Registered users on the network and on this desk. Search sits with the node list above.</p>
          </div>
          {listed.length === 0 && <p className="px-5 py-4 text-sm text-white/40">No registered users yet.</p>}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="text-white/35 text-[10px] uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3 font-normal">Node</th>
                  <th className="px-5 py-3 font-normal">Book</th>
                  <th className="px-5 py-3 font-normal">Where</th>
                  <th className="px-5 py-3 font-normal">Status</th>
                </tr>
              </thead>
              <tbody>
                {listed.map((n) => {
                  const api = rows.find((r) => r.id === n.id || r.email.toLowerCase() === n.email);
                  const book = accounts[n.id];
                  const nav = book?.genesisClaimedAt ? accountNav(book) : 0;
                  return (
                    <tr key={n.id} className="border-t border-white/[0.04]">
                      <td className="px-5 py-3">
                        <p className="font-semibold">{n.name}</p>
                        <p className="font-mono text-[11px] text-white/40">{n.email || n.id}</p>
                      </td>
                      <td className="px-5 py-3 font-mono">
                        {nav.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        {api ? <span className="block text-[10px] text-white/35">USDT {api.balances?.USDT?.cash ?? "0"}</span> : null}
                      </td>
                      <td className="px-5 py-3 text-white/50">{n.source}</td>
                      <td className="px-5 py-3">
                        {api ? (
                          <button
                            type="button"
                            disabled={api.id === user?.id}
                            onClick={() => void toggle(api)}
                            className={press(api.id + ":active", api.isActive ? "ghost" : "primary")}
                          >
                            {api.isActive ? <><Ban className="w-3 h-3" /> Disable</> : "Enable"}
                          </button>
                        ) : (
                          <button type="button" className={press(n.id + ":pick", "ghost")} onClick={() => { setFocusId(n.id); setAdj({ ...adj, userId: n.id }); setGrowth({ ...growth, userId: n.id }); ack(n.id + ":pick", `${n.email || n.name} is selected.`); }}>
                            Select
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

function NodePicker({
  nodes,
  value,
  onPick,
}: {
  nodes: NodeRef[];
  value: string;
  onPick: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const box = useRef<HTMLDivElement>(null);
  const selected = nodes.find((n) => n.id === value);

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, [open]);

  const shown = nodes.filter((n) => {
    const s = q.trim().toLowerCase();
    if (!s) return true;
    return `${n.name} ${n.email}`.toLowerCase().includes(s);
  });

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        className="sim-input text-left flex items-center justify-between gap-3"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="truncate">{selected ? selected.label : "Select node"}</span>
        <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 shrink-0">{nodes.length} registered</span>
      </button>
      {open && (
        <div className="absolute z-30 mt-2 w-full rounded-xl border border-white/15 bg-[#101816] shadow-2xl overflow-hidden">
          <div className="p-2 border-b border-white/10">
            <input
              autoFocus
              className="sim-input min-h-0 py-2"
              placeholder="Search registered users"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <ul className="max-h-64 overflow-y-auto">
            {shown.length === 0 ? (
              <li className="px-3 py-3 text-sm text-white/45">No registered users match.</li>
            ) : (
              shown.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    className="w-full text-left px-3 py-3 hover:bg-white/[0.06]"
                    onClick={() => {
                      onPick(n.id);
                      setOpen(false);
                      setQ("");
                    }}
                  >
                    <span className="block text-sm font-semibold text-white">{n.name}</span>
                    <span className="block text-[12px] font-mono text-white/50">{n.email || n.id} · {n.source}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
