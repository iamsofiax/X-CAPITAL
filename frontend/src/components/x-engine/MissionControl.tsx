"use client";

import { useStore } from "@/store/useStore";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";
import { ENGINE_COPY } from "@/lib/xEngine";
import { Check, X, Radio } from "lucide-react";

interface MissionControlProps {
  onApprove: (txId: string) => void;
  onReject: (txId: string) => void;
}

export default function MissionControl({
  onApprove,
  onReject,
}: MissionControlProps) {
  const { adminAlerts, pendingTransactions, markAdminAlertRead } = useStore();

  const queue = adminAlerts.filter((a) => a.status === "PENDING");

  if (queue.length === 0) {
    return (
      <div className="mission-panel rounded-xl border border-white/[0.08] p-8 text-center">
        <Radio className="w-8 h-8 text-white/20 mx-auto mb-3" />
        <p className="engine-mono text-[10px] text-white/30 tracking-widest">
          {ENGINE_COPY.inboundQueue}
        </p>
        <p className="text-sm text-white/40 mt-2">No active signals on scope</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">{ENGINE_COPY.missionControl}</h2>
        <span className="engine-mono text-[10px] text-amber-400 animate-pulse">
          {queue.length} LIVE
        </span>
      </div>
      {queue.map((alert) => {
        const tx = pendingTransactions.find((t) => t.id === alert.pendingTxId);
        return (
          <div
            key={alert.id}
            className="mission-panel rounded-xl border border-amber-500/25 bg-amber-500/[0.04] p-4 md:p-5"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="engine-mono text-[10px] text-amber-400 font-bold">
                    {alert.type}
                  </span>
                  <span className="text-xs text-white/30">·</span>
                  <span className="text-sm font-medium text-white truncate">
                    {alert.userName || alert.userEmail}
                  </span>
                </div>
                <p className="text-2xl font-bold text-white font-mono">
                  {formatCurrency(Number(alert.amount))}
                </p>
                <p className="engine-mono text-[10px] text-white/35">
                  {alert.method} · {formatRelativeTime(alert.createdAt)}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => {
                    markAdminAlertRead(alert.id);
                    if (tx) onApprove(tx.id);
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-black text-xs font-bold rounded-lg hover:bg-emerald-400 transition-colors"
                >
                  <Check className="w-4 h-4" />
                  {ENGINE_COPY.armNode}
                </button>
                <button
                  onClick={() => {
                    markAdminAlertRead(alert.id);
                    if (tx) onReject(tx.id);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 border border-white/15 text-white/70 text-xs font-bold rounded-lg hover:bg-white/5 transition-colors"
                >
                  <X className="w-4 h-4" />
                  {ENGINE_COPY.denySignal}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
