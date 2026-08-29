import { Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { accrueUser, buildLedgerSeries } from '../services/accrualService';

export const getPortfolio = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await accrueUser(req.user!.id);
    const portfolio = await prisma.portfolio.findUnique({
      where: { userId: req.user!.id },
      include: {
        holdings: {
          include: {
            asset: { select: { symbol: true, name: true, type: true, price: true, priceChange24h: true, imageUrl: true } },
          },
          orderBy: { currentValue: 'desc' },
        },
      },
    });

    if (!portfolio) {
      res.status(404).json({ success: false, message: 'Portfolio not found' });
      return;
    }

    const [wallet, investments] = await Promise.all([
      prisma.wallet.findUnique({
        where: { userId: req.user!.id },
        select: { fiatBalance: true, totalYieldGenerated: true, approvedCapital: true },
      }),
      prisma.userInvestment.findMany({
        where: { userId: req.user!.id, status: 'ACTIVE' },
        select: { amount: true },
      }),
    ]);

    const cashBalance = Number(wallet?.fiatBalance ?? 0);
    const holdingsValue = portfolio.holdings.reduce(
      (sum, h) => sum + Number(h.currentValue),
      0,
    );
    const fundsValue = investments.reduce((sum, inv) => sum + Number(inv.amount), 0);
    const nav = Math.round((cashBalance + holdingsValue + fundsValue) * 100) / 100;

    res.json({
      success: true,
      data: {
        ...portfolio,
        cashBalance,
        holdingsValue,
        fundsValue,
        unallocated: cashBalance,
        totalValue: nav,
        nav,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getHoldings = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const portfolio = await prisma.portfolio.findUnique({ where: { userId: req.user!.id } });
    if (!portfolio) { res.json({ success: true, data: [] }); return; }

    const holdings = await prisma.portfolioHolding.findMany({
      where: { portfolioId: portfolio.id },
      include: { asset: true },
      orderBy: { currentValue: 'desc' },
    });

    res.json({ success: true, data: holdings });
  } catch (error) {
    next(error);
  }
};

export const getPerformance = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await accrueUser(req.user!.id);
    const { period = '30d' } = req.query;
    const start = getPeriodStart(String(period));
    const daysMap: Record<string, number> = { '1d': 1, '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
    const days = daysMap[String(period)] || 30;

    const [transactions, wallet] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          userId: req.user!.id,
          status: 'COMPLETED',
          createdAt: { gte: start },
        },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.wallet.findUnique({
        where: { userId: req.user!.id },
        select: { fiatBalance: true },
      }),
    ]);

    const allTx = await prisma.transaction.findMany({
      where: { userId: req.user!.id, status: 'COMPLETED' },
      orderBy: { createdAt: 'asc' },
      select: { type: true, status: true, amount: true, createdAt: true },
    });

    res.json({
      success: true,
      data: {
        transactions,
        series: buildLedgerSeries(allTx, Number(wallet?.fiatBalance ?? 0), days),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAllocation = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const portfolio = await prisma.portfolio.findUnique({
      where: { userId: req.user!.id },
      include: { holdings: { include: { asset: { select: { type: true } } } } },
    });

    if (!portfolio) { res.json({ success: true, data: [] }); return; }

    const wallet = await prisma.wallet.findUnique({
      where: { userId: req.user!.id },
      select: { fiatBalance: true },
    });
    const cash = Number(wallet?.fiatBalance ?? 0);

    const allocation: Record<string, number> = {};
    let total = 0;

    for (const holding of portfolio.holdings) {
      const type = holding.asset.type;
      allocation[type] = (allocation[type] || 0) + Number(holding.currentValue);
      total += Number(holding.currentValue);
    }
    if (cash > 0) {
      allocation.CASH = cash;
      total += cash;
    }

    const result = Object.entries(allocation).map(([type, value]) => ({
      type,
      value,
      percentage: total > 0 ? (value / total) * 100 : 0,
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

function getPeriodStart(period: string): Date {
  const now = new Date();
  const map: Record<string, number> = { '1d': 1, '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
  const days = map[period] || 30;
  now.setDate(now.getDate() - days);
  return now;
}
