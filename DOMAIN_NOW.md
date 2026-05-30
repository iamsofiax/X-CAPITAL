# xcapital.investments — frontend only (no API)

Site already works: https://xcapital-web.onrender.com  
Goal: same site at **https://xcapital.investments**

Ignore **xcapital-api** for now (you can suspend it in Render to stop failed deploy emails).

---

## Step 1 — Render

1. https://dashboard.render.com  
2. Click **`xcapital-web`** (NOT xcapital-api)  
3. Left menu → **Settings**  
4. Scroll to **Custom Domains**  
5. Click **Add Custom Domain**  
6. Type: **`xcapital.investments`** → Add  
7. (Optional) Add **`www.xcapital.investments`** too  

Render shows DNS records. **Keep that page open.**

---

## Step 2 — Your domain registrar

Where you bought **xcapital.investments** (Namecheap, GoDaddy, Cloudflare, etc.):

1. Open **DNS** / **DNS Management**  
2. **Remove** old records pointing to GitHub Pages (if any):
   - A records `185.199.108.153` etc.  
   - CNAME to `iamsofiax.github.io` or `xsugax.github.io`  
3. **Add** what Render shows you. Usually:

| Type | Name / Host | Value (example — use Render’s exact value) |
|------|-------------|---------------------------------------------|
| **CNAME** | `www` | `xcapital-web.onrender.com` |
| **CNAME** or **ALIAS** | `@` | `xcapital-web.onrender.com` |

Some registrars call apex `@` **ALIAS** or **ANAME** instead of CNAME.  
If Render gives **A records** for apex, use those instead.

4. Save DNS

---

## Step 3 — Wait

- DNS: 5 minutes to 48 hours (often ~30 min)  
- Render: **Settings → Custom Domains** → wait for **Certificate Issued** (green)

---

## Step 4 — Test

Open: **https://xcapital.investments**

Hard refresh: **Ctrl + Shift + R**

---

## Optional — stop API failure emails

1. Dashboard → **xcapital-api**  
2. **Settings** → bottom → **Suspend Service**  

You can turn it back on later.

---

## What works without API

- Full marketing site, pages, design  
- Login / wallet / saved data → need API later  

When ready for API again: see `RENDER_API_FIX.md`.
