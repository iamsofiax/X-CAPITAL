"use client";

import { useApiHealth } from "@/hooks/useApiHealth";
import { cn } from "@/lib/utils";

interface ApiHealthBadgeProps {
  className?: string;
  showDetail?: boolean;
}

/**
 * ApiHealthBadge — live front↔back connectivity indicator.
 * GREEN  "ALL SYSTEMS OPERATIONAL"   — API + DB healthy
 * AMBER  "DEGRADED"                  — API reachable, some service offline
 * RED    "API OFFLINE"               — backend unreachable
 */
export default function ApiHealthBadge({
  className,
  showDetail = false,
}: ApiHealthBadgeProps) {
  const { health, online, loading } = useApiHealth();

  const status = health?.status ?? (online ? "degraded" : "offline");
  const dotClass =
    status === "healthy"
      ? "bg-emerald-400"
      : status === "degraded"
        ? "bg-amber-400"
        : "bg-red-500";
  const label =
    status === "healthy"
      ? "ALL SYSTEMS OPERATIONAL"
      : status === "degraded"
        ? "DEGRADED"
        : "API OFFLINE";
  const labelClass =
    status === "healthy"
      ? "text-emerald-400/90"
      : status === "degraded"
        ? "text-amber-400/90"
        : "text-red-400/90";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5",
        status === "healthy" && "border-emerald-500/25 bg-emerald-500/[0.06]",
        status === "degraded" && "border-amber-500/25 bg-amber-500/[0.06]",
        status === "offline" && "border-red-500/25 bg-red-500/[0.06]",
        className,
      )}
      title={
        loading
          ? "Checking system status…"
          : `${label} · last checked ${health ? new Date(health.timestamp).toLocaleTimeString() : "—"}`
      }
    >
      <span className="relative flex w-1.5 h-1.5">
        {!loading && status !== "offline" && (
          <span
            className={cn(
              "absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping",
              status === "healthy" ? "bg-emerald-400" : "bg-amber-400",
            )}
          />
        )}
        <span className={cn("relative inline-flex rounded-full w-1.5 h-1.5", dotClass)} />
      </span>
      <span className={cn("text-[9px] font-mono font-bold tracking-[0.18em]", labelClass)}>
        {loading ? "CHECKING…" : label}
      </span>
      {showDetail && health && !loading && (
        <span className="text-[9px] font-mono text-white/25 tracking-wider hidden sm:inline">
          {health.latencyMs !== undefined ? `${health.latencyMs}ms` : ""}
          {health.services.length > 0
            ? ` · ${health.summary.operational}/${health.summary.total} SRV`
            : ""}
        </span>
      )}
    </div>
  );
}
