import { Request, Response } from 'express';
import axios from 'axios';
import { prisma } from '../config/database';
import { env } from '../config/env';

const startedAt = Date.now();

interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'offline';
  latencyMs?: number;
  detail?: string;
}

/**
 * System health — the single source of truth for frontend telemetry.
 * Reports DB, AI Oracle, and process uptime so the UI can expose
 * real network status instead of hard-coded "ALL SYSTEMS OPERATIONAL".
 */
export async function getSystemHealth(_req: Request, res: Response) {
  const services: ServiceStatus[] = [];

  // ── Database ────────────────────────────────────────────────────────────────
  const dbStart = Date.now();
  let dbLatency: number | undefined;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbLatency = Date.now() - dbStart;
    services.push({ name: 'database', status: 'operational', latencyMs: dbLatency });
  } catch {
    services.push({ name: 'database', status: 'offline' });
  }

  // ── AI Oracle ───────────────────────────────────────────────────────────────
  const oracleStart = Date.now();
  try {
    const { data } = await axios.get(`${env.AI_ORACLE_URL}/health`, { timeout: 4000 });
    services.push({
      name: 'ai-oracle',
      status: data?.status === 'healthy' ? 'operational' : 'degraded',
      latencyMs: Date.now() - oracleStart,
      detail: data?.service,
    });
  } catch {
    services.push({ name: 'ai-oracle', status: 'offline' });
  }

  // ── Aggregate ───────────────────────────────────────────────────────────────
  const operational = services.filter((s) => s.status === 'operational').length;
  const degraded = services.filter((s) => s.status === 'degraded').length;
  const offline = services.filter((s) => s.status === 'offline').length;
  const overall: 'healthy' | 'degraded' | 'offline' =
    offline > 0 ? 'degraded' : degraded > 0 ? 'degraded' : operational > 0 ? 'healthy' : 'offline';

  res.status(200).json({
    success: true,
    data: {
      status: overall,
      service: 'X-CAPITAL API',
      version: '1.0.0',
      environment: env.NODE_ENV,
      uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
      timestamp: new Date().toISOString(),
      latencyMs: dbLatency,
      services,
      summary: {
        operational,
        degraded,
        offline,
        total: services.length,
      },
    },
  });
}
