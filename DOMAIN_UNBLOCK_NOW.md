# Unblock xcapital.investments (one-time)

**Cause (fixed):** `xsugax/X-CAPITAL` had owned the domain on GitHub Pages — **removed** (`cname: null`).  
Add the domain on **Render → xcapital-web** now.

---

## Do this now (copy/paste order)

### A — Release from xsugax (GitHub)

1. Open: **https://github.com/settings/pages**
2. **Add a domain** → `xcapital.investments`
3. Copy the **TXT** record GitHub shows:
   - **Host:** `_github-pages-challenge-iamsofiax`
   - **Value:** (token from GitHub)
4. **Namecheap** → Advanced DNS → **Add New Record**
   - Type: **TXT**
   - Host: `_github-pages-challenge-iamsofiax`
   - Value: (paste token)
   - TTL: Automatic
5. Wait **5–15 minutes** → click **Verify** on GitHub  
   → xsugax loses the domain automatically.

### B — Do NOT use GitHub for the live site

1. **https://github.com/iamsofiax/X-CAPITAL/settings/pages**
2. **Custom domain:** leave **empty** (no `xcapital.investments`)
3. Source can stay `gh-pages` for backups only.

### C — Render (after A is verified)

1. **https://dashboard.render.com** → every service → **Custom Domains**  
   Delete `xcapital.investments` / `www` from **xcapital-api** or any duplicate web service.
2. **xcapital-web** only → add:
   - `xcapital.investments`
   - `www.xcapital.investments`
3. Namecheap (unchanged):
   - **A** `@` → `216.24.57.1`
   - **CNAME** `www` → `xcapital-web.onrender.com`
   - **CNAME** `api` → `xcapital-api.onrender.com`

### D — Optional: clear stuck Render attachments

If Render still says "another site" after step A:

```powershell
# Create key: https://dashboard.render.com/u/settings#api-keys
$env:RENDER_API_KEY = "rnd_your_key_here"
.\scripts\release-render-domain.ps1
```

Wait 2 minutes → add domain on **xcapital-web** again.

---

## Proof (already confirmed)

- `xsugax/X-CAPITAL` Pages → `cname: xcapital.investments`
- `iamsofiax/X-CAPITAL` Pages → `cname: null`
- Live app works: **https://xcapital-web.onrender.com**

After A+C, **https://xcapital.investments** = same site as onrender.
