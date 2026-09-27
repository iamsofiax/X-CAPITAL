"use client";

import { createPortal } from "react-dom";
import type { TradeReceipt as Slip } from "@/lib/yieldDesk";
import { fmtUsdc } from "@/lib/sim/format";

export function TradeReceipt({ slip, onClose }: { slip: Slip; onClose?: () => void }) {
  const sell = slip.side === "SELL";
  const card = (
    <article className="bg-[#f3efe6] text-[#1a1612] rounded-sm px-6 py-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
      <header className="flex items-start justify-between gap-4 border-b border-[#1a1612]/15 pb-3">
        <div>
          <p className="text-[10px] tracking-[0.28em] uppercase text-[#1a1612]/50">X-Capital</p>
          <h3 className="mt-1 text-lg font-black tracking-tight">{sell ? "Settlement receipt" : "Fill receipt"}</h3>
        </div>
        <p className="text-right font-mono text-[11px] text-[#1a1612]/60">
          {slip.id}
          <span className="block">{new Date(slip.at).toLocaleString()}</span>
        </p>
      </header>
      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-[13px]">
        <div><dt className="text-[10px] uppercase tracking-widest text-[#1a1612]/45">Side</dt><dd className="font-bold">{slip.side}</dd></div>
        <div><dt className="text-[10px] uppercase tracking-widest text-[#1a1612]/45">Instrument</dt><dd className="font-bold">{slip.symbol}</dd></div>
        <div className="col-span-2"><dt className="text-[10px] uppercase tracking-widest text-[#1a1612]/45">Name</dt><dd>{slip.name}</dd></div>
        <div><dt className="text-[10px] uppercase tracking-widest text-[#1a1612]/45">Quantity</dt><dd className="font-mono">{slip.qty.toLocaleString(undefined, { maximumFractionDigits: 6 })}</dd></div>
        <div><dt className="text-[10px] uppercase tracking-widest text-[#1a1612]/45">Price</dt><dd className="font-mono">{fmtUsdc(slip.price, { decimals: 2 })}</dd></div>
        <div><dt className="text-[10px] uppercase tracking-widest text-[#1a1612]/45">{sell ? "Proceeds" : "Consideration"}</dt><dd className="font-mono font-bold">{fmtUsdc(slip.notional, { decimals: 2 })}</dd></div>
        <div><dt className="text-[10px] uppercase tracking-widest text-[#1a1612]/45">Spread</dt><dd className="font-mono">{fmtUsdc(slip.spread, { decimals: 2 })}</dd></div>
      </dl>
      <p className="mt-4 border-t border-dashed border-[#1a1612]/20 pt-3 text-[12px] leading-relaxed text-[#1a1612]/70">
        {sell
          ? "Position closed on the node. Proceeds are booked to cash. This slip is the record of the exit."
          : "Opening fill on the node. The position is booked at the ask. This slip is the record of the entry."}
      </p>
      {onClose && (
        <button type="button" onClick={onClose} className="mt-4 text-[12px] font-bold uppercase tracking-widest text-[#1a1612]/70">
          Close slip
        </button>
      )}
    </article>
  );

  if (!onClose || typeof document === "undefined") return card;
  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-4 bg-black/75">
      <div className="w-full max-w-md">{card}</div>
    </div>,
    document.body,
  );
}
