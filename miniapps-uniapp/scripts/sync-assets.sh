#!/bin/bash
# Sync static assets (logo.png, banner.png, banner.svg) and neo-manifest.json
# from source apps to the host-app public miniapps directory
# This fixes assets that were not copied during the Vite build

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APPS_DIR="$SCRIPT_DIR/../apps"
OUTPUT_DIR="$SCRIPT_DIR/../../platform/host-app/public/miniapps"

echo "Syncing MiniApp assets..."
echo ""

SYNCED_COUNT=0
SKIPPED_COUNT=0

for app_dir in "$APPS_DIR"/*/; do
  app_name=$(basename "$app_dir")
  
  # Skip if no output directory exists (app wasn't built)
  if [ ! -d "$OUTPUT_DIR/$app_name" ]; then
    echo "  [SKIP] $app_name - not built yet"
    ((SKIPPED_COUNT++))
    continue
  fi
  
  # Ensure static directory exists
  mkdir -p "$OUTPUT_DIR/$app_name/static"
  
  ASSETS_COPIED=0
  
  # Source static directory
  SRC_STATIC="$app_dir/src/static"
  
  if [ -d "$SRC_STATIC" ]; then
    # Copy logo.png
    if [ -f "$SRC_STATIC/logo.png" ]; then
      cp "$SRC_STATIC/logo.png" "$OUTPUT_DIR/$app_name/static/"
      ((ASSETS_COPIED++))
    fi
    
    # Copy banner.png
    if [ -f "$SRC_STATIC/banner.png" ]; then
      cp "$SRC_STATIC/banner.png" "$OUTPUT_DIR/$app_name/static/"
      ((ASSETS_COPIED++))
    fi
    
    # Copy banner.svg
    if [ -f "$SRC_STATIC/banner.svg" ]; then
      cp "$SRC_STATIC/banner.svg" "$OUTPUT_DIR/$app_name/static/"
      ((ASSETS_COPIED++))
    fi
  fi
  
  # Copy neo-manifest.json
  if [ -f "$app_dir/neo-manifest.json" ]; then
    cp "$app_dir/neo-manifest.json" "$OUTPUT_DIR/$app_name/"
    ((ASSETS_COPIED++))
  fi
  
  if [ $ASSETS_COPIED -gt 0 ]; then
    echo "  [OK] $app_name - synced $ASSETS_COPIED assets"
    ((SYNCED_COUNT++))
  else
    echo "  [SKIP] $app_name - no assets to sync"
  fi
done

echo ""
echo "Done! Synced assets for $SYNCED_COUNT apps, skipped $SKIPPED_COUNT"
