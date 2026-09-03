#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ASSETS="$ROOT/../flavours-of-india-local-assets"
DEST="$ROOT/client/public/manus-storage"
if [ ! -d "$ASSETS" ]; then
  echo "Missing ../flavours-of-india-local-assets next to the project folder."
  exit 1
fi
mkdir -p "$DEST"
cp "$ASSETS/hero-pantry.jpg" "$DEST/hero-pantry_47065533.jpg"
cp "$ASSETS/product-pickle.jpg" "$DEST/product-pickle_c9669039.jpg"
cp "$ASSETS/product-roasted.jpg" "$DEST/product-roasted_1a2dd2a6.jpg"
cp "$ASSETS/product-papad.jpg" "$DEST/product-papad_ca672ac8.jpg"
cp "$ASSETS/flavours-of-india-logo.png" "$DEST/flavours-of-india-logo_4e9a9073.png"
echo "Local visual assets copied to client/public/manus-storage"
