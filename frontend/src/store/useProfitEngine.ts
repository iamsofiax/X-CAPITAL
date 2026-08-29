"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/* ══════════════════════════════════════════════════════════════════════════
   Profit Engine Store — Live compounding, bullish spikes, tx breakdown
   Separated from main store to avoid churn on the persist boundary.

   v3 — ADMIN-GOVERNED + ACCOUNT-ISOLATED:
   - Nodes store the admin's profitMode ("linear" simple interest vs
     "compound" exponential) and EVERY yield calculation passes through
     computeYield() so a Linear user is never secretly compounded.
   - Every live tx is tagged with its owner userId; setActiveUser() scopes
     the feed to the active account so logging in as another user can never
     see the previous account's transactions.
   - Node growth, spikes and rate overrides stay per-user keyed and persist,
     so a returning account keeps its governed history across sessions.
   ══════════════════════════════════════════════════════════════════════════ */

export interface BullishSpike {
  targetUserId: string;
  percentage: number;    // e.g. 15 = 15% boost
  durationHours: number; // e.g. 24 = 24 hours
  direction: "up" | "down";
  label: string;
  active: boolean;
  startedAt: string;
  expiresAt: string;
}

export interface NodeGrowth {
  nodeId: string;
  balance: number;
  dailyRate: number;
  lastCompoundAt: string;
  compoundCount: number;
  totalYieldGenerated: number;
  /** Yield accumulated since the last emitted PROFIT tx */
  accruedPending?: number;
  /** Admin profitMode — "linear" uses simple interest, anything else compounds. */
  profitMode?: "linear" | "compound" | "stepped" | "random";
}

export interface LiveTxBreakdown {
  id: string;
  time: string;
  type: "DEPOSIT" | "WITHDRAWAL" | "PROFIT" | "TRADE" | "FUND_INVEST";
  amount: number;
  balanceAfter: number;
  source: string;
  /** Owner node/user — feeds are filtered per active account. */
  userId: string;
}

interface ProfitEngineState {
  // Bullish spikes from admin
  bullishSpikes: BullishSpike[];
  addBullishSpike: (spike: BullishSpike) => void;
  resolveBullishSpike: (userId: string) => void;
  getActiveSpikeForUser: (userId: string) => BullishSpike | null;

  // Node growth tracking
  nodeGrowths: Record<string, NodeGrowth>;
  /** Admin daily-rate overrides keyed by nodeId (decimal, e.g. 0.03 = 3%) */
  rateOverrides: Record<string, number>;
  initNode: (
    nodeId: string,
    balance: number,
    dailyRate?: number,
    profitMode?: NodeGrowth["profitMode"],
  ) => void;
  resetNode: (nodeId: string, balance: number) => void;
  setDailyRate: (nodeId: string, dailyRate: number) => void;
  setNodeProfitMode: (
    nodeId: string,
    profitMode: NodeGrowth["profitMode"],
  ) => void;
  tickCompound: (nodeId: string) => NodeGrowth | null;
  getCompoundedProjection: (nodeId: string, days: number) => number;

  // Live tx breakdown feed — ALWAYS owner-scoped.
  txBreakdown: LiveTxBreakdown[];
  pushTx: (tx: LiveTxBreakdown) => void;
  /** Called when an admin-approved deposit lands — seeds the node + emits a DEPOSIT tx */
  hydrateDeposit: (nodeId: string, balance: number, amount: number) => void;
  /**
   * Called on login/logout so the live feed only ever shows the ACTIVE
   * user's transactions. Growth nodes/spikes/overrides are never wiped —
   * each account keeps its governed history.
   */
  setActiveUser: (userId: string | null) => void;
}

export const DEFAULT_DAILY_RATE = 0.015; // 1.5% base

/** Floor between compound ticks — prevents same-millisecond churn, keeps 15s tick lively */
const MIN_COMPOUND_INTERVAL_MS = 5_000;
/** Emit a PROFIT transaction once accrued yield reaches this threshold */
const TX_FLOOR_USD = 0.05;

function realCompound(p: number, r: number, t: number): number {
  return p * Math.pow(1 + r, t);
}

/**
 * THE one math gate every tick, catch-up and projection passes through.
 *
 * - "linear"   → simple interest: P × r × t   (admin Profit Mode = Linear)
 * - otherwise → compound:          P × ((1 + r)^t − 1)
 *
 * t is FRACTIONAL DAYS (elapsedHours / 24) for exact sub-daily accrual.
 */
export function computeYield(
  balance: number,
  dailyRate: number,
  elapsedDays: number,
  profitMode?: NodeGrowth["profitMode"],
): number {
  if (balance <= 0 || dailyRate <= 0 || elapsedDays <= 0) return 0;
  if (profitMode === "linear") {
    return balance * dailyRate * elapsedDays;
  }
  return balance * (realCompound(1, dailyRate, elapsedDays) - 1);
}

const rand = () => Math.random().toString(36).slice(2, 8);

export const useProfitEngine = create<ProfitEngineState>()(
  persist(
    (set, get) => ({
      bullishSpikes: [],
      nodeGrowths: {},
      rateOverrides: {},
      txBreakdown: [],

      // ── Bullish Spikes ────────────────────────────────────────────
      addBullishSpike: (spike) => {
        set((state) => ({
          bullishSpikes: [...state.bullishSpikes, spike],
        }));
      },

      resolveBullishSpike: (userId) => {
        set((state) => ({
          bullishSpikes: state.bullishSpikes.map((s) =>
            s.targetUserId === userId ? { ...s, active: false } : s,
          ),
        }));
      },

      getActiveSpikeForUser: (userId) => {
        const now = Date.now();
        const state = get();
        for (const spike of state.bullishSpikes) {
          if (
            spike.targetUserId === userId &&
            spike.active &&
            new Date(spike.expiresAt).getTime() > now
          ) {
            return spike;
          }
        }
        return null;
      },

      // ── Node Growth ───────────────────────────────────────────────
      initNode: (
        nodeId,
        balance,
        dailyRate = DEFAULT_DAILY_RATE,
        profitMode = "compound",
      ) => {
        set((state) => {
          if (state.nodeGrowths[nodeId]) return state;
          const override = state.rateOverrides[nodeId];
          const finalRate =
            override != null && override > 0 ? override : dailyRate;
          return {
            nodeGrowths: {
              ...state.nodeGrowths,
              [nodeId]: {
                nodeId,
                balance,
                dailyRate: finalRate,
                profitMode,
                lastCompoundAt: new Date().toISOString(),
                compoundCount: 0,
                totalYieldGenerated: 0,
                accruedPending: 0,
              },
            },
          };
        });
      },

      resetNode: (nodeId, balance) => {
        set((state) => {
          const node = state.nodeGrowths[nodeId];
          if (!node) {
            return {
              nodeGrowths: {
                ...state.nodeGrowths,
                [nodeId]: {
                  nodeId,
                  balance,
                  dailyRate:
                    state.rateOverrides[nodeId] > 0
                      ? state.rateOverrides[nodeId]
                      : DEFAULT_DAILY_RATE,
                  profitMode: "compound",
                  lastCompoundAt: new Date().toISOString(),
                  compoundCount: 0,
                  totalYieldGenerated: 0,
                  accruedPending: 0,
                },
              },
            };
          }
          return {
            nodeGrowths: {
              ...state.nodeGrowths,
              [nodeId]: {
                ...node,
                balance,
                lastCompoundAt: new Date().toISOString(),
                accruedPending: 0,
              },
            },
          };
        });
      },

      setDailyRate: (nodeId, dailyRate) => {
        set((state) => {
          const node = state.nodeGrowths[nodeId];
          const nextOverrides = {
            ...state.rateOverrides,
            [nodeId]: Math.max(0.0001, dailyRate),
          };
          if (!node) return { rateOverrides: nextOverrides };
          return {
            rateOverrides: nextOverrides,
            nodeGrowths: {
              ...state.nodeGrowths,
              [nodeId]: { ...node, dailyRate: Math.max(0.0001, dailyRate) },
            },
          };
        });
      },

      setNodeProfitMode: (nodeId, profitMode) => {
        if (!profitMode) return;
        set((state) => {
          const node = state.nodeGrowths[nodeId];
          if (!node || node.profitMode === profitMode) return state;
          const valid: NodeGrowth["profitMode"] =
            profitMode === "linear" ||
            profitMode === "compound" ||
            profitMode === "stepped" ||
            profitMode === "random"
              ? profitMode
              : "compound";
          return {
            nodeGrowths: {
              ...state.nodeGrowths,
              [nodeId]: { ...node, profitMode: valid },
            },
          };
        });
      },

      tickCompound: (nodeId) => {
        const state = get();
        const node = state.nodeGrowths[nodeId];
        if (!node || node.balance <= 0) return null;

        const now = Date.now();
        const last = new Date(node.lastCompoundAt).getTime();
        const elapsedMs = Math.max(0, now - last);
        if (elapsedMs < MIN_COMPOUND_INTERVAL_MS) return node;

        const elapsedHours = elapsedMs / (1000 * 60 * 60);
        const dailyRate = node.dailyRate;

        // ADMIN-GOVERNED MATH — honor the user's profit mode:
        // linear → simple interest | otherwise → A = P(1 + r)^(t/24)
        const yieldGenerated = computeYield(
          node.balance,
          dailyRate,
          elapsedHours / 24,
          node.profitMode,
        );

        const spike = state.bullishSpikes.find(
          (s) =>
            s.targetUserId === nodeId &&
            s.active &&
            new Date(s.expiresAt).getTime() > now,
        );
        const spikeMultiplier = spike ? 1 + spike.percentage / 100 : 1;
        const finalYield = yieldGenerated * spikeMultiplier;
        const finalBalance = node.balance + finalYield;
        const accruedPending = (node.accruedPending ?? 0) + finalYield;

        const updated: NodeGrowth = {
          ...node,
          balance: finalBalance,
          dailyRate,
          lastCompoundAt: new Date().toISOString(),
          compoundCount: node.compoundCount + 1,
          totalYieldGenerated: node.totalYieldGenerated + finalYield,
          accruedPending,
        };

        // Emit a PROFIT tx once accrued yield crosses the floor —
        // keeps the live feed steady without flooding every tick.
        const shouldEmitTx = accruedPending >= TX_FLOOR_USD;
        let txBreakdown = state.txBreakdown;
        if (shouldEmitTx) {
          updated.accruedPending = 0;
          const tx: LiveTxBreakdown = {
            id: `tx-${Date.now()}-${rand()}`,
            time: new Date().toISOString(),
            type: "PROFIT",
            amount: accruedPending,
            balanceAfter: finalBalance,
            source: spike
              ? `compound + bull spike (${spike.percentage}%)`
              : "compound",
            userId: nodeId,
          };
          txBreakdown = [tx, ...txBreakdown].slice(0, 500);
        }

        set((s) => ({
          nodeGrowths: { ...s.nodeGrowths, [nodeId]: updated },
          txBreakdown,
        }));

        return updated;
      },

      getCompoundedProjection: (nodeId, days) => {
        const state = get();
        const node = state.nodeGrowths[nodeId];
        if (!node) return 0;
        return computeYield(
          node.balance,
          node.dailyRate,
          days,
          node.profitMode,
        );
      },

      // ── Live Tx Breakdown ─────────────────────────────────────────
      pushTx: (tx) => {
        set((state) => ({
          txBreakdown: [tx, ...state.txBreakdown].slice(0, 500),
        }));
      },

      hydrateDeposit: (nodeId, balance, amount) => {
        set((state) => {
          const node = state.nodeGrowths[nodeId];
          const dailyRate = node
            ? node.dailyRate
            : state.rateOverrides[nodeId] > 0
              ? state.rateOverrides[nodeId]
              : DEFAULT_DAILY_RATE;
          const updatedNode: NodeGrowth = node
            ? {
                ...node,
                balance,
                lastCompoundAt: new Date().toISOString(),
                accruedPending: 0,
              }
            : {
                nodeId,
                balance,
                dailyRate,
                profitMode: "compound",
                lastCompoundAt: new Date().toISOString(),
                compoundCount: 0,
                totalYieldGenerated: 0,
                accruedPending: 0,
              };
          const tx: LiveTxBreakdown = {
            id: `dep-${Date.now()}-${rand()}`,
            time: new Date().toISOString(),
            type: "DEPOSIT",
            amount,
            balanceAfter: balance,
            source: "deposit-approved",
            userId: nodeId,
          };
          return {
            nodeGrowths: { ...state.nodeGrowths, [nodeId]: updatedNode },
            txBreakdown: [tx, ...state.txBreakdown].slice(0, 500),
          };
        });
      },

      setActiveUser: (userId) => {
        set((state) => {
          if (userId === null) {
            // Logged out — never leak another account's live feed.
            if (state.txBreakdown.length === 0) return state;
            return { txBreakdown: [] };
          }
          const scoped = state.txBreakdown.filter(
            (tx) => tx.userId === userId,
          );
          if (scoped.length === state.txBreakdown.length) return state;
          return { txBreakdown: scoped };
        });
      },
    }),
    {
      name: "xcapital-profit-engine",
      version: 4,
      migrate: (): unknown => ({
        bullishSpikes: [],
        nodeGrowths: {},
        rateOverrides: {},
        txBreakdown: [],
      }),
      partialize: () => ({
        bullishSpikes: [],
        nodeGrowths: {},
        rateOverrides: {},
        txBreakdown: [],
      }),
    },
  ),
);

