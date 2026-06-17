#!/usr/bin/env bash
# Copy vendored Cave envelope schema + Pact JSON from inventory to sibling repos.
# Run from inventory repo root: ./scripts/sync-cave-contracts-to-siblings.sh

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
INV_FRONTEND_PACTS="$ROOT/frontend/pacts"
SCHEMA_SRC="$ROOT/packages/cave-contracts/schemas/envelope-v2.json"

for sibling in resaurce saurce; do
  DEST="$ROOT/../$sibling/contracts"
  mkdir -p "$DEST/schemas" "$DEST/pacts"
  cp -f "$SCHEMA_SRC" "$DEST/schemas/envelope-v2.json"
done

cp -f "$INV_FRONTEND_PACTS/inventory-frontend-resaurce-cave.json" "$ROOT/../resaurce/contracts/pacts/"
RESAURCE_UI_SCHEMA="$ROOT/../resaurce/contracts/schemas/resaurce-frontend-tome-v1.json"
if [ -f "$RESAURCE_UI_SCHEMA" ]; then
  mkdir -p "$ROOT/packages/cave-contracts/schemas"
  cp -f "$RESAURCE_UI_SCHEMA" "$ROOT/packages/cave-contracts/schemas/"
fi
cp -f "$INV_FRONTEND_PACTS/inventory-frontend-saurce-cave.json" "$ROOT/../saurce/contracts/pacts/"

SAURCE_UI_SCHEMA="$ROOT/../saurce/contracts/schemas/saurce-frontend-tome-v1.json"
if [ -f "$SAURCE_UI_SCHEMA" ]; then
  mkdir -p "$ROOT/packages/cave-contracts/schemas"
  cp -f "$SAURCE_UI_SCHEMA" "$ROOT/packages/cave-contracts/schemas/"
fi

echo "Synced envelope + pacts to ../resaurce/contracts and ../saurce/contracts"
