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

const ICONS_DIR = path.join(__dirname, "../apps");

// E-Robo gradient colors
const EROBO_COLORS = {
  primary: "#9f9df3",
  secondary: "#7b79d1",
  neo: "#00E599",
  neoDark: "#00B377",
};

// Apps that should keep Neo green (blockchain-specific)
const NEO_THEMED_APPS = ["neo-swap", "neo-ns", "neo-treasury", "neoburger", "explorer", "candidate-vote"];

function normalizeBackgroundShape(content) {
  const rectRegex =
    /<rect[^>]*width="512"[^>]*height="512"[^>]*fill="([^"]+)"[^>]*\/?>/i;
  const match = content.match(rectRegex);
  if (!match) return { content, changed: false };
  const fill = match[1];
  const updated = content.replace(rectRegex, `<circle cx="256" cy="256" r="256" fill="${fill}" />`);
  return { content: updated, changed: updated !== content };
}

function updateIconToErobo(iconPath, appName) {
  if (!fs.existsSync(iconPath)) {
    console.log(`  [SKIP] ${appName}: icon not found`);
    return false;
  }

  let content = fs.readFileSync(iconPath, "utf-8");
  let changed = false;

  if (!NEO_THEMED_APPS.includes(appName)) {
    const before = content;
    content = content.replace(/#00E599/gi, EROBO_COLORS.primary);
    content = content.replace(/#00B377/gi, EROBO_COLORS.secondary);
    if (content !== before) {
      changed = true;
    }
  }

  const normalized = normalizeBackgroundShape(content);
  if (normalized.changed) {
    content = normalized.content;
    changed = true;
  }

  if (!changed) {
    console.log(`  [OK] ${appName}: already up to date`);
    return false;
  }

  fs.writeFileSync(iconPath, content);
  console.log(`  [UPDATE] ${appName}: refreshed icon`);
  return true;
}

function main() {
  console.log("Updating miniapp icons to E-Robo style...\n");

  const appDirs = fs
    .readdirSync(ICONS_DIR)
    .filter((dir) => !dir.startsWith("."))
    .filter((dir) => {
      const fullPath = path.join(ICONS_DIR, dir);
      return fs.statSync(fullPath).isDirectory();
    });

  let updated = 0;

  for (const appDir of appDirs) {
    const iconPath = path.join(ICONS_DIR, appDir, "src/static/icon.svg");
    if (updateIconToErobo(iconPath, appDir)) {
      updated++;
    }
  }

  console.log(`\nUpdated ${updated} icons to E-Robo style`);
}

main();
