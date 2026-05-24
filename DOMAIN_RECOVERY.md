# Recover xcapital.investments (without xsugax access)

You **do not need** the old `xsugax` account. GitHub lets the **real domain owner** verify and **take back** the domain.

---

## Step 1 — Verify domain on **iamsofiax** (releases it from xsugax)

1. Log in as **iamsofiax**
2. Open: **https://github.com/settings/pages**
3. Click **Add a domain**
4. Enter: `xcapital.investments`
5. GitHub shows a **DNS TXT record** like:
   ```
   Host: _github-pages-challenge-iamsofiax.xcapital.investments
   Value: (token GitHub gives you)
   ```
6. Add that TXT record at your domain registrar (where you bought `xcapital.investments`)
7. Wait 5–30 minutes (sometimes up to 24h)
8. Click **Verify** on GitHub

**When verification succeeds, GitHub automatically removes `xcapital.investments` from the old `xsugax` Pages site.**

Official docs: [Verifying your custom domain for GitHub Pages](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/verifying-your-custom-domain-for-github-pages#verifying-a-domain-that-is-already-taken)

---

## Step 2 — Attach domain to the new repo

1. Open: **https://github.com/iamsofiax/X-CAPITAL/settings/pages**
2. Source: **Deploy from branch** → `gh-pages` → `/ (root)`
3. Custom domain: `xcapital.investments` → **Save**
4. Enable **Enforce HTTPS** when the certificate is ready

Or run (after Step 1 verify):
```powershell
gh auth switch --user iamsofiax
.\scripts\deploy-pages.ps1
```

---

## Step 3 — DNS records (at your registrar)

| Type | Name | Value |
|------|------|--------|
| **TXT** | `_github-pages-challenge-iamsofiax` | (from Step 1) |
| **A** or **CNAME** | `@` or `www` | GitHub Pages (see below) |

**For apex domain `xcapital.investments`**, use GitHub’s A records:
```
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```

**Or CNAME** (if your registrar supports apex CNAME / ALIAS):
```
iamsofiax.github.io
```

---

## Step 4 — Confirm it works

- https://iamsofiax.github.io/X-CAPITAL/ (works now)
- https://xcapital.investments (after Steps 1–3)

Hard refresh: **Ctrl+Shift+R**

---

## If verification fails

- Contact **GitHub Support**: https://support.github.com  
- Say: you own `xcapital.investments`, domain is stuck on `xsugax/X-CAPITAL`, you cannot access `xsugax`, you verified DNS TXT as `iamsofiax`.

---

## Your site is already live on the new account

| Item | URL |
|------|-----|
| Repo | https://github.com/iamsofiax/X-CAPITAL |
| Pages (default URL) | https://iamsofiax.github.io/X-CAPITAL/ |
| Custom domain (after verify) | https://xcapital.investments |

Deploy anytime:
```powershell
gh auth switch --user iamsofiax
.\scripts\deploy-pages.ps1
```
