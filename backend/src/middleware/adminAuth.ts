import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { env } from '../config/env';

/** Always operators, even if the host env list is stale. More can be added via ADMIN_EMAILS. */
const OPERATOR_EMAILS = [
  'admin@xcapital.io',
  'operator@xcapital.investments',
];

export const adminEmails = (): string[] => {
  const fromEnv = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return Array.from(new Set([...OPERATOR_EMAILS, ...fromEnv]));
};

export const isAdminEmail = (email: string): boolean =>
  adminEmails().includes(email.trim().toLowerCase());

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
