import 'dotenv/config';
import app from './app';
import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import { logger } from './utils/logger';

async function bootstrap(): Promise<void> {
  // Listen first so Render health checks pass while DB connects
  const server = app.listen(env.PORT, () => {
    logger.info(`X-CAPITAL API listening on port ${env.PORT} [${env.NODE_ENV}]`);
    keepRenderAwake();
  });

  connectDatabase()
    .then(async () => {
      logger.info(`Database ready · MODE=${env.MODE}`);
      const { ensureHouseAccounts } = await import('./services/ledgerService');
      const { startDepositWatcher } = await import('./services/depositService');
      const { startWithdrawalWatcher } = await import('./services/withdrawalService');
      await ensureHouseAccounts();
      startDepositWatcher();
      startWithdrawalWatcher();
    })
    .catch((err) => {
      logger.error('Database connection failed — retrying in 15s:', err);
      setTimeout(() => {
        connectDatabase().catch((e) => logger.error('Database retry failed:', e));
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

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Rejection:', reason);
  });
}

/** Render free tier sleeps after ~15 minutes with no inbound request. Ping the public health URL so the process stays up between GitHub wakes. */
function keepRenderAwake(): void {
  if (!env.IS_PRODUCTION) return;
  const base = (process.env.RENDER_EXTERNAL_URL || 'https://xcapital-api.onrender.com').replace(/\/$/, '');
  const url = `${base}/health`;
  const beat = () => {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 20_000);
    fetch(url, { signal: ac.signal })
      .then(() => logger.info('Keep-awake ping ok'))
      .catch((err) => logger.warn(`Keep-awake ping failed: ${err instanceof Error ? err.message : String(err)}`))
      .finally(() => clearTimeout(timer));
  };
  setTimeout(beat, 60_000);
  setInterval(beat, 4 * 60 * 1000);
}

bootstrap().catch((err) => {
  logger.error('Bootstrap error:', err);
  process.exit(1);
});
