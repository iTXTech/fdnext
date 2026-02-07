#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SRC_BASE="${1:-$ROOT_DIR/../FlashDetector/FlashDetector/resources}"
DST_BASE="$ROOT_DIR/resources"

if [ ! -d "$SRC_BASE" ]; then
  echo "resource source not found: $SRC_BASE" >&2
  exit 1
fi

mkdir -p "$DST_BASE/lang"
cp "$SRC_BASE/fdb.json" "$DST_BASE/fdb.json"
cp "$SRC_BASE/mdb.json" "$DST_BASE/mdb.json"
cp "$SRC_BASE/lang/chs.json" "$DST_BASE/lang/chs.json"
cp "$SRC_BASE/lang/eng.json" "$DST_BASE/lang/eng.json"

echo "resources synced"
