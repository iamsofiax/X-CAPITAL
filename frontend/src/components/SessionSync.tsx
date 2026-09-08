"use client";

import { useEffect, useRef } from "react";
import { useStore } from "@/store/useStore";
import { useAccountStore } from "@/store/useAccountStore";
import { hasApiToken } from "@/lib/apiUser";

/** Hydrates the account snapshot — Accrual Core is the clock. */
export default function SessionSync() {
  const isAuthenticated = useStore((s) => s.isAuthenticated);
  const fetchSnapshot = useAccountStore((s) => s.fetchSnapshot);
  const syncingRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !hasApiToken()) return;

    const onVisible = () => {
      if (!document.hidden && !syncingRef.current) {
        syncingRef.current = true;
        void fetchSnapshot().finally(() => {
          syncingRef.current = false;
        });
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [isAuthenticated, fetchSnapshot]);

  return null;
}
