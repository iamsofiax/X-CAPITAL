# Fix: "Welcome to Render" spinning forever on xcapital.investments

**Working:** https://xcapital-web.onrender.com  
**Broken:** https://xcapital.investments (hangs / spinner)

---

## Cause (most likely)

Namecheap **URL Redirect** or **Parking** sends traffic through **Cloudflare**, not to Render.
Your DNS must be **only** A + CNAME records — no "Redirect Domain" rows.

---

## Namecheap — delete these if present

In **Advanced DNS**, remove:

- **URL Redirect Record** (any host `@` or `www`)
- **Parking Page**
- **Masked Redirect**
- **CNAME** `@` → `parkingpage.namecheap.com` (or similar)
- Duplicate **A** / **AAAA** on `@`

---

## Namecheap — keep ONLY these 3 rows

| Type | Host | Value |
|------|------|--------|
| A Record | `@` | `216.24.57.1` |
| CNAME Record | `www` | `xcapital-web.onrender.com` |
| CNAME Record | `api` | `xcapital-api.onrender.com` |

TTL: Automatic or 1 min.

**Do not** put `https://` in Value.  
**Do not** use Host `xcapital.investments` (use `@` and `www` only).

---

## Render — redeploy web

1. **xcapital-web** → **Manual Deploy** → **Clear build cache & deploy**
2. Settings must show:
   - Publish Directory: **`out`**
   - Root Directory: **`frontend`**
3. Wait until status is **Live** (green).

---

## Test (incognito Firefox)

1. https://xcapital-web.onrender.com — must show full site  
2. https://www.xcapital.investments — should show full site (not redirect through Cloudflare)  
3. https://xcapital.investments — should match onrender

If (1) works but (2)/(3) fail → DNS still has redirect/parking.  
If all fail → redeploy web (publish path `out`).
