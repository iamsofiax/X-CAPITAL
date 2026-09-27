import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth';

/** Epoch 0 of the simulated network; must match frontend/src/lib/sim/clock.ts. */
const GENESIS_TS = Date.UTC(2026, 0, 1, 0, 0, 0);
const EPOCH_MS = 8 * 60 * 60 * 1000;
const SEASON_EPOCHS = 90;
const MIN_EPOCHS_FOR_RANK = 6;

const currentSeason = (): number =>
  Math.floor(Math.max(0, Math.floor((Date.now() - GENESIS_TS) / EPOCH_MS)) / SEASON_EPOCHS);

export const submitSnapshot = async (
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
    const b = req.body as {
      season: number;
      nav: number;
      seasonReturn: number;
      sortino: number | null;
      maxDrawdown: number;
      careerTier: string;
      xp: number;
      resets: number;
      epochs: number;
    };

    const season = currentSeason();
    if (b.season !== season) {
      res.status(409).json({ success: false, message: `Snapshots are accepted for season ${season} only` });
      return;
    }

    const data = {
      season,
      nav: b.nav,
      seasonReturn: b.seasonReturn,
      sortino: b.sortino,
      maxDrawdown: b.maxDrawdown,
      careerTier: b.careerTier,
      xp: b.xp,
      resets: b.resets,
      epochs: b.epochs,
    };

    await prisma.simSnapshot.upsert({
      where: { userId: req.user!.id },
      create: { userId: req.user!.id, ...data },
      update: data,
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const getLeaderboard = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const season = req.query.season !== undefined ? Number(req.query.season) : currentSeason();
    const rows = await prisma.simSnapshot.findMany({
      where: {
        season,
        epochs: { gte: MIN_EPOCHS_FOR_RANK },
        sortino: { not: null },
        user: { isActive: true },
      },
      orderBy: [{ sortino: 'desc' }, { seasonReturn: 'desc' }],
      take: 50,
      include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } },
    });

    res.json({
      success: true,
      data: {
        season,
        entries: rows.map((r, i) => ({
          rank: i + 1,
          userId: r.userId,
          name: `${r.user.firstName} ${r.user.lastName ? `${r.user.lastName[0]}.` : ''}`.trim(),
          avatarUrl: r.user.avatarUrl,
          nav: Number(r.nav),
          seasonReturn: Number(r.seasonReturn),
          sortino: r.sortino === null ? null : Number(r.sortino),
          maxDrawdown: Number(r.maxDrawdown),
          careerTier: r.careerTier,
          resets: r.resets,
          updatedAt: r.updatedAt,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};
