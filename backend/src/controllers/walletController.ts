import { Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { env } from '../config/env';
import { ensureUserAccounts, userBalances, userJournal } from '../services/ledgerService';
import {
  issueDepositAddress,
  issueAllVaultAddresses,
  listDepositAddresses,
  ingestIncoming,
  claimDeposit,
} from '../services/depositService';
import { requestWithdrawal } from '../services/withdrawalService';
import { prisma } from '../config/database';
import { getCustody } from '../services/custody/provider';

export const getWallet = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    await ensureUserAccounts(req.user!.id);
    await issueAllVaultAddresses(req.user!.id);
    const [balances, addresses, pendingDeposits, openWithdrawals] = await Promise.all([
      userBalances(req.user!.id),
      listDepositAddresses(req.user!.id),
      prisma.onChainDeposit.findMany({
        where: { userId: req.user!.id },
        orderBy: { firstSeenAt: 'desc' },
        take: 20,
      }),
      prisma.withdrawal.findMany({
        where: { userId: req.user!.id },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);
    res.json({
      success: true,
      data: {
        mode: env.MODE,
        balances,
        addresses,
        deposits: pendingDeposits,
        withdrawals: openWithdrawals,
      },
    });
  } catch (error) {
    next(error instanceof Error ? createError(error.message, 400) : error);
  }
};

export const getTransactions = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const limit = parseInt(String(req.query.limit || '20'), 10);
    const offset = parseInt(String(req.query.offset || '0'), 10);
    const data = await userJournal(req.user!.id, limit, offset);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const createDepositAddress = async (
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
    const asset = String(req.body.asset || '').toUpperCase();
    const address = await issueDepositAddress(req.user!.id, asset);
    res.status(201).json({ success: true, data: address });
  } catch (error) {
    next(error instanceof Error ? createError(error.message, 400) : error);
  }
};

export const claimUserDeposit = async (
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
    const asset = String(req.body.asset || '').toUpperCase();
    const txHash = String(req.body.txHash || '').trim();
    const row = await claimDeposit(req.user!.id, asset, txHash);
    res.status(201).json({ success: true, data: row });
  } catch (error) {
    next(error instanceof Error ? createError(error.message, 400) : error);
  }
};

export const requestUserWithdrawal = async (
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
    const { asset, toAddress, amount, idempotencyKey, reason } = req.body as {
      asset: string;
      toAddress: string;
      amount: string;
      idempotencyKey: string;
      reason?: string;
    };
    const row = await requestWithdrawal({
      userId: req.user!.id,
      actorId: req.user!.id,
      asset,
      toAddress,
      amount: String(amount),
      idempotencyKey,
      reason,
    });
    res.status(201).json({ success: true, data: row });
  } catch (error) {
    next(error instanceof Error ? createError(error.message, 400) : error);
  }
};

/** Webhook only schedules a lookup. Credit still requires provider confirmation + unique tx hash. */
export const custodyWebhook = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const secret = req.header('x-tatum-secret') || req.header('x-webhook-secret');
    if (!env.TATUM_WEBHOOK_SECRET || secret !== env.TATUM_WEBHOOK_SECRET) {
      res.status(401).json({ success: false, message: 'Unauthorized webhook' });
      return;
    }
    const body = req.body as {
      txId?: string;
      hash?: string;
      address?: string;
      amount?: string;
      currency?: string;
    };
    const txHash = body.txId || body.hash;
    const address = body.address;
    if (!txHash || !address) {
      res.status(400).json({ success: false, message: 'tx hash and address required' });
      return;
    }
    const pending = await prisma.onChainDeposit.findFirst({
      where: { txHash },
    });
    if (!pending) {
      res.json({ success: true, data: { queued: true, needsClaim: true } });
      return;
    }
    const custody = getCustody();
    const match = custody.verifyIncoming
      ? await custody.verifyIncoming({
          txHash,
          asset: pending.asset,
          chain: pending.chain,
          address: pending.address,
        })
      : null;
    if (!match) {
      res.json({ success: true, data: { queued: true, verified: false } });
      return;
    }
    const row = await ingestIncoming({
      userId: pending.userId,
      asset: pending.asset,
      chain: pending.chain,
      address: pending.address,
      txHash: match.txHash,
      amount: match.amount,
      confirmations: match.confirmations,
    });
    res.json({ success: true, data: row });
  } catch (error) {
    next(error);
  }
};
