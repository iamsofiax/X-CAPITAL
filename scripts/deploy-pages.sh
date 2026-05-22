#!/usr/bin/env bash
# Deploy frontend to GitHub Pages without GitHub Actions (billing-safe path).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/frontend"

echo "Building static export..."
npm run build

OUT="$ROOT/frontend/out"
test -d "$OUT" || { echo "Missing $OUT"; exit 1; }

cp -f "$ROOT/frontend/public/CNAME" "$OUT/CNAME" 2>/dev/null || true

TEMP="$(mktemp -d)"
cp -a "$OUT/." "$TEMP/"
cd "$TEMP"
git init -q
git config user.email "deploy@xcapital.investments"
git config user.name "X-CAPITAL Deploy"
git add -A
git commit -m "Deploy $(date -u +'%Y-%m-%d %H:%M:%S UTC')"

echo "Pushing to gh-pages..."
git push -f https://github.com/xsugax/X-CAPITAL.git HEAD:gh-pages

echo "Configuring Pages source..."
gh api -X PUT repos/xsugax/X-CAPITAL/pages \
  --input - <<'EOF'
{"build_type":"legacy","source":{"branch":"gh-pages","path":"/"}}
EOF

echo "Done: https://xcapital.investments"
