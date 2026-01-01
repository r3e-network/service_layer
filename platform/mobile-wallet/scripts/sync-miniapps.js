#!/usr/bin/env node
/**
 * Sync MiniApps from miniapps-uniapp directory
 * Reads manifest.json from each app and generates miniapps data
 */

const fs = require("fs");
const path = require("path");

const MINIAPPS_DIR = path.resolve(__dirname, "../../../miniapps-uniapp/apps");
const OUTPUT_FILE = path.resolve(__dirname, "../src/data/miniapps-generated.ts");

function loadManifests() {
  const apps = [];
  const dirs = fs.readdirSync(MINIAPPS_DIR);

  for (const dir of dirs) {
    const manifestPath = path.join(MINIAPPS_DIR, dir, "src/manifest.json");
    if (fs.existsSync(manifestPath)) {
      try {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
        apps.push({
          app_id: manifest.appid || `miniapp-${dir}`,
          name: manifest.name,
          description: manifest.description,
          category: manifest.category || "utility",
          icon: getIcon(manifest.category),
          entry_url: `/miniapps/${dir}/`,
          permissions: parsePermissions(manifest.permissions),
          status: "active",
        });
      } catch (e) {
        console.warn(`Failed to parse ${manifestPath}: ${e.message}`);
      }
    }
  }
  return apps;
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
  const map = { payments: "payments", rng: "randomness", governance: "governance" };
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
