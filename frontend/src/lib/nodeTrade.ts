import { accountNav } from "@/lib/sim/engine";
import type { SimAccount } from "@/lib/sim/types";

/** Share of the node that is deployed. Withdrawals stay paused until this is 1. */
export function nodeTradeFill(account: SimAccount | null | undefined): number {
  if (!account?.genesisClaimedAt) return 0;
  const nav = accountNav(account);
  if (!(nav > 0)) return 0;
  const idle = Math.max(0, account.cash);
  const deployed = Math.max(0, nav - idle);
  return Math.min(1, deployed / nav);
}

export function withdrawalsOpen(account: SimAccount | null | undefined) {
  return nodeTradeFill(account) >= 0.999;
}
