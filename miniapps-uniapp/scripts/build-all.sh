#!/bin/bash
# Build all uni-app MiniApps for H5
# set -e # Removed to allow all apps to attempt build

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APPS_DIR="$SCRIPT_DIR/../apps"
OUTPUT_DIR="$SCRIPT_DIR/../../platform/host-app/public/miniapps"

mkdir -p "$OUTPUT_DIR"

echo "Building uni-app MiniApps..."
FAILED_APPS=""

for app_dir in "$APPS_DIR"/*/; do
  app_name=$(basename "$app_dir")

  if [ ! -f "$app_dir/package.json" ]; then
    echo "  [SKIP] $app_name - no package.json"
    continue
  fi

  echo "  [BUILD] $app_name"

  cd "$app_dir"

  # Install deps if needed
  if [ ! -d "node_modules" ]; then
    pnpm install --silent 2>/dev/null || npm install --silent 2>/dev/null
  fi

  # Build H5
  if ! (pnpm build:h5 || pnpm build || npm run build || npm run build:h5); then
    echo "  [ERROR] $app_name failed to build"
    FAILED_APPS="$FAILED_APPS $app_name"
    continue
  fi

  # Copy to output
  if [ -d "dist/build/h5" ]; then
    rm -rf "$OUTPUT_DIR/$app_name"
    cp -r "dist/build/h5" "$OUTPUT_DIR/$app_name"
    
    # Ensure static directory exists in output
    mkdir -p "$OUTPUT_DIR/$app_name/static"
    
    # Copy static assets that Vite may not have included (unreferenced files)
    if [ -d "src/static" ]; then
      # Copy logo.png if exists and not already in output
      if [ -f "src/static/logo.png" ] && [ ! -f "$OUTPUT_DIR/$app_name/static/logo.png" ]; then
        cp "src/static/logo.png" "$OUTPUT_DIR/$app_name/static/"
        echo "    [ASSET] Copied logo.png"
      fi
      # Copy banner.png if exists and not already in output
      if [ -f "src/static/banner.png" ] && [ ! -f "$OUTPUT_DIR/$app_name/static/banner.png" ]; then
        cp "src/static/banner.png" "$OUTPUT_DIR/$app_name/static/"
        echo "    [ASSET] Copied banner.png"
      fi
      # Copy banner.svg if exists and not already in output
      if [ -f "src/static/banner.svg" ] && [ ! -f "$OUTPUT_DIR/$app_name/static/banner.svg" ]; then
        cp "src/static/banner.svg" "$OUTPUT_DIR/$app_name/static/"
        echo "    [ASSET] Copied banner.svg"
      fi
    fi
    
    # Copy neo-manifest.json if exists
    if [ -f "neo-manifest.json" ]; then
      cp "neo-manifest.json" "$OUTPUT_DIR/$app_name/"
      echo "    [MANIFEST] Copied neo-manifest.json"
    fi
    
    echo "  [OK] $app_name -> $OUTPUT_DIR/$app_name"
  else
    echo "  [WARN] $app_name built but dist/build/h5 not found"
  fi
done

if [ -n "$FAILED_APPS" ]; then
  echo ""
  echo "⚠️ Some apps failed to build:$FAILED_APPS"
fi

# Auto-discover and register miniapps
echo ""
echo "Auto-discovering miniapps..."
node "$SCRIPT_DIR/auto-discover.js"

echo ""
echo "Done! Built apps are in $OUTPUT_DIR"
