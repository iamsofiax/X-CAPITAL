# X-CAPITAL — Deploy in 10 Minutes (Production Frontend)

**Live URL:** https://xcapital.investments

GitHub Actions is **blocked** (billing lock). Use **local deploy** — it works every time.

---

## One command (Windows)

From the project root in PowerShell:

```powershell
.\scripts\deploy-pages.ps1
```

Takes ~3–8 minutes (build + upload). When you see **"Done"**, hard-refresh the site.

---

## Prerequisites (30 seconds)

| Check | Command |
|-------|---------|
| Node.js | `node -v` (need 18+) |
| GitHub CLI logged in | `gh auth status` |
| Git push access | `git remote -v` |

If `gh auth status` fails: `gh auth login`

---

## What the script does

1. `npm run build` → static site in `frontend/out`
2. Pushes `out/` to **`gh-pages`** branch
3. Ensures GitHub Pages uses **`gh-pages`** (not Actions)

---

## Verify production (2 minutes after deploy)

1. Open https://xcapital.investments  
2. Hard refresh: **Ctrl+Shift+R**  
3. Check:
   - Landing page loads
   - `/trading` — founder Hot Signals
   - **Crisp chat bubble** bottom-right
   - `/admin/login` loads

---

## If deploy fails

| Error | Fix |
|-------|-----|
| `npm run build failed` | `cd frontend && npm install && npm run build` |
| `gh-pages publish failed` | `gh auth login` then retry |
| Site old after deploy | Wait 2 min, Ctrl+Shift+R, try incognito |
| Actions still failing | **Ignore** — use local script only until billing fixed |

---

## Fix GitHub Actions later (optional)

1. https://github.com/settings/billing — unlock account  
2. Then pushes to `main` can auto-deploy via workflow again  

Until then: **`.\scripts\deploy-pages.ps1`** after every change.

---

## Backend / API note

This deploys the **frontend only** (GitHub Pages). If your API runs on Render/VPS separately, redeploy that service too for full stack updates.
