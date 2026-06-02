# xcapital.investments is locked on xsugax/X-CAPITAL GitHub Pages (blocks Render + your repo).
# This script prints the exact TXT record to add at Namecheap, then opens GitHub verify.

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=== ROOT CAUSE ===" -ForegroundColor Yellow
Write-Host "xsugax/X-CAPITAL still owns xcapital.investments on GitHub Pages."
Write-Host "Render will keep saying 'domain already exists on another site' until GitHub releases it."
Write-Host ""

Write-Host "=== FIX (10 minutes) ===" -ForegroundColor Cyan
Write-Host "1. Open: https://github.com/settings/pages"
Write-Host "2. Click 'Add a domain' -> type: xcapital.investments"
Write-Host "3. GitHub shows a TXT record like:"
Write-Host "     Host: _github-pages-challenge-iamsofiax"
Write-Host "     Value: (long token from GitHub)"
Write-Host "4. Namecheap -> Advanced DNS -> Add TXT Record:"
Write-Host "     Type: TXT | Host: _github-pages-challenge-iamsofiax | Value: (paste token)"
Write-Host "5. Wait 5-15 min -> click Verify on GitHub"
Write-Host "6. GitHub removes the domain from xsugax automatically."
Write-Host ""
Write-Host "7. iamsofiax/X-CAPITAL -> Settings -> Pages -> Custom domain: LEAVE EMPTY"
Write-Host "    (you use Render for the site, not GitHub Pages for apex)"
Write-Host ""
Write-Host "8. Render -> xcapital-web -> add xcapital.investments + www"
Write-Host ""

$open = Read-Host "Open GitHub domain settings in browser now? (y/n)"
if ($open -eq "y") {
  Start-Process "https://github.com/settings/pages"
}

Write-Host ""
gh api repos/xsugax/X-CAPITAL/pages --jq "{owner: \"xsugax\", cname: .cname, html: .html_url}" 2>$null
if ($LASTEXITCODE -eq 0) {
  Write-Host "Confirmed: xsugax repo still has custom domain set (see cname above)." -ForegroundColor Red
}
