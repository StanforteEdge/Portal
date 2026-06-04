#!/usr/bin/env bash
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

pass=0
fail=0

check() {
  local label=$1 result=$2
  if [ "$result" = "pass" ]; then
    echo -e "  ${GREEN}✓${NC} $label"
    pass=$((pass+1))
  else
    echo -e "  ${RED}✗${NC} $label"
    fail=$((fail+1))
  fi
}

echo "Checking StanforteEdge Portal setup..."
echo ""

# Node
if command -v node &>/dev/null; then
  v=$(node -v)
  check "Node $v" "pass"
else
  check "Node installed" "fail"
fi

# pnpm
if command -v pnpm &>/dev/null; then
  v=$(pnpm -v)
  check "pnpm $v" "pass"
else
  check "pnpm installed (run: corepack enable && corepack prepare pnpm@10.33.0 --activate)" "fail"
fi

# Deps installed
if [ -d "node_modules" ]; then
  check "Root node_modules exists" "pass"
else
  check "Root node_modules exists (run: pnpm install)" "fail"
fi

# API .env
if [ -f "api/.env" ]; then
  check "api/.env exists" "pass"
  # Check critical vars
  db_url=$(grep -c 'DATABASE_URL=' api/.env 2>/dev/null || true)
  jwt=$(grep -c 'JWT_SECRET=' api/.env 2>/dev/null || true)
  is_default=$(grep -c 'JWT_SECRET=change-me' api/.env 2>/dev/null || true)
  if [ "$db_url" -gt 0 ] && [ "$jwt" -gt 0 ]; then
    check "  DATABASE_URL and JWT_SECRET set" "pass"
  fi
  if [ "$is_default" -gt 0 ]; then
    check "  WARNING: JWT_SECRET still set to default" "fail"
  fi
else
  check "api/.env exists (run: cp api/.env.example api/.env)" "fail"
fi

# PWA2 .env
if [ -f "apps/pwa/.env.local" ]; then
  check "apps/pwa/.env.local exists" "pass"
else
  check "apps/pwa/.env.local exists (run: cp apps/pwa/.env.example apps/pwa/.env.local)" "fail"
fi

# DB connectivity via Prisma
if command -v npx &>/dev/null && [ -f "api/.env" ]; then
  set +e
  npx -w api prisma db execute --stdin <<< "SELECT 1;" &>/dev/null
  if [ $? -eq 0 ]; then
    check "PostgreSQL reachable" "pass"
  else
    check "PostgreSQL reachable (check DATABASE_URL)" "fail"
  fi
  set -e
fi

# Prisma migrations applied
if [ -f "api/prisma/schema.prisma" ]; then
  set +e
  npx -w api prisma migrate status &>/dev/null
  if [ $? -eq 0 ]; then
    check "Prisma migrations applied" "pass"
  else
    check "Prisma migrations applied (run: pnpm run prisma:migrate -w api)" "fail"
  fi
  set -e
fi

# Chrome for PDF
chrome_paths=(
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  "/usr/bin/google-chrome"
  "/usr/bin/chromium"
  "/snap/bin/chromium"
)
found_chrome=false
for p in "${chrome_paths[@]}"; do
  if [ -f "$p" ]; then
    found_chrome=true; break
  fi
done
if $found_chrome; then
  check "Chrome available for PDF" "pass"
else
  check "Chrome available for PDF (optional)" "pass"
fi

# Rust for Tauri
if command -v rustc &>/dev/null; then
  check "Rust installed (Tauri)" "pass"
else
  check "Rust installed for Tauri (optional)" "pass"
fi

echo ""
echo "Results: ${GREEN}$pass passed${NC}, ${RED}$fail failed${NC}"
exit $fail
