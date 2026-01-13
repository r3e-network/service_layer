#!/usr/bin/env node
/**
 * Sync MiniApps from miniapps-uniapp directory
 * Reads manifest.json and neo-manifest.json from each app and generates miniapps data
 */

const fs = require("fs");
const path = require("path");

const MINIAPPS_DIR = path.resolve(__dirname, "../../../miniapps-uniapp/apps");
const OUTPUT_FILE = path.resolve(__dirname, "../src/data/miniapps-generated.ts");

// Default supported chains for Neo N3 apps
const DEFAULT_SUPPORTED_CHAINS = ["neo-n3-mainnet", "neo-n3-testnet"];

function loadManifests() {
  const apps = [];
  const dirs = fs.readdirSync(MINIAPPS_DIR);

  for (const dir of dirs) {
    const manifestPath = path.join(MINIAPPS_DIR, dir, "src/manifest.json");
    const neoManifestPath = path.join(MINIAPPS_DIR, dir, "neo-manifest.json");

    if (fs.existsSync(manifestPath)) {
      try {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));

        // Try to load neo-manifest.json for chain configuration
        let supportedChains = DEFAULT_SUPPORTED_CHAINS;
        let chainContracts = undefined;

        if (fs.existsSync(neoManifestPath)) {
          try {
            const neoManifest = JSON.parse(fs.readFileSync(neoManifestPath, "utf-8"));
            if (neoManifest.supportedChains && Array.isArray(neoManifest.supportedChains)) {
              supportedChains = neoManifest.supportedChains;
            }
            if (neoManifest.chainContracts) {
              chainContracts = neoManifest.chainContracts;
            }
          } catch (e) {
            console.warn(`Failed to parse ${neoManifestPath}: ${e.message}`);
          }
        }

        const app = {
          app_id: manifest.appid || `miniapp-${dir}`,
          name: manifest.name,
          description: manifest.description,
          category: normalizeCategory(manifest.category),
          icon: getIcon(manifest.category),
          entry_url: `/miniapps/${dir}/`,
          permissions: parsePermissions(manifest.permissions),
          status: "active",
          supportedChains,
        };

        if (chainContracts) {
          app.chainContracts = chainContracts;
        }

        apps.push(app);
      } catch (e) {
        console.warn(`Failed to parse ${manifestPath}: ${e.message}`);
      }
    }
  }
  return apps;
}

// Valid MiniApp categories
const VALID_CATEGORIES = ["gaming", "defi", "governance", "utility", "social", "nft"];

function normalizeCategory(category) {
  if (!category) return "utility";
  const normalized = category.toLowerCase();
  // Map common aliases
  if (normalized === "tools") return "utility";
  if (normalized === "game") return "gaming";
  if (normalized === "finance") return "defi";
  return VALID_CATEGORIES.includes(normalized) ? normalized : "utility";
}

function getIcon(category) {
  const icons = {
    gaming: "🎮",
    defi: "💰",
    governance: "🗳️",
    utility: "🔧",
    social: "💬",
    nft: "🖼️",
  };
  return icons[category] || "📱";
}

function parsePermissions(perms) {
  if (!perms || !Array.isArray(perms)) return {};
  const map = { payments: "payments", rng: "rng", governance: "governance" };
  const result = {};
  for (const p of perms) {
    if (map[p]) result[map[p]] = true;
  }
  return result;
}

function generate() {
  const apps = loadManifests();
  console.log(`Found ${apps.length} miniapps`);

  const content = `// Auto-generated from miniapps-uniapp - DO NOT EDIT
// Run: node scripts/sync-miniapps.js

import type { MiniAppInfo } from "@/types/miniapp";

export const MINIAPPS: MiniAppInfo[] = ${JSON.stringify(apps, null, 2)};

export const getAppsByCategory = (cat: string) => MINIAPPS.filter(a => a.category === cat);
export const searchApps = (q: string) => {
  const lq = q.toLowerCase();
  return MINIAPPS.filter(a => a.name.toLowerCase().includes(lq) || a.description.toLowerCase().includes(lq));
};
`;

  fs.writeFileSync(OUTPUT_FILE, content);
  console.log(`Generated ${OUTPUT_FILE}`);
}

generate();
