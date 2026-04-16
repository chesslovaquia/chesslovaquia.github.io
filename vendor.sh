#!/usr/bin/env bash
# Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
# See LICENSE file.
#
# Vendor board assets from the lichess lila repository.
# Output: static/vendor/
#
# Note: chessground base CSS, brown board CSS, and cburnett piece CSS
# (with embedded SVGs) are shipped with the chessground npm package
# at node_modules/chessground/assets/ — import them directly.
# This script vendors only the standalone cburnett SVG files used by
# PromotionDialog.svelte.
#
# Usage: ./vendor.sh

set -euo pipefail

LILA_BASE="https://raw.githubusercontent.com/lichess-org/lila/master"
OUT="static/vendor"

mkdir -p "${OUT}/piece/cburnett"

echo "Fetching cburnett piece SVGs..."
PIECES=(
  wK wQ wR wB wN wP
  bK bQ bR bB bN bP
)
for p in "${PIECES[@]}"; do
  echo "  ${p}.svg"
  wget -q "${LILA_BASE}/public/piece/cburnett/${p}.svg" \
    -O "${OUT}/piece/cburnett/${p}.svg"
done

echo "Done. Assets in ${OUT}/"
