#!/usr/bin/env node
/**
 * Auto-discover and register MiniApps
 *
 * This script scans the apps directory and automatically generates
 * the miniapps.json registry file for the host-app.
 *
 * Usage: node scripts/auto-discover-miniapps.js
 *
 * Each MiniApp is self-contained under its app folder:
 * - neo-manifest.json (recommended, source of truth for permissions + metadata)
 * - src/manifest.json (fallback for name/description/appid)
 * - package.json (fallback for name/appid)
 */

const fs = require("fs");
const path = require("path");

const APPS_DIR = path.join(__dirname, "../apps");
const OUTPUT_FILE = path.join(__dirname, "../../platform/host-app/data/miniapps.json");
const CONTRACTS_CONFIG = path.join(__dirname, "../../deploy/config/testnet_contracts.json");

let contractAddressMap = {};
try {
  if (fs.existsSync(CONTRACTS_CONFIG)) {
    const config = JSON.parse(fs.readFileSync(CONTRACTS_CONFIG, "utf-8"));
    const entries = Object.values(config?.miniapp_contracts || {});
    contractAddressMap = entries.reduce((acc, entry) => {
      if (entry?.app_id && entry?.address) {
        acc[entry.app_id] = entry.address;
      }
      return acc;
    }, {});
  }
} catch (e) {
  console.warn("  Warning: Could not parse testnet_contracts.json for contract addresses");
}

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

function toTitleCase(value) {
  return value
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function toString(value) {
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

function preferPng(value, fallback) {
  const raw = toString(value);
  if (!raw) return fallback;
  return raw
    .replace(/icon\.svg(\?.*)?$/i, "logo.png$1")
    .replace(/banner\.svg(\?.*)?$/i, "banner.png$1")
    .replace(/\.svg(\?.*)?$/i, ".png$1");
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

function normalizePermissions(raw) {
  const permissions = raw && typeof raw === "object" ? raw : {};
  return {
    payments: Boolean(permissions.payments),
    governance: Boolean(permissions.governance),
    rng: Boolean(permissions.rng),
    datafeed: Boolean(permissions.datafeed),
    automation: Boolean(permissions.automation),
  };
}

function resolveAppId(appDir, manifest, neoManifest, packageJson) {
  const candidates = [
    toString(neoManifest?.app_id ?? neoManifest?.appId),
    toString(manifest?.appid),
    toString(packageJson?.name),
  ].filter(Boolean);

  return candidates[0] || `miniapp-${appDir}`;
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

  if (!packageJson && !manifest && !neoManifest) {
    console.log(`  [SKIP] ${appDir}: no package.json, src/manifest.json, or neo-manifest.json`);
    return null;
  }

  const appId = resolveAppId(appDir, manifest, neoManifest, packageJson);
  const fallbackName = toTitleCase(appDir);
  const name = toString(neoManifest?.name) || toString(manifest?.name) || fallbackName;
  const category = (toString(neoManifest?.category) || detectCategory(appDir)).toLowerCase();

  const description =
    toString(neoManifest?.description) || toString(manifest?.description) || `${name} - Neo MiniApp`;

  const descriptionZh =
    toString(neoManifest?.description_zh) || toString(neoManifest?.descriptionZh) || `${name} - Neo 小程序`;

  const icon = preferPng(neoManifest?.icon, `/miniapps/${appDir}/static/logo.png`);
  const banner = preferPng(
    neoManifest?.banner || neoManifest?.card?.display?.banner,
    `/miniapps/${appDir}/static/banner.png`,
  );
  const entryUrl = toString(neoManifest?.entry_url) || `/miniapps/${appDir}/index.html`;
  const supportedChainsRaw = Array.isArray(neoManifest?.supported_chains) ? neoManifest.supported_chains : [];
  const supportedChains = supportedChainsRaw.map((c) => toString(c).toLowerCase()).filter(Boolean);
  const rawContracts =
    neoManifest?.contracts && typeof neoManifest.contracts === "object" && !Array.isArray(neoManifest.contracts)
      ? neoManifest.contracts
      : {};
  if (!rawContracts["neo-n3-testnet"] && contractAddressMap[appId]) {
    rawContracts["neo-n3-testnet"] = { address: contractAddressMap[appId], active: true };
  }
  if (supportedChains.length === 0) {
    Object.keys(rawContracts).forEach((chainId) => {
      if (!supportedChains.includes(chainId)) supportedChains.push(chainId);
    });
  }

  const chainContracts = {};
  for (const [chainId, config] of Object.entries(rawContracts)) {
    if (!config || typeof config !== "object") continue;
    const address = toString(config.address) || null;
    const active = config.active !== false;
    const entryUrl =
      typeof config.entry_url === "string"
        ? config.entry_url
        : typeof config.entryUrl === "string"
          ? config.entryUrl
          : undefined;
    chainContracts[chainId] = { address, active, ...(entryUrl ? { entryUrl } : {}) };
  }
  const permissions = normalizePermissions(neoManifest?.permissions);

  return {
    app_id: appId,
    name,
    name_zh: toString(neoManifest?.name_zh) || toString(neoManifest?.nameZh) || toString(manifest?.name) || name,
    description,
    description_zh: descriptionZh,
    icon,
    banner,
    entry_url: entryUrl,
    category,
    status: toString(neoManifest?.status) || "active",
    supportedChains,
    chainContracts,
    permissions,
    limits: neoManifest?.limits ?? null,
    stats_display: neoManifest?.stats_display ?? null,
    news_integration: typeof neoManifest?.news_integration === "boolean" ? neoManifest.news_integration : null,
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
      const normalizedCategory = registry[app.category] ? app.category : "utility";
      registry[normalizedCategory].push(app);
      console.log(`  [OK] ${appDir} -> ${normalizedCategory}`);
      discovered++;
    }
  }

  // Sort apps in each category by name for stable output
  for (const category of Object.keys(registry)) {
    registry[category].sort((a, b) => a.name.localeCompare(b.name));
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

if (require.main === module) {
  main();
}

module.exports = { discoverMiniapp };
