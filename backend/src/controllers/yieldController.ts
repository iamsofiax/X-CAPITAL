import { Response, NextFunction } from "express";
import { ProfitMode } from "@prisma/client";
import { prisma } from "../config/database";
import { AuthRequest } from "../middleware/auth";
import { writeAdminAudit } from "../services/adminAudit";
import {
  accrueUser,
  clampDailyRate,
  DEFAULT_DAILY_RATE,
  ensureYieldConfig,
} from "../services/accrualService";

function toNum(value: unknown): number {
  return Number(value ?? 0);
}

export const getYieldConfig = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { userId } = req.params;
    const config = await ensureYieldConfig(userId);
    const now = new Date();
    const spikes = await prisma.yieldSpike.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    res.json({
      success: true,
      data: {
        ...config,
        dailyRate: toNum(config.dailyRate),
        profitRate: toNum(config.dailyRate) * 100,
        profitMultiplier: toNum(config.profitMultiplier),
        nodeGoal: config.nodeGoal == null ? null : toNum(config.nodeGoal),
        nextNodeRate:
          config.nextNodeRate == null ? null : toNum(config.nextNodeRate) * 100,
        profitMode: config.profitMode === ProfitMode.LINEAR ? "linear" : "compound",
        spikes,
        activeSpike: spikes.find(
          (s) => s.active && s.startsAt <= now && s.endsAt > now,
        ) ?? null,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const putYieldConfig = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { userId } = req.params;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    const body = req.body as {
      profitRate?: number;
      dailyRate?: number;
      profitMode?: string;
      profitMultiplier?: number;
      profitHold?: boolean;
      nodeGoal?: number | null;
      nextNodeRate?: number | null;
    };

    let dailyRate: number | undefined;
    if (typeof body.dailyRate === "number" && body.dailyRate > 0) {
      dailyRate = clampDailyRate(
        body.dailyRate > 1 ? body.dailyRate / 100 : body.dailyRate,
      );
    } else if (typeof body.profitRate === "number" && body.profitRate > 0) {
      dailyRate = clampDailyRate(body.profitRate / 100);
    }

    const mode: ProfitMode | undefined =
      body.profitMode == null
        ? undefined
        : String(body.profitMode).toLowerCase() === "linear"
          ? ProfitMode.LINEAR
          : ProfitMode.COMPOUND;

    const multiplier =
      typeof body.profitMultiplier === "number" && body.profitMultiplier > 0
        ? Math.min(10, Math.max(0.1, body.profitMultiplier))
        : undefined;

    let nextNodeRate: number | null | undefined;
    if (body.nextNodeRate === null) {
      nextNodeRate = null;
    } else if (typeof body.nextNodeRate === "number" && body.nextNodeRate > 0) {
      nextNodeRate = clampDailyRate(
        body.nextNodeRate > 1 ? body.nextNodeRate / 100 : body.nextNodeRate,
      );
    }

    const config = await prisma.userYieldConfig.upsert({
      where: { userId },
      create: {
        userId,
        dailyRate: dailyRate ?? DEFAULT_DAILY_RATE,
        profitMode: mode ?? ProfitMode.COMPOUND,
        profitMultiplier: multiplier ?? 1,
        profitHold: Boolean(body.profitHold),
        nodeGoal:
          typeof body.nodeGoal === "number" && body.nodeGoal >= 0
            ? body.nodeGoal
            : null,
        nextNodeRate: nextNodeRate ?? null,
      },
      update: {
        ...(dailyRate !== undefined ? { dailyRate } : {}),
        ...(mode !== undefined ? { profitMode: mode } : {}),
        ...(multiplier !== undefined ? { profitMultiplier: multiplier } : {}),
        ...(typeof body.profitHold === "boolean"
          ? { profitHold: body.profitHold }
          : {}),
        ...(body.nodeGoal !== undefined
          ? {
              nodeGoal:
                typeof body.nodeGoal === "number" && body.nodeGoal >= 0
                  ? body.nodeGoal
                  : null,
            }
          : {}),
        ...(nextNodeRate !== undefined ? { nextNodeRate } : {}),
      },
    });

    await accrueUser(userId);

    await writeAdminAudit({
      actorId: req.user!.id,
      actorEmail: req.user!.email,
      action: "Updated yield config",
      target: userId,
      level: "action",
    });

    res.json({
      success: true,
      data: {
        ...config,
        dailyRate: toNum(config.dailyRate),
        profitRate: toNum(config.dailyRate) * 100,
        profitMode: config.profitMode === ProfitMode.LINEAR ? "linear" : "compound",
        profitMultiplier: toNum(config.profitMultiplier),
        nodeGoal: config.nodeGoal == null ? null : toNum(config.nodeGoal),
        nextNodeRate:
          config.nextNodeRate == null ? null : toNum(config.nextNodeRate) * 100,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const setYieldHold = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { userId } = req.params;
    const { profitHold } = req.body as { profitHold: boolean };
    if (typeof profitHold !== "boolean") {
      res.status(400).json({ success: false, message: "profitHold boolean required" });
      return;
    }
    await ensureYieldConfig(userId);
    const config = await prisma.userYieldConfig.update({
      where: { userId },
      data: { profitHold },
    });
    await accrueUser(userId);
    await writeAdminAudit({
      actorId: req.user!.id,
      actorEmail: req.user!.email,
      action: profitHold ? "Yield hold on" : "Yield hold off",
      target: userId,
      level: "action",
    });
    res.json({ success: true, data: { profitHold: config.profitHold } });
  } catch (error) {
    next(error);
  }
};

export const createYieldSpike = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { userId } = req.params;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    const body = req.body as {
      percentage?: number;
      durationHours?: number;
      direction?: string;
      label?: string;
      dailyRate?: number;
      profitRate?: number;
    };

    const percentage = Math.max(0, Number(body.percentage ?? 0));
    const durationHours = Math.min(720, Math.max(1, Number(body.durationHours ?? 24)));
    const direction = body.direction === "down" ? "down" : "up";
    const now = new Date();
    const endsAt = new Date(now.getTime() + durationHours * 60 * 60 * 1000);

    await prisma.yieldSpike.updateMany({
      where: { userId, active: true },
      data: { active: false },
    });

    const spike = await prisma.yieldSpike.create({
      data: {
        userId,
        percentage,
        direction,
        durationHours,
        label: (body.label ?? "Admin override").slice(0, 80),
        startsAt: now,
        endsAt,
        active: true,
        createdBy: req.user?.email ?? "admin",
      },
    });

    if (
      (typeof body.profitRate === "number" && body.profitRate > 0) ||
      (typeof body.dailyRate === "number" && body.dailyRate > 0)
    ) {
      const dailyRate = clampDailyRate(
        typeof body.dailyRate === "number" && body.dailyRate > 0
          ? body.dailyRate > 1
            ? body.dailyRate / 100
            : body.dailyRate
          : Number(body.profitRate) / 100,
      );
      await prisma.userYieldConfig.upsert({
        where: { userId },
        create: { userId, dailyRate },
        update: { dailyRate },
      });
    }

    await writeAdminAudit({
      actorId: req.user!.id,
      actorEmail: req.user!.email,
      action: "Created yield spike",
      target: userId,
      level: "action",
    });
    res.status(201).json({ success: true, data: spike });
  } catch (error) {
    next(error);
  }
};

export const resolveYieldSpike = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { userId, spikeId } = req.params;
    if (spikeId) {
      await prisma.yieldSpike.updateMany({
        where: { id: spikeId, userId },
        data: { active: false },
      });
    } else {
      await prisma.yieldSpike.updateMany({
        where: { userId, active: true },
        data: { active: false },
      });
    }
    await writeAdminAudit({
      actorId: req.user!.id,
      actorEmail: req.user!.email,
      action: "Resolved yield spike",
      target: userId,
      level: "action",
    });
    res.json({ success: true, message: "Spike resolved" });
  } catch (error) {
    next(error);
  }
};
