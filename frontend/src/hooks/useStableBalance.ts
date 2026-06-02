"use client";

import { useMemo } from "react";
import { useStore } from "@/store/useStore";

/** Single source of truth for displayed fiat balance — avoids registry flicker. */
export function useStableBalance(): number {
  const walletBalance = useStore((s) => s.wallet?.fiatBalance);
  const userBalance = useStore((s) => s.user?.balance);

  return useMemo(() => {
    const w = Number(walletBalance);
    if (Number.isFinite(w)) return w;
    const u = Number(userBalance);
    if (Number.isFinite(u)) return u;
    return 0;
  }, [walletBalance, userBalance]);
}
