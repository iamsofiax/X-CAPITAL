# Creates RENDER_PASTE.env — upload this file in Render (xcapital-api -> Environment).
$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$envFile = Join-Path $root "backend\.env"
$outFile = Join-Path $root "RENDER_PASTE.env"

if (-not (Test-Path $envFile)) {
  Write-Host "ERROR: backend\.env not found." -ForegroundColor Red
  exit 1
}

$jwt = $null
Get-Content $envFile | ForEach-Object {
  if ($_ -match '^\s*JWT_SECRET\s*=\s*(.+)\s*$') {
    $jwt = $matches[1].Trim().Trim('"').Trim("'")
  }
}
if (-not $jwt) {
  Write-Host "ERROR: JWT_SECRET not found in backend\.env" -ForegroundColor Red
  exit 1
}

$content = @"
NODE_ENV=production
NODE_VERSION=20
JWT_SECRET=$jwt
FRONTEND_URL=https://xcapital.investments
CORS_ORIGINS=https://xcapital-web.onrender.com
ALPACA_BASE_URL=https://paper-api.alpaca.markets
ALPACA_DATA_URL=https://data.alpaca.markets
"@

Set-Content -Path $outFile -Value $content.TrimEnd() -Encoding UTF8

Write-Host ""
Write-Host "Created: $outFile" -ForegroundColor Green
Write-Host ""
Write-Host "NEXT (2 minutes):" -ForegroundColor Cyan
Write-Host "  1) https://dashboard.render.com -> xcapital-api -> Environment"
Write-Host "  2) Click 'Add from .env' -> choose RENDER_PASTE.env"
Write-Host "  3) Click 'Add from database' -> xcapital-db -> DATABASE_URL"
Write-Host "  4) Manual Deploy -> Clear build cache and deploy"
Write-Host ""
Write-Host "See RENDER_PASTE_HERE.md" -ForegroundColor DarkGray
Write-Host ""

try { Start-Process explorer.exe -ArgumentList "/select,`"$outFile`"" } catch { }
