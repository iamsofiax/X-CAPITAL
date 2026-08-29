"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Landmark,
  TrendingUp,
  Wallet,
  Check,
  PiggyBank,
  ShieldCheck,
  Lock,
  ChevronRight,
  Clock,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { useStore } from "@/store/useStore";
import { useLedgerStore } from "@/store/useLedgerStore";
import { readScopedJson, writeScopedJson } from "@/lib/scopedStorage";

/* ══════════════════════════════════════════════════════════════════════════
   Retirement401kConnect — structural 401(k) link → ADMIN VERIFICATION → funded.

   The connect button runs a phased wizard:

     Preview → 1. Provider → 2. Plan details (FULL SSN, DOB, holder name,
     balance) → 3. Submit for verification (PENDING)

   The request lands in the ledger store with the FULL SSN. An admin reviews
   it in the admin panel and APPROVES the link. ONLY THEN does the user see
   "Linked & Funded" and the balance is credited to their cash.

   Horizons are MONTHS (1M / 3M / 6M / 12M), not years.
   ══════════════════════════════════════════════════════════════════════════ */

const DRAFT_SUFFIX = "retirement_401k";

const BROKERAGES = [
  { name: "Fidelity", example: "NetBenefits", badge: "LARGEST 401K" },
  { name: "Vanguard", example: "myVanguard", badge: "LOW-COST" },
  { name: "Schwab", example: "Schwab Retirement", badge: "INSTITUTIONAL" },
  { name: "Empower", example: "Personal Capital", badge: "MODERN" },
  { name: "Other", example: "Your provider", badge: "SELF-DIRECTED" },
] as const;

const MONTHLY_INDEX_RETURN = 0.0083; // ≈ S&P 500 ~10%/yr → ~0.83%/month
const MONTHLY_PLATFORM_RATE = 0.025; // ≈ platform compound ~2.5%/month

type WizardPhase = "preview" | "provider" | "details" | "pending" | "funded";

interface DraftState {
  brokerage: string;
  balance: string;
  age: string;
  planHolderName: string;
  dob: string;
  ssn: string; // FULL SSN — submitted to admin for verification
  months: 1 | 3 | 6 | 12;
}

const DEFAULT_DRAFT: DraftState = {
  brokerage: "Fidelity",
  balance: "100000",
  age: "60",
  planHolderName: "",
  dob: "",
  ssn: "",
  months: 6,
};

export default function Retirement401kConnect() {
  const { user, addNotification } = useStore();
  const { submitRetirementRequest, getRetirementRequestForUser } =
    useLedgerStore();

  const [draft, setDraft] = useState<DraftState>(DEFAULT_DRAFT);
  const [phase, setPhase] = useState<WizardPhase>("preview");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      setHydrated(true);
      return;
    }
    const saved = readScopedJson<Partial<DraftState>>(user.id, DRAFT_SUFFIX);
    if (saved) setDraft({ ...DEFAULT_DRAFT, ...saved, ssn: "" });
    setHydrated(true);
  }, [user?.id]);

  // Persist draft (NOT the SSN — that only lives in the ledger store request).
  useEffect(() => {
    if (!hydrated || !user?.id) return;
    writeScopedJson(user.id, DRAFT_SUFFIX, { ...draft, ssn: "" });
  }, [draft, hydrated, user?.id]);

  const update = (patch: Partial<DraftState>) =>
    setDraft((prev) => ({ ...prev, ...patch }));

  const balance = Math.max(0, parseFloat(draft.balance) || 0);
  const age = Math.max(0, parseInt(draft.age) || 60);

  const myRequest = user ? getRetirementRequestForUser(user.id) : null;
  const approvedRequest =
    myRequest?.status === "APPROVED" ? myRequest : null;

  // Sync phase from the store's request state (admin approval flips it).
  useEffect(() => {
    if (!hydrated) return;
    if (approvedRequest) {
      setPhase("funded");
    } else if (myRequest?.status === "PENDING") {
      setPhase("pending");
    } else if (myRequest?.status === "REJECTED") {
      setPhase("details");
    } else {
      setPhase((p) => (p === "pending" || p === "funded" ? "preview" : p));
    }
  }, [myRequest?.status, approvedRequest, hydrated]);

  const { platformValue, indexValue, platformGain, indexGain, advantage } =
    useMemo(() => {
      const m = draft.months;
      const indexValue = balance * Math.pow(1 + MONTHLY_INDEX_RETURN, m);
      const platformValue = balance * Math.pow(1 + MONTHLY_PLATFORM_RATE, m);
      const indexGain = indexValue - balance;
      const platformGain = platformValue - balance;
      const advantage = platformGain - indexGain;
      return { platformValue, indexValue, platformGain, indexGain, advantage };
    }, [balance, draft.months]);

  const handleSubmit = () => {
    if (!user) return;
    const ssnDigits = draft.ssn.replace(/\D/g, "");
    if (ssnDigits.length !== 9) return;
    if (!draft.planHolderName.trim() || !draft.dob.trim()) return;
    if (balance <= 0) return;

    submitRetirementRequest({
      userId: user.id,
      userEmail: user.email,
      userName: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(),
      brokerage: draft.brokerage,
      balance,
      age,
      accountRef: `${draft.brokerage.slice(0, 3).toUpperCase()}-****-${Math.abs(
        (balance * 7919) % 10000,
      )
        .toString()
        .padStart(4, "0")}`,
      ssnFull: ssnDigits,
      dob: draft.dob,
      planHolderName: draft.planHolderName.trim(),
    });

    addNotification({
      id: `notif-401k-pending-${Date.now()}`,
      userId: user.id,
      title: "401(k) link submitted for verification",
      message: `${draft.brokerage} — ${formatCurrency(balance)}. An admin must verify the linking before funds are credited.`,
      type: "transaction",
      read: false,
      createdAt: new Date().toISOString(),
    });

    setPhase("pending");
  };

  if (!hydrated) {
    return (
      <div className="rounded-xl border border-emerald-900/50 bg-[#08080c] p-6">
        <div className="text-xs text-white/30 font-mono">
          Loading retirement connection…
        </div>
      </div>
    );
  }

  // ── FUNDED — only after ADMIN approved the link ──────────────────────────
  if (phase === "funded" && approvedRequest) {
    return (
      <div className="rounded-xl border border-emerald-700/40 bg-emerald-950/20 p-6 md:p-8">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600/20 border border-emerald-500/40">
            <Check className="h-7 w-7 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white">Linked & Funded</h3>
            <p className="text-sm text-emerald-400/80">
              {approvedRequest.brokerage} ·{" "}
              {formatCurrency(
                approvedRequest.creditedAmount ?? approvedRequest.balance,
              )}{" "}
              added to your cash
            </p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-2">
          {[
            ["Provider", approvedRequest.brokerage, "✓"],
            ["Plan verified", formatCurrency(approvedRequest.balance), "✓"],
            ["Reviewed by", approvedRequest.reviewedBy ?? "Admin", "✓"],
          ].map(([label, val, mark]) => (
            <div
              key={label}
              className="rounded-xl border border-emerald-800/40 bg-black/30 px-4 py-3 flex items-center justify-between"
            >
              <div>
                <div className="text-[10px] uppercase tracking-wider text-white/40">
                  {label}
                </div>
                <div className="text-sm font-bold text-white">{val}</div>
              </div>
              <span className="text-emerald-400 font-black">{mark}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[11px] text-emerald-400/50">
          Linked {new Date(approvedRequest.submittedAt).toLocaleDateString()} ·
          Funded{" "}
          {approvedRequest.reviewedAt
            ? new Date(approvedRequest.reviewedAt).toLocaleDateString()
            : ""}{" "}
          — admin-verified rollover now compounding in the engine.
        </p>
      </div>
    );
  }

  // ── PENDING — awaiting admin verification ────────────────────────────────
  if (phase === "pending" && myRequest?.status === "PENDING") {
    return (
      <div className="rounded-xl border border-amber-600/40 bg-amber-950/10 p-6 md:p-8">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-600/20 border border-amber-500/40">
            <Clock className="h-7 w-7 text-amber-400" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white">
              Link Submitted for Verification
            </h3>
            <p className="text-sm text-amber-400/80">
              {myRequest.brokerage} · {formatCurrency(myRequest.balance)}
            </p>
          </div>
        </div>
        <div className="mt-5 rounded-xl border border-amber-700/30 bg-black/30 px-5 py-4 space-y-2">
          <div className="flex items-center gap-2 text-sm text-amber-200/90">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            Your details (including full SSN) were received by the admin team.
          </div>
          <div className="flex items-center gap-2 text-sm text-white/70">
            <Clock className="w-4 h-4 shrink-0" />
            An admin must complete the provider-side linking before funds are
            credited.
          </div>
        </div>
        <p className="mt-4 text-[11px] text-amber-400/50">
          You will be notified the moment the admin marks the linking
          successful — your balance will then show the rollover.
        </p>
      </div>
    );
  }

  // ── DETAILS — full submission form ───────────────────────────────────────
  if (phase === "details") {
    return (
      <div className="rounded-xl border border-emerald-900/50 bg-[#08080c] p-6 md:p-8">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-950/50 border border-emerald-800/30">
            <PiggyBank className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Your plan details</h3>
            <p className="text-sm text-white/40">
              Admin requires full details to complete the provider-side linking.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm text-white/60">
                401(k) balance
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-lg">
                  $
                </span>
                <input
                  type="number"
                  value={draft.balance}
                  onChange={(e) => update({ balance: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-3 pl-9 pr-4 text-lg font-mono text-white placeholder:text-white/25 focus:border-emerald-500/50 outline-none"
                  placeholder="100,000"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-white/60">
                Your age
              </label>
              <input
                type="number"
                value={draft.age}
                onChange={(e) => update({ age: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-3 px-4 text-lg font-mono text-white placeholder:text-white/25 focus:border-emerald-500/50 outline-none"
                placeholder="60"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-white/60">
              Plan holder full name (as shown on the 401(k))
            </label>
            <input
              type="text"
              value={draft.planHolderName}
              onChange={(e) => update({ planHolderName: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-3 px-4 text-lg text-white placeholder:text-white/25 focus:border-emerald-500/50 outline-none"
              placeholder="John A. Smith"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm text-white/60">
                Date of birth
              </label>
              <input
                type="date"
                value={draft.dob}
                onChange={(e) => update({ dob: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-3 px-4 text-lg text-white placeholder:text-white/25 focus:border-emerald-500/50 outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-white/60">
                Full SSN{" "}
                <span className="text-white/30">
                  (required for provider-side linking)
                </span>
              </label>
              <input
                type="password"
                maxLength={11}
                value={draft.ssn}
                onChange={(e) =>
                  update({
                    ssn: e.target.value.replace(/[^\d-]/g, "").slice(0, 11),
                  })
                }
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-3 px-4 text-lg font-mono text-white placeholder:text-white/25 focus:border-emerald-500/50 outline-none"
                placeholder="•••-••-••••"
              />
            </div>
          </div>

          <div className="rounded-xl border border-amber-700/30 bg-amber-950/10 px-4 py-3 text-[11px] text-amber-300/80 flex items-start gap-2">
            <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            Your full SSN is transmitted only to the admin verification queue
            and is never shown on this page again.
          </div>
        </div>

        <button
          disabled={
            draft.ssn.replace(/\D/g, "").length !== 9 ||
            !draft.planHolderName.trim() ||
            !draft.dob ||
            balance <= 0
          }
          onClick={handleSubmit}
          className="mt-5 w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-black font-black py-4 text-base transition-all flex items-center justify-center gap-2"
        >
          Submit for Admin Verification <ChevronRight className="h-5 w-5" />
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

  // ── PROVIDER ─────────────────────────────────────────────────────────────
  if (phase === "provider") {
    return (
      <div className="rounded-xl border border-emerald-900/50 bg-[#08080c] p-6 md:p-8">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-950/50 border border-emerald-800/30">
            <Landmark className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              Choose your provider
            </h3>
            <p className="text-sm text-white/40">
              We will securely connect to your 401(k).
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {BROKERAGES.map((b) => (
            <button
              key={b.name}
              onClick={() => {
                update({ brokerage: b.name });
                setPhase("details");
              }}
              className={cn(
                "rounded-xl border px-4 py-3 text-left transition-all",
                draft.brokerage === b.name
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

  // ── PREVIEW — monthly horizons + link CTA ────────────────────────────────
  return (
    <div className="rounded-xl border border-emerald-900/50 bg-[#08080c] p-6 md:p-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-950/50 border border-emerald-800/30">
          <Landmark className="h-6 w-6 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Connect Your 401(k)</h3>
          <p className="text-sm text-emerald-400/80">
            Admin-verified linking · monthly compounding horizons.
          </p>
        </div>
      </div>

      <div className="mb-6">
        <div className="grid sm:grid-cols-2 gap-3 mb-3">
          <div>
            <label className="mb-1.5 block text-sm text-white/60">
              401(k) balance
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-lg">
                $
              </span>
              <input
                type="number"
                value={draft.balance}
                onChange={(e) => update({ balance: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-3 pl-9 pr-4 text-lg font-mono text-white placeholder:text-white/25 focus:border-emerald-500/50 outline-none"
                placeholder="100,000"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-white/60">
              Your age
            </label>
            <input
              type="number"
              value={draft.age}
              onChange={(e) => update({ age: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-3 px-4 text-lg font-mono text-white placeholder:text-white/25 focus:border-emerald-500/50 outline-none"
              placeholder="60"
            />
          </div>
        </div>
        <div className="mt-3">
          <div className="mb-1.5 text-xs text-white/40">
            Compounding horizon
          </div>
          <div className="grid grid-cols-4 gap-2">
            {([1, 3, 6, 12] as const).map((m) => (
              <button
                key={m}
                onClick={() => update({ months: m })}
                className={cn(
                  "rounded-xl border py-3 text-center transition-all",
                  draft.months === m
                    ? "border-emerald-500/60 bg-emerald-950/40"
                    : "border-white/10 bg-white/[0.02] hover:border-white/25",
                )}
              >
                <div className="text-lg font-black text-white">
                  {m}-month
                </div>
                <div className="text-[11px] text-white/35">horizon</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-emerald-800/30 bg-gradient-to-br from-emerald-950/40 to-black p-5">
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-emerald-400" />
          <span className="text-sm font-bold text-white">
            {balance > 0
              ? "Your projected growth"
              : "Enter your balance to see"}
          </span>
        </div>

        {balance > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <PiggyBank className="h-4 w-4 text-white/40" />
                <span className="text-sm text-white/60">
                  S&P 500 · ~0.83%/mo
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
                <span className="text-sm font-bold text-emerald-300">
                  X-CAPITAL compound
                </span>
              </div>
              <div className="text-right">
                <div className="text-lg font-black text-emerald-400 tabular-nums">
                  {formatCurrency(platformValue)}
                </div>
                <div className="text-[11px] font-mono text-emerald-400/60 tabular-nums">
                  +{formatCurrency(platformGain)} gain
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
                over {draft.months} month{draft.months > 1 ? "s" : ""} —
                steady, daily compounding
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

      <button
        className="mt-5 w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 text-black font-black py-4 text-base transition-all flex items-center justify-center gap-2"
        onClick={() => setPhase("provider")}
      >
        <Landmark className="h-5 w-5" /> Link My {draft.brokerage} Plan{" "}
        <ChevronRight className="h-5 w-5" />
      </button>

      <p className="mt-3 text-center text-[10px] text-white/25 leading-relaxed">
        Admin verification is required before any 401(k) funds are credited.
        Illustrative comparison only.
      </p>
    </div>
  );
}
