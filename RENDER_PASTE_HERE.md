# Render — paste this (2 minutes)

There is **no build command to paste** that fixes secrets. You paste an **env file** once, link the database once, deploy.

---

## Step A — Make the paste file on your PC

In PowerShell:

```powershell
cd "C:\Users\MY PC\Desktop\X-CAPITAL"
.\scripts\make-render-paste.ps1
```

This creates **`RENDER_PASTE.env`** in the project folder (uses your saved `JWT_SECRET` from `backend/.env`).

---

## Step B — Paste into Render (xcapital-api only)

1. Open https://dashboard.render.com  
2. Click **`xcapital-api`**  
3. Click **Environment** (left menu)  
4. Click **Add from .env** → choose **`RENDER_PASTE.env`** from your Desktop folder  
5. Click **Add from database** → **`xcapital-db`** → variable **`DATABASE_URL`**  
   - If you have no database: **New** → **PostgreSQL** → name **`xcapital-db`**, then repeat step 5.  
6. Click **Manual Deploy** → **Clear build cache & deploy**

---

## Step C — Check

Open: https://xcapital-api.onrender.com/health  

You want: `"status":"healthy"`

---

## If xcapital-api settings are wrong (copy these 3 fields)

Open **xcapital-api** → **Settings**:

| Field | Paste this |
|-------|------------|
| **Root Directory** | `backend` |
| **Build Command** | `npm ci && npx prisma generate && npm run build` |
| **Start Command** | `npm run start:render` |

---

## Even faster (new Render account / start over)

**New** → **Blueprint** → repo **`iamsofiax/X-CAPITAL`** → **Apply**  

That reads `render.yaml` and wires database + services automatically. Then only set **JWT** if login fails (run `make-render-paste.ps1` and add `JWT_SECRET`).

---

## Do not paste

- Anything from `backend/.env` that contains **`postgres:5432`** — that breaks Render.
