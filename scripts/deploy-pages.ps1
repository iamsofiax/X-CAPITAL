# Deploy X-CAPITAL frontend to GitHub Pages WITHOUT GitHub Actions.
# Use when Actions fail (e.g. account billing lock). Requires: Node 20+, git, gh CLI.

$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$Owner = "iamsofiax"
$Repo = "X-CAPITAL"
$RepoSlug = "$Owner/$Repo"
$RepoUrl = "https://github.com/$RepoSlug.git"
Set-Location (Join-Path $Root "frontend")

Write-Host "Building static export..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) { throw "npm run build failed" }

$Out = Join-Path (Get-Location) "out"
if (-not (Test-Path $Out)) { throw "Build output not found at $Out" }

# GitHub Pages runs Jekyll by default and skips folders like _next/ — breaks CSS/JS
$NoJekyll = Join-Path $Out ".nojekyll"
if (-not (Test-Path $NoJekyll)) { New-Item -Path $NoJekyll -ItemType File -Force | Out-Null }

$CnameSrc = Join-Path $Root "frontend\public\CNAME"
$CnameDst = Join-Path $Out "CNAME"
if (Test-Path $CnameSrc) { Copy-Item $CnameSrc $CnameDst -Force }

Write-Host "Publishing to gh-pages via gh-pages..." -ForegroundColor Cyan
gh auth setup-git 2>$null | Out-Null
npx --yes gh-pages@6 -d $Out -b gh-pages -r $RepoUrl --nojekyll --dotfiles -m "Deploy $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
if ($LASTEXITCODE -ne 0) { throw "gh-pages publish failed" }

Set-Location $Root
Write-Host "Switching GitHub Pages to gh-pages branch..." -ForegroundColor Cyan
$jsonFile = Join-Path $Root "pages-config.json"
$pagesJson = '{"build_type":"legacy","source":{"branch":"gh-pages","path":"/"},"cname":"xcapital.investments"}'
[System.IO.File]::WriteAllText($jsonFile, $pagesJson, [System.Text.UTF8Encoding]::new($false))
gh api -X PUT "repos/$RepoSlug/pages" --input $jsonFile 2>$null

Write-Host ""
Write-Host "Done. Check https://xcapital.investments in 1-3 minutes." -ForegroundColor Green
