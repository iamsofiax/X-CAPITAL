import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';

const DEFAULT_ADMIN_EMAIL = 'admin@xcapital.io';
const DEFAULT_ADMIN_PASSWORD = 'Admin2026!';

/** Create the configured operator account on a fresh database, without overwriting it. */
export async function ensurePlatformAdmin(): Promise<void> {
  const email = (process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL).trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return;

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        passwordHash,
        firstName: 'Platform',
        lastName: 'Admin',
        tier: 'BLACK',
        kycStatus: 'APPROVED',
        accreditationStatus: 'ACCREDITED',
      },
    });
    await tx.wallet.create({ data: { userId: user.id } });
    await tx.portfolio.create({
      data: { userId: user.id, totalValue: 0, totalCost: 0, totalPnL: 0 },
    });
    await tx.userYieldConfig.create({ data: { userId: user.id } });
  });
}