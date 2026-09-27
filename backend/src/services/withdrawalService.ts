import { AccountKind, JournalType, Prisma, WithdrawalPipelineStatus } from '@prisma/client';
import { prisma } from '../config/database';
import { chainFor, getCustody } from './custody/provider';
import { ensureUserAccounts, getAccount, postJournal, userCash } from './ledgerService';
import { logger } from '../utils/logger';

export async function requestWithdrawal(params: {
  userId: string;
  actorId: string;
  asset: string;
  toAddress: string;
  amount: string;
  idempotencyKey: string;
  reason?: string;
}) {
  const asset = params.asset.toUpperCase();
  const chain = chainFor(asset);
  const amount = new Prisma.Decimal(params.amount);
  if (amount.lte(0)) throw new Error('Withdrawal amount must be positive');
  if (!params.toAddress?.trim()) throw new Error('Destination address required');
  if (!params.idempotencyKey?.trim()) throw new Error('idempotency_key is required');

  const existing = await prisma.withdrawal.findUnique({
    where: { idempotencyKey: params.idempotencyKey },
  });
  if (existing) return existing;

  await ensureUserAccounts(params.userId);
  const available = await userCash(params.userId, asset);
  if (available.lt(amount)) throw new Error('Insufficient available funds');

  const cash = await getAccount(AccountKind.USER_CASH, asset, params.userId);
  const reserved = await getAccount(AccountKind.USER_RESERVED, asset, params.userId);

  const reserve = await postJournal({
    type: JournalType.WITHDRAWAL_RESERVE,
    actorId: params.actorId,
    userId: params.userId,
    reason: params.reason || `Reserve ${asset} for withdrawal to ${params.toAddress}`,
    idempotencyKey: `wd-reserve:${params.idempotencyKey}`,
    metadata: { toAddress: params.toAddress },
    lines: [
      { accountId: cash.id, debit: amount },
      { accountId: reserved.id, credit: amount },
    ],
  });

  const row = await prisma.withdrawal.create({
    data: {
      userId: params.userId,
      asset,
      chain,
      toAddress: params.toAddress.trim(),
      amount,
      status: WithdrawalPipelineStatus.RESERVED,
      reserveEntryId: reserve.entry.id,
      idempotencyKey: params.idempotencyKey,
      actorId: params.actorId,
      reason: params.reason || 'User withdrawal',
    },
  });

  return broadcastWithdrawal(row.id);
}

export async function broadcastWithdrawal(withdrawalId: string) {
  const row = await prisma.withdrawal.findUnique({ where: { id: withdrawalId } });
  if (!row || row.status === WithdrawalPipelineStatus.SETTLED || row.status === WithdrawalPipelineStatus.FAILED) {
    return row;
  }

  const custody = getCustody();
  const addr = await prisma.depositAddress.findFirst({
    where: { userId: row.userId, asset: row.asset },
  });

  try {
    const sent = await custody.broadcastWithdrawal({
      asset: row.asset,
      chain: row.chain,
      toAddress: row.toAddress,
      amount: row.amount.toFixed(),
      providerWalletId: addr?.providerWalletId || '',
      idempotencyKey: row.idempotencyKey,
    });
    return prisma.withdrawal.update({
      where: { id: row.id },
      data: {
        status: WithdrawalPipelineStatus.BROADCASTING,
        providerRef: sent.providerRef,
        txHash: sent.txHash,
      },
    });
  } catch (err) {
    logger.error(`Withdrawal broadcast failed ${row.id}: ${err instanceof Error ? err.message : String(err)}`);
    return failWithdrawal(row.id, err instanceof Error ? err.message : 'Broadcast failed');
  }
}

export async function settleWithdrawal(withdrawalId: string, txHash?: string) {
  const row = await prisma.withdrawal.findUnique({ where: { id: withdrawalId } });
  if (!row || row.status === WithdrawalPipelineStatus.SETTLED) return row;
  if (row.status === WithdrawalPipelineStatus.FAILED) return row;

  await ensureUserAccounts(row.userId);
  const reserved = await getAccount(AccountKind.USER_RESERVED, row.asset, row.userId);
  const custodyAcct = await getAccount(AccountKind.CUSTODY, row.asset, null);

  const posted = await postJournal({
    type: JournalType.WITHDRAWAL_SETTLE,
    actorId: 'system:custody',
    userId: row.userId,
    reason: `Withdrawal settled ${row.asset} ${txHash || row.txHash || row.id}`,
    idempotencyKey: `wd-settle:${row.idempotencyKey}`,
    externalRef: txHash || row.txHash,
    lines: [
      { accountId: reserved.id, debit: row.amount },
      { accountId: custodyAcct.id, credit: row.amount },
    ],
  });

  return prisma.withdrawal.update({
    where: { id: row.id },
    data: {
      status: WithdrawalPipelineStatus.SETTLED,
      settleEntryId: posted.entry.id,
      txHash: txHash || row.txHash,
    },
  });
}

export async function failWithdrawal(withdrawalId: string, reason: string) {
  const row = await prisma.withdrawal.findUnique({ where: { id: withdrawalId } });
  if (!row || row.status === WithdrawalPipelineStatus.SETTLED) return row;
  if (row.status === WithdrawalPipelineStatus.FAILED) return row;

  await ensureUserAccounts(row.userId);
  const reserved = await getAccount(AccountKind.USER_RESERVED, row.asset, row.userId);
  const cash = await getAccount(AccountKind.USER_CASH, row.asset, row.userId);

  const posted = await postJournal({
    type: JournalType.WITHDRAWAL_FAIL,
    actorId: 'system:custody',
    userId: row.userId,
    reason: `Withdrawal failed — reserved funds returned. ${reason}`,
    idempotencyKey: `wd-fail:${row.idempotencyKey}`,
    metadata: { failReason: reason },
    lines: [
      { accountId: reserved.id, debit: row.amount },
      { accountId: cash.id, credit: row.amount },
    ],
  });

  return prisma.withdrawal.update({
    where: { id: row.id },
    data: {
      status: WithdrawalPipelineStatus.FAILED,
      failEntryId: posted.entry.id,
    },
  });
}

export async function pollWithdrawals() {
  const custody = getCustody();
  if (!custody.configured) return;
  const open = await prisma.withdrawal.findMany({
    where: { status: WithdrawalPipelineStatus.BROADCASTING },
  });
  for (const row of open) {
    if (!row.providerRef) continue;
    try {
      const st = await custody.getWithdrawalStatus(row.providerRef);
      if (st.status === 'confirmed') await settleWithdrawal(row.id, st.txHash);
      else if (st.status === 'failed') await failWithdrawal(row.id, 'Provider reported failure');
      else if (st.txHash && !row.txHash) {
        await prisma.withdrawal.update({ where: { id: row.id }, data: { txHash: st.txHash } });
      }
    } catch (err) {
      logger.warn(`Withdrawal poll failed ${row.id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}

export function startWithdrawalWatcher() {
  const tick = () => {
    pollWithdrawals().catch((err) => logger.error('Withdrawal watcher failed', err));
  };
  tick();
  return setInterval(tick, 45_000);
}
