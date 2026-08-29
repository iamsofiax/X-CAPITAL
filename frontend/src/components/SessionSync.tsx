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

    const runSync = async () => {
      if (syncingRef.current || document.hidden) return;
      syncingRef.current = true;
      try {
        const snap = await fetchSnapshot();
        if (!snap) return;
        const store = useStore.getState();
        const cash = useAccountStore.getState().interpolatedCash;
        store.setWallet({
          id: snap.wallet.id,
          fiatBalance: cash,
          cryptoBalance: Number(snap.wallet.cryptoBalance ?? 0),
          lockedBalance: Number(snap.wallet.lockedBalance ?? 0),
          walletAddress: snap.wallet.walletAddress ?? undefined,
        });
        if (store.user?.id === snap.user.id) {
          store.updateUser({
            balance: cash,
            profitRate: snap.yieldConfig.profitRate,
            profitMode: snap.yieldConfig.profitMode,
            profitMultiplier: snap.yieldConfig.profitMultiplier,
            profitHold: snap.yieldConfig.profitHold,
            nodeGoal: snap.yieldConfig.nodeGoal ?? undefined,
            nextNodeRate: snap.yieldConfig.nextNodeRate ?? undefined,
          });
        }
      } finally {
        syncingRef.current = false;
      }
    };

    void runSync();
    const interval = setInterval(() => {
      void runSync();
    }, 15_000);

    const onVisible = () => {
      if (!document.hidden) void runSync();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [isAuthenticated, fetchSnapshot]);

  return null;
}
