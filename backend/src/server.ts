import 'dotenv/config';
import app from './app';
import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import { logger } from './utils/logger';

async function bootstrap(): Promise<void> {
  // Listen first so Render health checks pass while DB connects
  const server = app.listen(env.PORT, () => {
    logger.info(`X-CAPITAL API listening on port ${env.PORT} [${env.NODE_ENV}]`);
  });

  connectDatabase()
    .then(() => logger.info('Database ready'))
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
    shutdown('UNHANDLED_REJECTION');
  });
}

bootstrap().catch((err) => {
  logger.error('Bootstrap error:', err);
  process.exit(1);
});
