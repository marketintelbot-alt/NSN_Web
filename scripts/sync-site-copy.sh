#!/usr/bin/env bash

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PARENT_DIR="$(dirname "$PROJECT_ROOT")"
SNAPSHOT_DIR="$PARENT_DIR/NSN_Web_Copy"

mkdir -p "$SNAPSHOT_DIR"

rsync -a --delete \
  --exclude ".git" \
  --exclude "frontend/node_modules" \
  --exclude "backend/node_modules" \
  --exclude "frontend/dist" \
  --exclude "backend/dist" \
  --exclude "frontend/.env" \
  --exclude "backend/.env" \
  --exclude ".playwright-cli" \
  --exclude "output" \
  "$PROJECT_ROOT/" "$SNAPSHOT_DIR/"

printf 'Synced site copy to %s\n' "$SNAPSHOT_DIR"
