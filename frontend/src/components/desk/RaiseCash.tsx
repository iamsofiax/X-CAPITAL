"use client";

import { useState } from "react";
import { Banknote } from "lucide-react";
import { useSim } from "@/hooks/useSim";
import { useSimQuotes } from "@/hooks/useSimQuotes";
import { fmtUsdc } from "@/lib/sim/format";

export function RaiseCash() {
  const { account, actions, claimed } = useSim();
  const { quotes } = useSimQuotes();
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  if (!claimed || !account) return null;

  const held =
    Object.values(account.positions).some((p) => p.qty > 0) ||
    Object.keys(account.vaults).length > 0 ||
    (account.fleet?.units ?? 0) > 0 ||
    (account.commerce?.length ?? 0) > 0;

  const run = () => {
    setNote("");
    setError("");
    const mids: Record<string, number> = {};
    for (const q of Object.values(quotes)) mids[q.symbol] = q.bid > 0 ? q.bid : q.mid;
    const res = actions.raiseCash(mids);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    const locked = res.locked.length ? ` Still locked: ${res.locked.join(" ")}` : "";
    setNote(
      res.sold.length
        ? `${fmtUsdc(res.raised)} is now free cash (${res.sold.join(", ")}).${locked}`
        : `No cash was raised.${locked}`,
    );
  };

  return (
    <section className="sim-glass p-5 md:p-6">
      <p className="sim-label text-emerald-300">Cash for trades</p>
      <h2 className="mt-2 text-xl font-black tracking-tight">Turn holdings into cash</h2>
      <p className="mt-2 text-sm text-white/55 max-w-2xl leading-relaxed">
        Spot positions sell at the current bid. Vaults redeem when their window is open. Fleet and atelier return at cost. Locked sleeves stay where they are. The cash lands in Treasury for the next trade.
      </p>
      <button type="button" onClick={run} disabled={!held} className="sim-btn sim-btn-primary mt-4">
        <Banknote className="w-4 h-4" />
        {held ? "Convert to cash" : "No holdings to convert"}
      </button>
      {note && <p className="mt-3 text-sm text-emerald-300">{note}</p>}
      {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
    </section>
  );
}
