"use client";

import { create } from "zustand";
import { accountAPI } from "@/lib/api";
import { hasApiToken } from "@/lib/apiUser";
import { computeYield } from "@/store/useProfitEngine";
import { buildLiveLedger, buildLedgerSeriesFromEvents } from "@/lib/userLedger";
import type { AccountSnapshot } from "@/types";

interface AccountState {
  snapshot: AccountSnapshot | null;
  interpolatedCash: number;
  displayNav: number;
  loading: boolean;
  lastFetchedAt: number | null;
  error: string | null;
  fetchSnapshot: () => Promise<AccountSnapshot | null>;
  interpolate: () => void;
  reset: () => void;
}

function holdingsAndFunds(snapshot: AccountSnapshot | null): number {
  if (!snapshot) return 0;
  return (
    Number(snapshot.portfolio.holdingsValue ?? 0) +
    Number(snapshot.portfolio.fundsValue ?? 0)
  );
}

function interpolateCash(snapshot: AccountSnapshot): number {
  const cash = Math.max(0, Number(snapshot.wallet.fiatBalance ?? 0));
  if (snapshot.yieldConfig.profitHold || cash <= 0) return cash;
  const last = snapshot.wallet.lastAccruedAt
    ? new Date(snapshot.wallet.lastAccruedAt).getTime()
    : Date.now();
  const elapsedDays = Math.max(0, (Date.now() - last) / 86_400_000);
  let yielded = computeYield(
    cash,
    snapshot.yieldConfig.dailyRate,
    elapsedDays,
    snapshot.yieldConfig.profitMode,
  );
  if (snapshot.activeSpike) {
    const pct = Number(snapshot.activeSpike.percentage) || 0;
    const mult =
      snapshot.activeSpike.direction === "down"
        ? Math.max(0, 1 - pct / 100)
        : 1 + pct / 100;
    yielded *= mult;
  }
  return Math.round((cash + yielded) * 100) / 100;
}

export const useAccountStore = create<AccountState>()((set, get) => ({
  snapshot: null,
  interpolatedCash: 0,
  displayNav: 0,
  loading: false,
  lastFetchedAt: null,
  error: null,

  fetchSnapshot: async () => {
    if (!hasApiToken()) return null;
    set({ loading: true, error: null });
    try {
      const { data } = await accountAPI.getSnapshot();
      const snapshot = data.data as AccountSnapshot;
      const cash = interpolateCash(snapshot);
      const nav = Math.round((cash + holdingsAndFunds(snapshot)) * 100) / 100;
      set({
        snapshot,
        interpolatedCash: cash,
        displayNav: nav,
        loading: false,
        lastFetchedAt: Date.now(),
        error: null,
      });
      return snapshot;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Snapshot unavailable";
      set({ loading: false, error: message });
      return null;
    }
  },

  interpolate: () => {
    const { snapshot } = get();
    if (!snapshot) return;
    const cash = interpolateCash(snapshot);
    const nav = Math.round((cash + holdingsAndFunds(snapshot)) * 100) / 100;
    set({ interpolatedCash: cash, displayNav: nav });
  },

  reset: () =>
    set({
      snapshot: null,
      interpolatedCash: 0,
      displayNav: 0,
      loading: false,
      lastFetchedAt: null,
      error: null,
    }),
}));

export function useAccountSnapshot() {
  return useAccountStore();
}

export function selectLiveLedger(snapshot: AccountSnapshot | null) {
  if (!snapshot) {
    return buildLiveLedger({ balance: 0, transactions: [], totalYieldGenerated: 0 });
  }
  return buildLiveLedger({
    balance: snapshot.wallet.fiatBalance,
    transactions: snapshot.transactions.map((tx) => ({
      id: tx.id,
      type:
        tx.type === "YIELD"
          ? "PROFIT"
          : tx.type === "DEPOSIT"
            ? "DEPOSIT"
            : tx.type === "WITHDRAWAL"
              ? "WITHDRAWAL"
              : tx.type === "FUND_INVESTMENT"
                ? "FUND_INVESTMENT"
                : tx.type === "FUND_REDEMPTION"
                  ? "FUND_REDEMPTION"
                  : tx.type === "TRADE"
                    ? "TRADE"
                    : "CREDIT",
      amount: Number(tx.amount),
      note: String(tx.metadata?.note ?? tx.type),
      timestamp: tx.createdAt,
      performedBy: "system",
    })),
    totalYieldGenerated: snapshot.wallet.totalYieldGenerated,
  });
}

export function selectSeries(snapshot: AccountSnapshot | null) {
  if (!snapshot) return [];
  if (snapshot.series?.length) return snapshot.series;
  return buildLedgerSeriesFromEvents(
    snapshot.transactions.map((tx) => ({
      type: tx.type,
      amount: Number(tx.amount),
      status: tx.status,
      timestamp: tx.createdAt,
    })),
    snapshot.wallet.fiatBalance,
    30,
  );
}
