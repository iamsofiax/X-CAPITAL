#!/bin/sh
set -e

echo "=== X-CAPITAL API startup (Render) ==="

if [ -z "$DATABASE_URL" ]; then
  echo ""
  echo "ERROR: DATABASE_URL is not set."
  echo "  Fix: Render Dashboard -> xcapital-api -> Environment"
  echo "  Add DATABASE_URL from database xcapital-db (Link database)."
  echo "  Do NOT paste the URL from backend/.env (Docker uses host 'postgres')."
  echo "  See RENDER_ENV_SETUP.md in the repo."
  echo ""
  exit 1
fi

if [ -z "$JWT_SECRET" ]; then
  echo ""
  echo "ERROR: JWT_SECRET is not set."
  echo "  Fix: Copy JWT_SECRET from backend/.env line 9 into Render Environment."
  echo "  Or run: scripts/render-setup.ps1"
  echo ""
  exit 1
fi

# Reject Docker-only hostname (common mistake when copying .env to Render)
case "$DATABASE_URL" in
  *@postgres:*|*@postgres/*|*@postgres,*)
    echo ""
    echo "ERROR: DATABASE_URL points to hostname 'postgres' (Docker only)."
    echo "  Use Render Postgres Internal/External URL instead."
    echo "  See RENDER_ENV_SETUP.md"
    echo ""
    exit 1
    ;;
esac

# Render Postgres requires SSL on external connections
case "$DATABASE_URL" in
  *sslmode=*) ;;
  *\?*) export DATABASE_URL="${DATABASE_URL}&sslmode=require" ;;
  *) export DATABASE_URL="${DATABASE_URL}?sslmode=require" ;;
esac

echo "Database host configured (SSL enabled if needed)."
echo "Waiting for Postgres..."
sleep 5

echo "Applying schema (prisma db push)..."
attempt=1
max=5
while [ "$attempt" -le "$max" ]; do
  if npx prisma db push --skip-generate; then
    echo "Schema applied."
    break
  fi
  if [ "$attempt" -eq "$max" ]; then
    echo ""
    echo "ERROR: prisma db push failed after $max attempts."
    echo "  Check DATABASE_URL is the Render Postgres URL (not Docker .env)."
    echo "  Check xcapital-db is running on Render."
    exit 1
  fi
  echo "Retry $attempt/$max in 10s..."
  sleep 10
  attempt=$((attempt + 1))
done

echo "Starting API on port ${PORT:-4000}..."
exec node dist/server.js
