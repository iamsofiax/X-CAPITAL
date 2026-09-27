import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { env } from '../config/env';

export const adminEmails = (): string[] =>
  (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

export const isAdminEmail = (email: string): boolean =>
  adminEmails().includes(email.toLowerCase());

export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  if (!req.user?.email) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }
  if (!isAdminEmail(req.user.email)) {
    res.status(403).json({ success: false, message: 'Admin access required' });
    return;
  }
  next();
};

export { env };
