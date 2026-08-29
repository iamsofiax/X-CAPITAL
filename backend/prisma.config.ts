import path from "node:path";
import dotenv from "dotenv";
import { defineConfig } from "prisma/config";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });
dotenv.config({
  path: path.resolve(process.cwd(), "../.env.local"),
  override: true,
});

function neonSafeUrl(url: string): string {
  if (!url.includes("neon.tech")) return url;
  try {
    const u = new URL(url);
    u.searchParams.delete("channel_binding");
    u.searchParams.set("sslmode", "no-verify");
    return u.toString();
  } catch {
    return url;
  }
}

// Prisma 7: connection URL lives here (not in schema.prisma).
// Placeholder allows `prisma generate` during CI/Render build without a live DB.
// Prefer the unpooled Neon URL for prisma db push / migrations.
const databaseUrl = neonSafeUrl(
  process.env.DATABASE_URL_UNPOOLED ||
    process.env.DIRECT_URL ||
    process.env.DATABASE_URL ||
    "postgresql://build:build@127.0.0.1:5432/build?sslmode=disable",
);

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: databaseUrl,
  },
});
