"use client";

import { useEffect, useState } from "react";
import { systemAPI, type SystemHealth } from "@/lib/api";

interface ApiHealthState {
  health: SystemHealth | null;
  loading: boolean;
  online: boolean;
  lastCheckedAt: number | null;
}

const INITIAL: ApiHealthState = {
  health: null,
  loading: true,
  online: false,
  lastCheckedAt: null,
};

/**
 * useApiHealth — polls the backend `/health` endpoint every 30s.
 * Powers the ApiHealthBadge and the hero GATEWAY telemetry so the UI
 * reflects real front↔back connectivity, never hard-coded status.
 */
export function useApiHealth(pollMs = 30_000): ApiHealthState & { refresh: () => void } {
  const [state, setState] = useState<ApiHealthState>(INITIAL);

  const refresh = async () => {
    try {
      const { data } = await systemAPI.getHealth();
      const health: SystemHealth | null = data?.data ?? null;
      setState({
        health,
        loading: false,
        online: health?.status === "healthy" || health?.status === "degraded",
        lastCheckedAt: Date.now(),
      });
    } catch {
      setState((prev) => ({
        health: prev.health,
        loading: false,
        online: false,
        lastCheckedAt: Date.now(),
      }));
    }
  };

  useEffect(() => {
    void refresh();
    const interval = setInterval(() => void refresh(), pollMs);
    // Re-check immediately when the tab becomes visible again
    const onVisibility = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pollMs]);

  return { ...state, refresh };
}
