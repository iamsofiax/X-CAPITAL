/**
 * Push Neon DATABASE_URL onto Render xcapital-api and trigger a deploy.
 * Reads .env.local (never prints secrets). Auth: RENDER_API_KEY or ~/.render/cli.yaml
 *
 * Usage: node scripts/push-neon-to-render.mjs
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function readCliToken() {
  const p = path.join(os.homedir(), ".render", "cli.yaml");
  if (!fs.existsSync(p)) return "";
  const text = fs.readFileSync(p, "utf8");
  const nested = text.match(/api:\s*\r?\n\s+key:\s*["']?([^\s"']+)/);
  if (nested) return nested[1];
  const m =
    text.match(/apiKey:\s*["']?([^\s"']+)/) ||
    text.match(/api_key:\s*["']?([^\s"']+)/) ||
    text.match(/token:\s*["']?([^\s"']+)/);
  return m ? m[1] : "";
}

async function api(token, method, urlPath, body) {
  const res = await fetch(`https://api.render.com/v1${urlPath}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text.slice(0, 200) };
  }
  if (!res.ok) {
    throw new Error(`${method} ${urlPath} -> ${res.status}`);
  }
  return json;
}

const local = {
  ...parseEnvFile(path.join(root, ".env")),
  ...parseEnvFile(path.join(root, ".env.local")),
};

const databaseUrl = local.DATABASE_URL;
const unpooled = local.DATABASE_URL_UNPOOLED || local.DIRECT_URL || "";
if (!databaseUrl || !databaseUrl.includes("neon.tech")) {
  console.error("No Neon DATABASE_URL in .env.local — run neon link first.");
  process.exit(1);
}

const pastePath = path.join(root, "RENDER_PASTE.env");
const pasteLines = [
  `DATABASE_URL=${databaseUrl}`,
  `DATABASE_URL_UNPOOLED=${unpooled || databaseUrl}`,
  `KEEP_ALIVE_URL=https://xcapital-api.onrender.com`,
];
fs.writeFileSync(pastePath, pasteLines.join("\n") + "\n", "utf8");
console.log("Wrote RENDER_PASTE.env (gitignored) with Neon URLs.");

const token = process.env.RENDER_API_KEY || process.env.RENDER_TOKEN || readCliToken();
if (!token) {
  console.error(
    "No Render credentials. Set RENDER_API_KEY or run `render login` (token in %USERPROFILE%\\.render\\cli.yaml).",
  );
  process.exit(2);
}

const listed = await api(token, "GET", "/services?limit=50");
const rows = Array.isArray(listed) ? listed : [];
const match = rows.find((row) => {
  const svc = row.service || row;
  return svc.name === "xcapital-api";
});
if (!match) {
  console.error("xcapital-api not found in this Render account.");
  process.exit(3);
}
const service = match.service || match;
const id = service.id;
console.log(`Updating ${service.name} (${id}) — values not logged.`);

const keys = [
  ["DATABASE_URL", databaseUrl],
  ["DATABASE_URL_UNPOOLED", unpooled || databaseUrl],
  ["KEEP_ALIVE_URL", "https://xcapital-api.onrender.com"],
  ["PGSSLMODE", "no-verify"],
];
if (local.GOOGLE_CLIENT_ID) keys.push(["GOOGLE_CLIENT_ID", local.GOOGLE_CLIENT_ID]);
if (local.APPLE_CLIENT_ID) keys.push(["APPLE_CLIENT_ID", local.APPLE_CLIENT_ID]);

for (const [key, value] of keys) {
  if (!value) continue;
  await api(token, "PUT", `/services/${id}/env-vars/${encodeURIComponent(key)}`, {
    value,
  });
  console.log(`Set ${key}`);
}

try {
  await api(token, "PATCH", `/services/${id}`, {
    serviceDetails: { plan: "starter" },
  });
  console.log("Plan set to starter (always-on).");
} catch {
  console.log("Plan update skipped (may already be paid, or key lacks permission).");
}

await api(token, "POST", `/services/${id}/deploys`, { clearCache: "do_not_clear" });
console.log("Deploy triggered.");
