/**
 * Render production startup (Node — avoids shell/CRLF issues on Windows commits).
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

async function main() {
  console.log("=== X-CAPITAL API startup (Render) ===");

  let databaseUrl = process.env.DATABASE_URL;
  const jwtSecret = process.env.JWT_SECRET;

  if (!databaseUrl) {
    fail(
      "ERROR: DATABASE_URL is not set.\n" +
        "  Render -> xcapital-api -> Environment -> Add from database -> xcapital-db"
    );
  }

  if (!jwtSecret) {
    fail(
      "ERROR: JWT_SECRET is not set.\n" +
        "  Run: .\\scripts\\make-render-paste.ps1 then Add from .env on Render"
    );
  }

  if (/@postgres[:/]/.test(databaseUrl)) {
    fail(
      "ERROR: DATABASE_URL uses Docker host 'postgres'.\n" +
        "  Link Render Postgres (xcapital-db), do not paste backend/.env"
    );
  }

  databaseUrl = ensureSsl(databaseUrl);
  process.env.DATABASE_URL = databaseUrl;

  console.log("Waiting for Postgres...");
  await sleep(5000);

  const maxAttempts = 5;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`Applying schema (prisma db push) attempt ${attempt}/${maxAttempts}...`);
      execSync("npx prisma db push --skip-generate", {
        stdio: "inherit",
        env: process.env,
      });
      console.log("Schema applied.");
      break;
    } catch (err) {
      if (attempt === maxAttempts) {
        fail(
          "ERROR: prisma db push failed.\n" +
            "  Confirm xcapital-db is running and DATABASE_URL is linked on Render."
        );
      }
      console.log(`Retry in 10s...`);
      await sleep(10000);
    }
  }

  const port = process.env.PORT || "4000";
  console.log(`Starting API on port ${port}...`);
  const child = spawn("node", ["dist/server.js"], {
    stdio: "inherit",
    env: process.env,
  });
  child.on("exit", (code) => process.exit(code ?? 1));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
