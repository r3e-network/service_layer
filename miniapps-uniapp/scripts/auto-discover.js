#!/usr/bin/env node
/**
 * Auto-discover MiniApps from apps directory
 *
 * This script scans the apps directory and generates miniapps.json
 * for the host-app based on each miniapp's manifest.json
 *
 * Usage: node scripts/auto-discover.js
 */
const fs = require("fs");
const path = require("path");

const APPS_DIR = path.join(__dirname, "../apps");
const OUTPUT_FILE = path.join(__dirname, "../../platform/host-app/data/miniapps.json");

// Default permissions for miniapps - SECURE BY DEFAULT
// Apps must explicitly request permissions in neo-manifest.json
const DEFAULT_PERMISSIONS = {
  payments: false,
  governance: false,
  automation: false,
};

// Validate Neo N3 script hash format (0x + 40 hex chars)
function isValidContractHash(hash) {
  if (!hash) return true; // null is valid (no contract)
  return /^0x[a-fA-F0-9]{40}$/.test(hash);
}

// Validate manifest has required fields
function validateManifest(manifest, appDir) {
  const errors = [];
  if (!manifest.name || typeof manifest.name !== "string") {
    errors.push("name is required and must be a string");
  }
  if (manifest.appid && !/^[a-z0-9-]+$/.test(manifest.appid)) {
    errors.push("appid must contain only lowercase letters, numbers, and hyphens");
  }
  return errors;
}

function discoverMiniApps() {
  const apps = [];
  const categories = {
    gaming: [],
    defi: [],
    social: [],
    nft: [],
    governance: [],
    utility: [],
  };

  // Scan apps directory
  const appDirs = fs.readdirSync(APPS_DIR).filter((dir) => {
    const appPath = path.join(APPS_DIR, dir);
    return fs.statSync(appPath).isDirectory();
  });

  for (const appDir of appDirs) {
    const manifestPath = path.join(APPS_DIR, appDir, "src/manifest.json");
    const neoManifestPath = path.join(APPS_DIR, appDir, "neo-manifest.json");

    if (!fs.existsSync(manifestPath)) {
      console.warn(`⚠️  Skipping ${appDir}: no manifest.json found`);
      continue;
    }

    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));

      // Validate manifest
      const manifestErrors = validateManifest(manifest, appDir);
      if (manifestErrors.length > 0) {
        console.error(`❌ Invalid manifest for ${appDir}:`, manifestErrors.join(", "));
        continue;
      }

      // Load neo-manifest.json if exists (extended config)
      let neoManifest = {};
      if (fs.existsSync(neoManifestPath)) {
        neoManifest = JSON.parse(fs.readFileSync(neoManifestPath, "utf-8"));
      }

      // Validate contract hash format
      if (neoManifest.contract_hash && !isValidContractHash(neoManifest.contract_hash)) {
        console.error(`❌ Invalid contract_hash for ${appDir}: must be 0x + 40 hex chars`);
        continue;
      }

      const app = {
        app_id: manifest.appid || `miniapp-${appDir}`,
        name: manifest.name || appDir,
        name_zh: neoManifest.name_zh || manifest.name,
        description: neoManifest.description || manifest.description || "",
        description_zh: neoManifest.description_zh || "",
        icon: `/miniapps/${appDir}/static/icon.svg`,
        entry_url: `/miniapps/${appDir}/index.html`,
        status: neoManifest.status || "active",
        contract_hash: neoManifest.contract_hash || null,
        permissions: neoManifest.permissions || DEFAULT_PERMISSIONS,
      };

      const category = neoManifest.category || "utility";
      if (categories[category]) {
        categories[category].push(app);
      } else {
        categories.utility.push(app);
      }

      console.log(`✅ Discovered: ${app.name} (${category})`);
    } catch (err) {
      console.error(`❌ Error processing ${appDir}:`, err.message);
    }
  }

  return categories;
}

function main() {
  console.log("🔍 Auto-discovering MiniApps...\n");

  const categories = discoverMiniApps();

  // Write output
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(categories, null, 2));

  console.log(`\n📦 Generated: ${OUTPUT_FILE}`);

  // Summary
  let total = 0;
  for (const [cat, apps] of Object.entries(categories)) {
    if (apps.length > 0) {
      console.log(`   ${cat}: ${apps.length} apps`);
      total += apps.length;
    }
  }
  console.log(`   Total: ${total} apps`);
}

main();
