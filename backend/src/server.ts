import 'dotenv/config';
import app from './app';
import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import { logger } from './utils/logger';
import { startAccrualWorker } from './services/accrualService';

async function bootstrap(): Promise<void> {
  // Listen first so Render health checks pass while DB connects
  const server = app.listen(env.PORT, () => {
    logger.info(`X-CAPITAL API listening on port ${env.PORT} [${env.NODE_ENV}]`);
  });

  connectDatabase()
    .then(() => {
      logger.info('Database ready');
      startAccrualWorker(20_000);
      logger.info('Accrual Core worker armed');
    })
    .catch((err) => {
      logger.error('Database connection failed — retrying in 15s:', err);
      setTimeout(() => {
        connectDatabase()
          .then(() => {
            logger.info('Database ready');
            startAccrualWorker(20_000);
          })
          .catch((e) => logger.error('Database retry failed:', e));
      }, 15000);
    });

  const shutdown = async (signal: string) => {
    logger.info(`${signal} received — shutting down gracefully`);
    server.close(async () => {
      await disconnectDatabase();
      logger.info('Server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // CRITICAL: a stray rejection or exception must NEVER kill the API.
  // Log it, keep serving. Render's health check + self-ping keeps us alive.
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Rejection — server stays up:', reason);
  });

  process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception — server stays up:', err);
  });

  // Keep-alive: on Render, self-ping every 60s so the free-tier web service
  // never spins down from inactivity → the API stays constantly live.
  if (process.env.RENDER_EXTERNAL_URL || process.env.KEEP_ALIVE_URL) {
    const selfPing = () => {
      const base = process.env.KEEP_ALIVE_URL || process.env.RENDER_EXTERNAL_URL;
      fetch(`${base}/health`)
        .then(() => logger.debug('Keep-alive ping OK'))
        .catch((e) => {
          const message = e instanceof Error ? e.message : String(e);
          logger.warn('Keep-alive ping failed:', message);
        });
    };
    selfPing();
    const keepAliveTimer = setInterval(selfPing, 60_000);
    keepAliveTimer.unref();
  }
}

bootstrap().catch((err) => {
  logger.error('Bootstrap error:', err);
  process.exit(1);
});
