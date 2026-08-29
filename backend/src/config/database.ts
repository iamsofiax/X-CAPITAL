import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { logger } from "../utils/logger";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function needsSsl(url: string): boolean {
  return (
    process.env.NODE_ENV === "production" ||
    url.includes("neon.tech") ||
    url.includes("sslmode=")
  );
}

/**
 * Neon + node-pg on Render: query-string sslmode is not enough — Node still
 * rejects the chain as a self-signed cert. Strip sslmode/channel_binding and
 * pass ssl: { rejectUnauthorized: false } into the adapter's pg Pool.
 */
export function sanitizeDatabaseUrl(raw: string): string {
  try {
    const u = new URL(raw);
    u.searchParams.delete("sslmode");
    u.searchParams.delete("channel_binding");
    return u.toString();
  } catch {
    return raw
      .replace(/([?&])sslmode=[^&]*/gi, "$1")
      .replace(/([?&])channel_binding=[^&]*/gi, "$1")
      .replace(/\?&/, "?")
      .replace(/&&/g, "&")
      .replace(/[?&]$/, "");
  }
}

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return sanitizeDatabaseUrl(url);
}

function createPrismaClient(): PrismaClient {
  const connectionString = getDatabaseUrl();
  const adapter = new PrismaPg({
    connectionString,
    ssl: needsSsl(connectionString) ? { rejectUnauthorized: false } : undefined,
    max: 10,
    idleTimeoutMillis: 20_000,
    connectionTimeoutMillis: 8_000,
  } as ConstructorParameters<typeof PrismaPg>[0]);
  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "info", "warn", "error"]
        : ["error"],
  });
}

const prisma = global.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.__prisma = prisma;
}

export async function connectDatabase(): Promise<void> {
  await prisma.$connect();
  logger.info("Database connected successfully");
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}

export { prisma };
