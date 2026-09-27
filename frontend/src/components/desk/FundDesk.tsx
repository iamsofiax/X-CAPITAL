"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { FUND_RAILS, ONRAMPS, qrImageUrl, type FundAsset } from "@/lib/fundRails";
import { walletAPI } from "@/lib/api";
import { pushNotice } from "@/lib/yieldDesk";
import { useStore } from "@/store/useStore";
import { cn } from "@/lib/utils";

const STEPS = [
  { n: "01", t: "Choose the asset", d: "Pick the coin you will send. Each one has its own network." },
  { n: "02", t: "Buy it if you need to", d: "Open a provider, purchase there, then come back. This desk never asks for that login." },
  { n: "03", t: "Send to the vault", d: "Scan the QR or copy the address. Send only on the network printed under it." },
  { n: "04", t: "Paste the hash", d: "The credit posts after the transfer confirms." },
];

export function FundDesk() {
  const userId = useStore((s) => s.user?.id);
  const [asset, setAsset] = useState<FundAsset>("BTC");
  const [copied, setCopied] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const rail = FUND_RAILS.find((r) => r.asset === asset) ?? FUND_RAILS[0];

  const copy = async () => {
    await navigator.clipboard.writeText(rail.address);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const claim = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setNote("");
    try {
      await walletAPI.claimDeposit(asset, txHash.trim());
      setTxHash("");
      setNote("Hash received. The credit posts when the transfer confirms.");
      if (userId) pushNotice(userId, "Deposit submitted", `${asset} hash received. Credit posts after confirmation.`);
    } catch (err) {
      setError(readErr(err, "That hash could not be matched to this vault yet."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-3xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
      <div className="px-5 md:px-8 pt-7 pb-2">
        <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-emerald-300/80">Fund the book</p>
        <h2 className="mt-2 text-2xl md:text-3xl font-black tracking-tight">Add capital in four quiet steps</h2>
        <p className="mt-2 max-w-2xl text-sm text-white/50 leading-relaxed">
          Buy the coin at any desk you already use, send it to the vault below, and paste the hash. The address on the QR is the one that receives the transfer.
        </p>
      </div>

      <ol className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3 px-5 md:px-8 py-5">
        {STEPS.map((s) => (
          <li key={s.n} className="rounded-2xl border border-white/[0.06] bg-black/30 px-4 py-3">
            <p className="font-mono text-[10px] text-emerald-300/80">{s.n}</p>
            <p className="mt-1 text-sm font-semibold text-white">{s.t}</p>
            <p className="mt-1 text-[12px] text-white/45 leading-snug">{s.d}</p>
          </li>
        ))}
      </ol>

      <div className="grid lg:grid-cols-[1fr_340px] gap-6 px-5 md:px-8 pb-8">
        <div className="space-y-6 min-w-0">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-white/35 mb-3">1 · Asset</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {FUND_RAILS.map((r) => (
                <button
                  key={r.asset}
                  type="button"
                  onClick={() => { setAsset(r.asset); setCopied(false); setError(""); }}
                  className={cn(
                    "rounded-2xl border px-3 py-3 text-left transition-colors",
                    r.asset === asset
                      ? "border-emerald-400/40 bg-emerald-400/[0.07]"
                      : "border-white/[0.06] hover:bg-white/[0.03]",
                  )}
                >
                  <p className="text-sm font-bold text-white">{r.asset}</p>
                  <p className="text-[11px] text-white/40 mt-0.5">{r.network}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-white/35 mb-1">2 · Buy {rail.name} if you do not hold it</p>
            <p className="text-[12px] text-white/40 mb-3">Opens the provider in a new tab. When the coin is yours, send it to the vault on the right.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2">
              {ONRAMPS.map((p) => (
                <a
                  key={p.id}
                  href={p.href(asset)}
                  target="_blank"
                  rel="noreferrer"
                  className="group rounded-2xl border border-white/[0.06] bg-black/20 px-3 py-3 hover:border-white/15 hover:bg-white/[0.03]"
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-semibold text-white">{p.name}</span>
                    <ExternalLink className="w-3 h-3 text-white/25 group-hover:text-white/60" />
                  </span>
                  <span className="block text-[11px] text-white/35 mt-0.5">{p.note}</span>
                </a>
              ))}
            </div>
          </div>

          <form onSubmit={(e) => void claim(e)} className="rounded-2xl border border-white/[0.06] p-4">
            <p className="text-[10px] font-mono uppercase tracking-widest text-white/35 mb-2">4 · Transaction hash</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                className="sim-input flex-1"
                placeholder="Paste the hash from your wallet"
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                required
                minLength={20}
              />
              <button type="submit" disabled={busy} className="sim-btn sim-btn-primary shrink-0">
                {busy ? "Checking" : "Verify and credit"}
              </button>
            </div>
            {note && <p className="text-sm text-emerald-300/90 mt-3">{note}</p>}
            {error && <p className="text-sm text-red-300 mt-3">{error}</p>}
          </form>
        </div>

        <aside className="lg:sticky lg:top-20 h-fit rounded-3xl border border-emerald-400/20 bg-[#07110d] p-5 text-center">
          <p className="text-[10px] font-mono uppercase tracking-widest text-emerald-300/70">3 · Send {rail.asset}</p>
          <p className="text-lg font-black mt-1">{rail.network}</p>
          <div className="mt-4 mx-auto w-[220px] rounded-2xl bg-[#f4fff8] p-3">
            <img
              src={qrImageUrl(rail.qr, 440)}
              alt={`QR code for the ${rail.asset} vault`}
              width={440}
              height={440}
              className="w-full h-auto"
            />
          </div>
          <p className="mt-4 font-mono text-[12px] leading-relaxed break-all text-white/80">{rail.address}</p>
          <button type="button" onClick={() => void copy()} className="sim-btn sim-btn-primary mt-4 w-full">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Address copied" : "Copy address"}
          </button>
          <p className="mt-3 text-[12px] text-amber-200/80 leading-snug">{rail.warning}</p>
        </aside>
      </div>
    </section>
  );
}

function readErr(err: unknown, fallback: string) {
  if (err && typeof err === "object" && "response" in err) {
    const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
    if (msg) return msg;
  }
  return fallback;
}
