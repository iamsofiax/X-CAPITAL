import { Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getPortfolio = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
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

    const { userCash } = await import('../services/ledgerService');
    const cash = await userCash(req.user!.id, 'USD');

    res.json({ success: true, data: { ...portfolio, cashBalance: cash.toFixed() } });
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
    const { period = '30d' } = req.query;

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: req.user!.id,
        status: 'COMPLETED',
        type: 'TRADE',
        createdAt: {
          gte: getPeriodStart(String(period)),
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json({ success: true, data: transactions });
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

    const allocation: Record<string, number> = {};
    let total = 0;

    for (const holding of portfolio.holdings) {
      const type = holding.asset.type;
      allocation[type] = (allocation[type] || 0) + Number(holding.currentValue);
      total += Number(holding.currentValue);
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
