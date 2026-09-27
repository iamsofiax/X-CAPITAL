import axios from 'axios';
import { env } from '../config/env';
import { prisma } from '../config/database';
import { vaultCustody } from './custody/vault';
import { brokerService } from './brokerService';

export type HealthServiceRow = { name: string; status: 'operational' | 'degraded' | 'offline' };

export async function collectHealth() {
  const started = Date.now();

  let ledger: HealthServiceRow['status'] = 'offline';
  try {
    await prisma.$queryRaw`SELECT 1`;
    ledger = 'operational';
  } catch {
    ledger = 'offline';
  }

  let oracle: HealthServiceRow['status'] = 'offline';
  try {
    const { data, status } = await axios.get(`${env.AI_ORACLE_URL.replace(/\/$/, '')}/health`, {
      timeout: 4000,
      validateStatus: () => true,
    });
    if (status === 200 && (data?.status === 'healthy' || data?.service)) {
      oracle = 'operational';
    } else if (status < 500) {
      oracle = 'degraded';
    }
  } catch {
    oracle = 'degraded';
  }

  const railsReady = env.MODE === 'live' || env.MODE === 'testnet';
  const railsHot = railsReady && (vaultCustody.configured || brokerService.configured());
  const rails: HealthServiceRow['status'] = railsHot ? 'operational' : railsReady ? 'degraded' : 'offline';

  const api: HealthServiceRow['status'] = 'operational';
  const services: HealthServiceRow[] = [
    { name: 'api', status: api },
    { name: 'database', status: ledger },
    { name: 'ledger', status: ledger },
    { name: 'ai-oracle', status: oracle },
    { name: 'rail-sync', status: rails },
  ];

  const operational = services.filter((s) => s.status === 'operational').length;
  const degraded = services.filter((s) => s.status === 'degraded').length;
  const offline = services.filter((s) => s.status === 'offline').length;
  const worst = offline ? 'degraded' : degraded ? 'degraded' : 'healthy';

  return {
    status: worst,
    service: 'X-CAPITAL API',
    version: '1.0.0',
    environment: env.NODE_ENV,
    mode: env.MODE,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    latencyMs: Date.now() - started,
    database: ledger === 'operational',
    services,
    summary: { operational, degraded, offline, total: services.length },
  };
}
