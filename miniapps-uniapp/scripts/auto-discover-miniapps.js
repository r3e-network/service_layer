#!/usr/bin/env node
/**
 * Auto-discover and register miniapps
 *
 * This script scans the apps directory and automatically generates
 * the miniapps.json registry file for the host-app.
 *
 * Usage: node scripts/auto-discover-miniapps.js
 *
 * Each miniapp should have:
 * - package.json with name and neo config
 * - src/manifest.json with app metadata
 * - Optional: neo-manifest.json for permissions/contract info
 */

const fs = require("fs");
const path = require("path");

const APPS_DIR = path.join(__dirname, "../apps");
const OUTPUT_FILE = path.join(__dirname, "../../platform/host-app/data/miniapps.json");

// Category detection based on app name patterns
const CATEGORY_PATTERNS = {
  gaming: ["lottery", "coin-flip", "scratch-card", "crash", "dice", "poker", "tarot", "canvas", "riddle"],
  defi: ["swap", "loan", "flashloan", "compound", "burger", "sponsor", "treasury", "vault", "capsule"],
  social: ["envelope", "tipping", "breakup", "ex-files", "grant", "burn-league"],
  nft: ["garden", "graveyard", "heritage", "time-capsule", "million"],
  governance: ["governance", "vote", "dao", "merc", "booster", "council", "masquerade"],
  utility: ["explorer", "ns", "checkin", "guardian", "doomsday", "clock"],
};

function detectCategory(appName) {
  const lowerName = appName.toLowerCase();
  for (const [category, patterns] of Object.entries(CATEGORY_PATTERNS)) {
    if (patterns.some((p) => lowerName.includes(p))) {
      return category;
    }
  }
  return "utility";
}

function readJsonSafe(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, "utf-8"));
    }
  } catch (e) {
    console.warn(`  Warning: Could not parse ${filePath}`);
  }
  return null;
}

function discoverMiniapp(appDir) {
  const appPath = path.join(APPS_DIR, appDir);

  // Skip non-directories and hidden folders
  if (!fs.statSync(appPath).isDirectory() || appDir.startsWith(".")) {
    return null;
  }

  const packageJson = readJsonSafe(path.join(appPath, "package.json"));
  const manifest = readJsonSafe(path.join(appPath, "src/manifest.json"));
  const neoManifest = readJsonSafe(path.join(appPath, "neo-manifest.json"));

  if (!packageJson) {
    console.log(`  [SKIP] ${appDir}: no package.json`);
    return null;
  }

  // Extract app info
  const appId = packageJson.name || `miniapp-${appDir}`;
  const name =
    manifest?.name ||
    appDir
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  const category = neoManifest?.category || detectCategory(appDir);

  return {
    app_id: appId,
    name: name,
    name_zh: neoManifest?.name_zh || manifest?.name || name,
    description: neoManifest?.description || manifest?.description || `${name} - Neo MiniApp`,
    description_zh: neoManifest?.description_zh || `${name} - Neo 小程序`,
    icon: `/miniapps/${appDir}/static/icon.svg`,
    entry_url: `/miniapps/${appDir}/index.html`,
    status: neoManifest?.status || "active",
    contract_hash: neoManifest?.contract_hash || null,
    permissions: neoManifest?.permissions || {
      payments: true,
      governance: category === "governance",
      automation: false,
    },
  };
}

function main() {
  console.log("Auto-discovering miniapps...\n");

  const registry = {
    gaming: [],
    defi: [],
    social: [],
    nft: [],
    governance: [],
    utility: [],
  };

  const appDirs = fs.readdirSync(APPS_DIR);
  let discovered = 0;

  for (const appDir of appDirs) {
    const app = discoverMiniapp(appDir);
    if (app) {
      const category = detectCategory(appDir);
      registry[category].push(app);
      console.log(`  [OK] ${appDir} -> ${category}`);
      discovered++;
    }
  }

  // Ensure output directory exists
  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write registry
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(registry, null, 2));

  console.log(`\nDiscovered ${discovered} miniapps`);
  console.log(`Registry written to: ${OUTPUT_FILE}`);
}

main();
