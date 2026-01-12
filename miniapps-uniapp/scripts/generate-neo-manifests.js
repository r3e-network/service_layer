#!/usr/bin/env node
/**
 * Generate neo-manifest.json for all miniapps
 * This ensures each app has explicit permissions declared
 */
const fs = require("fs");
const path = require("path");

const APPS_DIR = path.join(__dirname, "../apps");

// App configurations with categories and permissions
const APP_CONFIGS = {
  lottery: { category: "gaming", payments: true },
  "coin-flip": { category: "gaming", payments: true },
  "scratch-card": { category: "gaming", payments: true },
  "neo-crash": { category: "gaming", payments: true },
  "on-chain-tarot": { category: "gaming", payments: true },
  "secret-poker": { category: "gaming", payments: true },
  "neo-swap": { category: "defi", payments: true },
  flashloan: { category: "defi", payments: true },
  "self-loan": { category: "defi", payments: true },
  "compound-capsule": { category: "defi", payments: true },
  neoburger: { category: "defi", payments: true },
  "gas-sponsor": { category: "defi", payments: true },
  "neo-treasury": { category: "defi", payments: true },
  "red-envelope": { category: "social", payments: true },
  "dev-tipping": { category: "social", payments: true },
  "breakup-contract": { category: "social", payments: true },
  "ex-files": { category: "social", payments: true },
  "masquerade-dao": { category: "social", payments: true },
  "garden-of-neo": { category: "nft", payments: true },
  "million-piece-map": { category: "nft", payments: true },
  graveyard: { category: "nft", payments: true },
  canvas: { category: "nft", payments: true },
  "crypto-riddle": { category: "nft", payments: true },
  "council-governance": { category: "governance", payments: true, governance: true },
  "candidate-vote": { category: "governance", payments: true, governance: true },
  "gov-merc": { category: "governance", payments: true, governance: true },
  "gov-booster": { category: "governance", payments: true, governance: true },
  "grant-share": { category: "governance", payments: true, governance: true },
  explorer: { category: "utility", payments: false },
  "neo-ns": { category: "utility", payments: true },
  "time-capsule": { category: "utility", payments: true },
  "heritage-trust": { category: "utility", payments: true },
  "guardian-policy": { category: "utility", payments: true },
  "unbreakable-vault": { category: "utility", payments: true },
  "doomsday-clock": { category: "utility", payments: true },
  "burn-league": { category: "governance", payments: true },
  "daily-checkin": { category: "utility", payments: true },
  "hall-of-fame": { category: "social", payments: true },
};

function generateNeoManifest(appDir) {
  const config = APP_CONFIGS[appDir] || { category: "utility", payments: false };
  const manifestPath = path.join(APPS_DIR, appDir, "src/manifest.json");
  if (!fs.existsSync(manifestPath)) return null;
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  return {
    app_id: `miniapp-${appDir}`,
    name: manifest.name,
    name_zh: manifest.name,
    description: manifest.description || `${manifest.name} - Neo MiniApp`,
    description_zh: `${manifest.name} - Neo 小程序`,
    category: config.category,
    status: "active",
    contract_hash: null,
    permissions: {
      payments: config.payments || false,
      governance: config.governance || false,
      automation: false,
    },
  };
}

function main() {
  console.log("🔧 Generating neo-manifest.json files...\n");
  const appDirs = fs.readdirSync(APPS_DIR).filter((dir) => {
    return fs.statSync(path.join(APPS_DIR, dir)).isDirectory();
  });
  let created = 0;
  for (const appDir of appDirs) {
    const neoManifestPath = path.join(APPS_DIR, appDir, "neo-manifest.json");
    if (fs.existsSync(neoManifestPath)) {
      console.log(`⏭️  Skipping ${appDir}: exists`);
      continue;
    }
    const neoManifest = generateNeoManifest(appDir);
    if (neoManifest) {
      fs.writeFileSync(neoManifestPath, JSON.stringify(neoManifest, null, 2));
      console.log(`✅ Created: ${appDir}/neo-manifest.json`);
      created++;
    }
  }
  console.log(`\n📦 Created ${created} neo-manifest.json files`);
}

main();
