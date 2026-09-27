"use client";

import { useEffect, useRef } from "react";
import { useStore } from "@/store/useStore";
import { hasApiToken } from "@/lib/apiUser";

/** Refreshes the signed-in profile from /auth/me. Simulation balances stay on the client ledger. */
export default function SessionSync() {
  const isAuthenticated = useStore((s) => s.isAuthenticated);
  const syncSessionFromApi = useStore((s) => s.syncSessionFromApi);
  const syncingRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !hasApiToken()) return;

    const runSync = async () => {
      if (syncingRef.current || document.hidden) return;
      syncingRef.current = true;
      try {
        await syncSessionFromApi();
      } finally {
        syncingRef.current = false;
      }
    };

    void runSync();

    const interval = setInterval(() => {
      void runSync();
    }, 90_000);

    const onVisible = () => {
      if (!document.hidden) void runSync();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [isAuthenticated, syncSessionFromApi]);

  return null;
}
