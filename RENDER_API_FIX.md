# Fix the API on Render (3 steps)

Your code is ready. Render only needs **env vars** + **redeploy**.

## Step 1 — Create paste file (on your PC)

```powershell
cd "C:\Users\MY PC\Desktop\X-CAPITAL"
.\scripts\make-render-paste.ps1
```

## Step 2 — Render dashboard

1. https://dashboard.render.com → **xcapital-api**
2. **Environment** → **Add from .env** → select **RENDER_PASTE.env**
3. **Add from database** → **xcapital-db** → **DATABASE_URL**
4. **Settings** — confirm:

| Field | Value |
|-------|--------|
| Root Directory | `backend` |
| Build Command | `npm ci && npx prisma generate && npm run build` |
| Start Command | `npm run start:render` |

## Step 3 — Deploy

**Manual Deploy** → **Clear build cache & deploy** → wait for **Live**.

## Test

https://xcapital-api.onrender.com/health

- `"database": true` → fully working
- `"database": false`, `"status": "starting"` → wait 30s and refresh (DB still connecting)

## Frontend

Redeploy **xcapital-web** after API is healthy (already points to `xcapital-api.onrender.com`).
