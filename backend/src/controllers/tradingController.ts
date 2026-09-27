import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import { prisma } from "../config/database";
import { AuthRequest } from "../middleware/auth";
import { brokerService } from "../services/brokerService";
import {
  AssetType,
  OrderStatus,
  Prisma,
} from "@prisma/client";

export const getAssets = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { type, search, limit = "50", offset = "0" } = req.query;

    const where: Record<string, unknown> = { isActive: true };
    if (type) where.type = type;
    if (search) {
      where.OR = [
        { symbol: { contains: String(search).toUpperCase() } },
        { name: { contains: String(search), mode: "insensitive" } },
      ];
    }

    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        where: where as Prisma.AssetWhereInput,
        orderBy: { marketCap: "desc" },
        take: parseInt(String(limit)),
        skip: parseInt(String(offset)),
      }),
      prisma.asset.count({
        where: where as Prisma.AssetWhereInput,
      }),
    ]);

    res.json({ success: true, data: { assets, total } });
  } catch (error) {
    next(error);
  }
};

export const getAsset = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { symbol } = req.params;
    const asset = await prisma.asset.findUnique({
      where: { symbol: symbol.toUpperCase() },
    });

    if (!asset) {
      res.status(404).json({ success: false, message: "Asset not found" });
      return;
    }

    // Fetch live price from broker if stock/ETF
    let livePrice = null;
    if (asset.type === AssetType.STOCK || asset.type === AssetType.ETF) {
      try {
        livePrice = await brokerService.getQuote(asset.symbol);
      } catch {
        // Use stored price as fallback
      }
    }

    res.json({ success: true, data: { ...asset, livePrice } });
  } catch (error) {
    next(error);
  }
};

export const getLiveQuotes = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const raw = String(req.query.symbols || "");
    const symbols = raw
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean)
      .slice(0, 20);
    if (!symbols.length) {
      res.status(400).json({ success: false, message: "symbols required" });
      return;
    }
    const quotes = await brokerService.getSnapshots(symbols);
    res.json({
      success: true,
      data: {
        quotes,
        feed: brokerService.configured() ? "alpaca-iex" : "unavailable",
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAssetChart = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { symbol } = req.params;
    const { period = "1D" } = req.query;

    const data = await brokerService.getBars(
      symbol.toUpperCase(),
      String(period),
    );
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getOrders = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user!.id },
      include: {
        asset: {
          select: { symbol: true, name: true, type: true, imageUrl: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    res.json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};

export const getOrder = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
      include: { asset: true },
    });
    if (!order) {
      res.status(404).json({ success: false, message: "Order not found" });
      return;
    }
    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

