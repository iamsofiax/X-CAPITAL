import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SimAccount } from "@/lib/sim/types";
import type { Quote } from "@/lib/sim/instruments";
import {
  SimError,
  checkIn,
  buyCatalog,
  buyFleet,
  claimGenesis,
  creditConfirmedDeposit,
  creditYield,
  createAccount,
  openZeroBook,
  settleFleetIncome,
  depositVault,
  executeTrade,
  lockSxc,
  setTradingHalt,
  markPositions,
  resetAccount,
  setAutoCompound,
  settle,
  unlockSxc,
  withdrawVault,
  type SettlementReport,
} from "@/lib/sim/engine";

export type SimResult = { ok: true } | { ok: false; error: string };

interface SimState {
  accounts: Record<string, SimAccount>;
  lastReport: Record<string, SettlementReport | undefined>;
  ensure: (userId: string) => SimAccount;
  sync: (userId: string) => SettlementReport | null;
  mark: (userId: string, mids: Record<string, number>) => void;
  claimGenesis: (userId: string) => SimResult;
  confirmDeposit: (userId: string, usd: number, asset: string, txHash: string) => SimResult;
  creditYield: (userId: string, amount: number, memo: string) => SimResult;
  buyFleet: (userId: string, units: number) => SimResult;
  buyCatalog: (userId: string, sku: string, units: number) => SimResult;
  settleFleet: (userId: string) => SimResult;
  reset: (userId: string) => SimResult;
  deposit: (userId: string, vaultId: string, amount: number) => SimResult;
  withdraw: (userId: string, vaultId: string, amount: number) => SimResult;
  toggleCompound: (userId: string, vaultId: string, on: boolean) => void;
  trade: (
    userId: string,
    quote: Quote,
    side: "BUY" | "SELL",
    input: { notional?: number; qty?: number },
  ) => SimResult;
  lock: (userId: string, amount: number, days: number) => SimResult;
  unlock: (userId: string, lockId: string) => SimResult;
  checkIn: (userId: string) => number;
  clearReport: (userId: string) => void;
  setHalt: (userId: string, halted: boolean) => void;
}

export const useSimStore = create<SimState>()(
  persist(
    (set, get) => {
      const run = (userId: string, fn: (acc: SimAccount) => SimAccount): SimResult => {
        try {
          const settled = settle(get().ensure(userId)).account;
          const next = fn(settled);
          set((s) => ({ accounts: { ...s.accounts, [userId]: next } }));
          return { ok: true };
        } catch (err) {
          if (err instanceof SimError) return { ok: false, error: err.message };
          console.error("[sim]", err);
          return { ok: false, error: "The book could not be updated. Please retry." };
        }
      };

      return {
        accounts: {},
        lastReport: {},

        ensure: (userId) => {
          const existing = get().accounts[userId];
          const opened = openZeroBook(existing ?? createAccount(userId));
          if (!existing || opened !== existing) {
            set((s) => ({ accounts: { ...s.accounts, [userId]: opened } }));
          }
          return opened;
        },

        sync: (userId) => {
          const { account, report } = settle(get().ensure(userId));
          if (report.epochs === 0) return null;
          set((s) => ({
            accounts: { ...s.accounts, [userId]: account },
            lastReport: { ...s.lastReport, [userId]: report },
          }));
          return report;
        },

        mark: (userId, mids) => {
          const acc = get().accounts[userId];
          if (!acc) return;
          const next = markPositions(acc, mids);
          if (next !== acc) set((s) => ({ accounts: { ...s.accounts, [userId]: next } }));
        },

        claimGenesis: (userId) => run(userId, (a) => claimGenesis(a)),
        confirmDeposit: (userId, usd, asset, txHash) =>
          run(userId, (a) => creditConfirmedDeposit(a, usd, asset, txHash)),
        creditYield: (userId, amount, memo) => run(userId, (a) => creditYield(a, amount, memo)),
        buyFleet: (userId, units) => run(userId, (a) => buyFleet(a, units)),
        buyCatalog: (userId, sku, units) => run(userId, (a) => buyCatalog(a, sku, units)),
        settleFleet: (userId) => {
          const acc = get().accounts[userId];
          if (!acc?.genesisClaimedAt) return { ok: true };
          const next = settleFleetIncome(acc);
          if (next === acc) return { ok: true };
          set((s) => ({ accounts: { ...s.accounts, [userId]: next } }));
          return { ok: true };
        },
        reset: (userId) => run(userId, (a) => resetAccount(a)),
        deposit: (userId, vaultId, amount) => run(userId, (a) => depositVault(a, vaultId, amount)),
        withdraw: (userId, vaultId, amount) => run(userId, (a) => withdrawVault(a, vaultId, amount)),
        toggleCompound: (userId, vaultId, on) => {
          run(userId, (a) => setAutoCompound(a, vaultId, on));
        },
        trade: (userId, quote, side, input) => run(userId, (a) => executeTrade(a, quote, side, input)),
        lock: (userId, amount, days) => run(userId, (a) => lockSxc(a, amount, days)),
        unlock: (userId, lockId) => run(userId, (a) => unlockSxc(a, lockId)),

        setHalt: (userId, halted) => {
          const acc = get().accounts[userId];
          if (!acc) return;
          set((s) => ({ accounts: { ...s.accounts, [userId]: setTradingHalt(acc, halted) } }));
        },

        checkIn: (userId) => {
          const acc = get().accounts[userId];
          if (!acc?.genesisClaimedAt) return 0;
          const { account, xp } = checkIn(acc);
          if (xp > 0) set((s) => ({ accounts: { ...s.accounts, [userId]: account } }));
          return xp;
        },

        clearReport: (userId) =>
          set((s) => ({ lastReport: { ...s.lastReport, [userId]: undefined } })),
      };
    },
    {
      name: "xcapital-sim",
      version: 1,
      partialize: (s) => ({ accounts: s.accounts }),
    },
  ),
);
