import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
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

export const investInFund = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { id: investmentId } = req.params;
    const { amount } = req.body;
    const userId = req.user!.id;

    const [fund, wallet] = await Promise.all([
      prisma.investment.findUnique({ where: { id: investmentId } }),
      prisma.wallet.findUnique({ where: { userId } }),
    ]);

    if (!fund || !fund.isOpen) {
      res.status(404).json({ success: false, message: 'Fund not found or closed' });
      return;
    }

    if (amount < Number(fund.minInvestment)) {
      res.status(400).json({
        success: false,
        message: `Minimum investment is $${fund.minInvestment}`,
      });
      return;
    }

    if (!wallet || Number(wallet.fiatBalance) < amount) {
      res.status(400).json({ success: false, message: 'Insufficient balance' });
      return;
    }

    const transaction = await prisma.transaction.create({
      data: {
        userId,
        walletId: wallet.id,
        amount,
        type: 'FUND_INVESTMENT',
        status: 'PENDING',
        metadata: { fundName: fund.name, fundId: investmentId },
      },
    });

    await prisma.adminAlert.create({
      data: {
        type: 'FUND_INVEST',
        userId,
        amount,
        method: 'fund',
        transactionId: transaction.id,
        metadata: { fundId: investmentId, fundName: fund.name },
      },
    });

    res.status(201).json({
      success: true,
      message: `Investment signal $${amount} in ${fund.name} sent for admin clearance`,
      data: { pending: true, transactionId: transaction.id },
    });
  } catch (error) {
    next(error);
  }
};

export const redeemInvestment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { investmentId } = req.params;
    const userId = req.user!.id;

    const userInvestment = await prisma.userInvestment.findFirst({
      where: { id: investmentId, userId, status: 'ACTIVE' },
      include: { investment: true },
    });

    if (!userInvestment) {
      res.status(404).json({ success: false, message: 'Investment not found' });
      return;
    }

    if (userInvestment.maturesAt && new Date() < userInvestment.maturesAt) {
      res.status(400).json({
        success: false,
        message: `Investment locked until ${userInvestment.maturesAt.toDateString()}`,
      });
      return;
    }

    const returnAmount = Number(userInvestment.amount) * (1 + Number(userInvestment.investment.targetReturn) / 100);
    const wallet = await prisma.wallet.findUnique({ where: { userId } });

    await prisma.$transaction(async (tx) => {
      await tx.userInvestment.update({
        where: { id: investmentId },
        data: { status: 'REDEEMED', redeemedAt: new Date() },
      });

      await tx.wallet.update({
        where: { userId },
        data: { fiatBalance: { increment: returnAmount } },
      });

      await tx.transaction.create({
        data: {
          userId,
          walletId: wallet!.id,
          amount: returnAmount,
          type: 'FUND_REDEMPTION',
          status: 'COMPLETED',
          reference: investmentId,
        },
      });
    });

    res.json({ success: true, message: 'Investment redeemed successfully', data: { amount: returnAmount } });
  } catch (error) {
    next(error);
  }
};
