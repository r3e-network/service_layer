/**
 * Theme Switching Test Script
 * Tests all 36 MiniApps for proper dark/light theme support
 */

import { readFileSync, readdirSync, existsSync } from "fs";
import { join } from "path";

interface ThemeTestResult {
  app: string;
  passed: boolean;
  checks: {
    variablesImport: boolean;
    tokensImport: boolean;
    scopedStyle: boolean;
    cssVariablesUsed: boolean;
    hardcodedColors: string[];
  };
}

const APPS_DIR = join(process.cwd(), "apps");

// Hardcoded color patterns to detect
const HARDCODED_COLOR_PATTERNS = [
  /#[0-9a-fA-F]{3,8}(?![0-9a-fA-F])/g, // Hex colors
  /rgb\([^)]+\)/g, // rgb()
  /rgba\([^)]+\)/g, // rgba() - some are acceptable for shadows
];

// Acceptable rgba patterns (shadows, glows, CSS variable patterns)
const ACCEPTABLE_RGBA = [
  /rgba\(0,\s*0,\s*0,/i, // Black shadows
  /rgba\(255,\s*255,\s*255,/i, // White highlights
  /rgba\(0,\s*229,\s*153,/i, // Neo green glow
  /rgba\(var\(--[^)]+\)/i, // CSS variable with fallback: rgba(var(--color-rgb), 0.5)
  /rgba\(\$[a-z-]+,/i, // SCSS variable: rgba($neo-green, 0.5) - will be compiled
];

function testApp(appName: string): ThemeTestResult {
  const indexPath = join(APPS_DIR, appName, "src/pages/index/index.vue");

  if (!existsSync(indexPath)) {
    return {
      app: appName,
      passed: false,
      checks: {
        variablesImport: false,
        tokensImport: false,
        scopedStyle: false,
        cssVariablesUsed: false,
        hardcodedColors: ["File not found"],
      },
    };
  }

  const content = readFileSync(indexPath, "utf-8");

  // Extract style section
  const styleMatch = content.match(/<style[^>]*>([\s\S]*?)<\/style>/);
  const styleContent = styleMatch ? styleMatch[1] : "";
  const styleTag = content.match(/<style[^>]*>/)?.[0] || "";

  // Check imports
  const variablesImport = /variables\.scss/.test(content);
  const tokensImport = /tokens\.scss/.test(content);
  const scopedStyle = /scoped/.test(styleTag);

  // Check CSS variable usage
  const cssVarCount = (styleContent.match(/var\(--/g) || []).length;
  const cssVariablesUsed = cssVarCount > 5;

  // Find hardcoded colors (excluding acceptable ones)
  const hardcodedColors: string[] = [];

  for (const pattern of HARDCODED_COLOR_PATTERNS) {
    const matches = styleContent.match(pattern) || [];
    for (const match of matches) {
      // Skip if it's in a SCSS variable definition
      if (styleContent.includes(`$`) && styleContent.indexOf(match) < 100) {
        continue;
      }
      // Skip acceptable rgba patterns
      if (ACCEPTABLE_RGBA.some((p) => p.test(match))) {
        continue;
      }
      // Skip colors in comments
      const beforeMatch = styleContent.substring(0, styleContent.indexOf(match));
      if (beforeMatch.lastIndexOf("//") > beforeMatch.lastIndexOf("\n")) {
        continue;
      }
      hardcodedColors.push(match);
    }
  }

  const passed = variablesImport && tokensImport && scopedStyle && cssVariablesUsed && hardcodedColors.length === 0;

  return {
    app: appName,
    passed,
    checks: {
      variablesImport,
      tokensImport,
      scopedStyle,
      cssVariablesUsed,
      hardcodedColors: hardcodedColors.slice(0, 5), // Limit to first 5
    },
  };
}

function runTests(): void {
  console.log("🎨 Theme Switching Test\n");
  console.log("=".repeat(60));

  const apps = readdirSync(APPS_DIR).filter((f) => {
    const indexPath = join(APPS_DIR, f, "src/pages/index/index.vue");
    return existsSync(indexPath);
  });

  const results: ThemeTestResult[] = [];
  let passed = 0;
  let failed = 0;

  for (const app of apps) {
    const result = testApp(app);
    results.push(result);

    if (result.passed) {
      passed++;
      console.log(`✅ ${app}`);
    } else {
      failed++;
      console.log(`❌ ${app}`);
      if (!result.checks.variablesImport) console.log("   - Missing variables.scss import");
      if (!result.checks.tokensImport) console.log("   - Missing tokens.scss import");
      if (!result.checks.scopedStyle) console.log("   - Missing scoped attribute");
      if (!result.checks.cssVariablesUsed) console.log("   - Insufficient CSS variables");
      if (result.checks.hardcodedColors.length > 0) {
        console.log(`   - Hardcoded colors: ${result.checks.hardcodedColors.join(", ")}`);
      }
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log(`\n📊 Results: ${passed}/${apps.length} passed (${Math.round((passed / apps.length) * 100)}%)`);

  if (failed > 0) {
    console.log(`\n⚠️  ${failed} apps need attention`);
    process.exit(1);
  } else {
    console.log("\n🎉 All apps support theme switching!");
  }
}

runTests();
