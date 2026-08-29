import { Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import { prisma } from "../config/database";
import { AuthRequest } from "../middleware/auth";
import { createError } from "../middleware/errorHandler";
import { Prisma } from "@prisma/client";
import { accrueUser } from "../services/accrualService";

export const getWallet = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    await accrueUser(req.user!.id);
    const wallet = await prisma.wallet.findUnique({
      where: { userId: req.user!.id },
      select: {
        id: true,
        fiatBalance: true,
        cryptoBalance: true,
        lockedBalance: true,
        walletAddress: true,
        lastAccruedAt: true,
        totalYieldGenerated: true,
        approvedCapital: true,
      },
    });
    res.json({ success: true, data: wallet });
  } catch (error) {
    next(error);
  }
};

export const getTransactions = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { limit = "20", offset = "0", type } = req.query;

    const where: Record<string, unknown> = { userId: req.user!.id };
    if (type) where.type = type;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: where as Prisma.TransactionWhereInput,
        orderBy: { createdAt: "desc" },
        take: parseInt(String(limit)),
        skip: parseInt(String(offset)),
      }),
      prisma.transaction.count({
        where: where as Prisma.TransactionWhereInput,
      }),
    ]);

    res.json({ success: true, data: { transactions, total } });
  } catch (error) {
    next(error);
  }
};

export const depositFunds = async (
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

    const { amount, paymentMethodId } = req.body;
    const userId = req.user!.id;

    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      res.status(404).json({ success: false, message: "Wallet not found" });
      return;
    }

    // In production, integrate Stripe payment intent here
    // const paymentIntent = await stripe.paymentIntents.create({ amount: amount * 100, currency: 'usd' });

    const transaction = await prisma.transaction.create({
      data: {
        userId,
        walletId: wallet.id,
        amount,
        type: "DEPOSIT",
        status: "PENDING",
        metadata: {
          paymentMethodId,
          requestedAt: new Date().toISOString(),
        },
      },
    });

    await prisma.adminAlert.create({
      data: {
        type: "DEPOSIT",
        userId,
        amount,
        method: paymentMethodId ?? "wire",
        transactionId: transaction.id,
        metadata: { paymentMethodId },
      },
    });

    res.json({
      success: true,
      message:
        "Deposit request created and sent for admin approval. Funds will be available once the request is approved.",
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

export const withdrawFunds = async (
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

    const { amount, bankAccountId } = req.body;
    const userId = req.user!.id;

    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet || Number(wallet.fiatBalance) < amount) {
      res.status(400).json({ success: false, message: "Insufficient balance" });
      return;
    }

    // FIX: Do NOT deduct balance immediately — wait for admin approval
    // Balance will be deducted by adminController.approveAlert when APPROVED
    // This prevents lost funds if admin rejects the withdrawal
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        walletId: wallet.id,
        amount,
        type: "WITHDRAWAL",
        status: "PENDING",
        metadata: { bankAccountId },
      },
    });

    // Create admin alert so admin can approve/reject
    await prisma.adminAlert.create({
      data: {
        type: "WITHDRAW",
        userId,
        amount,
        method: bankAccountId ? "wire" : "crypto",
        transactionId: transaction.id,
        metadata: { bankAccountId },
      },
    });

    res.json({
      success: true,
      message: `Withdrawal of $${amount} sent for admin clearance. Funds will be released once approved.`,
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};
