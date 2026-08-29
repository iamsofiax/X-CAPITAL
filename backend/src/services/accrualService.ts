import { Prisma, ProfitMode } from "@prisma/client";
import { prisma } from "../config/database";
import { logger } from "../utils/logger";

export const DEFAULT_DAILY_RATE = 0.015;
export const MAX_DAILY_RATE = 0.15;
export const TX_FLOOR_USD = 0.05;
export const MIN_ACCRUAL_MS = 5_000;

function toNum(value: Prisma.Decimal | number | null | undefined): number {
  if (value == null) return 0;
  return Number(value);
}

function roundUsd(value: number): number {
  return Math.round(value * 100) / 100;
}

export function computeYield(
  balance: number,
  dailyRate: number,
  elapsedDays: number,
  profitMode: ProfitMode | "linear" | "compound" = ProfitMode.COMPOUND,
): number {
  if (balance <= 0 || dailyRate <= 0 || elapsedDays <= 0) return 0;
  const mode = String(profitMode).toUpperCase();
  if (mode === "LINEAR") {
    return balance * dailyRate * elapsedDays;
  }
  return balance * (Math.pow(1 + dailyRate, elapsedDays) - 1);
}

export function clampDailyRate(rate: number): number {
  if (!Number.isFinite(rate) || rate <= 0) return DEFAULT_DAILY_RATE;
  return Math.min(MAX_DAILY_RATE, Math.max(0.0001, rate));
}

export async function ensureYieldConfig(userId: string) {
  return prisma.userYieldConfig.upsert({
    where: { userId },
    create: {
      userId,
      dailyRate: DEFAULT_DAILY_RATE,
      profitMode: ProfitMode.COMPOUND,
      profitMultiplier: 1,
      profitHold: false,
    },
    update: {},
  });
}

function resolveEffectiveRate(input: {
  dailyRate: number;
  profitMultiplier: number;
  nodeGoal: number | null;
  nextNodeRate: number | null;
  balance: number;
}): number {
  const balance = Math.max(0, input.balance);
  if (
    input.nodeGoal != null &&
    input.nodeGoal > 0 &&
    input.nextNodeRate != null &&
    input.nextNodeRate > 0 &&
    balance >= input.nodeGoal
  ) {
    return clampDailyRate(input.nextNodeRate);
  }
  const multiplier = Math.max(0.1, input.profitMultiplier || 1);
  return clampDailyRate(input.dailyRate * multiplier);
}

function spikeMultiplier(
  spike: { percentage: Prisma.Decimal | number; direction: string } | null,
): number {
  if (!spike) return 1;
  const pct = toNum(spike.percentage);
  if (pct <= 0) return 1;
  if (spike.direction === "down") {
    return Math.max(0, 1 - pct / 100);
  }
  return 1 + pct / 100;
}

export interface AccrualResult {
  userId: string;
  fiatBalance: number;
  totalYieldGenerated: number;
  approvedCapital: number;
  lastAccruedAt: string;
  yielded: number;
  held: boolean;
}

export async function accrueUser(userId: string): Promise<AccrualResult | null> {
  return prisma.$transaction(
    async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet) return null;

      const now = new Date();
      const lastAccruedAt = wallet.lastAccruedAt;

      if (!lastAccruedAt) {
        await tx.wallet.update({
          where: { userId },
          data: { lastAccruedAt: now },
        });
        return {
          userId,
          fiatBalance: toNum(wallet.fiatBalance),
          totalYieldGenerated: toNum(wallet.totalYieldGenerated),
          approvedCapital: toNum(wallet.approvedCapital),
          lastAccruedAt: now.toISOString(),
          yielded: 0,
          held: false,
        };
      }

      const elapsedMs = now.getTime() - lastAccruedAt.getTime();
      if (elapsedMs < MIN_ACCRUAL_MS) {
        return {
          userId,
          fiatBalance: toNum(wallet.fiatBalance),
          totalYieldGenerated: toNum(wallet.totalYieldGenerated),
          approvedCapital: toNum(wallet.approvedCapital),
          lastAccruedAt: lastAccruedAt.toISOString(),
          yielded: 0,
          held: false,
        };
      }

      let config = await tx.userYieldConfig.findUnique({ where: { userId } });
      if (!config) {
        config = await tx.userYieldConfig.create({
          data: {
            userId,
            dailyRate: DEFAULT_DAILY_RATE,
            profitMode: ProfitMode.COMPOUND,
            profitMultiplier: 1,
            profitHold: false,
          },
        });
      }

      if (config.profitHold) {
        await tx.wallet.update({
          where: { userId },
          data: { lastAccruedAt: now },
        });
        return {
          userId,
          fiatBalance: toNum(wallet.fiatBalance),
          totalYieldGenerated: toNum(wallet.totalYieldGenerated),
          approvedCapital: toNum(wallet.approvedCapital),
          lastAccruedAt: now.toISOString(),
          yielded: 0,
          held: true,
        };
      }

      const balance = toNum(wallet.fiatBalance);
      if (balance <= 0) {
        await tx.wallet.update({
          where: { userId },
          data: { lastAccruedAt: now },
        });
        return {
          userId,
          fiatBalance: 0,
          totalYieldGenerated: toNum(wallet.totalYieldGenerated),
          approvedCapital: toNum(wallet.approvedCapital),
          lastAccruedAt: now.toISOString(),
          yielded: 0,
          held: false,
        };
      }

      await tx.yieldSpike.updateMany({
        where: { userId, active: true, endsAt: { lte: now } },
        data: { active: false },
      });

      const activeSpike = await tx.yieldSpike.findFirst({
        where: {
          userId,
          active: true,
          startsAt: { lte: now },
          endsAt: { gt: now },
        },
        orderBy: { createdAt: "desc" },
      });

      const dailyRate = resolveEffectiveRate({
        dailyRate: toNum(config.dailyRate),
        profitMultiplier: toNum(config.profitMultiplier),
        nodeGoal: config.nodeGoal == null ? null : toNum(config.nodeGoal),
        nextNodeRate:
          config.nextNodeRate == null ? null : toNum(config.nextNodeRate),
        balance,
      });

      const elapsedDays = elapsedMs / 86_400_000;
      const rawYield = computeYield(
        balance,
        dailyRate,
        elapsedDays,
        config.profitMode,
      );
      const yielded = roundUsd(rawYield * spikeMultiplier(activeSpike));

      if (yielded < 0.01) {
        await tx.wallet.update({
          where: { userId },
          data: { lastAccruedAt: now },
        });
        return {
          userId,
          fiatBalance: balance,
          totalYieldGenerated: toNum(wallet.totalYieldGenerated),
          approvedCapital: toNum(wallet.approvedCapital),
          lastAccruedAt: now.toISOString(),
          yielded: 0,
          held: false,
        };
      }

      const nextBalance = roundUsd(balance + yielded);
      const nextTotalYield = roundUsd(
        toNum(wallet.totalYieldGenerated) + yielded,
      );

      await tx.wallet.update({
        where: { userId },
        data: {
          fiatBalance: nextBalance,
          totalYieldGenerated: nextTotalYield,
          lastAccruedAt: now,
        },
      });

      if (yielded >= TX_FLOOR_USD) {
        await tx.transaction.create({
          data: {
            userId,
            walletId: wallet.id,
            amount: yielded,
            type: "YIELD",
            status: "COMPLETED",
            metadata: {
              dailyRate,
              profitMode: config.profitMode,
              spikePct: activeSpike ? toNum(activeSpike.percentage) : 0,
              elapsedDays,
              balanceAfter: nextBalance,
            },
          },
        });
      }

      return {
        userId,
        fiatBalance: nextBalance,
        totalYieldGenerated: nextTotalYield,
        approvedCapital: toNum(wallet.approvedCapital),
        lastAccruedAt: now.toISOString(),
        yielded,
        held: false,
      };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

export async function accrueAllActiveWallets(): Promise<number> {
  const wallets = await prisma.wallet.findMany({
    where: { fiatBalance: { gt: 0 } },
    select: { userId: true },
  });
  let count = 0;
  for (const wallet of wallets) {
    try {
      const result = await accrueUser(wallet.userId);
      if (result && result.yielded > 0) count += 1;
    } catch (error) {
      logger.warn(`Accrual skipped for ${wallet.userId}:`, error);
    }
  }
  return count;
}

export function startAccrualWorker(intervalMs = 20_000): NodeJS.Timeout {
  const run = () => {
    void accrueAllActiveWallets()
      .then((n) => {
        if (n > 0) logger.debug(`Accrual worker credited ${n} wallet(s)`);
      })
      .catch((error) => logger.warn("Accrual worker failed:", error));
  };
  run();
  const timer = setInterval(run, intervalMs);
  timer.unref();
  return timer;
}

export function buildLedgerFromTransactions(
  transactions: Array<{
    type: string;
    status: string;
    amount: Prisma.Decimal | number;
  }>,
  liveBalance: number,
  totalYieldGenerated: number,
) {
  let approvedCapital = 0;
  for (const tx of transactions) {
    if (tx.status !== "COMPLETED") continue;
    const amount = Math.abs(toNum(tx.amount));
    if (
      tx.type === "DEPOSIT" ||
      tx.type === "DIVIDEND" ||
      tx.type === "FUND_REDEMPTION"
    ) {
      approvedCapital += amount;
    } else if (tx.type === "WITHDRAWAL" || tx.type === "FEE") {
      approvedCapital -= amount;
    }
  }
  approvedCapital = Math.max(0, roundUsd(approvedCapital));
  const compoundYield = Math.max(0, roundUsd(totalYieldGenerated));
  const totalReturnUsd = roundUsd(liveBalance - approvedCapital);
  const totalReturnPct =
    approvedCapital > 0 ? (totalReturnUsd / approvedCapital) * 100 : 0;
  return {
    approvedCapital,
    compoundYield,
    liveBalance: roundUsd(liveBalance),
    totalReturnUsd,
    totalReturnPct,
  };
}

export function buildLedgerSeries(
  transactions: Array<{
    type: string;
    status: string;
    amount: Prisma.Decimal | number;
    createdAt: Date;
  }>,
  liveBalance: number,
  days = 30,
): Array<{ date: string; value: number }> {
  const windowDays = Math.max(1, Math.min(90, days));
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - windowDays);
  start.setHours(0, 0, 0, 0);

  const completed = transactions
    .filter((tx) => tx.status === "COMPLETED")
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

  let running = 0;
  for (const tx of completed) {
    if (new Date(tx.createdAt) < start) {
      const amount = Math.abs(toNum(tx.amount));
      if (
        tx.type === "DEPOSIT" ||
        tx.type === "YIELD" ||
        tx.type === "DIVIDEND" ||
        tx.type === "FUND_REDEMPTION"
      ) {
        running += amount;
      } else if (
        tx.type === "WITHDRAWAL" ||
        tx.type === "FEE" ||
        tx.type === "FUND_INVESTMENT"
      ) {
        running -= amount;
      }
    }
  }
  running = Math.max(0, running);

  const series: Array<{ date: string; value: number }> = [];
  for (let i = 0; i <= windowDays; i++) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);
    for (const tx of completed) {
      const at = new Date(tx.createdAt);
      if (at < day || at > dayEnd) continue;
      if (at < start) continue;
      const amount = Math.abs(toNum(tx.amount));
      if (
        tx.type === "DEPOSIT" ||
        tx.type === "YIELD" ||
        tx.type === "DIVIDEND" ||
        tx.type === "FUND_REDEMPTION"
      ) {
        running += amount;
      } else if (
        tx.type === "WITHDRAWAL" ||
        tx.type === "FEE" ||
        tx.type === "FUND_INVESTMENT"
      ) {
        running -= amount;
      }
    }
    running = Math.max(0, roundUsd(running));
    series.push({
      date: day.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      value: running,
    });
  }

  if (series.length > 0) {
    series[series.length - 1].value = roundUsd(liveBalance);
  }
  return series;
}
