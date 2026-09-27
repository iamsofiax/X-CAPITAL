import { AccountKind, JournalType, Prisma } from '@prisma/client';
import { ensureUserAccounts, getAccount, postJournal, userBalances } from './ledgerService';

export async function adminAdjust(params: {
  actorId: string;
  userId: string;
  asset: string;
  amount: string;
  direction: 'credit' | 'debit';
  reason: string;
  idempotencyKey: string;
}) {
  if (!params.reason?.trim()) throw new Error('reason is required');
  if (!params.idempotencyKey?.trim()) throw new Error('idempotency_key is required');
  const amount = new Prisma.Decimal(params.amount);
  if (amount.lte(0)) throw new Error('amount must be positive');
  const asset = params.asset.toUpperCase();

  await ensureUserAccounts(params.userId);
  const userCash = await getAccount(AccountKind.USER_CASH, asset, params.userId);
  const contraKind = params.direction === 'credit' ? AccountKind.PROFIT_POOL : AccountKind.HOUSE;
  const contra = await getAccount(contraKind, asset, null);

  const posted = await postJournal({
    type: params.direction === 'credit' ? JournalType.ADMIN_CREDIT : JournalType.ADMIN_DEBIT,
    actorId: params.actorId,
    userId: params.userId,
    reason: params.reason.trim(),
    idempotencyKey: params.idempotencyKey.trim(),
    metadata: { direction: params.direction, asset },
    lines:
      params.direction === 'credit'
        ? [
            { accountId: contra.id, debit: amount },
            { accountId: userCash.id, credit: amount },
          ]
        : [
            { accountId: userCash.id, debit: amount },
            { accountId: contra.id, credit: amount },
          ],
  });

  return {
    entry: posted.entry,
    replayed: posted.replayed,
    balances: await userBalances(params.userId),
  };
}
