# Render — exit status 1 fix (applied in repo)

**Cause:** API crashed on start — Postgres SSL + `prisma db push` failing.

**Fix pushed:** `backend/scripts/render-start.sh` + SSL in `database.ts`.

---

## If a service still fails — update these 3 fields only

### xcapital-api (Web Service)

| Field | Value |
|-------|--------|
| Root Directory | `backend` |
| Build Command | `npm ci && npx prisma generate && npm run build` |
| Start Command | `npm run start:render` |

Must have **DATABASE_URL** (linked Postgres) and **JWT_SECRET** (any long random string).

---

### xcapital-web (Static Site)

| Field | Value |
|-------|--------|
| Root Directory | `frontend` |
| Build Command | `npm ci && npm run build` |
| Publish Directory | `out` |
| Start Command | *(empty)* |

---

### xcapital-oracle

| Start Command | `uvicorn main:app --host 0.0.0.0 --port $PORT` |

---

## Redeploy

Render Dashboard → **xcapital-api** → **Manual Deploy** → **Clear build cache & deploy**

Wait for **Live** (green). Then redeploy **xcapital-web**.

---

## Site URLs

- Frontend: https://xcapital-web.onrender.com (or custom domain)
- API health: https://xcapital-api.onrender.com/health
