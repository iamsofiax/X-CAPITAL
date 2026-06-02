"use client";

import Link from "next/link";
import { useXEngine } from "@/hooks/useXEngine";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";
import { ENGINE_COPY } from "@/lib/xEngine";

export default function SignalPulse() {
  const { isOnHold, lastPending, phase } = useXEngine();

  if (!isOnHold && phase !== "DETECTING") return null;

  return (
    <div className="signal-pulse border-b border-amber-500/30 bg-amber-500/[0.06]">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-60" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400" />
          </span>
          <p className="text-sm font-medium text-amber-200/90">
            {ENGINE_COPY.signalDetected}
          </p>
        </div>
        {lastPending && (
          <p className="engine-mono text-[10px] text-amber-400/70">
            {formatCurrency(lastPending.amount)} ·{" "}
            {formatRelativeTime(lastPending.createdAt)}
          </p>
        )}
        <Link
          href="/wallet"
          className="text-xs font-bold text-amber-300 hover:text-white transition-colors"
        >
          View uplink →
        </Link>
      </div>
    </div>
  );
}
