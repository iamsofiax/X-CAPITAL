# Render environment — plain English (read this once)

You already saved secrets in **`backend/.env`**. That file is for **Docker on your PC**, not for Render.  
Render needs the **same JWT secret**, but a **different database URL**.

---

## What these two variables mean

| Variable | What it is |
|----------|------------|
| **DATABASE_URL** | The address of your PostgreSQL database. The API and Prisma use it to read/write users, trades, etc. |
| **JWT_SECRET** | A long random password the API uses to sign login tokens. If it changes, everyone must log in again. |

---

## DATABASE_URL — do **not** copy from `backend/.env`

Your local file has:

```text
postgresql://xcapital:...@postgres:5432/xcapital_db
```

`postgres` is a **Docker hostname**. It does not exist on Render. If you paste that into Render, the API **will crash**.

### Correct way on Render

1. Open [Render Dashboard](https://dashboard.render.com).
2. Open database **`xcapital-db`** (create it from Blueprint if missing).
3. On **`xcapital-api`** → **Environment**:
   - Click **Add from database** → select **`xcapital-db`** → **`DATABASE_URL`**  
   **OR** copy **Internal Database URL** from the database page and paste as `DATABASE_URL`.

Render will set something like:

```text
postgresql://xcapital:XXXX@dpg-xxxxx-a.oregon-postgres.render.com/xcapital_db
```

That is the only `DATABASE_URL` that works in production.

---

## JWT_SECRET — copy from your saved `backend/.env`

You already saved this on **line 9** of `backend/.env`:

```text
JWT_SECRET=xcapital_jwt_secret_production_key_2026_minimum_64_characters_for_security_here
```

On **`xcapital-api`** → **Environment** → add or edit:

- Key: `JWT_SECRET`
- Value: *(paste the full line after `=` from your `.env` — no quotes)*

Also set:

| Key | Value |
|-----|--------|
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | `https://xcapital.investments` |
| `PORT` | *(leave empty — Render sets this)* |

---

## After env vars are set

1. **xcapital-api** → **Manual Deploy** → **Clear build cache & deploy**
2. Wait until status is **Live**
3. Open: https://xcapital-api.onrender.com/health — should show `"status":"healthy"`
4. Redeploy **xcapital-web** if needed

Run locally to print your JWT for copy-paste:

```powershell
.\scripts\render-setup.ps1
```

---

## Frontend is already working

https://xcapital-web.onrender.com returns **200**.  
The API was failing because of Prisma build + wrong/missing `DATABASE_URL` on Render.

---

## Login (unchanged)

- Site: https://xcapital.investments/auth/login  
- Admin: https://xcapital.investments/admin/login  
- See `LOGIN_DETAILS.md` for demo accounts (after API + DB are live).
