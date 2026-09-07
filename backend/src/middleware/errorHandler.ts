import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  const prismaError = err.name.startsWith('Prisma') || Boolean((err as Error & { code?: string }).code?.startsWith('P'));
  const statusCode = err.statusCode || (prismaError ? 503 : 500);
  const message = err.isOperational
    ? err.message
    : prismaError
      ? 'Authentication service is temporarily unavailable. Please try again shortly.'
      : 'Internal server error';

  logger.error(`${statusCode} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);

  if (!err.isOperational) {
    logger.error('Unexpected error:', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export const createError = (message: string, statusCode: number): AppError => {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};
