# Render — fixed settings (copy-paste)

If you created services manually, **delete them** and use **Blueprint** instead:
**New → Blueprint → `iamsofiax/X-CAPITAL` → Apply**

---

## Or fix each service manually

### xcapital-web (Static Site)

| Field | Value |
|-------|--------|
| Root Directory | `frontend` |
| Build Command | `npm ci && npm run build` |
| Publish Directory | `out` |
| Start Command | *(empty)* |

Environment:
```
NEXT_PUBLIC_API_URL=https://xcapital-api.onrender.com/api/v1
NEXT_PUBLIC_WS_URL=wss://xcapital-api.onrender.com
```

---

### xcapital-api (Web Service)

| Field | Value |
|-------|--------|
| Root Directory | `backend` |
| Build Command | `npm ci && npx prisma generate && npm run build` |
| Start Command | `npx prisma db push && npm start` |

Link Postgres database `xcapital-db` → `DATABASE_URL` auto-fills.

---

### xcapital-oracle (Web Service)

| Field | Value |
|-------|--------|
| Root Directory | `ai-oracle` |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `uvicorn main:app --host 0.0.0.0 --port $PORT` |

---

## Do NOT use repo root for frontend

Wrong (causes `@/store` errors):
- Root Directory: `.` or empty
- Build: `npm run build` (root package.json)

Right:
- Root Directory: **`frontend`**

---

## Custom domain

1. **xcapital-web** → `xcapital.investments`
2. **xcapital-api** → `api.xcapital.investments`
3. Redeploy **xcapital-web** with:
   `NEXT_PUBLIC_API_URL=https://api.xcapital.investments/api/v1`
