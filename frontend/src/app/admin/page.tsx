"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, RefreshCw, Ban, Play, Pause } from "lucide-react";
import { useStore } from "@/store/useStore";
import { adminAPI } from "@/lib/api";
import { isAdminUser, type AdminUserRow } from "@/lib/apiUser";
import { findDesk, hashDeskSecret, loadDesks, loadRegistry, newDeskId, rememberRegistry, resolveBookUserId, upsertDesk, type RegistryUser } from "@/lib/localDesk";
import { restoreRememberedTokens } from "@/lib/sessionScope";
import { confirmDepositRecord, listDeliveries, listDeposits, listDeskJournal, listKyc, listLinks, listNotices, nodeActivated, pingDesk, pushNotice, readMandate, saveDeskJournal, setDailyGrowth, setDeliveryStatus, setKycStatus, setLinkStatus, setTradeGate, setUnlockFill, touchMandate, tradesPaused, unlockFillOf, weeklyFromDaily, weeklyOf, type DeliveryOrder, type ExternalLinkRequest, type KycPacket, type PendingDeposit } from "@/lib/yieldDesk";
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
  const [growth, setGrowth] = useState({ dailyPct: "", weeklyPct: "", unlockFillPct: "100" });
  const [pending, setPending] = useState<PendingDeposit[]>([]);
  const [kycRows, setKycRows] = useState<KycPacket[]>([]);
  const [linkRows, setLinkRows] = useState<ExternalLinkRequest[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryOrder[]>([]);
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
  const [focusId, setFocusId] = useState("");
  const [desk, setDesk] = useState<"people" | "do" | "inbox">("people");
  const [resetForm, setResetForm] = useState({ email: "", password: "" });
  const [cashUsd, setCashUsd] = useState("");
  const [note, setNote] = useState("");
  const [focusPw, setFocusPw] = useState("");
  const [resetArmed, setResetArmed] = useState("");
  const [peopleFilter, setPeopleFilter] = useState<"all" | "live" | "halted" | "quiet">("all");
  const accounts = useSimStore((s) => s.accounts);
  const allowed = ready && isAuthenticated && isAdminUser(user);

  const ack = (id: string, text: string) => {
    setHit(id);
    setFormMsg(text);
    window.setTimeout(() => setHit((cur) => (cur === id ? "" : cur)), 480);
  };

  const press = (id: string, tone: "primary" | "ghost" = "primary") =>
    cn(
      "sim-btn min-h-12 justify-center active:scale-95 active:brightness-125",
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
      setDeliveries(listDeliveries().filter((row) => row.status === "open"));
    };
    pull();
    const bump = () => {
      pull();
      void useSimStore.persist.rehydrate();
      setTick((n) => n + 1);
    };
    window.addEventListener("xc-yield", bump);
    window.addEventListener("storage", bump);
    return () => {
      window.removeEventListener("xc-yield", bump);
      window.removeEventListener("storage", bump);
    };
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
    const snap = useStore.getState();
    const restored = restoreRememberedTokens({
      accessToken: snap.accessToken,
      refreshToken: snap.refreshToken,
    });
    if (restored && snap.user && snap.accessToken && !snap.isAuthenticated) {
      useStore.setState({ isAuthenticated: true });
      return;
    }
    if (!snap.isAuthenticated || !isAdminUser(snap.user ?? user)) {
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
      const resolved = resolveBookUserId(mail, id);
      const key = mail.includes("@") ? mail : resolved;
      if (!key) return;
      const prev = [...byKey.values()].find((n) => n.id === resolved || n.id === id || (mail.includes("@") && n.email === mail));
      const display = name.trim() || (mail.includes("@") ? mail.split("@")[0] : "Book");
      if (prev) {
        if (name.trim()) prev.name = name.trim();
        prev.id = resolved || prev.id;
        if (mail.includes("@")) prev.email = mail;
        if (source === "Network" || source === "Desk") prev.source = source;
        prev.label = prev.email ? `${prev.name} · ${prev.email}` : prev.name;
        return;
      }
      byKey.set(key, {
        id: resolved || mail,
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
    const searched = s
      ? nodes.filter((n) => `${n.name} ${n.email} ${n.source}`.toLowerCase().includes(s))
      : nodes;
    if (peopleFilter === "all") return searched;
    return searched.filter((n) => {
      const mandate = readMandate(n.id);
      const book = accounts[n.id];
      const paused = tradesPaused(mandate) || !!book?.tradingHalted;
      const live = nodeActivated(mandate) && !paused;
      if (peopleFilter === "live") return live;
      if (peopleFilter === "halted") return paused;
      return !live && !paused;
    });
  }, [nodes, q, peopleFilter, accounts, tick]);

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
    return { live, paused, waiting: pending.length + kycRows.length + linkRows.length + deliveries.length };
  }, [nodes, accounts, pending.length, kycRows.length, linkRows.length, deliveries.length, tick]);

  const activity = useMemo(() => {
    const items: { id: string; at: number; text: string }[] = [];
    for (const row of listDeskJournal()) items.push({ id: row.id, at: row.at, text: `Journal ${row.direction} ${row.amount} ${row.asset} · ${row.email}` });
    for (const row of listDeposits()) items.push({ id: row.id, at: row.at, text: `Deposit ${row.status} · ${row.asset} · ${row.email}` });
    for (const row of listKyc()) items.push({ id: row.id, at: row.at, text: `Identity ${row.status} · ${row.email}` });
    for (const row of listLinks()) items.push({ id: row.id, at: row.at, text: `Link ${row.status} · ${row.kind} · ${row.email}` });
    for (const row of listDeliveries()) items.push({ id: row.id, at: row.at, text: `Delivery ${row.status} · ${row.email}` });
    return items.sort((a, b) => b.at - a.at).slice(0, 12);
  }, [tick]);

  const focus = nodes.find((n) => n.id === focusId) ?? null;

  const bookIdOf = (id: string, email: string) => resolveBookUserId(email, id);

  const pickPerson = (node: NodeRef) => {
    const id = bookIdOf(node.id, node.email);
    setFocusId(id);
    setAdj({ ...adj, userId: id });
    const m = readMandate(id);
    setGrowth({
      dailyPct: m ? String(m.dailyPct) : "",
      weeklyPct: m ? weeklyOf(m).toFixed(2) : "",
      unlockFillPct: String(unlockFillOf(m)),
    });
    setCashUsd("");
    setFocusPw("");
    setResetArmed("");
    setDesk("do");
    ack(id + ":pick", `${node.email || node.name} is on the desk.`);
  };

  const applyGrowth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!focus) {
      ack("activate", "Pick a person first.");
      return;
    }
    const id = bookIdOf(focus.id, focus.email);
    const unlock = Number(growth.unlockFillPct);
    const dailyRaw = growth.dailyPct.trim();
    const weekRaw = growth.weeklyPct.trim();
    const daily = dailyRaw === "" ? readMandate(id)?.dailyPct ?? 0 : Number(dailyRaw);
    const weekly = weekRaw === "" ? weeklyFromDaily(daily) : Number(weekRaw);
    if (Number.isNaN(unlock) || Number.isNaN(daily) || Number.isNaN(weekly)) {
      ack("activate", "Enter the fill percent, and a daily or weekly rate if you want one.");
      return;
    }
    const principal = navOf(id);
    try {
      if (dailyRaw === "" && weekRaw === "") {
        setUnlockFill({ userId: id, email: focus.email || focus.name, unlockFillPct: unlock });
      } else {
        setDailyGrowth({
          userId: id,
          email: focus.email || focus.name,
          dailyPct: daily,
          weeklyPct: weekly,
          unlockFillPct: unlock,
          principal,
        });
      }
      ack(
        "activate",
        `Fill to withdraw is ${unlockFillOf({ unlockFillPct: unlock })}%.${dailyRaw || weekRaw ? ` Daily ${daily}% · week ${weekly}%.` : ""}`,
      );
    } catch (err) {
      ack("activate", err instanceof Error ? err.message : "Could not save.");
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
    const uid = bookIdOf(node.id, node.email);
    ack("journal", "Posting the entry");
    const cash = adj.asset === "USD" || adj.asset === "USDT";
    try {
      await adminAPI.postJournal(uid, {
        asset: adj.asset,
        amount: adj.amount,
        direction: adj.direction,
        reason: adj.reason,
        idempotencyKey: adj.idempotencyKey || `admin-${adj.direction}-${Date.now()}`,
      });
      saveDeskJournal({ userId: uid, email: node.email, asset: adj.asset, amount, direction: adj.direction, reason: adj.reason, where: "network" });
      ack("journal", `Journal posted for ${node.email}.`);
      setAdj({ ...adj, amount: "", reason: "", idempotencyKey: "" });
      await load();
    } catch {
      if (cash && adj.direction === "credit") {
        const res = useSimStore.getState().confirmDeposit(uid, amount, adj.asset, `journal-${Date.now()}`);
        if (!res.ok) {
          ack("journal", res.error);
          return;
        }
        syncPrincipal(uid);
      } else if (cash && adj.direction === "debit") {
        const res = useSimStore.getState().debitCash(uid, amount, adj.reason);
        if (!res.ok) {
          ack("journal", res.error);
          return;
        }
        syncPrincipal(uid);
      }
      saveDeskJournal({ userId: uid, email: node.email, asset: adj.asset, amount, direction: adj.direction, reason: adj.reason, where: "desk" });
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
    const uid = bookIdOf(id, email);
    useSimStore.getState().setHalt(uid, false);
    const book = useSimStore.getState().accounts[uid];
    const nav = book?.genesisClaimedAt ? accountNav(book) : 0;
    const prev = readMandate(uid);
    const operated = (prev?.operatedPct ?? 0) > 0 ? prev!.operatedPct : 100;
    if (prev) {
      touchMandate(uid, {
        tradesOpen: true,
        operatedPct: operated,
        email,
        principal: nav > 0 ? nav : prev.principal,
        activatedAt: nav > 0 && operated > 0 ? prev.activatedAt ?? Date.now() : Date.now(),
      });
    } else {
      setDailyGrowth({
        userId: uid,
        email,
        dailyPct: 0,
        operatedPct: 100,
        unlockFillPct: Number(growth.unlockFillPct) || 100,
        principal: nav,
      });
      setTradeGate({ userId: uid, email, open: true });
    }
    const live = nodeActivated(readMandate(uid));
    pushNotice(
      uid,
      live ? "Node live" : "Trading armed",
      live
        ? "The desk took this node live. Fills and accrual are open."
        : "The desk armed fills. They post once confirmed funds are on the node and the desk takes it live.",
    );
    ack(uid + ":start", live ? `Live for ${email}.` : `Armed for ${email}. Fills wait until the node is funded and taken live.`);
    setTick((n) => n + 1);
  };

  const pauseTrade = (id: string, email: string) => {
    const uid = bookIdOf(id, email);
    useSimStore.getState().setHalt(uid, true);
    setTradeGate({ userId: uid, email, open: false });
    ack(uid + ":pause", `Trading paused for ${email}.`);
    setTick((n) => n + 1);
  };

  const bookCash = (id: string, email: string) => {
    const uid = bookIdOf(id, email);
    const usd = Number(cashUsd);
    if (!(usd > 0)) {
      ack(uid + ":book", "Enter the USD amount to book.");
      return;
    }
    const res = useSimStore.getState().confirmDeposit(uid, usd, "USD", `desk-${Date.now()}`);
    if (!res.ok) {
      ack(uid + ":book", res.error);
      return;
    }
    syncPrincipal(uid);
    pushNotice(uid, "Node funded", `${usd.toLocaleString()} USD is booked to the node.`);
    setCashUsd("");
    ack(uid + ":book", `Booked ${usd.toLocaleString()} USD on ${email}.`);
    saveDeskJournal({ userId: uid, email, asset: "USD", amount: usd, direction: "credit", reason: "Desk book", where: "desk" });
    setTick((n) => n + 1);
  };

  const takeCash = (id: string, email: string) => {
    const uid = bookIdOf(id, email);
    const usd = Number(cashUsd);
    if (!(usd > 0)) {
      ack(uid + ":debit", "Enter the USD amount to debit.");
      return;
    }
    const res = useSimStore.getState().debitCash(uid, usd, `Desk debit ${usd} USD`);
    if (!res.ok) {
      ack(uid + ":debit", res.error);
      return;
    }
    syncPrincipal(uid);
    pushNotice(uid, "Cash debited", `${usd.toLocaleString()} USD was taken off the node.`);
    setCashUsd("");
    saveDeskJournal({ userId: uid, email, asset: "USD", amount: usd, direction: "debit", reason: "Desk debit", where: "desk" });
    ack(uid + ":debit", `Debited ${usd.toLocaleString()} USD on ${email}.`);
    setTick((n) => n + 1);
  };

  const resetBook = (id: string, email: string) => {
    const uid = bookIdOf(id, email);
    if (resetArmed !== uid) {
      setResetArmed(uid);
      ack(uid + ":reset", "Tap Reset book again. Cash and holdings on this node go to zero.");
      return;
    }
    const res = useSimStore.getState().reset(uid);
    setResetArmed("");
    if (!res.ok) {
      ack(uid + ":reset", res.error);
      return;
    }
    pingDesk();
    syncPrincipal(uid);
    pushNotice(uid, "Book reset", "The desk reset this node. Posted cash is zero until they book again.");
    ack(uid + ":reset", `Reset the book for ${email}.`);
    setTick((n) => n + 1);
  };

  const resetFocusPassword = async () => {
    if (!focus?.email) {
      ack("reset", "Pick a person with an email first.");
      return;
    }
    if (focusPw.length < 8) {
      ack("reset", "Use at least 8 characters.");
      return;
    }
    const desk = findDesk(focus.email);
    if (!desk) {
      ack("reset", "That email is not registered on this desk.");
      return;
    }
    upsertDesk({ ...desk, passwordHash: await hashDeskSecret(focusPw) });
    setFocusPw("");
    ack("reset", `Password updated for ${desk.email} on this desk.`);
  };

  const sendNote = (id: string, email: string) => {
    const uid = bookIdOf(id, email);
    const body = note.trim();
    if (body.length < 2) {
      ack(uid + ":note", "Write the note first.");
      return;
    }
    pushNotice(uid, "Desk note", body);
    setNote("");
    ack(uid + ":note", `Note sent to ${email}.`);
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

  const focusMandate = focus ? readMandate(focus.id) : null;
  const focusBook = focus ? accounts[focus.id] : undefined;
  const focusPaused = !!(focus && (tradesPaused(focusMandate) || focusBook?.tradingHalted));
  const focusLive = !!(focus && nodeActivated(focusMandate) && !focusPaused);
  const focusApi = focus ? rows.find((r) => r.id === focus.id || r.email.toLowerCase() === focus.email) : undefined;
  const focusNotes = focus ? listNotices(focus.id).slice(0, 6) : [];
  const focusJournal = focus ? listDeskJournal().filter((row) => row.userId === focus.id).slice(0, 6) : [];

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-white/[0.06] px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <XCapitalLogoMark size={26} />
          <div className="min-w-0">
            <p className="font-black text-sm tracking-tight">X-CAPITAL Admin</p>
            <p className="text-[10px] font-mono uppercase tracking-widest text-white/35">Live desk</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            logout();
            router.push("/admin/login");
          }}
          className={press("out", "ghost")}
        >
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </header>

      <main className="max-w-md mx-auto px-4 py-5 space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {([
            ["people", "People"],
            ["do", "Do"],
            ["inbox", pulse.waiting ? `Inbox (${pulse.waiting})` : "Inbox"],
          ] as const).map(([id, label]) => (
            <button key={id} type="button" className={press("tab:" + id, desk === id ? "primary" : "ghost")} onClick={() => setDesk(id)}>
              {label}
            </button>
          ))}
        </div>

        {error && <p className="text-sm text-red-300">{error}</p>}
        {formMsg && <p className="text-sm text-white/60">{formMsg}</p>}

        {desk === "people" && (
          <section className="space-y-3">
            <input className="sim-input min-h-12" placeholder="Search name or email" value={q} onChange={(e) => setQ(e.target.value)} />
            <div className="grid grid-cols-4 gap-2">
              {(["all", "live", "halted", "quiet"] as const).map((key) => (
                <button key={key} type="button" className={press("filter:" + key, peopleFilter === key ? "primary" : "ghost")} onClick={() => setPeopleFilter(key)}>
                  {key}
                </button>
              ))}
            </div>
            {listed.length === 0 ? (
              <p className="text-sm text-white/40">No people on this desk yet.</p>
            ) : (
              <ul className="space-y-2">
                {listed.map((node) => {
                  const mandate = readMandate(node.id);
                  const book = accounts[node.id];
                  const paused = tradesPaused(mandate) || !!book?.tradingHalted;
                  const live = nodeActivated(mandate) && !paused;
                  const nav = navOf(node.id);
                  return (
                    <li key={node.id}>
                      <button
                        type="button"
                        className={cn(
                          "w-full text-left rounded-2xl border px-4 py-4 min-h-[72px]",
                          focusId === node.id ? "border-emerald-300/50 bg-emerald-300/10" : "border-white/[0.12] bg-black/40",
                        )}
                        onClick={() => pickPerson(node)}
                      >
                        <p className="text-base font-bold">{node.name}</p>
                        <p className="text-[12px] font-mono text-white/55 mt-1 break-all">{node.email}</p>
                        <p className="text-[13px] text-white/70 mt-2">
                          {nav.toLocaleString(undefined, { maximumFractionDigits: 2 })} USD
                          {" · "}
                          {live ? "Live" : paused ? "Halted" : "Quiet"}
                          {mandate ? ` · fill ${unlockFillOf(mandate)}%` : ""}
                        </p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        )}

        {desk === "do" && (
          <section className="space-y-4">
            {!focus ? (
              <p className="text-sm text-white/50">Pick a person first.</p>
            ) : (
              <>
                <div className="rounded-2xl border border-white/[0.12] bg-black/40 px-4 py-4">
                  <p className="text-base font-bold">{focus.name}</p>
                  <p className="text-[12px] font-mono text-white/55 mt-1 break-all">{focus.email}</p>
                  <p className="text-[15px] mt-2">
                    {navOf(focus.id).toLocaleString(undefined, { maximumFractionDigits: 2 })} USD
                    {" · "}
                    {focusLive ? "Live" : focusPaused ? "Halted" : "Quiet"}
                  </p>
                  <p className="text-[12px] text-white/50 mt-2">
                    Cash {(focusBook?.cash ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    {focusBook?.fleet?.units ? ` · fleet ${focusBook.fleet.units}` : ""}
                    {focusBook?.commerce?.length ? ` · atelier ${focusBook.commerce.reduce((n, h) => n + h.qty, 0)}` : ""}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="sim-label">Cash (USD)</label>
                  <input className="sim-input min-h-12" inputMode="decimal" placeholder="USD amount" value={cashUsd} onChange={(e) => setCashUsd(e.target.value)} />
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" className={press(focus.id + ":book")} onClick={() => bookCash(focus.id, focus.email)}>Book</button>
                    <button type="button" className={press(focus.id + ":debit", "ghost")} onClick={() => takeCash(focus.id, focus.email)}>Debit</button>
                  </div>
                </div>

                <form onSubmit={applyGrowth} className="space-y-2">
                  <label className="sim-label">Node-trade fill to withdraw</label>
                  <input className="sim-input min-h-12" inputMode="decimal" placeholder="100" value={growth.unlockFillPct} onChange={(e) => setGrowth({ ...growth, unlockFillPct: e.target.value })} />
                  <label className="sim-label">Daily rate %</label>
                  <input className="sim-input min-h-12" inputMode="decimal" placeholder="0.25" value={growth.dailyPct} onChange={(e) => setGrowth({ ...growth, dailyPct: e.target.value })} />
                  <label className="sim-label">Weekly rate %</label>
                  <input className="sim-input min-h-12" inputMode="decimal" placeholder="1.76" value={growth.weeklyPct} onChange={(e) => setGrowth({ ...growth, weeklyPct: e.target.value })} />
                  <button type="submit" className={cn(press("activate"), "w-full")}>Save fill and rates</button>
                </form>
                {focusMandate && (
                  <p className="text-[12px] text-white/45">
                    Withdrawals open at {unlockFillOf(focusMandate)}% fill
                    {focusMandate.dailyPct ? ` · ${focusMandate.dailyPct}% a day · ${weeklyOf(focusMandate).toFixed(2)}% week` : ""}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <button type="button" className={press(focus.id + ":start")} onClick={() => startTrade(focus.id, focus.email)}>
                    <Play className="w-4 h-4" /> Start
                  </button>
                  <button type="button" className={press(focus.id + ":pause", "ghost")} onClick={() => pauseTrade(focus.id, focus.email)}>
                    <Pause className="w-4 h-4" /> Halt
                  </button>
                </div>

                <div className="space-y-2">
                  <input className="sim-input min-h-12" placeholder="Note to this person" value={note} onChange={(e) => setNote(e.target.value)} />
                  <button type="button" className={cn(press(focus.id + ":note", "ghost"), "w-full")} onClick={() => sendNote(focus.id, focus.email)}>Send note</button>
                </div>

                <div className="space-y-2">
                  <label className="sim-label">Desk password</label>
                  <input className="sim-input min-h-12" type="password" placeholder="New password (8+)" value={focusPw} onChange={(e) => setFocusPw(e.target.value)} />
                  <button type="button" className={cn(press("reset"), "w-full")} onClick={() => void resetFocusPassword()}>Reset password</button>
                </div>

                {focusApi && focusApi.id !== user?.id && (
                  <button
                    type="button"
                    className={cn(press(focusApi.id + ":active", focusApi.isActive ? "ghost" : "primary"), "w-full")}
                    onClick={() => void toggle(focusApi)}
                  >
                    {focusApi.isActive ? <><Ban className="w-4 h-4" /> Disable account</> : "Enable account"}
                  </button>
                )}

                <button type="button" className={cn(press(focus.id + ":reset", "ghost"), "w-full")} onClick={() => resetBook(focus.id, focus.email)}>
                  {resetArmed === focus.id ? "Tap again to reset book" : "Reset book"}
                </button>

                <div>
                  <p className="font-black mb-2">Tape</p>
                  {focusNotes.length === 0 && focusJournal.length === 0 ? (
                    <p className="text-sm text-white/40">No notes or journal lines yet.</p>
                  ) : (
                    <ul className="space-y-1 text-[12px] text-white/55">
                      {focusNotes.map((row) => (
                        <li key={row.id}>{row.title} — {row.body}</li>
                      ))}
                      {focusJournal.map((row) => (
                        <li key={row.id} className="font-mono">{row.direction} {row.amount} {row.asset} · {row.reason}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </section>
        )}

        {desk === "inbox" && (
          <div className="space-y-5">
            <section>
              <p className="font-black mb-1">Deposits</p>
              <p className="text-sm text-white/50 mb-3">Books stay at 0 until you type the USD.</p>
              {pending.length === 0 ? (
                <p className="text-sm text-white/40">None waiting.</p>
              ) : (
                <ul className="space-y-3">
                  {pending.map((row) => (
                    <li key={row.id} className="rounded-2xl border border-white/[0.12] bg-black/40 p-4 space-y-3">
                      <p className="text-sm font-bold">{row.email}</p>
                      <p className="text-[12px] text-white/50">{row.asset} · {new Date(row.at).toLocaleString()}</p>
                      <p className="text-[11px] font-mono text-white/35 break-all">{row.txHash}</p>
                      <input className="sim-input min-h-12" inputMode="decimal" placeholder="USD value" value={usdById[row.id] ?? ""} onChange={(e) => setUsdById((m) => ({ ...m, [row.id]: e.target.value }))} />
                      <button
                        type="button"
                        className={cn(press(row.id + ":deposit"), "w-full")}
                        onClick={() => {
                          const usd = Number(usdById[row.id]);
                          if (!(usd > 0)) {
                            setError("Enter the USD value before confirming.");
                            return;
                          }
                          const uid = resolveBookUserId(row.email, row.userId);
                          const res = useSimStore.getState().confirmDeposit(uid, usd, row.asset, row.txHash);
                          if (!res.ok) {
                            setError(res.error);
                            return;
                          }
                          confirmDepositRecord(row.id, usd);
                          syncPrincipal(uid);
                          pushNotice(uid, "Node funded", `${usd.toLocaleString()} USD from ${row.asset} is booked to the node.`);
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

            <section>
              <p className="font-black mb-1">Identity</p>
              {kycRows.length === 0 ? (
                <p className="text-sm text-white/40">None waiting.</p>
              ) : (
                <ul className="space-y-3">
                  {kycRows.map((row) => (
                    <li key={row.id} className="rounded-2xl border border-white/[0.12] bg-black/40 p-4">
                      <p className="text-sm font-bold">{row.legalFirst} {row.legalLast} · {row.email}</p>
                      <p className="text-[12px] text-white/55 mt-1">{row.address}, {row.city}, {row.country}</p>
                      <p className="text-[12px] text-white/55 mt-1">{row.phone} · {row.docType} {row.docNumber}</p>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <button type="button" className={press(row.id + ":kyc-yes")} onClick={() => { setKycStatus(row.id, "approved"); pushNotice(row.userId, "Identity approved", "The operator confirmed the identity packet."); ack(row.id + ":kyc-yes", `Identity approved for ${row.email}.`); }}>Approve</button>
                        <button type="button" className={press(row.id + ":kyc-no", "ghost")} onClick={() => { setKycStatus(row.id, "rejected"); pushNotice(row.userId, "Identity rejected", "The operator rejected the identity packet."); ack(row.id + ":kyc-no", `Identity rejected for ${row.email}.`); }}>Reject</button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <p className="font-black mb-1">Links</p>
              {linkRows.length === 0 ? (
                <p className="text-sm text-white/40">None waiting.</p>
              ) : (
                <ul className="space-y-3">
                  {linkRows.map((row) => (
                    <li key={row.id} className="rounded-2xl border border-white/[0.12] bg-black/40 p-4 space-y-2">
                      <p className="text-sm font-bold">{row.email}</p>
                      <p className="text-[12px] text-white/55">{row.kind} · {row.custodian} · {row.requestedUsd.toLocaleString()} USD</p>
                      <button type="button" className={cn(press(row.id + ":link", "ghost"), "w-full")} onClick={() => { setLinkStatus(row.id, "linked"); pushNotice(row.userId, "Plan linked", `${row.kind} at ${row.custodian} is on file. No cash was booked.`); ack(row.id + ":link", `Link confirmed for ${row.email}.`); }}>Confirm link</button>
                      <input className="sim-input min-h-12" inputMode="decimal" placeholder="USD to book" value={linkUsd[row.id] ?? String(row.requestedUsd)} onChange={(e) => setLinkUsd((m) => ({ ...m, [row.id]: e.target.value }))} />
                      <button
                        type="button"
                        className={cn(press(row.id + ":booklink"), "w-full")}
                        onClick={() => {
                          const usd = Number(linkUsd[row.id] ?? row.requestedUsd);
                          if (!(usd > 0)) {
                            setError("Enter the USD amount to book.");
                            return;
                          }
                          const uid = resolveBookUserId(row.email, row.userId);
                          const res = useSimStore.getState().confirmDeposit(uid, usd, row.kind, `link-${row.id}`);
                          if (!res.ok) {
                            setError(res.error);
                            return;
                          }
                          setLinkStatus(row.id, "booked", usd);
                          syncPrincipal(uid);
                          pushNotice(uid, "Node funded", `${usd.toLocaleString()} USD from ${row.custodian} is booked to the node.`);
                          setError("");
                          ack(row.id + ":booklink", `Booked ${usd.toLocaleString()} USD.`);
                        }}
                      >
                        Book cash
                      </button>
                      <button type="button" className={cn(press(row.id + ":rej", "ghost"), "w-full")} onClick={() => { setLinkStatus(row.id, "rejected"); pushNotice(row.userId, "Link rejected", `${row.kind} at ${row.custodian} was not accepted.`); ack(row.id + ":rej", `Link rejected for ${row.email}.`); }}>Reject</button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <p className="font-black mb-1">Deliveries</p>
              <p className="text-sm text-white/50 mb-3">Confirm or dismiss. No extra workflow.</p>
              {deliveries.length === 0 ? (
                <p className="text-sm text-white/40">None open.</p>
              ) : (
                <ul className="space-y-3">
                  {deliveries.map((row) => (
                    <li key={row.id} className="rounded-2xl border border-white/[0.12] bg-black/40 p-4 space-y-2">
                      <p className="text-sm font-bold">{row.name} · {row.email}</p>
                      <p className="text-[12px] text-white/55">{row.phone}</p>
                      <p className="text-[12px] text-white/55">{row.address}, {row.city}, {row.country}</p>
                      {row.notes ? <p className="text-[12px] text-white/45">{row.notes}</p> : null}
                      <ul className="text-[12px] text-white/70">
                        {row.items.map((item) => (
                          <li key={item.sku}>{item.qty} × {item.name}</li>
                        ))}
                      </ul>
                      <p className="text-sm font-bold">{row.total.toLocaleString(undefined, { maximumFractionDigits: 0 })} USD</p>
                      <div className="grid grid-cols-2 gap-2">
                        <button type="button" className={press(row.id + ":ship")} onClick={() => { setDeliveryStatus(row.id, "confirmed"); ack(row.id + ":ship", `Delivery confirmed for ${row.email}.`); }}>Confirm</button>
                        <button type="button" className={press(row.id + ":skip", "ghost")} onClick={() => { setDeliveryStatus(row.id, "dismissed"); ack(row.id + ":skip", `Delivery dismissed.`); }}>Dismiss</button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}

        <details className="rounded-2xl border border-white/[0.08] bg-black/30 px-4 py-3">
          <summary className="font-black min-h-12 flex items-center cursor-pointer">More</summary>
          <div className="mt-4 space-y-6 pb-2">
            <section>
              <p className="font-black mb-2">Post journal</p>
              <form onSubmit={postJournal} className="space-y-2">
                <NodePicker
                  nodes={nodes}
                  value={adj.userId}
                  onPick={(id) => setAdj({ ...adj, userId: id })}
                />
                <select className="sim-input min-h-12" value={adj.asset} onChange={(e) => setAdj({ ...adj, asset: e.target.value })}>
                  {["USDT", "BTC", "ETH", "SOL", "USD"].map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
                <select className="sim-input min-h-12" value={adj.direction} onChange={(e) => setAdj({ ...adj, direction: e.target.value as "credit" | "debit" })}>
                  <option value="credit">Credit</option>
                  <option value="debit">Debit</option>
                </select>
                <input className="sim-input min-h-12" placeholder="Amount" value={adj.amount} onChange={(e) => setAdj({ ...adj, amount: e.target.value })} required />
                <input className="sim-input min-h-12" placeholder="Reason" value={adj.reason} onChange={(e) => setAdj({ ...adj, reason: e.target.value })} required minLength={3} />
                <button type="submit" className={cn(press("journal"), "w-full")}>Post entry</button>
              </form>
            </section>

            <section>
              <p className="font-black mb-2">Create operator</p>
              <form onSubmit={create} className="space-y-2">
                <input className="sim-input min-h-12" placeholder="First" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
                <input className="sim-input min-h-12" placeholder="Last" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
                <input className="sim-input min-h-12" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                <input className="sim-input min-h-12" type="password" placeholder="Password (8+)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} />
                <button type="submit" className={cn(press("create"), "w-full")}>Create</button>
              </form>
              <form onSubmit={resetDeskPassword} className="space-y-2 mt-4">
                <input className="sim-input min-h-12" type="email" placeholder="Registered email" value={resetForm.email} onChange={(e) => setResetForm({ ...resetForm, email: e.target.value })} required />
                <input className="sim-input min-h-12" type="password" placeholder="New password (8+)" value={resetForm.password} onChange={(e) => setResetForm({ ...resetForm, password: e.target.value })} required minLength={8} />
                <button type="submit" className={cn(press("reset", "ghost"), "w-full")}>Reset desk password</button>
              </form>
            </section>

            <section>
              <p className="font-black mb-2">Directory</p>
              <button type="button" onClick={() => { ack("refresh", "Directory refreshed."); void load(); }} className={cn(press("refresh", "ghost"), "w-full mb-3")}>
                <RefreshCw className={cn("w-3.5 h-3.5", busy && "animate-spin")} /> Refresh
              </button>
              {listed.length === 0 ? (
                <p className="text-sm text-white/40">No registered users yet.</p>
              ) : (
                <ul className="space-y-2">
                  {listed.map((n) => {
                    const api = rows.find((r) => r.id === n.id || r.email.toLowerCase() === n.email);
                    return (
                      <li key={n.id} className="rounded-xl border border-white/[0.08] px-3 py-3">
                        <p className="text-sm font-semibold">{n.name}</p>
                        <p className="font-mono text-[11px] text-white/40 break-all">{n.email || n.id}</p>
                        <p className="text-[12px] text-white/50 mt-1">{navOf(n.id).toLocaleString(undefined, { maximumFractionDigits: 2 })} USD · {n.source}</p>
                        {api ? (
                          <button type="button" disabled={api.id === user?.id} onClick={() => void toggle(api)} className={cn(press(api.id + ":active", api.isActive ? "ghost" : "primary"), "w-full mt-2")}>
                            {api.isActive ? <><Ban className="w-3 h-3" /> Disable</> : "Enable"}
                          </button>
                        ) : (
                          <button type="button" className={cn(press(n.id + ":pick", "ghost"), "w-full mt-2")} onClick={() => pickPerson(n)}>Select</button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section>
              <p className="font-black mb-2">Activity</p>
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
          </div>
        </details>
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
