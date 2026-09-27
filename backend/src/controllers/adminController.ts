import { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { validationResult } from 'express-validator';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { isAdminEmail } from '../middleware/adminAuth';
import { createError } from '../middleware/errorHandler';
import { ensureUserAccounts, userBalances } from '../services/ledgerService';
import { adminAdjust } from '../services/adminLedgerService';

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
        avatarUrl: true,
        authProvider: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const data = await Promise.all(
      users.map(async (u) => {
        await ensureUserAccounts(u.id);
        return {
          ...u,
          role: isAdminEmail(u.email) ? 'ADMIN' : 'USER',
          balances: await userBalances(u.id),
        };
      }),
    );

    res.json({
      success: true,
      data,
    });
  } catch (error) {
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
        },
      });
      await tx.wallet.create({ data: { userId: newUser.id } });
      await tx.portfolio.create({
        data: { userId: newUser.id, totalValue: 0, totalCost: 0, totalPnL: 0 },
      });
      return newUser;
    });
    await ensureUserAccounts(user.id);

    res.status(201).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        tier: user.tier,
        kycStatus: user.kycStatus,
        role: isAdminEmail(user.email) ? 'ADMIN' : 'USER',
      },
    });
  } catch (error) {
    next(error);
  }
};

export const setUserActive = async (
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
    const { userId } = req.params;
    const { active } = req.body as { active: boolean };

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    if (!active && user.id === req.user!.id) {
      res.status(400).json({ success: false, message: 'You cannot disable your own account' });
      return;
    }

    await prisma.$transaction([
      prisma.user.update({ where: { id: userId }, data: { isActive: active } }),
      ...(active ? [] : [prisma.refreshToken.deleteMany({ where: { userId } })]),
    ]);

    res.json({ success: true, data: { id: userId, isActive: active } });
  } catch (error) {
    next(error);
  }
};

export const postLedgerAdjustment = async (
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
    const { userId } = req.params;
    const { asset, amount, direction, reason, idempotencyKey } = req.body as {
      asset: string;
      amount: string;
      direction: 'credit' | 'debit';
      reason: string;
      idempotencyKey: string;
    };
    const result = await adminAdjust({
      actorId: req.user!.id,
      userId,
      asset,
      amount: String(amount),
      direction,
      reason,
      idempotencyKey,
    });
    res.status(result.replayed ? 200 : 201).json({ success: true, data: result });
  } catch (error) {
    next(error instanceof Error ? createError(error.message, 400) : error);
  }
};
