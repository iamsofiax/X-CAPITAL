import { AccountKind, DepositCreditStatus, JournalType, Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { chainFor, getCustody } from './custody/provider';
import { ensureUserAccounts, getAccount, postJournal } from './ledgerService';
import { logger } from '../utils/logger';

export async function issueDepositAddress(userId: string, asset: string) {
  const symbol = asset.toUpperCase();
  if (symbol === 'USD') throw new Error('USD deposits are not on-chain. Use a supported crypto asset.');
  const chain = chainFor(symbol);
  const existing = await prisma.depositAddress.findUnique({
    where: { userId_asset_chain: { userId, asset: symbol, chain } },
  });
  if (existing) return existing;

  const custody = getCustody();
  if (!custody.configured) throw new Error('Custody vault is not configured');
  const derived = await custody.deriveAddress({ asset: symbol, chain, userId, index: 0 });

  return prisma.depositAddress.create({
    data: {
      userId,
      asset: symbol,
      chain,
      address: derived.address,
      providerWalletId: derived.providerWalletId,
      derivationIndex: 0,
    },
  });
}

export async function issueAllVaultAddresses(userId: string) {
  const { DEPOSIT_ASSETS } = await import('./custody/provider');
  const rows = [];
  for (const asset of DEPOSIT_ASSETS) {
    rows.push(await issueDepositAddress(userId, asset));
  }
  return rows;
}

export async function claimDeposit(userId: string, asset: string, txHash: string) {
  const symbol = asset.toUpperCase();
  const chain = chainFor(symbol);
  const addr = await issueDepositAddress(userId, symbol);
  const custody = getCustody();
  if (!custody.verifyIncoming) throw new Error('Custody cannot verify transactions');
  const seen = await custody.verifyIncoming({
    txHash: txHash.trim(),
    asset: symbol,
    chain,
    address: addr.address,
  });
  if (!seen) {
    throw new Error('Transaction not found on-chain paying the vault for this asset');
  }
  const taken = await prisma.onChainDeposit.findUnique({ where: { txHash: seen.txHash } });
  if (taken && taken.userId !== userId) {
    throw new Error('This transaction hash is already attributed');
  }
  return ingestIncoming({
    userId,
    asset: symbol,
    chain,
    address: addr.address,
    txHash: seen.txHash,
    amount: seen.amount,
    confirmations: seen.confirmations,
  });
}

export async function listDepositAddresses(userId: string) {
  return prisma.depositAddress.findMany({ where: { userId }, orderBy: { asset: 'asc' } });
}

export async function ingestIncoming(params: {
  userId: string;
  asset: string;
  chain: string;
  address: string;
  txHash: string;
  amount: string;
  confirmations: number;
}) {
  const txHash = params.txHash.trim();
  if (!txHash || !/^0x?[0-9a-fA-F]{16,}$/.test(txHash) && !/^[0-9a-zA-Z]{20,}$/.test(txHash)) {
    throw new Error('Invalid transaction hash');
  }
  const custody = getCustody();
  const required = custody.requiredConfirmations(params.asset, params.chain);
  const amount = new Prisma.Decimal(params.amount);
  if (amount.lte(0)) return null;

  const row = await prisma.onChainDeposit.upsert({
    where: { txHash },
    update: { confirmations: params.confirmations },
    create: {
      txHash,
      userId: params.userId,
      asset: params.asset,
      chain: params.chain,
      address: params.address,
      amount,
      confirmations: params.confirmations,
      requiredConf: required,
      status: params.confirmations >= required ? DepositCreditStatus.CONFIRMING : DepositCreditStatus.SEEN,
    },
  });

  if (row.status === DepositCreditStatus.CREDITED) return row;
  if (params.confirmations < required) {
    await prisma.onChainDeposit.update({
      where: { id: row.id },
      data: { status: DepositCreditStatus.SEEN, confirmations: params.confirmations },
    });
    return row;
  }
  return creditIfConfirmed(row.id);
}

async function creditIfConfirmed(depositId: string) {
  const row = await prisma.onChainDeposit.findUnique({ where: { id: depositId } });
  if (!row || row.status === DepositCreditStatus.CREDITED) return row;
  if (row.confirmations < row.requiredConf) return row;

  await ensureUserAccounts(row.userId);
  const userCash = await getAccount(AccountKind.USER_CASH, row.asset, row.userId);
  const custody = await getAccount(AccountKind.CUSTODY, row.asset, null);

  const posted = await postJournal({
    type: JournalType.DEPOSIT,
    actorId: 'system:custody',
    userId: row.userId,
    reason: `On-chain deposit ${row.asset} confirmed ${row.txHash}`,
    idempotencyKey: `deposit:${row.txHash}`,
    externalRef: row.txHash,
    metadata: { chain: row.chain, address: row.address, confirmations: row.confirmations },
    lines: [
      { accountId: custody.id, debit: row.amount },
      { accountId: userCash.id, credit: row.amount },
    ],
  });

  return prisma.onChainDeposit.update({
    where: { id: row.id },
    data: {
      status: DepositCreditStatus.CREDITED,
      journalId: posted.entry.id,
      creditedAt: posted.replayed ? row.creditedAt ?? new Date() : new Date(),
    },
  });
}

export async function scanDeposits() {
  const custody = getCustody();
  if (!custody.configured) return { scanned: 0, credited: 0 };
  let scanned = 0;
  let credited = 0;
  const pending = await prisma.onChainDeposit.findMany({
    where: { status: { in: [DepositCreditStatus.SEEN, DepositCreditStatus.CONFIRMING] } },
  });
  for (const row of pending) {
    scanned += 1;
    if (custody.verifyIncoming) {
      const live = await custody.verifyIncoming({
        txHash: row.txHash,
        asset: row.asset,
        chain: row.chain,
        address: row.address,
      });
      if (live) {
        await ingestIncoming({
          userId: row.userId,
          asset: row.asset,
          chain: row.chain,
          address: row.address,
          txHash: live.txHash,
          amount: live.amount,
          confirmations: live.confirmations,
        });
      }
    } else if (row.confirmations >= row.requiredConf) {
      await creditIfConfirmed(row.id);
    }
    const fresh = await prisma.onChainDeposit.findUnique({ where: { id: row.id } });
    if (fresh?.status === DepositCreditStatus.CREDITED) credited += 1;
  }
  return { scanned, credited };
}

export function startDepositWatcher() {
  const tick = () => {
    scanDeposits().catch((err) => logger.error('Deposit watcher failed', err));
  };
  tick();
  return setInterval(tick, 45_000);
}
