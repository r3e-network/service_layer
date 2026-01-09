#!/usr/bin/env node
/**
 * Update miniapp icons to E-Robo style
 *
 * E-Robo color palette:
 * - Primary: #9f9df3 (light purple)
 * - Secondary: #7b79d1 (dark purple)
 * - Accent: #00E599 (Neo green - for Neo-specific apps)
 */

const fs = require("fs");
const path = require("path");

const ICONS_DIR = path.join(__dirname, "../../platform/host-app/public/miniapps");

// E-Robo gradient colors
const EROBO_COLORS = {
  primary: "#9f9df3",
  secondary: "#7b79d1",
  neo: "#00E599",
  neoDark: "#00B377",
};

// Apps that should keep Neo green (blockchain-specific)
const NEO_THEMED_APPS = ["neo-swap", "neo-ns", "neo-treasury", "neoburger", "explorer", "candidate-vote"];

function updateIconToErobo(iconPath, appName) {
  if (!fs.existsSync(iconPath)) {
    console.log(`  [SKIP] ${appName}: icon not found`);
    return false;
  }

  let content = fs.readFileSync(iconPath, "utf-8");

  // Check if already E-Robo style
  if (content.includes(EROBO_COLORS.primary)) {
    console.log(`  [OK] ${appName}: already E-Robo style`);
    return false;
  }

  // Keep Neo green for Neo-specific apps
  if (NEO_THEMED_APPS.includes(appName)) {
    console.log(`  [KEEP] ${appName}: Neo-themed app`);
    return false;
  }

  // Replace Neo green gradient with E-Robo purple
  content = content.replace(/#00E599/gi, EROBO_COLORS.primary);
  content = content.replace(/#00B377/gi, EROBO_COLORS.secondary);

  fs.writeFileSync(iconPath, content);
  console.log(`  [UPDATE] ${appName}: converted to E-Robo style`);
  return true;
}

function main() {
  console.log("Updating miniapp icons to E-Robo style...\n");

  const appDirs = fs.readdirSync(ICONS_DIR).filter((dir) => {
    const fullPath = path.join(ICONS_DIR, dir);
    return fs.statSync(fullPath).isDirectory();
  });

  let updated = 0;

  for (const appDir of appDirs) {
    const iconPath = path.join(ICONS_DIR, appDir, "static/icon.svg");
    if (updateIconToErobo(iconPath, appDir)) {
      updated++;
    }
  }

  console.log(`\nUpdated ${updated} icons to E-Robo style`);
}

main();
