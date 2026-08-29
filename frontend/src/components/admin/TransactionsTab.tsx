"use client";

import { MissionControl } from "@/components/x-engine";
import { cn, formatCurrency } from "@/lib/utils";
import type { PendingTransaction } from "@/store/useStore";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export function TransactionsTab({
  pendingTransactions,
  onApprove,
  onReject,
  onOpenReject,
}: {
  pendingTransactions: PendingTransaction[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onOpenReject: (id: string) => void;
}) {
  const pending = pendingTransactions.filter((t) => t.status === "PENDING");
  const resolved = pendingTransactions.filter((t) => t.status !== "PENDING");

  return (
    <div className="space-y-6">
      <MissionControl onApprove={onApprove} onReject={onReject} />
      <h3 className="text-sm font-semibold text-white">Transaction Approval Queue</h3>
      {pending.length === 0 ? (
        <div className="text-center py-16 text-gray-600">
          <CheckCircle2 size={40} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">No pending transactions</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map((tx) => (
            <div key={tx.id} className="bg-[#12121a] border border-white/5 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={cn("w-9 h-9 rounded-full flex items-center justify-center", tx.type === "DEPOSIT" ? "bg-emerald-600/20" : "bg-red-600/20")}>
                    {tx.type === "DEPOSIT" ? (
                      <ArrowDownLeft size={16} className="text-emerald-400" />
                    ) : (
                      <ArrowUpRight size={16} className="text-red-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{tx.userName}</p>
                    <p className="text-xs text-gray-500">{tx.userEmail}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn("text-lg font-bold font-mono", tx.type === "DEPOSIT" ? "text-emerald-400" : "text-red-400")}>
                    {tx.type === "DEPOSIT" ? "+" : "−"}
                    {tx.currency === "USD" ? formatCurrency(tx.amount) : `${tx.amount} ${tx.currency}`}
                  </p>
                  <p className="text-xs text-gray-500">{tx.type} · {tx.method.toUpperCase()}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {Object.entries(tx.details).map(([k, v]) => (
                  <div key={k}>
                    <p className="text-[10px] text-gray-600 uppercase">{k.replace(/([A-Z])/g, " $1")}</p>
                    <p className="text-xs text-gray-300 font-mono truncate">{v}</p>
                  </div>
                ))}
                <div>
                  <p className="text-[10px] text-gray-600 uppercase">Submitted</p>
                  <p className="text-xs text-gray-300">{new Date(tx.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => onApprove(tx.id)} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium transition">
                  <CheckCircle size={14} /> Approve
                </button>
                <button onClick={() => onOpenReject(tx.id)} className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg text-sm font-medium transition">
                  <XCircle size={14} /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {resolved.length > 0 && (
        <div className="mt-8">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Recently Resolved</h4>
          <div className="space-y-2">
            {resolved.slice(0, 20).map((tx) => (
              <div key={tx.id} className="flex items-center justify-between bg-[#12121a] border border-white/5 rounded-lg px-4 py-3 text-sm">
                <div className="flex items-center gap-3">
                  <div className={cn("w-2 h-2 rounded-full", tx.status === "APPROVED" ? "bg-emerald-500" : "bg-red-500")} />
                  <span className="text-gray-400">{tx.userName}</span>
                  <span className="text-gray-600 text-xs">{tx.type} · {tx.method}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-white font-mono text-sm">
                    {tx.currency === "USD" ? formatCurrency(tx.amount) : `${tx.amount} ${tx.currency}`}
                  </span>
                  <span className={cn("text-xs font-bold px-2 py-0.5 rounded", tx.status === "APPROVED" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400")}>
                    {tx.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
