# Find and remove xcapital.investments from every Render service so xcapital-web can claim it.
# Usage: set RENDER_API_KEY from https://dashboard.render.com/u/settings#api-keys then run:
#   $env:RENDER_API_KEY = "rnd_..."
#   .\scripts\release-render-domain.ps1

$ErrorActionPreference = "Stop"
$domains = @("xcapital.investments", "www.xcapital.investments", "api.xcapital.investments")

$key = $env:RENDER_API_KEY
if (-not $key) {
  Write-Host "Set RENDER_API_KEY first (Render Dashboard -> Account Settings -> API Keys)" -ForegroundColor Red
  exit 1
}

$headers = @{
  Authorization = "Bearer $key"
  Accept        = "application/json"
}

Write-Host "Fetching Render services..." -ForegroundColor Cyan
$services = Invoke-RestMethod -Uri "https://api.render.com/v1/services?limit=100" -Headers $headers

$found = @()
foreach ($svc in $services) {
  $s = $svc.service
  if (-not $s) { continue }
  $id = $s.id
  $name = $s.name
  try {
    $custom = Invoke-RestMethod -Uri "https://api.render.com/v1/services/$id/custom-domains" -Headers $headers
  } catch {
    continue
  }
  foreach ($row in $custom) {
    $d = $row.customDomain
    if (-not $d) { continue }
    $hostName = $d.name
    if ($domains -contains $hostName) {
      $found += [pscustomobject]@{
        Service     = $name
        ServiceId   = $id
        Domain      = $hostName
        DomainId    = $d.id
      }
    }
  }
}

if ($found.Count -eq 0) {
  Write-Host "No matching custom domains on Render. Blocker may be GitHub Pages (xsugax/X-CAPITAL)." -ForegroundColor Yellow
  Write-Host "Run: .\scripts\release-github-domain.ps1" -ForegroundColor Yellow
  exit 0
}

Write-Host ""
Write-Host "Domains found on Render:" -ForegroundColor Yellow
$found | Format-Table -AutoSize

foreach ($row in $found) {
  if ($row.Service -eq "xcapital-web" -and $row.Domain -match "^xcapital\.investments$|^www\.") {
    Write-Host "Keeping $($row.Domain) on xcapital-web (correct host)." -ForegroundColor Green
    continue
  }
  Write-Host "Deleting $($row.Domain) from $($row.Service) ..." -ForegroundColor Cyan
  Invoke-RestMethod -Method Delete -Uri "https://api.render.com/v1/services/$($row.ServiceId)/custom-domains/$($row.DomainId)" -Headers $headers | Out-Null
  Write-Host "  Deleted." -ForegroundColor Green
}

Write-Host ""
Write-Host "Done. Wait 2 minutes, then add domains on xcapital-web in Render dashboard." -ForegroundColor Green
