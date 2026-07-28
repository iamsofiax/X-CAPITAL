"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/* ══════════════════════════════════════════════════════════════════════════
   Profit Engine Store — Live compounding, bullish spikes, tx breakdown
   Separated from main store to avoid churn on the persist boundary.
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
  initNode: (nodeId: string, balance: number, dailyRate?: number) => void;
  tickCompound: (nodeId: string) => NodeGrowth | null;
  getCompoundedProjection: (nodeId: string, days: number) => number;

  // Live tx breakdown feed
  txBreakdown: LiveTxBreakdown[];
  pushTx: (tx: LiveTxBreakdown) => void;
}

const DEFAULT_DAILY_RATE = 0.015; // 1.5% base

function realCompound(p: number, r: number, t: number): number {
  return p * Math.pow(1 + r, t);
}

export const useProfitEngine = create<ProfitEngineState>()(
  persist(
    (set, get) => ({
      bullishSpikes: [],
      nodeGrowths: {},
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
          return {
            nodeGrowths: {
              ...state.nodeGrowths,
              [nodeId]: {
                nodeId,
                balance,
                dailyRate,
                lastCompoundAt: new Date().toISOString(),
                compoundCount: 0,
                totalYieldGenerated: 0,
              },
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
        const elapsedHours = Math.max(0, (now - last) / (1000 * 60 * 60));

        if (elapsedHours < 1) return node; // min 1h granularity

        const dailyRate = node.dailyRate;
        // Compute compound for elapsed fraction of a day
        const compoundFactor = Math.pow(1 + dailyRate, elapsedHours / 24);
        const newBalance = node.balance * compoundFactor;
        const yieldGenerated = newBalance - node.balance;

        // Apply bullish spike if active
        const spike = state.bullishSpikes.find(
          (s) => s.targetUserId === nodeId && s.active,
        );

        const spikeMultiplier = spike ? 1 + spike.percentage / 100 : 1;
        const finalBalance = node.balance + yieldGenerated * spikeMultiplier;

        // Push tx breakdown
        const tx: LiveTxBreakdown = {
          id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          time: new Date().toISOString(),
          type: "PROFIT",
          amount: yieldGenerated * spikeMultiplier,
          balanceAfter: finalBalance,
          source: spike
            ? `compound + bull spike (${spike.percentage}%)`
            : "compound",
        };

        const updated: NodeGrowth = {
          ...node,
          balance: finalBalance,
          dailyRate,
          lastCompoundAt: new Date().toISOString(),
          compoundCount: node.compoundCount + 1,
          totalYieldGenerated:
            node.totalYieldGenerated + yieldGenerated * spikeMultiplier,
        };

        set((s) => ({
          nodeGrowths: { ...s.nodeGrowths, [nodeId]: updated },
          txBreakdown: [tx, ...s.txBreakdown].slice(0, 500),
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
    }),
    {
      name: "xcapital-profit-engine",
      version: 1,
      partialize: (state) => ({
        bullishSpikes: state.bullishSpikes,
        nodeGrowths: state.nodeGrowths,
        txBreakdown: state.txBreakdown.slice(0, 200),
      }),
    },
  ),
);
