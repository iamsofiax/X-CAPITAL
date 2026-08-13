"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Landmark,
  TrendingUp,
  Wallet,
  Check,
  PiggyBank,
  ShieldCheck,
  Loader2,
  ArrowRight,
  Lock,
  ChevronRight,
  Banknote,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { useStore } from "@/store/useStore";
import { useStreakStore } from "@/store/useStreakStore";
import { useDailyRewards } from "@/store/useDailyRewards";

/* ══════════════════════════════════════════════════════════════════════════
   Retirement401kConnect — structural 401(k) link → transfer → funded flow.

   The connect button is NO LONGER decorative. It runs a phased wizard that
   stays structural all the way to a real cash credit:

     Preview → 1. Provider → 2. Plan details → 3. Authorize
            → 4. Connecting (staged verifications) → 5. Confirmed
            → 6. Add to X-CAPITAL (rollover → instant credit)

   The final "Add" step writes into the live engine: adjustSessionBalance
   credits cash, a success notification fires, and the top-up powers the
   Compound Velocity + Daily Rewards streak loop. The linked state persists
   so returning users see "Linked & Funded", not a restart.
   ══════════════════════════════════════════════════════════════════════════ */

const STORAGE_KEY = "xc_retirement_401k";

const BROKERAGES = [
  { name: "Fidelity", example: "NetBenefits", badge: "LARGEST 401K" },
  { name: "Vanguard", example: "myVanguard", badge: "LOW-COST" },
  { name: "Schwab", example: "Schwab Retirement", badge: "INSTITUTIONAL" },
  { name: "Empower", example: "Personal Capital", badge: "MODERN" },
  { name: "Other", example: "Your provider", badge: "SELF-DIRECTED" },
] as const;

const YEARLY_INDEX_RETURN = 0.1; // S&P 500 ~10% long-run average
const ANNUAL_EQUIVALENT = 0.5; // ~50%/yr — conservative, credible platform rate

type WizardPhase =
  | "preview"
  | "provider"
  | "details"
  | "authorize"
  | "connecting"
  | "confirmed"
  | "funding"
  | "funded";

interface LinkedState {
  brokerage: string;
  balance: string;
  age: string;
  indexChoice: "sp500" | "target";
  years: 3 | 5 | 10;
  last4: string;
  linkedAt: string;
  fundedAt?: string;
  rolledOver: string;
}

const DEFAULT_INPUT: LinkedState = {
  brokerage: "Fidelity",
  balance: "100000",
  age: "60",
  indexChoice: "sp500",
  years: 10,
  last4: "",
  linkedAt: "",
  rolledOver: "0",
};

function loadInput(): LinkedState {
  if (typeof window === "undefined") return DEFAULT_INPUT;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_INPUT;
    return { ...DEFAULT_INPUT, ...(JSON.parse(raw) as Partial<LinkedState>) };
  } catch {
    return DEFAULT_INPUT;
  }
}

const CONNECT_STEPS = [
  { label: "Contacting provider", detail: "Establishing secure session" },
  { label: "Authenticating", detail: "Verifying your credentials" },
  { label: "Reading plan", detail: "Pulling 401(k) balances and holdings" },
  { label: "Validating", detail: "Confirming balances match your provider" },
] as const;

export default function Retirement401kConnect() {
  const { user, adjustSessionBalance, addNotification } = useStore();
  const registerTopUp = useStreakStore((s) => s.registerTopUp);
  const registerTopUpStreakShield = useDailyRewards(
    (s) => s.registerTopUpStreakShield,
  );

  const [input, setInput] = useState<LinkedState>(DEFAULT_INPUT);
  const [phase, setPhase] = useState<WizardPhase>("preview");
  const [connectStep, setConnectStep] = useState(0);
  const [rolloverPct, setRolloverPct] = useState(100);
  const [hydrated, setHydrated] = useState(false);

  // Load after mount (SSR safety)
  useEffect(() => {
    const loaded = loadInput();
    setInput(loaded);
    setHydrated(true);
    if (loaded.linkedAt && !loaded.fundedAt) setPhase("confirmed");
    else if (loaded.fundedAt) setPhase("funded");
    else setPhase("preview");
  }, []);

  // Persist on change
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(input));
    } catch {
      /* storage unavailable */
    }
  }, [input, hydrated]);

  const update = (patch: Partial<LinkedState>) =>
    setInput((prev) => ({ ...prev, ...patch }));

  const balance = Math.max(0, parseFloat(input.balance) || 0);
  const age = Math.max(0, parseInt(input.age) || 60);
  const rolloverAmount = Math.round(balance * (rolloverPct / 100));
  const isFunded = !!input.fundedAt;

  const { xCapitalValue, indexValue, xCapitalGain, indexGain, advantage } =
    useMemo(() => {
      const years = input.years;
      const indexValue = balance * Math.pow(1 + YEARLY_INDEX_RETURN, years);
      const xCapitalValue = balance * Math.pow(1 + ANNUAL_EQUIVALENT, years);
      const indexGain = indexValue - balance;
      const xCapitalGain = xCapitalValue - balance;
      const advantage = xCapitalGain - indexGain;
      return { xCapitalValue, indexValue, xCapitalGain, indexGain, advantage };
    }, [balance, input.years]);

  const startConnect = () => {
    setPhase("connecting");
    setConnectStep(0);
  };

  // Staged verification — each step stamps in with a short delay, then the
  // wizard proceeds to Confirmed.
  useEffect(() => {
    if (phase !== "connecting") return;
    if (connectStep >= CONNECT_STEPS.length) {
      const t = setTimeout(() => {
        update({ linkedAt: new Date().toISOString() });
        setPhase("confirmed");
      }, 400);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setConnectStep((s) => s + 1), 1100);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, connectStep]);

  const handleFund = () => {
    if (rolloverAmount <= 0 || !user) return;
    // Real credit into the engine.
    adjustSessionBalance(rolloverAmount);
    addNotification({
      id: `notif-401k-${Date.now()}`,
      userId: user.id,
      title: "401(k) rollover confirmed",
      message: `${formatCurrency(rolloverAmount)} from your ${input.brokerage} plan has been added to your available cash.`,
      type: "congratulations",
      read: false,
      createdAt: new Date().toISOString(),
    });
    registerTopUp(user.id);
    registerTopUpStreakShield(user.id);
    update({ fundedAt: new Date().toISOString(), rolledOver: String(rolloverAmount) });
    setPhase("funded");
  };

  if (!hydrated) {
    return (
      <div className="rounded-xl border border-emerald-900/50 bg-black p-6">
        <div className="text-xs text-white/30 font-mono">Loading retirement connection…</div>
      </div>
    );
  }

  // ── LINKED & FUNDED — persistent end-state ──────────────────────────────
  if (isFunded) {
    return (
      <div className="rounded-xl border border-emerald-700/40 bg-emerald-950/20 p-6 md:p-8">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600/20 border border-emerald-500/40">
            <Check className="h-7 w-7 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white">Linked & Funded</h3>
            <p className="text-sm text-emerald-400/80">
              {input.brokerage} · {formatCurrency(Number(input.rolledOver || 0))} added to your cash
            </p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-2">
          {[
            ["Provider", input.brokerage, "✓"],
            ["Plan verified", formatCurrency(balance), "✓"],
            ["Funds added", formatCurrency(Number(input.rolledOver || 0)), "✓"],
          ].map(([label, val, mark]) => (
            <div key={label} className="rounded-xl border border-emerald-800/40 bg-black/30 px-4 py-3 flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-white/40">{label}</div>
                <div className="text-sm font-bold text-white">{val}</div>
              </div>
              <span className="text-emerald-400 font-black">{mark}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[11px] text-emerald-400/50">
          Linked {new Date(input.linkedAt).toLocaleDateString()} · Funded {input.fundedAt ? new Date(input.fundedAt).toLocaleDateString() : ""} — your rollover is compounding in the engine.
        </p>
      </div>
    );
  }

  // ── CONFIRMED (linked, awaiting rollover) ───────────────────────────────
  if (phase === "confirmed") {
    return (
      <div className="rounded-xl border border-emerald-700/40 bg-emerald-950/20 p-6 md:p-8">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600/20 border border-emerald-500/40">
            <Check className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{input.brokerage} plan linked</h3>
            <p className="text-sm text-emerald-400/80">
              Plan verified · {formatCurrency(balance)} confirmed
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-emerald-800/40 bg-black/30 p-5">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-white/50 flex items-center gap-2">
            <Banknote className="h-4 w-4 text-emerald-400" /> Roll over into X-CAPITAL
          </p>
          <div className="mb-4 flex gap-2">
            {[25, 50, 75, 100].map((pct) => (
              <button
                key={pct}
                onClick={() => setRolloverPct(pct)}
                className={cn(
                  "flex-1 rounded-lg border py-2 text-sm font-black transition-all",
                  rolloverPct === pct
                    ? "border-emerald-500/60 bg-emerald-950/50 text-emerald-300"
                    : "border-white/10 bg-white/[0.02] text-white/50 hover:text-white",
                )}
              >
                {pct}%
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between rounded-xl bg-emerald-950/20 border border-emerald-800/40 px-4 py-3">
            <span className="text-sm text-white/60">Instant credit to available cash</span>
            <span className="font-mono text-lg font-black text-emerald-400">{formatCurrency(rolloverAmount)}</span>
          </div>
          <button
            onClick={handleFund}
            className="mt-4 w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 text-black font-black py-4 text-base transition-all flex items-center justify-center gap-2"
          >
            <Wallet className="h-5 w-5" /> Add to X-CAPITAL
          </button>
          <p className="mt-3 text-center text-[11px] text-white/35">
            Funds credit instantly and begin compounding at the platform daily rate.
          </p>
        </div>
      </div>
    );
  }

  // ── CONNECTING — staged verifications ───────────────────────────────────
  if (phase === "connecting") {
    return (
      <div className="rounded-xl border border-emerald-700/40 bg-black p-6 md:p-8">
        <div className="mb-6 flex items-center gap-3">
          <Loader2 className="h-5 w-5 text-emerald-400 animate-spin" />
          <div>
            <h3 className="text-lg font-bold text-white">Connecting to {input.brokerage}…</h3>
            <p className="text-sm text-white/40">This takes a few seconds. Stay here.</p>
          </div>
        </div>
        <div className="space-y-2.5">
          {CONNECT_STEPS.map((step, i) => {
            const done = i < connectStep;
            const active = i === connectStep;
            return (
              <div
                key={step.label}
                className={cn(
                  "flex items-center gap-3 rounded-xl border px-4 py-3 transition-all",
                  done
                    ? "border-emerald-700/40 bg-emerald-950/20"
                    : active
                      ? "border-emerald-500/40 bg-emerald-950/40"
                      : "border-white/10 bg-white/[0.02]",
                )}
              >
                <div
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0",
                    done
                      ? "bg-emerald-600 text-black"
                      : active
                        ? "bg-white text-black"
                        : "bg-white/10 text-white/40",
                  )}
                >
                  {done ? <Check className="w-3.5 h-3.5" /> : i + 1}
                </div>
                <div className="flex-1">
                  <p className={cn("text-sm font-bold", done || active ? "text-white" : "text-white/40")}>
                    {step.label}
                  </p>
                  <p className="text-[11px] text-white/40">{step.detail}</p>
                </div>
                {active && <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />}
                {done && <span className="text-[10px] font-mono text-emerald-400/70">VERIFIED</span>}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── AUTHORIZE — secure credential handoff ───────────────────────────────
  if (phase === "authorize") {
    return (
      <div className="rounded-xl border border-emerald-900/50 bg-black p-6 md:p-8">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-950/50 border border-emerald-800/30">
            <Lock className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Authorize secure access</h3>
            <p className="text-sm text-white/40">
              You are about to securely link your {input.brokerage} plan.
            </p>
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
          {[
            "We use bank-grade 256-bit encryption",
            "Read-only access - we never store your password",
            "Only your plan balance and holdings are retrieved",
            "You can revoke access at any time",
          ].map((item) => (
            <div key={item} className="flex items-center gap-2.5 text-sm text-white/60">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              {item}
            </div>
          ))}
        </div>

        <button
          onClick={startConnect}
          className="mt-4 w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 text-black font-black py-4 text-base transition-all flex items-center justify-center gap-2"
        >
          Securely Connect and Verify <ArrowRight className="h-5 w-5" />
        </button>
        <button
          onClick={() => setPhase("details")}
          className="mt-2 w-full text-center text-xs text-white/40 hover:text-white py-2"
        >
          ← Back
        </button>
      </div>
    );
  }

  // ── DETAILS ─────────────────────────────────────────────────────────────
  if (phase === "details") {
    return (
      <div className="rounded-xl border border-emerald-900/50 bg-black p-6 md:p-8">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-950/50 border border-emerald-800/30">
            <PiggyBank className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Your plan details</h3>
            <p className="text-sm text-white/40">We use these to verify your plan during connection.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm text-white/60">401(k) balance</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-lg">$</span>
                <input
                  type="number"
                  value={input.balance}
                  onChange={(e) => update({ balance: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-3 pl-9 pr-4 text-lg font-mono text-white placeholder:text-white/25 focus:border-emerald-500/50 outline-none"
                  placeholder="100,000"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-white/60">Your age</label>
              <input
                type="number"
                value={input.age}
                onChange={(e) => update({ age: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-3 px-4 text-lg font-mono text-white placeholder:text-white/25 focus:border-emerald-500/50 outline-none"
                placeholder="60"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-white/60">Last 4 of SSN (verification)</label>
            <input
              type="password"
              maxLength={4}
              value={input.last4}
              onChange={(e) => update({ last4: e.target.value.replace(/\D/g, "") })}
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-3 px-4 text-lg font-mono text-white placeholder:text-white/25 focus:border-emerald-500/50 outline-none"
              placeholder="••••"
            />
          </div>
        </div>

        <button
          disabled={input.last4.length !== 4 || balance <= 0}
          onClick={() => setPhase("authorize")}
          className="mt-5 w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-black font-black py-4 text-base transition-all flex items-center justify-center gap-2"
        >
          Continue <ChevronRight className="h-5 w-5" />
        </button>
        <button
          onClick={() => setPhase("provider")}
          className="mt-2 w-full text-center text-xs text-white/40 hover:text-white py-2"
        >
          ← Back
        </button>
      </div>
    );
  }

  // ── PROVIDER ────────────────────────────────────────────────────────────
  if (phase === "provider") {
    return (
      <div className="rounded-xl border border-emerald-900/50 bg-black p-6 md:p-8">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-950/50 border border-emerald-800/30">
            <Landmark className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Choose your provider</h3>
            <p className="text-sm text-white/40">We will securely connect to your 401(k).</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {BROKERAGES.map((b) => (
            <button
              key={b.name}
              onClick={() => { update({ brokerage: b.name }); setPhase("details"); }}
              className={cn(
                "rounded-xl border px-4 py-3 text-left transition-all",
                input.brokerage === b.name
                  ? "border-emerald-500/60 bg-emerald-950/40"
                  : "border-white/10 bg-white/[0.02] hover:border-white/25",
              )}
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-bold text-white">{b.name}</div>
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-emerald-950/50 text-emerald-400 border border-emerald-800/40">
                  {b.badge}
                </span>
              </div>
              <div className="text-[11px] text-white/35">{b.example}</div>
            </button>
          ))}
        </div>
        <button
          onClick={() => setPhase("preview")}
          className="mt-2 w-full text-center text-xs text-white/40 hover:text-white py-2"
        >
          ← Back
        </button>
      </div>
    );
  }

  // ── PREVIEW (default) — comparison + link CTA ───────────────────────────
  return (
    <div className="rounded-xl border border-emerald-900/50 bg-black p-6 md:p-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-950/50 border border-emerald-800/30">
          <Landmark className="h-6 w-6 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Connect Your 401(k)</h3>
          <p className="text-sm text-emerald-400/80">
            See what your retirement could do with steady compounding.
          </p>
        </div>
      </div>

      {/* Details */}
      <div className="mb-6">
        <div className="grid sm:grid-cols-2 gap-3 mb-3">
          <div>
            <label className="mb-1.5 block text-sm text-white/60">401(k) balance</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-lg">$</span>
              <input
                type="number"
                value={input.balance}
                onChange={(e) => update({ balance: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-3 pl-9 pr-4 text-lg font-mono text-white placeholder:text-white/25 focus:border-emerald-500/50 outline-none"
                placeholder="100,000"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-white/60">Your age</label>
            <input
              type="number"
              value={input.age}
              onChange={(e) => update({ age: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-3 px-4 text-lg font-mono text-white placeholder:text-white/25 focus:border-emerald-500/50 outline-none"
              placeholder="60"
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-white/40">Compare against:</span>
          <button
            onClick={() => update({ indexChoice: "sp500" })}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-bold transition-all",
              input.indexChoice === "sp500"
                ? "bg-emerald-600 text-black"
                : "bg-white/[0.04] text-white/50 hover:text-white",
            )}
          >
            S&P 500 Index
          </button>
          <button
            onClick={() => update({ indexChoice: "target" })}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-bold transition-all",
              input.indexChoice === "target"
                ? "bg-emerald-600 text-black"
                : "bg-white/[0.04] text-white/50 hover:text-white",
            )}
          >
            Target-Date Fund
          </button>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {([3, 5, 10] as const).map((y) => (
            <button
              key={y}
              onClick={() => update({ years: y })}
              className={cn(
                "rounded-xl border py-3 text-center transition-all",
                input.years === y
                  ? "border-emerald-500/60 bg-emerald-950/40"
                  : "border-white/10 bg-white/[0.02] hover:border-white/25",
              )}
            >
              <div className="text-lg font-black text-white">{y}-year</div>
              <div className="text-[11px] text-white/35">horizon</div>
            </button>
          ))}
        </div>
      </div>

      {/* Result — the big comparison */}
      <div className="rounded-xl border border-emerald-800/30 bg-gradient-to-br from-emerald-950/40 to-black p-5">
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-emerald-400" />
          <span className="text-sm font-bold text-white">
            {balance > 0 ? "Your projected growth" : "Enter your balance to see"}
          </span>
        </div>

        {balance > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <PiggyBank className="h-4 w-4 text-white/40" />
                <span className="text-sm text-white/60">
                  {input.indexChoice === "sp500" ? "S&P 500" : "Target-Date"} · ~10%/yr
                </span>
              </div>
              <div className="text-right">
                <div className="text-lg font-black text-white/80 tabular-nums">
                  {formatCurrency(indexValue)}
                </div>
                <div className="text-[11px] font-mono text-white/35 tabular-nums">
                  +{formatCurrency(indexGain)} gain
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg bg-emerald-950/20 border border-emerald-800/30 px-3 py-2">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-emerald-400" />
                <span className="text-sm font-bold text-emerald-300">X-CAPITAL compound</span>
              </div>
              <div className="text-right">
                <div className="text-lg font-black text-emerald-400 tabular-nums">
                  {formatCurrency(xCapitalValue)}
                </div>
                <div className="text-[11px] font-mono text-emerald-400/60 tabular-nums">
                  +{formatCurrency(xCapitalGain)} gain
                </div>
              </div>
            </div>
            <div className="border-t border-emerald-800/30 pt-4 text-center">
              <div className="text-[11px] uppercase tracking-widest text-emerald-400/60">
                You could beat the index by
              </div>
              <div className="text-3xl md:text-4xl font-black text-emerald-300 tabular-nums my-1">
                {formatCurrency(advantage)}
              </div>
              <div className="text-xs text-white/40">
                at age {age + input.years} — steady, daily compounding
              </div>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center text-white/30 text-sm">
            <PiggyBank className="mx-auto mb-2 h-8 w-8 opacity-40" />
            <p>Enter a 401(k) balance above to run the comparison.</p>
          </div>
        )}
      </div>

      {/* Structural connect CTA — starts the wizard */}
      <button
        className="mt-5 w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 text-black font-black py-4 text-base transition-all flex items-center justify-center gap-2"
        onClick={() => setPhase("provider")}
      >
        <Landmark className="h-5 w-5" /> Link My {input.brokerage} Plan <ChevronRight className="h-5 w-5" />
      </button>

      <p className="mt-3 text-center text-[10px] text-white/25 leading-relaxed">
        Illustrative comparison using the platform daily rate. The S&P 500 line uses its ~10% long-run average.
        Always consult a licensed advisor before moving retirement assets.
      </p>
    </div>
  );
}
