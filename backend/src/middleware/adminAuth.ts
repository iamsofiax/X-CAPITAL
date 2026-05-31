import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { env } from '../config/env';

const adminEmails = (): string[] =>
  (process.env.ADMIN_EMAILS ?? 'admin@xcapital.io,demo@xcapital.investments')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  if (!req.user?.email) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }
  if (!adminEmails().includes(req.user.email.toLowerCase())) {
    res.status(403).json({ success: false, message: 'Admin access required' });
    return;
  }
  next();
};

export { env };
