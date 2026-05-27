# Prints Render env instructions using values from backend/.env (JWT only).
# DATABASE_URL on Render must come from Render Postgres - never from .env.

$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$envFile = Join-Path $root "backend\.env"

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

Write-Host ""
Write-Host "========== X-CAPITAL Render setup ==========" -ForegroundColor Cyan
Write-Host ""
Write-Host "1) DATABASE_URL" -ForegroundColor Yellow
Write-Host "   Do NOT use backend/.env (Docker hostname postgres)."
Write-Host "   Render Dashboard -> xcapital-db -> link to xcapital-api"
Write-Host ""
Write-Host "2) JWT_SECRET - paste into xcapital-api Environment:" -ForegroundColor Yellow
if ($jwt) {
  Write-Host "   $jwt" -ForegroundColor Green
  try {
    Set-Clipboard -Value $jwt
    Write-Host "   (copied to clipboard)" -ForegroundColor DarkGray
  } catch {
    Write-Host "   (copy the line above manually)" -ForegroundColor DarkGray
  }
} else {
  Write-Host "   ERROR: JWT_SECRET not found in backend\.env" -ForegroundColor Red
}
Write-Host ""
Write-Host "3) Redeploy xcapital-api with clear build cache" -ForegroundColor Yellow
Write-Host "4) Test https://xcapital-api.onrender.com/health" -ForegroundColor Yellow
Write-Host ""
Write-Host "See RENDER_ENV_SETUP.md" -ForegroundColor DarkGray
Write-Host ""
