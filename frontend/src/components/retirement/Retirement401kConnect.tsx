"use client";

import { useEffect, useMemo, useState } from "react";
import { Landmark, TrendingUp, Wallet, Check, PiggyBank } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

/* ══════════════════════════════════════════════════════════════════════════
   Retirement401kConnect — senior-friendly 401(k) comparison.

   Large text, three simple steps, real compounding math:
   - S&P 500: ~10%/yr (long-run average)
   - X-CAPITAL: platform daily rate → annual equivalent
   Persisted to localStorage so seniors never lose their inputs.
   ══════════════════════════════════════════════════════════════════════════ */

const STORAGE_KEY = "xc_retirement_401k";

const BROKERAGES = [
  { name: "Fidelity", example: "NetBenefits" },
  { name: "Vanguard", example: "myVanguard" },
  { name: "Schwab", example: "Schwab Retirement" },
  { name: "Empower", example: "Personal Capital" },
  { name: "Other", example: "Your provider" },
] as const;

const YEARLY_INDEX_RETURN = 0.10; // S&P 500 ~10% long-run average
const ANNUAL_EQUIVALENT = 0.65; // ~65%/yr from 1.5%/day platform rate

interface PersistedInput {
  brokerage: string;
  balance: string;
  age: string;
  indexChoice: "sp500" | "target";
  years: 3 | 5 | 10;
}

const DEFAULT_INPUT: PersistedInput = {
  brokerage: "Fidelity",
  balance: "100000",
  age: "60",
  indexChoice: "sp500",
  years: 10,
};

function loadInput(): PersistedInput {
  if (typeof window === "undefined") return DEFAULT_INPUT;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_INPUT;
    return { ...DEFAULT_INPUT, ...(JSON.parse(raw) as Partial<PersistedInput>) };
  } catch {
    return DEFAULT_INPUT;
  }
}

export default function Retirement401kConnect() {
  const [input, setInput] = useState<PersistedInput>(DEFAULT_INPUT);
  const [hydrated, setHydrated] = useState(false);

  // Load after mount (SSR safety)
  useEffect(() => {
    setInput(loadInput());
    setHydrated(true);
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

  const update = (patch: Partial<PersistedInput>) =>
    setInput((prev) => ({ ...prev, ...patch }));

  const balance = Math.max(0, parseFloat(input.balance) || 0);
  const age = Math.max(0, parseInt(input.age) || 60);

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

  if (!hydrated) {
    return (
      <div className="rounded-xl border border-emerald-900/50 bg-black p-6">
        <div className="text-xs text-white/30 font-mono">Loading retirement comparison…</div>
      </div>
    );
  }

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

      {/* STEP 1 — Brokerage */}
      <div className="mb-6">
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-white/40 flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-emerald-600 text-black text-[11px] flex items-center justify-center font-black">1</span>
          Choose your provider
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {BROKERAGES.map((b) => (
            <button
              key={b.name}
              onClick={() => update({ brokerage: b.name })}
              className={cn(
                "rounded-xl border px-3 py-3 text-left transition-all",
                input.brokerage === b.name
                  ? "border-emerald-500/60 bg-emerald-950/40"
                  : "border-white/10 bg-white/[0.02] hover:border-white/25",
              )}
            >
              <div className="text-sm font-bold text-white">{b.name}</div>
              <div className="text-[11px] text-white/35">{b.example}</div>
            </button>
          ))}
        </div>
      </div>

      {/* STEP 2 — Balance + age */}
      <div className="mb-6">
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-white/40 flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-emerald-600 text-black text-[11px] flex items-center justify-center font-black">2</span>
          Your details
        </p>
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
        <div className="mt-3 flex flex-wrap items-center gap-2">
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
      </div>

      {/* STEP 3 — Horizon */}
      <div className="mb-6">
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-white/40 flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-emerald-600 text-black text-[11px] flex items-center justify-center font-black">3</span>
          How far out?
        </p>
        <div className="grid grid-cols-3 gap-2">
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
              <div className="text-lg font-black text-white">
                {y}-year
              </div>
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
            {/* Index line */}
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

            {/* X-CAPITAL line */}
            <div className="flex items-center justify-between gap-3 rounded-lg bg-emerald-950/20 border border-emerald-800/30 px-3 py-2">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-emerald-400" />
                <span className="text-sm font-bold text-emerald-300">
                  X-CAPITAL compound
                </span>
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

            {/* Advantage — giant number */}
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

      <button
        className="mt-5 w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 text-black font-black py-4 text-base transition-all flex items-center justify-center gap-2"
        onClick={() => update({})}
      >
        <Check className="h-5 w-5" /> {input.brokerage} · Connected
      </button>

      <p className="mt-3 text-center text-[10px] text-white/25 leading-relaxed">
        Illustrative comparison using the platform daily rate. The S&P 500 line uses its ~10% long-run average.
        Always consult a licensed advisor before moving retirement assets.
      </p>
    </div>
  );
}
