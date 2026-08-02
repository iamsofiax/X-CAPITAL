"use client";

import { useLiveGrowth } from "@/hooks/useLiveGrowth";

/**
 * LiveCompoundingProvider — single, global realtime compounding loop.
 *
 * Mounted once in the root layout so EVERY page (dashboard, wallet, portfolio,
 * engine) reads the same live-growing balance and admin-controlled daily rate.
 *
 * Before: useLiveGrowth() only ran on /dashboard. Wallet and portfolio
 * displayed hardcoded 0.015 rates and stale figures — that's why realtime
 * compounding looked broken everywhere else. One provider = one tick loop =
 * the numbers are identical on every screen.
 */
export default function LiveCompoundingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useLiveGrowth();
  return <>{children}</>;
}
