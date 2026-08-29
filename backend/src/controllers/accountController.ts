import { Response, NextFunction } from "express";
import { prisma } from "../config/database";
import { AuthRequest } from "../middleware/auth";
import {
  accrueUser,
  buildLedgerFromTransactions,
  buildLedgerSeries,
  ensureYieldConfig,
} from "../services/accrualService";

function toNum(value: unknown): number {
  return Number(value ?? 0);
}

export const getAccountSnapshot = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.id;
    await ensureYieldConfig(userId);
    await accrueUser(userId);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        tier: true,
        kycStatus: true,
        accreditationStatus: true,
        createdAt: true,
        lastLoginAt: true,
        wallet: true,
        yieldConfig: true,
        portfolio: {
          include: {
            holdings: {
              include: {
                asset: {
                  select: {
                    symbol: true,
                    name: true,
                    type: true,
                    price: true,
                    priceChange24h: true,
                    imageUrl: true,
                  },
                },
              },
              orderBy: { currentValue: "desc" },
            },
          },
        },
        investments: {
          where: { status: "ACTIVE" },
          select: { id: true, amount: true, status: true, investedAt: true },
        },
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 200,
        },
      },
    });

    if (!user || !user.wallet) {
      res.status(404).json({ success: false, message: "Account not found" });
      return;
    }

    const now = new Date();
    const activeSpike = await prisma.yieldSpike.findFirst({
      where: {
        userId,
        active: true,
        startsAt: { lte: now },
        endsAt: { gt: now },
      },
      orderBy: { createdAt: "desc" },
    });

    const cash = toNum(user.wallet.fiatBalance);
    const holdingsValue = (user.portfolio?.holdings ?? []).reduce(
      (sum, holding) => sum + toNum(holding.currentValue),
      0,
    );
    const fundsValue = user.investments.reduce(
      (sum, inv) => sum + toNum(inv.amount),
      0,
    );
    const nav = Math.round((cash + holdingsValue + fundsValue) * 100) / 100;
    const unallocated = cash;

    const ledger = buildLedgerFromTransactions(
      user.transactions,
      cash,
      toNum(user.wallet.totalYieldGenerated),
    );
    const series = buildLedgerSeries(user.transactions, cash, 30);

    const dailyRate = toNum(user.yieldConfig?.dailyRate);
    const profitMultiplier = toNum(user.yieldConfig?.profitMultiplier) || 1;
    const profitRatePct = dailyRate * 100;

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          tier: user.tier,
          kycStatus: user.kycStatus,
          accreditationStatus: user.accreditationStatus,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt,
        },
        wallet: {
          id: user.wallet.id,
          fiatBalance: cash,
          cryptoBalance: toNum(user.wallet.cryptoBalance),
          lockedBalance: toNum(user.wallet.lockedBalance),
          walletAddress: user.wallet.walletAddress,
          lastAccruedAt: user.wallet.lastAccruedAt,
          totalYieldGenerated: toNum(user.wallet.totalYieldGenerated),
          approvedCapital: ledger.approvedCapital,
        },
        yieldConfig: {
          dailyRate,
          profitRate: profitRatePct,
          profitMode:
            user.yieldConfig?.profitMode === "LINEAR" ? "linear" : "compound",
          profitMultiplier,
          profitHold: user.yieldConfig?.profitHold ?? false,
          nodeGoal: user.yieldConfig?.nodeGoal
            ? toNum(user.yieldConfig.nodeGoal)
            : null,
          nextNodeRate: user.yieldConfig?.nextNodeRate
            ? toNum(user.yieldConfig.nextNodeRate) * 100
            : null,
        },
        activeSpike: activeSpike
          ? {
              id: activeSpike.id,
              percentage: toNum(activeSpike.percentage),
              direction: activeSpike.direction,
              label: activeSpike.label,
              startsAt: activeSpike.startsAt,
              endsAt: activeSpike.endsAt,
            }
          : null,
        portfolio: {
          id: user.portfolio?.id ?? null,
          cashBalance: cash,
          holdingsValue,
          fundsValue,
          nav,
          unallocated,
          totalCost: toNum(user.portfolio?.totalCost),
          totalPnL: Math.round((nav - ledger.approvedCapital) * 100) / 100,
          holdings: user.portfolio?.holdings ?? [],
        },
        ledger: {
          ...ledger,
          nav,
          unallocated,
          eventCount: user.transactions.length,
        },
        series,
        transactions: user.transactions,
      },
    });
  } catch (error) {
    next(error);
  }
};
