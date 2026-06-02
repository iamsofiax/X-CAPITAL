import { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { validationResult } from 'express-validator';
import { TransactionType } from '@prisma/client';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getAlerts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { status } = req.query;
    const where =
      status && typeof status === 'string'
        ? { status: status as 'PENDING' | 'APPROVED' | 'REJECTED' }
        : {};

    const alerts = await prisma.adminAlert.findMany({
      where,
      include: {
        user: { select: { email: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    res.json({ success: true, data: alerts });
  } catch (error) {
    next(error);
  }
};

export const approveAlert = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const alert = await prisma.adminAlert.findUnique({ where: { id } });
    if (!alert || alert.status !== 'PENDING') {
      res.status(404).json({ success: false, message: 'Alert not found' });
      return;
    }

    const wallet = await prisma.wallet.findUnique({
      where: { userId: alert.userId },
    });
    if (!wallet) {
      res.status(404).json({ success: false, message: 'Wallet not found' });
      return;
    }

    await prisma.$transaction(async (tx) => {
      if (alert.type === 'DEPOSIT') {
        await tx.wallet.update({
          where: { userId: alert.userId },
          data: { fiatBalance: { increment: alert.amount } },
        });
        if (alert.transactionId) {
          await tx.transaction.update({
            where: { id: alert.transactionId },
            data: { status: 'COMPLETED' },
          });
        }
      } else if (alert.type === 'FUND_INVEST' || alert.type === 'WITHDRAW') {
        const bal = Number(wallet.fiatBalance);
        if (bal < Number(alert.amount)) {
          throw new Error('Insufficient balance');
        }
        await tx.wallet.update({
          where: { userId: alert.userId },
          data: { fiatBalance: { decrement: alert.amount } },
        });
        if (alert.transactionId) {
          await tx.transaction.update({
            where: { id: alert.transactionId },
            data: { status: 'COMPLETED' },
          });
        }
        if (alert.type === 'FUND_INVEST') {
          const meta = alert.metadata as { fundId?: string } | null;
          if (meta?.fundId) {
            const fund = await tx.investment.findUnique({
              where: { id: meta.fundId },
            });
            if (fund) {
              const maturesAt = new Date();
              maturesAt.setDate(maturesAt.getDate() + fund.lockPeriodDays);
              await tx.userInvestment.create({
                data: {
                  userId: alert.userId,
                  investmentId: meta.fundId,
                  amount: alert.amount,
                  maturesAt,
                },
              });
              await tx.investment.update({
                where: { id: meta.fundId },
                data: { currentAUM: { increment: alert.amount } },
              });
            }
          }
        }
      }

      await tx.adminAlert.update({
        where: { id },
        data: { status: 'APPROVED', resolvedAt: new Date() },
      });
    });

    res.json({ success: true, message: 'Alert approved and balance updated' });
  } catch (error) {
    next(error);
  }
};

export const rejectAlert = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body as { reason?: string };

    const alert = await prisma.adminAlert.findUnique({ where: { id } });
    if (!alert || alert.status !== 'PENDING') {
      res.status(404).json({ success: false, message: 'Alert not found' });
      return;
    }

    await prisma.$transaction(async (tx) => {
      if (alert.transactionId) {
        await tx.transaction.update({
          where: { id: alert.transactionId },
          data: {
            status: 'CANCELLED',
            metadata: {
              ...(typeof alert.metadata === 'object' ? alert.metadata : {}),
              rejectionReason: reason ?? 'Rejected by admin',
            },
          },
        });
      }
      await tx.adminAlert.update({
        where: { id },
        data: { status: 'REJECTED', resolvedAt: new Date() },
      });
    });

    res.json({ success: true, message: 'Alert rejected' });
  } catch (error) {
    next(error);
  }
};

export const listUsers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        tier: true,
        kycStatus: true,
        accreditationStatus: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
        wallet: { select: { id: true, fiatBalance: true } },
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 40,
          select: {
            id: true,
            amount: true,
            type: true,
            status: true,
            metadata: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

export const adjustUserBalance = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { userId } = req.params;
    const { amount, direction, note, txType } = req.body as {
      amount: number;
      direction: 'credit' | 'debit';
      note?: string;
      txType?: TransactionType;
    };

    if (!amount || amount <= 0 || !['credit', 'debit'].includes(direction)) {
      res.status(400).json({ success: false, message: 'Invalid amount or direction' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true },
    });
    if (!user?.wallet) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const resolvedType: TransactionType =
      txType ??
      (direction === 'credit' ? 'DEPOSIT' : 'WITHDRAWAL');

    const result = await prisma.$transaction(async (tx) => {
      if (direction === 'debit') {
        const bal = Number(user.wallet!.fiatBalance);
        if (bal < amount) {
          throw new Error('Insufficient balance');
        }
        await tx.wallet.update({
          where: { userId },
          data: { fiatBalance: { decrement: amount } },
        });
      } else {
        await tx.wallet.update({
          where: { userId },
          data: { fiatBalance: { increment: amount } },
        });
      }

      const transaction = await tx.transaction.create({
        data: {
          userId,
          walletId: user.wallet!.id,
          amount,
          type: resolvedType,
          status: 'COMPLETED',
          metadata: {
            note: note ?? (direction === 'credit' ? 'Admin fund' : 'Admin debit'),
            performedBy: req.user!.email,
            adminAdjust: true,
            direction,
          },
        },
      });

      const wallet = await tx.wallet.findUnique({
        where: { userId },
        select: { fiatBalance: true },
      });

      return { wallet, transaction };
    });

    res.json({
      success: true,
      message: 'Balance updated',
      data: {
        fiatBalance: Number(result.wallet?.fiatBalance ?? 0),
        transaction: result.transaction,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Insufficient balance') {
      res.status(400).json({ success: false, message: error.message });
      return;
    }
    next(error);
  }
};

export const createUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { email, password, firstName, lastName, tier, phone } = req.body as {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      tier?: 'CORE' | 'GOLD' | 'BLACK';
      phone?: string;
    };

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ success: false, message: 'Email already registered' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          passwordHash,
          firstName,
          lastName,
          phone,
          tier: tier ?? 'CORE',
          kycStatus: 'APPROVED',
        },
      });
      await tx.wallet.create({ data: { userId: newUser.id } });
      await tx.portfolio.create({
        data: { userId: newUser.id, totalValue: 0, totalCost: 0, totalPnL: 0 },
      });
      return newUser;
    });

    res.status(201).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        tier: user.tier,
        kycStatus: user.kycStatus,
        balance: 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const requestFundInvest = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { fundId } = req.params;
    const { amount } = req.body as { amount: number };
    const userId = req.user!.id;

    const [fund, wallet] = await Promise.all([
      prisma.investment.findUnique({ where: { id: fundId } }),
      prisma.wallet.findUnique({ where: { userId } }),
    ]);

    if (!fund || !fund.isOpen) {
      res.status(404).json({ success: false, message: 'Fund not found' });
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
        metadata: { fundName: fund.name, fundId },
      },
    });

    await prisma.adminAlert.create({
      data: {
        type: 'FUND_INVEST',
        userId,
        amount,
        method: 'fund',
        transactionId: transaction.id,
        metadata: { fundId, fundName: fund.name },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Fund investment signal sent for admin clearance',
      data: { transaction, alert: true },
    });
  } catch (error) {
    next(error);
  }
};
