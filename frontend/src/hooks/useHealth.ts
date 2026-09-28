"use client";

import { useEffect, useState } from "react";
import { getHealth, hydratedDesk, type HealthSnapshot } from "@/lib/health";

type HealthState = {
  health: HealthSnapshot;
  loading: boolean;
  online: boolean;
  lastCheckedAt: number | null;
};

let cached: HealthSnapshot = hydratedDesk();

export function useHealth(intervalMs = 60_000) {
  const [state, setState] = useState<HealthState>({
    health: cached,
    loading: false,
    online: true,
    lastCheckedAt: null,
  });

  useEffect(() => {
    let stop = false;
    let inflight = false;
    const refresh = async () => {
      if (inflight) return;
      inflight = true;
      const next = await getHealth();
      inflight = false;
      if (stop) return;
      if (next) cached = next;
      setState({
        health: cached,
        loading: false,
        online: true,
        lastCheckedAt: Date.now(),
      });
    };
    void refresh();
    const id = setInterval(() => void refresh(), intervalMs);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, [intervalMs]);

  return state;
}
