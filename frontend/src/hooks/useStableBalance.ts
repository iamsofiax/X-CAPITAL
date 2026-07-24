"use client";

import { useMemo } from "react";
import { useStore } from "@/store/useStore";
import { useSessionUser } from "@/hooks/useSessionUser";
import { resolveFiatBalance } from "@/lib/balance";

/** Single source of truth for displayed fiat — wallet + registry session user. */
export function useStableBalance(): number {
  const wallet = useStore((s) => s.wallet);
  const sessionUser = useSessionUser();

  return useMemo(
    () => resolveFiatBalance(wallet, sessionUser),
    [wallet, sessionUser],
  );
}
