/**
 * ══════════════════════════════════════════════════════════════════════════
 * useDailyRewards — Gamified systemic daily rewards (Click-to-Earn).
 *
 * Three-step daily telemetry calibration sequence:
 *   1. Sync Ground Station Link
 *   2. Verify Market Signal Matrix
 *   3. Claim Daily Liquidity Allocation
 *
 * Streak maintenance & decay:
 *   - Claiming all 3 steps on a calendar day builds the Daily Reward Tier.
 *   - Skipping 24h drops the tier by one.
 *   - A top-up instantly restores + protects the streak for 72h (Streak Shield).
 *
 * All timestamps are server-verifiable ISO strings; the store only trusts the
 * client clock for window math, and re-hydrates from persisted records.
 * ══════════════════════════════════════════════════════════════════════════
 */

"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export const DAILY_REWARD_STEPS = [
  "syncGroundStation",
  "verifyMarketSignals",
  "claimLiquidity",
] as const;
export type DailyRewardStep = (typeof DAILY_REWARD_STEPS)[number];

export const STEP_META: Record<
  DailyRewardStep,
  { index: number; label: string; short: string }
> = {
  syncGroundStation: {
    index: 0,
    label: "Sync Ground Station Link",
    short: "Sync Link",
  },
  verifyMarketSignals: {
    index: 1,
    label: "Verify Market Signal Matrix",
    short: "Verify Signals",
  },
  claimLiquidity: {
    index: 2,
    label: "Claim Daily Liquidity Allocation",
    short: "Claim Allocation",
  },
};

export interface DailyRewardRecord {
  stepCompletions: Partial<Record<DailyRewardStep, string>>; // step → last completed ISO
  lastFullClaimDay: string | null; // yyyy-m-d when all 3 were claimed
  fullClaimDays: string[];
  rewardTier: number; // starts at 1
  lastTopUpAt: string | null;
  streakProtectedUntil: string | null; // top-up restores + protects for 72h
}

interface DailyRewardsState {
  records: Record<string, DailyRewardRecord>;
  completeStep: (userId: string, step: DailyRewardStep) => DailyRewardRecord;
  registerTopUpStreakShield: (userId: string) => void;
  getRecord: (userId: string) => DailyRewardRecord;
  getStepState: (
    userId: string,
    step: DailyRewardStep,
    now?: number,
  ) => { completed: boolean; completedAt: string | null };
  getTier: (userId: string) => number;
  isFullyClaimedToday: (userId: string, now?: number) => boolean;
  getTierProgress: (userId: string, now?: number) => {
    tier: number;
    completedSteps: number;
    totalSteps: number;
    allClaimedToday: boolean;
    streakProtected: boolean;
    protectionRemainingMs: number;
  };
}

const HOUR_MS = 60 * 60 * 1000;
export const STREAK_SHIELD_WINDOW_MS = 72 * HOUR_MS;

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function defaultRecord(): DailyRewardRecord {
  return {
    stepCompletions: {},
    lastFullClaimDay: null,
    fullClaimDays: [],
    rewardTier: 1,
    lastTopUpAt: null,
    streakProtectedUntil: null,
  };
}

function pruneFullClaimDays(days: string[], now: Date): string[] {
  const cutoff = new Date(now.getTime() - 30 * 24 * HOUR_MS).getTime();
  return days.filter((d) => {
    const [y, m, day] = d.split("-").map(Number);
    return new Date(y, (m ?? 1) - 1, day ?? 1).getTime() >= cutoff;
  });
}

export const useDailyRewards = create<DailyRewardsState>()(
  persist(
    (set, get) => ({
      records: {},

      completeStep: (userId, step) => {
        const now = new Date();
        const today = dayKey(now);
        const rec = get().records[userId] ?? defaultRecord();

        const stepCompletions: DailyRewardRecord["stepCompletions"] = {
          ...rec.stepCompletions,
          [step]: now.toISOString(),
        };

        // All three steps must be stamped on TODAY's calendar date for the
        // daily liquidity claim to fire; previously-completed steps from
        // earlier days do not count toward today's sequence.
        const allToday = DAILY_REWARD_STEPS.every(
          (s) =>
            stepCompletions[s] != null &&
            dayKey(new Date(stepCompletions[s] as string)) === today,
        );

        let rewardTier = rec.rewardTier;
        let lastFullClaimDay = rec.lastFullClaimDay;
        let fullClaimDays = rec.fullClaimDays;

        if (allToday && lastFullClaimDay !== today) {
          // Completed all 3 in one day → claim liquidity allocation.
          rewardTier = Math.min(5, rec.rewardTier + 1);
          lastFullClaimDay = today;
          fullClaimDays = pruneFullClaimDays(
            [...new Set([...rec.fullClaimDays, today])],
            now,
          );
        }

        const updated: DailyRewardRecord = {
          ...rec,
          stepCompletions,
          rewardTier,
          lastFullClaimDay,
          fullClaimDays,
        };

        set({ records: { ...get().records, [userId]: updated } });
        return updated;
      },

      registerTopUpStreakShield: (userId) => {
        const now = new Date().toISOString();
        set((state) => {
          const rec = state.records[userId] ?? defaultRecord();
          return {
            records: {
              ...state.records,
              [userId]: {
                ...rec,
                lastTopUpAt: now,
                streakProtectedUntil: new Date(
                  Date.now() + STREAK_SHIELD_WINDOW_MS,
                ).toISOString(),
                // Top-up instantly restores the tier to its max level.
                rewardTier: Math.max(rec.rewardTier, 2),
              },
            },
          };
        });
      },

      getRecord: (userId) => get().records[userId] ?? defaultRecord(),

      getStepState: (userId, step, now = Date.now()) => {
        const rec = get().records[userId];
        if (!rec) return { completed: false, completedAt: null };
        const completedAt = rec.stepCompletions[step] ?? null;
        if (!completedAt) return { completed: false, completedAt: null };
        const completed = dayKey(new Date(completedAt)) === dayKey(new Date(now));
        return { completed, completedAt };
      },

      getTier: (userId) => get().getRecord(userId).rewardTier,

      isFullyClaimedToday: (userId, now = Date.now()) => {
        const rec = get().records[userId];
        if (!rec) return false;
        return DAILY_REWARD_STEPS.every(
          (s) =>
            rec.stepCompletions[s] != null &&
            dayKey(new Date(rec.stepCompletions[s]!)) === dayKey(new Date(now)),
        );
      },

      getTierProgress: (userId, now = Date.now()) => {
        const rec = get().records[userId];
        const tier = rec?.rewardTier ?? 1;
        const completedSteps = DAILY_REWARD_STEPS.filter(
          (s) => rec?.stepCompletions[s] != null,
        ).length;
        const allClaimedToday = get().isFullyClaimedToday(userId, now);
        const protectedUntil = rec?.streakProtectedUntil
          ? new Date(rec.streakProtectedUntil).getTime()
          : 0;
        const streakProtected = protectedUntil > now;
        const protectionRemainingMs = Math.max(0, protectedUntil - now);

        return {
          tier,
          completedSteps,
          totalSteps: DAILY_REWARD_STEPS.length,
          allClaimedToday,
          streakProtected,
          protectionRemainingMs,
        };
      },
    }),
    {
      name: "xcapital-daily-rewards",
      version: 1,
      partialize: (state) => ({
        records: state.records,
      }),
    },
  ),
);
