import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getFunds = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const funds = await prisma.investment.findMany({
      where: { isOpen: true },
      orderBy: { currentAUM: 'desc' },
    });
    res.json({ success: true, data: funds });
  } catch (error) {
    next(error);
  }
};

export const getFund = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const fund = await prisma.investment.findUnique({ where: { id: req.params.id } });
    if (!fund) {
      res.status(404).json({ success: false, message: 'Fund not found' });
      return;
    }
    res.json({ success: true, data: fund });
  } catch (error) {
    next(error);
  }
};

export const getMyInvestments = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const investments = await prisma.userInvestment.findMany({
      where: { userId: req.user!.id },
      include: { investment: true },
      orderBy: { investedAt: 'desc' },
    });
    res.json({ success: true, data: investments });
  } catch (error) {
    next(error);
  }
};
