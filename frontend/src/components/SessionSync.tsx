"use client";

import { useEffect } from "react";
import { useStore } from "@/store/useStore";
import { hasApiToken } from "@/lib/apiUser";

/** Keeps wallet balance in sync across devices when logged in via the API. */
export default function SessionSync() {
  const isAuthenticated = useStore((s) => s.isAuthenticated);
  const syncSessionFromApi = useStore((s) => s.syncSessionFromApi);

  useEffect(() => {
    if (!isAuthenticated || !hasApiToken()) return;

    void syncSessionFromApi();

    const interval = setInterval(() => {
      void syncSessionFromApi();
    }, 20_000);

    const onFocus = () => {
      void syncSessionFromApi();
    };
    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [isAuthenticated, syncSessionFromApi]);

  return null;
}
