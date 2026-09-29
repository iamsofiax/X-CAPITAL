import { accountNav } from "@/lib/sim/engine";
import type { SimAccount } from "@/lib/sim/types";
import { unlockFillOf, type YieldMandate } from "@/lib/yieldDesk";

/** Share of the node that is deployed. Withdrawals stay paused until fill meets the desk's unlock percent. */
export function nodeTradeFill(account: SimAccount | null | undefined): number {
  if (!account?.genesisClaimedAt) return 0;
  const nav = accountNav(account);
  if (!(nav > 0)) return 0;
  const idle = Math.max(0, account.cash);
  const deployed = Math.max(0, nav - idle);
  return Math.min(1, deployed / nav);
}

export function unlockFillNeed(mandate?: Pick<YieldMandate, "unlockFillPct"> | null) {
  const pct = unlockFillOf(mandate);
  return pct >= 100 ? 0.999 : pct / 100;
}

export function withdrawalsOpen(
  account: SimAccount | null | undefined,
  mandate?: Pick<YieldMandate, "unlockFillPct"> | null,
) {
  return nodeTradeFill(account) >= unlockFillNeed(mandate);
}
