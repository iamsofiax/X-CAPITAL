"use client";

import { useEffect, useState } from "react";
import { healthProbe, type SystemHealth } from "@/lib/api";

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

/** Last-known good health — preserves the badge across a single failed probe. */
let lastKnownHealth: SystemHealth | null = null;
let lastKnownOnline = false;

/**
 * useApiHealth — polls the backend `/health` endpoint every 30s.
 * Powers the ApiHealthBadge and the hero GATEWAY telemetry so the UI
 * reflects real front↔back connectivity, never hard-coded status.
 */
export function useApiHealth(pollMs = 30_000): ApiHealthState & { refresh: () => void } {
  const [state, setState] = useState<ApiHealthState>(INITIAL);

  const refresh = async () => {
    // healthProbe waits out Render cold-starts (503 → retry with backoff) so
    // the badge shows "CHECKING…" instead of a false "API OFFLINE".
    const health = await healthProbe();
    if (health) {
      lastKnownHealth = health;
      lastKnownOnline =
        health.status === "healthy" || health.status === "degraded";
    }
    setState({
      // Keep the last-known health on a failed probe so one network blip
      // doesn't flip the badge to "API OFFLINE" after it was healthy.
      health: health ?? lastKnownHealth,
      loading: false,
      online: lastKnownOnline,
      lastCheckedAt: Date.now(),
    });
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
