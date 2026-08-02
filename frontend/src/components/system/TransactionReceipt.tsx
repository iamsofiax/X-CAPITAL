"use client";

import { useEffect, useRef, useState } from "react";
import { Printer } from "lucide-react";
import { cn } from "@/lib/utils";

/* ══════════════════════════════════════════════════════════════════════════
   TransactionReceipt — institutional receipt for every state-changing action.
   - Print/PDF ready: a dedicated @media print stylesheet isolates the receipt
     so Ctrl+P / "Save as PDF" outputs a clean one-pager.
   - Shown at the END of every successful submission (deposit, withdrawal,
     fund invest) right under the success state.
   ══════════════════════════════════════════════════════════════════════════ */

export interface ReceiptItem {
  label: string;
  value: string;
  mono?: boolean;
}

export interface TransactionReceiptProps {
  title: string;
  subtitle?: string;
  reference: string;
  createdAt: string;
  amountLabel: string;
  amountValue: string;
  status: "PENDING" | "APPROVED" | "COMPLETED" | "REJECTED";
  items: ReceiptItem[];
  className?: string;
}

const STATUS_COLOR: Record<string, string> = {
  PENDING: "text-amber-400",
  APPROVED: "text-emerald-400",
  COMPLETED: "text-emerald-400",
  REJECTED: "text-red-400",
};

export default function TransactionReceipt({
  title,
  subtitle,
  reference,
  createdAt,
  amountLabel,
  amountValue,
  status,
  items,
  className,
}: TransactionReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [printHint, setPrintHint] = useState(false);

  useEffect(() => {
    // Show the print hint briefly when a fresh receipt appears
    const t = setTimeout(() => setPrintHint(true), 600);
    const t2 = setTimeout(() => setPrintHint(false), 6000);
    return () => {
      clearTimeout(t);
      clearTimeout(t2);
    };
  }, [reference]);

  const print = () => {
    if (typeof window === "undefined") return;
    // Focus the receipt so browser print preview prioritizes it
    receiptRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => window.print(), 350);
  };

  const dateStr = new Date(createdAt).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className={cn("space-y-2 select-text", className)}>
      {/* Print hint + action */}
      <div
        className={cn(
          "flex items-center justify-between transition-opacity duration-500",
          printHint ? "opacity-100" : "opacity-0",
        )}
      >
        <span className="text-[10px] font-mono text-emerald-400/80 tracking-wider">
          ✓ RECEIPT READY — PRINT / SAVE AS PDF
        </span>
        <button
          onClick={print}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.12] text-[10px] font-mono font-bold text-white/70 hover:text-white hover:border-white/25 transition-all"
        >
          <Printer className="w-3 h-3" /> PRINT
        </button>
      </div>

      {/* Receipt body */}
      <div
        ref={receiptRef}
        className="border border-white/[0.10] rounded-2xl bg-[#020204] overflow-hidden print-receipt"
      >
        {/* Header strip */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.08] bg-white/[0.02]">
          <div>
            <div className="text-sm font-black text-white tracking-tight">
              X·CAPITAL
            </div>
            <div className="text-[9px] font-mono text-white/30 tracking-[0.2em] uppercase">
              {subtitle ?? "Transaction Receipt"}
            </div>
          </div>
          <span
            className={cn(
              "text-[10px] font-mono font-bold tracking-widest uppercase",
              STATUS_COLOR[status] ?? "text-white/50",
            )}
          >
            {status}
          </span>
        </div>

        {/* Title */}
        <div className="px-5 pt-4 pb-3">
          <div className="text-base font-black text-white">{title}</div>
          <div className="text-xs text-white/40">{dateStr}</div>
        </div>

        {/* Amount */}
        <div className="px-5 py-3 bg-emerald-500/[0.03] border-y border-white/[0.06]">
          <div className="text-[9px] font-mono text-white/30 uppercase tracking-[0.2em]">
            {amountLabel}
          </div>
          <div className="text-2xl font-black font-mono text-white tabular-nums">
            {amountValue}
          </div>
        </div>

        {/* Detail rows */}
        <div className="px-5 py-4 space-y-2">
          <div className="flex justify-between text-xs gap-4">
            <span className="text-white/35">Reference</span>
            <span className="text-white font-mono font-bold">{reference}</span>
          </div>
          {items.map((item) => (
            <div key={item.label} className="flex justify-between text-xs gap-4">
              <span className="text-white/35 shrink-0">{item.label}</span>
              <span
                className={cn(
                  "text-right text-white/90",
                  item.mono && "font-mono",
                )}
              >
                {item.value}
              </span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/[0.06] flex items-center justify-between text-[9px] font-mono text-white/25">
          <span>REAL-TIME RECORD · BLOCKCHAIN-AUDITED</span>
          <span>XCAP-{reference.startsWith("XCAP-") ? reference.slice(5) : reference}</span>
        </div>
      </div>

      {/* Print stylesheet — the receipt becomes the only printed content */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .print-receipt,
          .print-receipt * {
            visibility: visible !important;
          }
          .print-receipt {
            position: fixed !important;
            inset: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
            border: none !important;
            border-radius: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
          }
          .print-receipt * {
            color: #000000 !important;
            border-color: #dddddd !important;
          }
          @page {
            margin: 12mm;
          }
        }
      `}</style>
    </div>
  );
}
