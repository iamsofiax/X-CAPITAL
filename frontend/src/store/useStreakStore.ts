/**
 * ══════════════════════════════════════════════════════════════════════════
 * useStreakStore — Compound Velocity persistence (behavioral retention core).
 *
 * Tracks real top-up / withdrawal timestamps per user and derives the
 * "Addictive Compounding Threshold" state that every retention widget reads:
 *
 *   - Active top-up velocity boosts (Daily 1.15× / 48h 1.10× / Weekly vault)
 *   - Compound streak level (L1–L5) — withdraws reset to L1 and strip boosts
 *   - Next-tier fuel-gauge targets (what the user must do to keep/upgrade)
 *
 * Withdrawal enforcement ("Streak Shield"): any top-up BEFORE the last
 * withdrawal is ignored for boost eligibility — withdrawing really does strip
 * active APY multipliers, and a fresh top-up restores them instantly.
 *
 * Persisted per-user in localStorage (zustand persist + cross-tab echo guard).
 * ══════════════════════════════════════════════════════════════════════════
 */

"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TopUpBoostKey, YieldBoost } from "@/lib/compoundMath";
import { TOP_UP_BOOSTS, TOP_UP_BOOST_KEYS } from "@/lib/compoundMath";
import { projectWithBoosts } from "@/lib/compoundMath";

export const STREAK_LEVEL_DAYS = [0, 2, 4, 7, 14] as const;

const HOUR_MS = 60 * 60 * 1000;
export const DAILY_BOOST_WINDOW_MS = 24 * HOUR_MS;
export const FORTY_EIGHT_BOOST_WINDOW_MS = 48 * HOUR_MS;
export const WEEKLY_STREAK_DAYS_REQUIRED = 7;

export interface StreakRecord {
  topUpTimestamps: string[];
  streakLevel: number;
  consecutiveDays: number;
  lastDepositDay: string | null;
  weeklyDepositDays: string[];
  weeklyUnlockedAt: string | null;
  lastWithdrawalAt: string | null;
  boostAnchorAt: string | null;
}

export interface NextTierTarget {
  tier: TopUpBoostKey;
  label: string;
  multiplier: number;
  required: string;
  remainingMs: number;
  progress: number;
  mode: "maintain" | "unlock";
}

interface StreakState {
  records: Record<string, StreakRecord>;
  registerTopUp: (userId: string, amount?: number) => void;
  registerWithdrawal: (userId: string) => void;
  getActiveBoosts: (userId: string, now?: number) => TopUpBoostKey[];
  getActiveBoostDetails: (userId: string, now?: number) => YieldBoost[];
  getStreakLevel: (userId: string) => number;
  getRecord: (userId: string) => StreakRecord;
  getNextTierTarget: (userId: string, now?: number) => NextTierTarget | null;
  getForfeitedProjection: (
    userId: string,
    balance: number,
    dailyRate: number,
  ) => { projected30d: number; lostYield30d: number; level: number; boosts: TopUpBoostKey[] };
}

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function yesterdayKey(now: Date): string {
  const d = new Date(now.getTime() - 24 * HOUR_MS);
  return dayKey(d);
}

/** "04:12:09" style countdown from a millisecond duration. */
export function formatCountdown(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

function defaultRecord(): StreakRecord {
  return {
    topUpTimestamps: [],
    streakLevel: 1,
    consecutiveDays: 0,
    lastDepositDay: null,
    weeklyDepositDays: [],
    weeklyUnlockedAt: null,
    lastWithdrawalAt: null,
    boostAnchorAt: null,
  };
}

function levelFromConsecutiveDays(days: number): number {
  let level = 1;
  for (let i = 1; i < STREAK_LEVEL_DAYS.length; i++) {
    if (days >= STREAK_LEVEL_DAYS[i]) level = i + 1;
  }
  return level;
}

function pruneWeeklyDays(days: string[], now: Date): string[] {
  const cutoff = new Date(now.getTime() - 7 * 24 * HOUR_MS).getTime();
  return days.filter((d) => {
    const [y, m, day] = d.split("-").map(Number);
    return new Date(y, (m ?? 1) - 1, day ?? 1).getTime() >= cutoff;
  });
}

export const useStreakStore = create<StreakState>()(
  persist(
    (set, get) => ({
      records: {},

      registerTopUp: (userId) => {
        set((state) => {
          const rec = state.records[userId] ?? defaultRecord();
          const now = new Date();
          const today = dayKey(now);
          const yday = yesterdayKey(now);

          const topUpTimestamps = [...rec.topUpTimestamps, now.toISOString()].slice(-60);

          // Consecutive-day streak
          let consecutiveDays = rec.consecutiveDays;
          if (rec.lastDepositDay === today) {
            // same-day top-up — streak unchanged
          } else if (rec.lastDepositDay === yday) {
            consecutiveDays += 1;
          } else {
            consecutiveDays = 1;
          }

          // Rolling weekly window for the structural vault bonus
          const weeklyDepositDays = pruneWeeklyDays(
            [...new Set([...rec.weeklyDepositDays, today])],
            now,
          );
          const weeklyUnlockedAt =
            rec.weeklyUnlockedAt ??
            (weeklyDepositDays.length >= WEEKLY_STREAK_DAYS_REQUIRED
              ? now.toISOString()
              : null);

          return {
            records: {
              ...state.records,
              [userId]: {
                ...rec,
                topUpTimestamps,
                consecutiveDays,
                lastDepositDay: today,
                weeklyDepositDays,
                weeklyUnlockedAt,
                streakLevel: levelFromConsecutiveDays(consecutiveDays),
                // A top-up after a withdrawal re-arms the boost anchor.
                boostAnchorAt:
                  rec.boostAnchorAt &&
                  (rec.lastDepositDay === today || rec.lastDepositDay === yday)
                    ? rec.boostAnchorAt
                    : null,
              },
            },
          };
        });
      },

      registerWithdrawal: (userId) => {
        set((state) => {
          const rec = state.records[userId];
          if (!rec) return state;
          const now = new Date().toISOString();
          return {
            records: {
              ...state.records,
              [userId]: {
                ...rec,
                streakLevel: 1,
                consecutiveDays: 0,
                lastDepositDay: null,
                weeklyUnlockedAt: null,
                weeklyDepositDays: [],
                lastWithdrawalAt: now,
                // Anchor: pre-withdrawal top-ups never count toward active
                // APY multipliers — the streak shield.
                boostAnchorAt: now,
              },
            },
          };
        });
      },

      getRecord: (userId) => get().records[userId] ?? defaultRecord(),

      getActiveBoosts: (userId, now = Date.now()) => {
        const rec = get().records[userId];
        if (!rec) return [];
        const anchorMs = rec.boostAnchorAt
          ? new Date(rec.boostAnchorAt).getTime()
          : 0;
        const eligible = rec.topUpTimestamps.filter(
          (t) => new Date(t).getTime() >= anchorMs,
        );
        const active: TopUpBoostKey[] = [];

        const hasRecent = (windowMs: number) =>
          eligible.some((t) => now - new Date(t).getTime() < windowMs);

        // Daily top-up → +0.15% base boost, 1.15× ROI multiplier for 24h
        if (hasRecent(DAILY_BOOST_WINDOW_MS)) active.push("daily");
        // 48-hour streak → requires top-ups on 2 consecutive days
        if (
          hasRecent(FORTY_EIGHT_BOOST_WINDOW_MS) &&
          rec.consecutiveDays >= 2
        ) {
          active.push("fortyEight");
        }
        // Weekly vault bonus — structural once unlocked
        if (rec.weeklyUnlockedAt) active.push("weekly");

        return active;
      },

      getActiveBoostDetails: (userId, now) => {
        const keys = get().getActiveBoosts(userId, now);
        return TOP_UP_BOOST_KEYS.filter((k) => keys.includes(k)).map(
          (k) => TOP_UP_BOOSTS[k],
        );
      },

      getStreakLevel: (userId) => get().getRecord(userId).streakLevel,

      getNextTierTarget: (userId, now = Date.now()) => {
        const rec = get().records[userId];
        if (!rec) return null;
        const active = get().getActiveBoosts(userId, now);
        const boost = (k: TopUpBoostKey): YieldBoost => TOP_UP_BOOSTS[k];

        // Tier order: daily → fortyEight → weekly
        if (!active.includes("daily")) {
          return {
            tier: "daily",
            label: boost("daily").label,
            multiplier: boost("daily").multiplier,
            required: "Make your next top-up to unlock the daily accelerator",
            remainingMs: DAILY_BOOST_WINDOW_MS,
            progress: 0,
            mode: "unlock",
          };
        }

        if (!active.includes("fortyEight")) {
          const lastTopUp =
            rec.topUpTimestamps[rec.topUpTimestamps.length - 1] ??
            new Date().toISOString();
          const remainingMs = Math.max(
            0,
            DAILY_BOOST_WINDOW_MS - (now - new Date(lastTopUp).getTime()),
          );
          return {
            tier: "fortyEight",
            label: boost("fortyEight").label,
            multiplier: boost("fortyEight").multiplier,
            required: `Deposit again in the next ${formatCountdown(remainingMs)} to keep your streak`,
            remainingMs,
            progress: Math.min(1, rec.consecutiveDays / 2),
            mode: "unlock",
          };
        }

        if (!active.includes("weekly")) {
          const progress =
            rec.weeklyDepositDays.length / WEEKLY_STREAK_DAYS_REQUIRED;
          return {
            tier: "weekly",
            label: boost("weekly").label,
            multiplier: 1,
            required: `${rec.weeklyDepositDays.length}/${WEEKLY_STREAK_DAYS_REQUIRED} deposit days — vault bonus locks in at 7`,
            remainingMs: 7 * 24 * HOUR_MS,
            progress: Math.min(1, progress),
            mode: "unlock",
          };
        }

        // All unlocked — maintain the daily window.
        const lastTopUp =
          rec.topUpTimestamps[rec.topUpTimestamps.length - 1] ??
          new Date().toISOString();
        const remainingMs = Math.max(
          0,
          DAILY_BOOST_WINDOW_MS - (now - new Date(lastTopUp).getTime()),
        );
        if (remainingMs <= 0) return null;
        return {
          tier: "daily",
          label: boost("daily").label,
          multiplier: boost("daily").multiplier,
          required: `Deposit within ${formatCountdown(remainingMs)} to maintain your 1.15× Dynamic Multiplier`,
          remainingMs,
          progress: 1 - remainingMs / DAILY_BOOST_WINDOW_MS,
          mode: "maintain",
        };
      },

      getForfeitedProjection: (userId, balance, dailyRate) => {
        const record = get().getRecord(userId);
        const boosts = get().getActiveBoosts(userId);
        // What the next 30 days would have produced WITH active boosts.
        const boosted = projectWithBoosts(balance, dailyRate, 30, boosts);
        return {
          projected30d: boosted.gross,
          lostYield30d: boosted.netReturn,
          level: record.streakLevel,
          boosts,
        };
      },
    }),
    {
      name: "xcapital-compound-velocity",
      version: 1,
      partialize: (state) => ({
        records: state.records,
      }),
    },
  ),
);
