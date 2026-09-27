$ErrorActionPreference = "Stop"
Set-Location "d:\X-CAPITAL"
$env:GIT_OPTIONAL_LOCKS = "0"

git add -u -- frontend backend ai-oracle render.yaml scripts .github
if ($LASTEXITCODE -ne 0) { throw "git add -u failed" }
git add -- frontend/src frontend/public/catalog
if ($LASTEXITCODE -ne 0) { throw "git add catalog failed" }

$staged = git diff --cached --name-only
if (-not $staged) {
  Write-Output "NOTHING_STAGED"
} else {
  git commit -m "Remove Google sign-in and publish the current desk."
  if ($LASTEXITCODE -ne 0) { throw "git commit failed" }
}

git push origin HEAD
if ($LASTEXITCODE -ne 0) { throw "git push failed" }
git log -1 --oneline
git status -sb -uno
Write-Output "PUSH_DONE"
