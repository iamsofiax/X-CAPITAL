# Finish migration to iamsofiax/X-CAPITAL
# Run AFTER: gh auth login  (sign in as **iamsofiax**, not xsugax)

$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $Root

$user = (gh api user --jq .login 2>$null)
if ($user -ne "iamsofiax") {
    Write-Host "Wrong GitHub account: $user" -ForegroundColor Red
    Write-Host "Run: gh auth login" -ForegroundColor Yellow
    Write-Host "Then sign in as **iamsofiax** and re-run this script." -ForegroundColor Yellow
    exit 1
}

git remote set-url origin https://github.com/iamsofiax/X-CAPITAL.git
Write-Host "Pushing main to iamsofiax/X-CAPITAL..." -ForegroundColor Cyan
git push -u origin main --force

Write-Host "Deploying frontend to gh-pages..." -ForegroundColor Cyan
& (Join-Path $PSScriptRoot "deploy-pages.ps1")

Write-Host ""
Write-Host "Migration complete on iamsofiax." -ForegroundColor Green
Write-Host "Optional — remove old repo (requires xsugax login):" -ForegroundColor Yellow
Write-Host "  gh auth login   # as xsugax"
Write-Host "  gh repo delete xsugax/X-CAPITAL --yes"
Write-Host ""
Write-Host "Re-point GitHub Pages custom domain xcapital.investments in:" -ForegroundColor Cyan
Write-Host "  https://github.com/iamsofiax/X-CAPITAL/settings/pages"
