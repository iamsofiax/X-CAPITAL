#!/bin/sh
set -e

if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is not set. Link the Postgres database in Render."
  exit 1
fi

if [ -z "$JWT_SECRET" ]; then
  echo "ERROR: JWT_SECRET is not set."
  exit 1
fi

# Render Postgres (external URL) requires SSL
case "$DATABASE_URL" in
  *sslmode=*) ;;
  *\?*) export DATABASE_URL="${DATABASE_URL}&sslmode=require" ;;
  *) export DATABASE_URL="${DATABASE_URL}?sslmode=require" ;;
esac

echo "Waiting for database..."
sleep 3

echo "Applying schema (prisma db push)..."
if ! npx prisma db push --skip-generate; then
  echo "Retrying db push in 8s..."
  sleep 8
  npx prisma db push --skip-generate
fi

echo "Starting X-CAPITAL API on port ${PORT:-4000}..."
exec node dist/server.js
