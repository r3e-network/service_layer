#!/usr/bin/env node
/**
 * Migrate neo-manifest.json files to multi-chain format
 */

const fs = require("fs");
const path = require("path");

const appsDir = path.join(__dirname, "../apps");
const apps = fs.readdirSync(appsDir).filter((f) => fs.statSync(path.join(appsDir, f)).isDirectory());

let migrated = 0;

for (const app of apps) {
  const manifestPath = path.join(appsDir, app, "neo-manifest.json");
  if (!fs.existsSync(manifestPath)) continue;

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

  // Skip if already migrated
  if (manifest.supportedChains) {
    console.log(`[SKIP] ${app} - already migrated`);
    continue;
  }

  // Migrate to new format
  const newManifest = {
    app_id: manifest.app_id,
    name: manifest.name,
    name_zh: manifest.name_zh,
    description: manifest.description,
    description_zh: manifest.description_zh,
    category: manifest.category,
    status: manifest.status || "active",
    supportedChains: ["neo-n3-mainnet", "neo-n3-testnet"],
    contracts: {
      "neo-n3-mainnet": { address: manifest.contract_hash || null },
      "neo-n3-testnet": { address: manifest.contract_hash || null },
    },
    permissions: manifest.permissions || {},
  };

  fs.writeFileSync(manifestPath, JSON.stringify(newManifest, null, 2) + "\n");
  console.log(`[OK] ${app}`);
  migrated++;
}

console.log(`\nMigrated ${migrated} miniapps`);
