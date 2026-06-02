# Render: "domain already exists on another site" — WEB fix

GitHub is clear (xsugax + iamsofiax both `cname: null`).  
The lock is **inside Render** — almost always because the **root domain is on the API service**.

---

## Rule (memorize this)

| Domain | ONLY on this Render service |
|--------|----------------------------|
| `xcapital.investments` | **xcapital-web** |
| `www.xcapital.investments` | **xcapital-web** |
| `api.xcapital.investments` | **xcapital-api** |

**Never** put `xcapital.investments` or `www` on **xcapital-api**.

---

## Fix in Render Dashboard (3 minutes)

### Step 1 — xcapital-api

1. Open **xcapital-api** → **Settings** → **Custom Domains**
2. **Delete** any of these if listed:
   - `xcapital.investments`
   - `www.xcapital.investments`
3. **Keep only:** `api.xcapital.investments` (if you use it)

### Step 2 — every other service

Open **each** service in your Render account (including old/duplicate names):

- xcapital-web
- xcapital-oracle
- Any `xcapital-web-xxxx` duplicate from old Blueprint

**Custom Domains** → delete `xcapital.investments` / `www` from anything that is **not** xcapital-web.

### Step 3 — wait 2 minutes, then xcapital-web

1. **xcapital-web** → **Custom Domains** → **Add**
2. Add `xcapital.investments`
3. Add `www.xcapital.investments`

---

## Still blocked?

Create a Render API key: https://dashboard.render.com/u/settings#api-keys

```powershell
$env:RENDER_API_KEY = "rnd_paste_key_here"
.\scripts\release-render-domain.ps1
```

That script lists every service holding the domain and removes it from the wrong ones.

---

## Namecheap (unchanged)

| Type | Host | Value |
|------|------|--------|
| A | `@` | `216.24.57.1` |
| CNAME | `www` | `xcapital-web.onrender.com` |
| CNAME | `api` | `xcapital-api.onrender.com` |
