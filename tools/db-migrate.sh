#!/usr/bin/env bash
# tools/db-migrate.sh — Tracked D1 migration runner
# --------------------------------------------------
# Runs drizzle/0*.sql migration files, skipping any that have already been
# applied.  Tracks state in an `_applied_migrations` table inside D1.
#
# Usage:
#   bash tools/db-migrate.sh <db-name> --local  [--dir drizzle]
#   bash tools/db-migrate.sh <db-name> --remote [--dir drizzle]
#   bash tools/db-migrate.sh <db-name> --local  --dir drizzle --reset
#
# Flags:
#   --reset   Wipe local D1 state before migrating. REFUSES --remote.
#
# Designed to be called from package.json scripts:
#   "db:migrate": "bash ../../tools/db-migrate.sh my-db --local --dir drizzle"
#   "db:reset":   "bash ../../tools/db-migrate.sh my-db --local --dir drizzle --reset"
set -euo pipefail

DB_NAME="${1:?Usage: db-migrate.sh <db-name> --local|--remote [--dir <path>]}"
shift

LOCATION_FLAG="--local"
DRIZZLE_DIR="drizzle"
RESET=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --local)  LOCATION_FLAG="--local";  shift ;;
    --remote) LOCATION_FLAG="--remote"; shift ;;
    --dir)    DRIZZLE_DIR="$2";         shift 2 ;;
    --reset)  RESET=true;               shift ;;
    *)        shift ;;
  esac
done

# Safety: --reset is LOCAL-ONLY. Refuse to wipe a production database.
if [ "$RESET" = true ] && [ "$LOCATION_FLAG" = "--remote" ]; then
  echo "🚫  REFUSED: --reset cannot be used with --remote. This would destroy production data."
  exit 1
fi

if [ "$RESET" = true ]; then
  echo "🗑️  Resetting local D1 state..."
  rm -rf .wrangler/state/v3/d1
fi

# 1. Ensure tracking table exists
wrangler d1 execute "$DB_NAME" "$LOCATION_FLAG" \
  --command "CREATE TABLE IF NOT EXISTS _applied_migrations (filename TEXT PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT (datetime('now')));" \
  > /dev/null 2>&1

# 2. Fetch already-applied filenames
APPLIED=$(wrangler d1 execute "$DB_NAME" "$LOCATION_FLAG" \
  --command "SELECT filename FROM _applied_migrations;" --json 2>/dev/null \
  | node -e "
    let buf = '';
    process.stdin.on('data', c => buf += c);
    process.stdin.on('end', () => {
      try {
        const d = JSON.parse(buf);
        (d[0]?.results || []).forEach(r => console.log(r.filename));
      } catch {}
    });
  " 2>/dev/null || echo "")

SKIP=0
APPLY=0

# 3. Process each migration file in order
for f in "$DRIZZLE_DIR"/0*.sql; do
  [ -f "$f" ] || continue
  filename=$(basename "$f")

  if echo "$APPLIED" | grep -qx "$filename"; then
    SKIP=$((SKIP + 1))
    continue
  fi

  echo "⏳  Applying $filename..."
  wrangler d1 execute "$DB_NAME" "$LOCATION_FLAG" --file="$f"

  # Record successful application
  wrangler d1 execute "$DB_NAME" "$LOCATION_FLAG" \
    --command "INSERT INTO _applied_migrations (filename) VALUES ('$filename');" \
    > /dev/null 2>&1

  APPLY=$((APPLY + 1))
done

echo "✅  Migrations complete: $APPLY applied, $SKIP skipped"
