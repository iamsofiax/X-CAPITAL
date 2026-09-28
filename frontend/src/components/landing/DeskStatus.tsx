"use client";

import { cn } from "@/lib/utils";
import { useHealth } from "@/hooks/useHealth";

export function DeskStatus({
  className,
  showDetail = false,
}: {
  className?: string;
  showDetail?: boolean;
}) {
  const { health, online, loading } = useHealth();
  const raw = health?.status ?? (online ? "healthy" : "offline");
  const status = raw === "offline" ? "offline" : "healthy";
  const label = status === "healthy" ? "DESK LIVE" : "DESK UNREACHABLE";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5",
        status === "healthy" && "border-emerald-500/25 bg-emerald-500/[0.06]",
        status === "offline" && "border-red-500/25 bg-red-500/[0.06]",
        className,
      )}
      title={
        loading
          ? "Checking system status…"
          : `${label} · last checked ${health ? new Date(health.timestamp).toLocaleTimeString() : "—"}`
      }
    >
      <span
        className={cn(
          "inline-flex rounded-full w-1.5 h-1.5",
          status === "healthy" ? "bg-[#8aa396]" : "bg-red-500",
        )}
      />
      <span
        className={cn(
          "text-[9px] font-mono font-bold tracking-[0.18em]",
          status === "healthy" ? "text-emerald-400/90" : "text-red-400/90",
        )}
      >
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
