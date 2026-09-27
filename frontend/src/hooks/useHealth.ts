"use client";

import { useEffect, useState } from "react";
import { getHealth, type HealthSnapshot } from "@/lib/health";

type HealthState = {
  health: HealthSnapshot | null;
  loading: boolean;
  online: boolean;
  lastCheckedAt: number | null;
};

const INITIAL: HealthState = {
  health: null,
  loading: true,
  online: false,
  lastCheckedAt: null,
};

let cached: HealthSnapshot | null = null;
let cachedOnline = false;

export function useHealth(intervalMs = 30_000) {
  const [state, setState] = useState<HealthState>(INITIAL);

  const refresh = async () => {
    const next = await getHealth();
    if (next) {
      cached = next;
      cachedOnline = next.status === "healthy" || next.status === "degraded";
    }
    setState({
      health: next ?? cached,
      loading: false,
      online: cachedOnline,
      lastCheckedAt: Date.now(),
    });
  };

  useEffect(() => {
    void refresh();
    const id = setInterval(() => void refresh(), intervalMs);
    const onVis = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", onVis);
    };
  }, [intervalMs]);

  return { ...state, refresh };
}
