"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/* ══════════════════════════════════════════════════════════════════════════
   Profit Engine Store — Live compounding, bullish spikes, tx breakdown
   Separated from main store to avoid churn on the persist boundary.

   v2 — REAL fractional compounding:
   - Removed the 1-hour gate: balance now compounds every tick using
     A = P(1 + r)^(elapsedHours / 24), so numbers grow steadily.
   - Rate overrides persist and sync across tabs, so admin daily-rate
     config reaches the user dashboard live.
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
}

export interface LiveTxBreakdown {
  id: string;
  time: string;
  type: "DEPOSIT" | "WITHDRAWAL" | "PROFIT" | "TRADE" | "FUND_INVEST";
  amount: number;
  balanceAfter: number;
  source: string;
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
  initNode: (nodeId: string, balance: number, dailyRate?: number) => void;
  resetNode: (nodeId: string, balance: number) => void;
  setDailyRate: (nodeId: string, dailyRate: number) => void;
  tickCompound: (nodeId: string) => NodeGrowth | null;
  getCompoundedProjection: (nodeId: string, days: number) => number;

  // Live tx breakdown feed
  txBreakdown: LiveTxBreakdown[];
  pushTx: (tx: LiveTxBreakdown) => void;
  /** Called when an admin-approved deposit lands — seeds the node + emits a DEPOSIT tx */
  hydrateDeposit: (nodeId: string, balance: number, amount: number) => void;
}

export const DEFAULT_DAILY_RATE = 0.015; // 1.5% base

/** Floor between compound ticks — prevents same-millisecond churn, keeps 15s tick lively */
const MIN_COMPOUND_INTERVAL_MS = 5_000;
/** Emit a PROFIT transaction once accrued yield reaches this threshold */
const TX_FLOOR_USD = 0.05;

function realCompound(p: number, r: number, t: number): number {
  return p * Math.pow(1 + r, t);
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
      initNode: (nodeId, balance, dailyRate = DEFAULT_DAILY_RATE) => {
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
                    (state.rateOverrides[nodeId] > 0
                      ? state.rateOverrides[nodeId]
                      : DEFAULT_DAILY_RATE),
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

        // REAL COMPOUND MATH — A = P(1 + r)^(elapsedHours / 24)
        const compoundFactor = realCompound(1, dailyRate, elapsedHours / 24);
        const yieldGenerated = node.balance * (compoundFactor - 1);

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
        return realCompound(node.balance, node.dailyRate, days);
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
            ? { ...node, balance, lastCompoundAt: new Date().toISOString(), accruedPending: 0 }
            : {
                nodeId,
                balance,
                dailyRate,
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
          };
          return {
            nodeGrowths: { ...state.nodeGrowths, [nodeId]: updatedNode },
            txBreakdown: [tx, ...state.txBreakdown].slice(0, 500),
          };
        });
      },
    }),
    {
      name: "xcapital-profit-engine",
      version: 2,
      migrate: (persisted: unknown, version: number): unknown => {
        if (version < 2) {
          const old = (persisted ?? {}) as Record<string, unknown>;
          const state = (old.state ?? old) as {
            bullishSpikes?: BullishSpike[];
            nodeGrowths?: Record<string, NodeGrowth>;
            txBreakdown?: LiveTxBreakdown[];
          };
          const nodeGrowths: Record<string, NodeGrowth> = {};
          Object.entries(state.nodeGrowths ?? {}).forEach(([id, n]) => {
            nodeGrowths[id] = { ...n, accruedPending: 0 };
          });
          return {
            bullishSpikes: state.bullishSpikes ?? [],
            nodeGrowths,
            rateOverrides: {},
            txBreakdown: state.txBreakdown ?? [],
          };
        }
        return persisted;
      },
      partialize: (state) => ({
        bullishSpikes: state.bullishSpikes,
        nodeGrowths: state.nodeGrowths,
        rateOverrides: state.rateOverrides,
        txBreakdown: state.txBreakdown.slice(0, 200),
      }),
    },
  ),
);

/* ── Cross-tab sync ────────────────────────────────────────────────────────
   Admin actions (bullish spikes, daily-rate overrides) live on the admin
   tab's localStorage. Listening to `storage` propagates them to the user's
   dashboard tab instantly — no reload required. */
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key !== "xcapital-profit-engine" || !e.newValue) return;
    try {
      const parsed = JSON.parse(e.newValue);
      const incoming = parsed?.state ?? parsed;
      useProfitEngine.setState((current) => ({
        bullishSpikes: incoming.bullishSpikes ?? current.bullishSpikes,
        nodeGrowths: {
          ...current.nodeGrowths,
          ...(incoming.nodeGrowths ?? {}),
        },
        rateOverrides: {
          ...current.rateOverrides,
          ...(incoming.rateOverrides ?? {}),
        },
        txBreakdown: incoming.txBreakdown ?? current.txBreakdown,
      }));
    } catch {
      /* ignore malformed storage events */
    }
  });
}

