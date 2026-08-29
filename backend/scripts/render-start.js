/**
 * Render production startup.
 *
 * The HTTP process MUST listen immediately. Blocking on prisma db push used
 * to stall /health, which made Render mark the service dead and restart it —
 * the API then looked permanently OFFLINE.
 *
 * Schema apply runs in the background with retries. Neon (or any reachable
 * Postgres) is required for logins; liveness does not wait on it.
 */
require("dotenv").config();

const { execSync, spawn } = require("child_process");

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function fail(msg) {
  console.error("\n" + msg + "\n");
  process.exit(1);
}

function ensureSsl(url) {
  if (!url || url.includes("sslmode=")) return url;
  return url.includes("?") ? `${url}&sslmode=require` : `${url}?sslmode=require`;
}

async function applySchemaInBackground() {
  const pushUrl =
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.DIRECT_URL ||
    process.env.DATABASE_URL;
  const pushEnv = { ...process.env, DATABASE_URL: ensureSsl(pushUrl) };

  for (let attempt = 1; attempt <= 30; attempt++) {
    try {
      console.log(`Applying schema (prisma db push) attempt ${attempt}/30...`);
      execSync("npx prisma db push --skip-generate", {
        stdio: "inherit",
        env: pushEnv,
      });
      console.log("Schema applied.");
      return;
    } catch {
      console.log(`Schema apply failed — retry in 12s (API stays up).`);
      await sleep(12_000);
    }
  }
  console.error(
    "Schema apply still failing after 30 attempts. API is live; logins will work once Postgres accepts the schema.",
  );
}

async function main() {
  console.log("=== X-CAPITAL API startup (Render) ===");

  let databaseUrl = process.env.DATABASE_URL;
  const jwtSecret = process.env.JWT_SECRET;

  if (!databaseUrl) {
    fail(
      "ERROR: DATABASE_URL is not set.\n" +
        "  Paste the Neon pooled connection string on Render → xcapital-api → Environment.",
    );
  }

  if (!jwtSecret) {
    fail(
      "ERROR: JWT_SECRET is not set.\n" +
        "  Run: .\\scripts\\make-render-paste.ps1 then Add from .env on Render",
    );
  }

  if (/@postgres[:/]/.test(databaseUrl)) {
    fail(
      "ERROR: DATABASE_URL uses Docker host 'postgres'.\n" +
        "  Use the Neon pooled URL (*.neon.tech), not backend/.env Docker values.",
    );
  }

  databaseUrl = ensureSsl(databaseUrl);
  process.env.DATABASE_URL = databaseUrl;
  if (process.env.DATABASE_URL_UNPOOLED) {
    process.env.DATABASE_URL_UNPOOLED = ensureSsl(
      process.env.DATABASE_URL_UNPOOLED,
    );
  }

  const port = process.env.PORT || "4000";
  console.log(`Starting API on port ${port} (schema apply in background)...`);
  const child = spawn("node", ["dist/server.js"], {
    stdio: "inherit",
    env: process.env,
  });
  child.on("exit", (code) => process.exit(code ?? 1));

  void applySchemaInBackground();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
