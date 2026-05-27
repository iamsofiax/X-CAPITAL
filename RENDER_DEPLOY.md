# Deploy X-CAPITAL on Render (custom domain)

Host **xcapital.investments** on Render instead of GitHub Pages. No `xsugax` account needed.

---

## Architecture on Render

| Service | Render name | URL |
|---------|-------------|-----|
| Frontend (static) | `xcapital-web` | **https://xcapital.investments** |
| Backend API | `xcapital-api` | **https://api.xcapital.investments** (recommended) |
| AI Oracle | `xcapital-oracle` | Internal / `*.onrender.com` |
| PostgreSQL | `xcapital-db` | Private (linked to API) |

---

## Step 1 — Create Render account

1. https://render.com → Sign up (GitHub login as **iamsofiax** is easiest)
2. Connect GitHub → allow access to **iamsofiax/X-CAPITAL**

---

## Step 2 — Deploy with Blueprint (one click)

1. Render Dashboard → **New** → **Blueprint**
2. Connect repo: `iamsofiax/X-CAPITAL`
3. Render reads **`render.yaml`** and creates all services + database
4. Click **Apply**

First deploy takes ~10–15 minutes.

---

## Step 3 — Set secrets in Render Dashboard

For **`xcapital-api`**, add in **Environment**:

| Variable | Value |
|----------|--------|
| `ALPACA_API_KEY` | Your Alpaca key |
| `ALPACA_SECRET_KEY` | Your Alpaca secret |
| `PERSONA_API_KEY` | (optional, for KYC) |
| `STRIPE_SECRET_KEY` | (optional) |

`JWT_SECRET` and `DATABASE_URL` are set automatically by the blueprint.

---

## Step 4 — Custom domains (DNS)

### Frontend → `xcapital.investments`

1. Open **`xcapital-web`** → **Settings** → **Custom Domains**
2. Add: `xcapital.investments` and `www.xcapital.investments`
3. Render shows DNS records — add at your registrar:

| Type | Name | Value |
|------|------|--------|
| **CNAME** | `www` | `xcapital-web.onrender.com` (use exact value Render shows) |
| **ALIAS/ANAME** or **A** | `@` | Render’s apex instructions (or CNAME flattening) |

### Backend → `api.xcapital.investments` (recommended)

1. Open **`xcapital-api`** → **Settings** → **Custom Domains**
2. Add: `api.xcapital.investments`
3. DNS:

| Type | Name | Value |
|------|------|--------|
| **CNAME** | `api` | `xcapital-api.onrender.com` |

### Update frontend API URL

After `api.xcapital.investments` works:

1. **`xcapital-web`** → **Environment** → set:
   ```
   NEXT_PUBLIC_API_URL=https://api.xcapital.investments/api/v1
   NEXT_PUBLIC_WS_URL=wss://api.xcapital.investments
   ```
2. **Manual Deploy** → redeploy frontend (env vars are baked in at build time)

---

## Step 5 — Turn off GitHub Pages (optional)

Once Render serves the domain:

1. Stop using `.\scripts\deploy-pages.ps1` for production
2. GitHub Pages on `xsugax` can stay — DNS pointing to Render wins once you update registrar records

---

## Redeploy after code changes

**Automatic:** push to `main` on `iamsofiax/X-CAPITAL` (enable auto-deploy per service in Render).

**Manual:** Render Dashboard → service → **Manual Deploy** → Deploy latest commit.

---

## Free tier notes

| Limit | Detail |
|-------|--------|
| **Spin-down** | Free web services sleep after ~15 min idle; first visit may take 30–60s |
| **PostgreSQL** | Free DB has storage/time limits — check Render docs |
| **Build minutes** | Limited per month on free tier |

For always-on production, upgrade API + DB to **Starter** (~$7+/mo each).

---

## Health checks

| Service | URL |
|---------|-----|
| Frontend | https://xcapital.investments |
| API | https://api.xcapital.investments/health |
| Oracle | https://xcapital-oracle.onrender.com/health |

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Site loads but API fails | Check `NEXT_PUBLIC_API_URL` and redeploy **xcapital-web** |
| CORS errors | Set `FRONTEND_URL=https://xcapital.investments` on **xcapital-api** |
| DB errors | Check **xcapital-db** is linked; run logs on **xcapital-api** |
| Build fails | View build logs in Render; ensure Node 20 / Python 3.12 |

---

## Quick checklist

- [ ] Blueprint deployed from `iamsofiax/X-CAPITAL`
- [ ] API secrets set (Alpaca, etc.)
- [ ] DNS: `xcapital.investments` → **xcapital-web**
- [ ] DNS: `api.xcapital.investments` → **xcapital-api**
- [ ] Frontend env updated + redeployed
- [ ] HTTPS shows “Certificate issued” on both custom domains
