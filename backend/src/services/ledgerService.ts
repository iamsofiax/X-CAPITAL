import { AccountKind, JournalType, Prisma } from '@prisma/client';
import { prisma } from '../config/database';

const D = (v: Prisma.Decimal | string | number) => new Prisma.Decimal(v);

export const HOUSE_ASSETS = ['USD', 'BTC', 'ETH', 'USDT', 'BNB', 'DOGE', 'TRX'] as const;

export async function ensureHouseAccounts(tx: Prisma.TransactionClient = prisma) {
  const kinds: AccountKind[] = [
    AccountKind.HOUSE,
    AccountKind.FEE,
    AccountKind.PROFIT_POOL,
    AccountKind.CUSTODY,
  ];
  for (const kind of kinds) {
    for (const asset of HOUSE_ASSETS) {
      const existing = await tx.ledgerAccount.findFirst({ where: { kind, userId: null, asset } });
      if (!existing) {
        await tx.ledgerAccount.create({ data: { kind, userId: null, asset } });
      }
    }
  }
}

export async function ensureUserAccounts(userId: string, tx: Prisma.TransactionClient = prisma) {
  await ensureHouseAccounts(tx);
  for (const asset of HOUSE_ASSETS) {
    await tx.ledgerAccount.upsert({
      where: { kind_userId_asset: { kind: AccountKind.USER_CASH, userId, asset } },
      update: {},
      create: { kind: AccountKind.USER_CASH, userId, asset },
    });
    await tx.ledgerAccount.upsert({
      where: { kind_userId_asset: { kind: AccountKind.USER_RESERVED, userId, asset } },
      update: {},
      create: { kind: AccountKind.USER_RESERVED, userId, asset },
    });
  }
}

export async function getAccount(
  kind: AccountKind,
  asset: string,
  userId: string | null,
  tx: Prisma.TransactionClient = prisma,
) {
  const found = await tx.ledgerAccount.findFirst({ where: { kind, asset, userId } });
  if (found) return found;
  return tx.ledgerAccount.create({ data: { kind, asset, userId } });
}

/** Liability (user cash/reserved): credit − debit. Asset (custody): debit − credit. */
export async function accountBalance(
  accountId: string,
  tx: Prisma.TransactionClient = prisma,
): Promise<Prisma.Decimal> {
  const agg = await tx.journalLine.aggregate({
    where: { accountId },
    _sum: { debit: true, credit: true },
  });
  const debit = D(agg._sum.debit ?? 0);
  const credit = D(agg._sum.credit ?? 0);
  const account = await tx.ledgerAccount.findUnique({ where: { id: accountId } });
  if (!account) return D(0);
  if (
    account.kind === AccountKind.USER_CASH ||
    account.kind === AccountKind.USER_RESERVED ||
    account.kind === AccountKind.FEE ||
    account.kind === AccountKind.PROFIT_POOL ||
    account.kind === AccountKind.HOUSE
  ) {
    return credit.minus(debit);
  }
  return debit.minus(credit);
}

export async function userCash(userId: string, asset: string, tx: Prisma.TransactionClient = prisma) {
  const acct = await getAccount(AccountKind.USER_CASH, asset, userId, tx);
  return accountBalance(acct.id, tx);
}

export async function userReserved(userId: string, asset: string, tx: Prisma.TransactionClient = prisma) {
  const acct = await getAccount(AccountKind.USER_RESERVED, asset, userId, tx);
  return accountBalance(acct.id, tx);
}

export type JournalLineInput = {
  accountId: string;
  debit?: Prisma.Decimal | string | number;
  credit?: Prisma.Decimal | string | number;
};

export async function postJournal(params: {
  type: JournalType;
  actorId: string;
  userId?: string | null;
  reason: string;
  idempotencyKey: string;
  externalRef?: string | null;
  metadata?: Prisma.InputJsonValue;
  lines: JournalLineInput[];
}) {
  const existing = await prisma.journalEntry.findUnique({
    where: { idempotencyKey: params.idempotencyKey },
    include: { lines: true },
  });
  if (existing) return { entry: existing, replayed: true };

  let debitSum = D(0);
  let creditSum = D(0);
  const normalized = params.lines.map((line) => {
    const debit = D(line.debit ?? 0);
    const credit = D(line.credit ?? 0);
    if (debit.lt(0) || credit.lt(0)) throw new Error('Journal lines cannot be negative');
    if (debit.gt(0) && credit.gt(0)) throw new Error('A line cannot be both debit and credit');
    if (debit.eq(0) && credit.eq(0)) throw new Error('A line must have a debit or a credit');
    debitSum = debitSum.plus(debit);
    creditSum = creditSum.plus(credit);
    return { accountId: line.accountId, debit, credit };
  });
  if (!debitSum.eq(creditSum)) {
    throw new Error(`Unbalanced journal: debit ${debitSum} ≠ credit ${creditSum}`);
  }

  const entry = await prisma.$transaction(async (tx) => {
    const created = await tx.journalEntry.create({
      data: {
        type: params.type,
        actorId: params.actorId,
        userId: params.userId ?? null,
        reason: params.reason,
        idempotencyKey: params.idempotencyKey,
        externalRef: params.externalRef ?? null,
        metadata: params.metadata ?? undefined,
        lines: { create: normalized },
      },
      include: { lines: true },
    });
    return created;
  });

  return { entry, replayed: false };
}

export async function userBalances(userId: string) {
  await ensureUserAccounts(userId);
  const out: Record<string, { cash: string; reserved: string }> = {};
  for (const asset of HOUSE_ASSETS) {
    const [cash, reserved] = await Promise.all([userCash(userId, asset), userReserved(userId, asset)]);
    out[asset] = { cash: cash.toFixed(), reserved: reserved.toFixed() };
  }
  return out;
}

export async function userJournal(userId: string, limit = 50, offset = 0) {
  const [entries, total] = await Promise.all([
    prisma.journalEntry.findMany({
      where: { userId },
      include: { lines: { include: { account: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.journalEntry.count({ where: { userId } }),
  ]);
  return { entries, total };
}
