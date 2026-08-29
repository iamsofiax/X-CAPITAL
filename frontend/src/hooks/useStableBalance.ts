"use client";

import { useMemo } from "react";
import { useStore } from "@/store/useStore";
import { useSessionUser } from "@/hooks/useSessionUser";
import { useAccountStore } from "@/store/useAccountStore";
import { resolveFiatBalance } from "@/lib/balance";

/** Single source of truth for displayed fiat — interpolated Accrual Core cash. */
export function useStableBalance(): number {
  const interpolatedCash = useAccountStore((s) => s.interpolatedCash);
  const snapshot = useAccountStore((s) => s.snapshot);
  const wallet = useStore((s) => s.wallet);
  const sessionUser = useSessionUser();

  return useMemo(() => {
    if (snapshot) return interpolatedCash;
    return resolveFiatBalance(wallet, sessionUser);
  }, [snapshot, interpolatedCash, wallet, sessionUser]);
}

export function useStableNav(): number {
  const displayNav = useAccountStore((s) => s.displayNav);
  const snapshot = useAccountStore((s) => s.snapshot);
  const cash = useStableBalance();
  return snapshot ? displayNav : cash;
}
