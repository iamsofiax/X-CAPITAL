import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../config/database';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    tier: string;
    kycStatus: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ success: false, message: 'No token provided' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      userId: string;
      email: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, tier: true, kycStatus: true, isActive: true },
    });

    if (!user || !user.isActive) {
      res.status(401).json({ success: false, message: 'User not found or deactivated' });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      tier: user.tier,
      kycStatus: user.kycStatus,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ success: false, message: 'Token expired' });
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ success: false, message: 'Invalid token' });
      return;
    }
    next(error);
  }
};

export const requireKYC = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (req.user?.kycStatus !== 'APPROVED') {
    res.status(403).json({
      success: false,
      message: 'KYC verification required to access this feature',
      kycStatus: req.user?.kycStatus,
    });
    return;
  }
  next();
};

export const requireAccreditation = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { accreditationStatus: true },
  });

  if (user?.accreditationStatus !== 'ACCREDITED') {
    res.status(403).json({
      success: false,
      message: 'Accredited investor status required for private investments',
    });
    return;
  }
  next();
};

export const requireTier = (minTier: 'CORE' | 'GOLD' | 'BLACK') => {
  const tierRank: Record<string, number> = { CORE: 0, GOLD: 1, BLACK: 2 };
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const userRank = tierRank[req.user?.tier || 'CORE'];
    if (userRank < tierRank[minTier]) {
      res.status(403).json({
        success: false,
        message: `${minTier} tier or higher required for this feature`,
      });
      return;
    }
    next();
  };
};
