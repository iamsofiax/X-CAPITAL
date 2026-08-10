"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useStore } from "@/store/useStore";
import {
  DEFAULT_DEPOSIT_ADDRESSES,
  resolveDepositAddress,
} from "@/lib/depositAddresses";
import type { DepositAddress } from "@/types";
import {
  Save,
  RotateCcw,
  QrCode,
  Wallet,
  Check,
  AlertTriangle,
  X,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════════════
   X-CAPITAL — Deposit Address Manager (Admin)

   Lets the admin update the crypto receive addresses shown on /wallet at any
   time — no code change, no redeploy. This is a PLATFORM-WIDE setting: every
   user deposits into the same company wallet per coin, so the values here are
   intentionally shared, never per-user.

   The QR code is generated live from the address (same qrserver.com endpoint
   the wallet page uses), so when you paste a new address the preview shows the
   exact QR your users will see — instantly, before you even save.

   Defaults live in lib/depositAddresses.ts and are restored via "Reset".
   ═══════════════════════════════════════════════════════════════════════════ */

const QR_ENDPOINT =
  "https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=";

export default function DepositAddressManager() {
  const { depositAddresses, setDepositAddress } = useStore();
  const [drafts, setDrafts] = useState<Record<string, DepositAddress>>(() => {
    const initial: Record<string, DepositAddress> = {};
    DEFAULT_DEPOSIT_ADDRESSES.forEach((d) => {
      initial[d.symbol] = { ...d };
    });
    return initial;
  });
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  const handleSave = (symbol: string) => {
    const draft = drafts[symbol];
    if (!draft?.address?.trim()) {
      showToast(`${symbol} address cannot be empty`, "error");
      return;
    }
    setDepositAddress(symbol, draft.address, draft.tag);
    setSaved((s) => ({ ...s, [symbol]: true }));
    setTimeout(() => setSaved((s) => ({ ...s, [symbol]: false })), 2000);
    showToast(`${symbol} deposit address updated — live on /wallet`);
  };

  const handleReset = (symbol: string) => {
    const fallback = DEFAULT_DEPOSIT_ADDRESSES.find((d) => d.symbol === symbol);
    if (!fallback) return;
    setDrafts((d) => ({ ...d, [symbol]: { ...fallback } }));
    setDepositAddress(symbol, fallback.address, fallback.tag);
    setSaved((s) => ({ ...s, [symbol]: true }));
    setTimeout(() => setSaved((s) => ({ ...s, [symbol]: false })), 2000);
    showToast(`${symbol} reset to default — live on /wallet`);
  };

  const currentQrUrl = (symbol: string) => {
    const draft = drafts[symbol];
    return `${QR_ENDPOINT}${encodeURIComponent(draft?.address ?? "")}`;
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div
          className={cn(
            "fixed top-6 right-6 z-[9999] px-5 py-3 rounded-lg shadow-2xl flex items-center gap-3",
            toast.type === "success" ? "bg-emerald-600" : "bg-red-600",
          )}
        >
          <span className="text-sm font-medium text-white">
            {toast.message}
          </span>
          <button
            onClick={() => setToast(null)}
            className="hover:opacity-70 text-white"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Header note */}
      <div className="bg-[#12121a] border border-white/5 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-1">
          <Wallet size={15} className="text-emerald-400" />
          <h3 className="text-sm font-semibold text-white">
            Crypto Deposit Addresses
          </h3>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed">
          These are the receive wallets shown to every user on /wallet →
          Deposit → Crypto. Because these are platform-wide company wallets
          (one per coin), changes here apply instantly to all users — no code
          change or redeploy needed. The QR code regenerates automatically
          from the address.
        </p>
      </div>

      {/* Per-coin rows */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {DEFAULT_DEPOSIT_ADDRESSES.map((coin) => {
          const live = resolveDepositAddress(coin.symbol, depositAddresses);
          const draft = drafts[coin.symbol];
          const isCustomized = live.address !== coin.address;
          const isDirty =
            (draft?.address ?? "") !== (live.address ?? "") ||
            (draft?.tag ?? "") !== (live.tag ?? "");

          return (
            <div
              key={coin.symbol}
              className="bg-[#12121a] border border-white/5 rounded-xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between bg-black/30 px-4 py-3 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 font-black text-sm",
                      isCustomized
                        ? "bg-emerald-600/20 text-emerald-400"
                        : "bg-white/[0.06] text-white/60",
                    )}
                  >
                    {coin.symbol}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {coin.symbol}
                      {isCustomized && (
                        <span className="ml-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-600/20 text-emerald-400 border border-emerald-700/40">
                          CUSTOM
                        </span>
                      )}
                    </p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                      {live.address === coin.address
                        ? "Using default"
                        : "Using admin override"}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] text-gray-600 font-mono">
                  {live.address === coin.address ? "DEFAULT" : "OVERRIDE"}
                </span>
              </div>

              <div className="p-4">
                {/* Address input */}
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1">
                    Deposit Address
                  </label>
                  <textarea
                    value={draft?.address ?? ""}
                    onChange={(e) =>
                      setDrafts((d) => ({
                        ...d,
                        [coin.symbol]: {
                          ...d[coin.symbol],
                          address: e.target.value,
                        },
                      }))
                    }
                    rows={2}
                    spellCheck={false}
                    placeholder={`${coin.symbol} receive address…`}
                    className="w-full px-3 py-2 bg-[#0c0c12] border border-white/10 rounded-lg text-xs font-mono text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 resize-none"
                  />
                </div>

                {/* Tag / memo (XRP and other tagged coins) */}
                <div className="mt-2">
                  <label className="block text-[10px] text-gray-500 mb-1">
                    Memo / Tag <span className="text-gray-600">(optional)</span>
                  </label>
                  <input
                    value={draft?.tag ?? ""}
                    onChange={(e) =>
                      setDrafts((d) => ({
                        ...d,
                        [coin.symbol]: {
                          ...d[coin.symbol],
                          tag: e.target.value,
                        },
                      }))
                    }
                    placeholder={
                      coin.symbol === "XRP"
                        ? "Required for XRP deposits"
                        : "e.g. destination tag"
                    }
                    className="w-full px-3 py-2 bg-[#0c0c12] border border-white/10 rounded-lg text-xs font-mono text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                  />
                </div>

                {/* Live QR preview + address preview */}
                <div className="mt-3 flex gap-3">
                  <div className="shrink-0 bg-white p-1.5 rounded-lg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={currentQrUrl(coin.symbol)}
                      alt={`${coin.symbol} QR preview`}
                      width={140}
                      height={140}
                      className="rounded block"
                    />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                      <QrCode size={11} className="text-emerald-400" />
                      Live QR preview — updates as you type
                    </div>
                    <div className="bg-black/40 border border-white/5 rounded-lg px-2 py-1.5">
                      <p className="text-[9px] text-gray-600 uppercase mb-0.5">
                        Address shown to users
                      </p>
                      <p className="text-[10px] font-mono text-white/70 break-all leading-relaxed line-clamp-3">
                        {(draft?.address ?? "").trim() ||
                          "Paste an address to see the QR"}
                      </p>
                      {draft?.tag && (
                        <p className="text-[10px] font-mono text-emerald-400/80 mt-1">
                          memo: {draft.tag}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleSave(coin.symbol)}
                    disabled={!draft?.address?.trim() || !isDirty}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition",
                      saved[coin.symbol]
                        ? "bg-emerald-600 text-white"
                        : !draft?.address?.trim() || !isDirty
                          ? "bg-white/[0.04] text-gray-600 cursor-not-allowed"
                          : "bg-emerald-600 hover:bg-emerald-500 text-white",
                    )}
                  >
                    {saved[coin.symbol] ? (
                      <>
                        <Check size={12} /> Saved — Live
                      </>
                    ) : (
                      <>
                        <Save size={12} /> Save & Make Live
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleReset(coin.symbol)}
                    disabled={!isCustomized}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition",
                      isCustomized
                        ? "bg-white/[0.06] hover:bg-white/[0.1] text-gray-300"
                        : "bg-white/[0.03] text-gray-700 cursor-not-allowed",
                    )}
                  >
                    <RotateCcw size={12} /> Reset
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Warning note */}
      <div className="flex items-start gap-2 text-[11px] text-amber-400/80 bg-amber-950/20 border border-amber-900/30 rounded-xl px-4 py-3">
        <AlertTriangle size={13} className="shrink-0 mt-0.5" />
        <span>
          Changing an address redirects <strong>all new</strong> deposits for
          that coin. Funds already sent to the previous address are unaffected.
          Always double-check the QR preview matches the address before saving.
        </span>
      </div>
    </div>
  );
}
