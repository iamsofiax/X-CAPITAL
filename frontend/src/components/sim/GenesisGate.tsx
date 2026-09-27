"use client";

import { useState } from "react";
import { Sparkles, ShieldCheck, Layers, Trophy } from "lucide-react";
import { useSim } from "@/hooks/useSim";
import { useStore } from "@/store/useStore";
import { pushNotice } from "@/lib/yieldDesk";
import { GENESIS_ALLOCATION } from "@/lib/sim/engine";
import { fmtUsdc } from "@/lib/sim/format";
import { Notice } from "./Panel";

export function GenesisClaim({ compact }: { compact?: boolean }) {
  const { actions } = useSim();
  const userId = useStore((s) => s.user?.id);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const claim = () => {
    setBusy(true);
    const res = actions.claimGenesis();
    setBusy(false);
    if (!res.ok) setError(res.error);
    else if (userId) {
      pushNotice(userId, "Book opened", "The book is at 0 USD. Cash posts only after an operator confirms a crypto deposit.");
    }
  };

  return (
    <div className={compact ? "" : "sim-glass sim-glass-edge sim-scan p-6 md:p-10 max-w-3xl mx-auto"}>
      <p className="sim-label text-emerald-300/80">Fund node · book opens at zero</p>
      <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight mt-2">
        The book opens at {fmtUsdc(GENESIS_ALLOCATION, { decimals: 0 })} USD
      </h2>
      <p className="text-white/55 text-[14px] mt-3 max-w-xl leading-relaxed">
        Nothing is credited until an operator confirms a crypto deposit. The seven rails stay available. Cash stays at zero until that confirmation.
      </p>
      <ul className="grid sm:grid-cols-3 gap-3 mt-6">
        {[
          { icon: Layers, t: "Seven rails", d: "Treasury, Execution, Book, Vaults, RWA, Oracle and Conviction." },
          { icon: ShieldCheck, t: "Proof of reserves", d: "Balances always equal the sum of your signed ledger entries." },
          { icon: Trophy, t: "Mandate", d: "Performance is measured on the node book. The ledger is the record." },
        ].map(({ icon: Icon, t, d }) => (
          <li key={t} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
            <Icon className="w-4 h-4 text-emerald-300" />
            <p className="text-[13px] font-bold text-white mt-2">{t}</p>
            <p className="text-[12px] text-white/45 mt-0.5 leading-snug">{d}</p>
          </li>
        ))}
      </ul>
      {error && <Notice tone="error" className="mt-5">{error}</Notice>}
      <button type="button" onClick={claim} disabled={busy} className="sim-btn sim-btn-primary mt-6 w-full sm:w-auto px-8">
        <Sparkles className="w-4 h-4" />
        Open node
      </button>
    </div>
  );
}

/** Renders children only once the user's simulated book exists. */
export function GenesisGate({ children }: { children: React.ReactNode }) {
  const { ready, claimed } = useSim();
  if (!ready) {
    return (
      <div className="sim-glass p-6 text-sm text-white/55">
        Opening the book
      </div>
    );
  }
  if (!claimed) return <GenesisClaim />;
  return <>{children}</>;
}
