import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { errorHandler } from './middleware/errorHandler';
import { apiRateLimit } from './middleware/rateLimit';
import { env } from './config/env';
import { prisma } from './config/database';
import { withTimeout } from './utils/withTimeout';
import routes from './routes';

const app = express();

const corsOrigins = [
  env.FRONTEND_URL,
  'https://xcapital.investments',
  'https://www.xcapital.investments',
  'https://xcapital-web.onrender.com',
  'https://iamsofiax.github.io',
  'http://localhost:3000',
  ...env.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean),
].filter((o, i, arr) => o && arr.indexOf(o) === i);

// ─── Security ────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || corsOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Performance ─────────────────────────────────────────────────────────────
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Logging ─────────────────────────────────────────────────────────────────
if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.IS_PRODUCTION ? 'combined' : 'dev'));
}

// ─── Rate Limiting (never throttle liveness — Render + keep-alive ping this) ─
app.use('/api/', (req, res, next) => {
  if (req.path === '/v1/health' || req.path === '/health') {
    next();
    return;
  }
  apiRateLimit(req, res, next);
});

// ─── Liveness ─────────────────────────────────────────────────────────────────
// Always 200 if the process is up. A hanging DB query must NEVER stall this
// endpoint — Render treats a timeout as a dead service and restarts it.
app.get('/health', async (_req, res) => {
  let db = false;
  try {
    await withTimeout(prisma.$queryRaw`SELECT 1`, 1500, 'db-timeout');
    db = true;
  } catch {
    db = false;
  }
  res.status(200).json({
    status: db ? 'healthy' : 'starting',
    database: db,
    service: 'X-CAPITAL API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/v1', routes);

// ─── 404 ─────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// ─── Error Handling ───────────────────────────────────────────────────────────
app.use(errorHandler);

export default app;
