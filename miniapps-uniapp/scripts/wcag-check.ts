/**
 * WCAG AAA Accessibility Checker
 * Validates color contrast ratios (≥7:1 for AAA)
 */

import { readFileSync, readdirSync, existsSync } from "fs";
import { join } from "path";

const APPS_DIR = join(process.cwd(), "apps");

// WCAG AAA requires 7:1 contrast ratio
const AAA_RATIO = 7;

interface ColorPair {
  foreground: string;
  background: string;
  ratio: number;
  passes: boolean;
}

interface AccessibilityResult {
  app: string;
  passed: boolean;
  issues: string[];
  colorPairs: ColorPair[];
}

// Design system colors from tokens.scss
const DESIGN_COLORS: Record<string, string> = {
  "--neo-green": "#00e599",
  "--neo-purple": "#6600ee",
  "--neo-black": "#000000",
  "--neo-white": "#ffffff",
  "--brutal-yellow": "#ffde59",
  "--brutal-pink": "#ff6b9d",
  "--brutal-blue": "#4ecdc4",
  "--brutal-orange": "#ff8c42",
  "--brutal-red": "#ff4757",
  "--bg-primary": "#0a0a0a",
  "--bg-primary-light": "#f5f5f5",
  "--text-primary": "#ffffff",
  "--text-primary-light": "#0a0a0a",
};

// Convert hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

// Calculate relative luminance
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// Calculate contrast ratio
function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  if (!rgb1 || !rgb2) return 0;

  const l1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Common text/background pairs to check
const CRITICAL_PAIRS = [
  { fg: "--text-primary", bg: "--bg-primary" },
  { fg: "--neo-green", bg: "--bg-primary" },
  { fg: "--brutal-yellow", bg: "--neo-black" },
  { fg: "--neo-white", bg: "--neo-purple" },
];

function checkDesignSystem(): ColorPair[] {
  const results: ColorPair[] = [];

  for (const pair of CRITICAL_PAIRS) {
    const fg = DESIGN_COLORS[pair.fg];
    const bg = DESIGN_COLORS[pair.bg];
    if (fg && bg) {
      const ratio = getContrastRatio(fg, bg);
      results.push({
        foreground: `${pair.fg} (${fg})`,
        background: `${pair.bg} (${bg})`,
        ratio: Math.round(ratio * 100) / 100,
        passes: ratio >= AAA_RATIO,
      });
    }
  }
  return results;
}

function runAccessibilityCheck(): void {
  console.log("♿ WCAG AAA Accessibility Check\n");
  console.log("=".repeat(60));
  console.log(`Target: Contrast ratio ≥ ${AAA_RATIO}:1\n`);

  const pairs = checkDesignSystem();
  let passed = 0;
  let failed = 0;

  console.log("Design System Color Pairs:\n");

  for (const pair of pairs) {
    if (pair.passes) {
      passed++;
      console.log(`✅ ${pair.ratio}:1 - ${pair.foreground} on ${pair.background}`);
    } else {
      failed++;
      console.log(`❌ ${pair.ratio}:1 - ${pair.foreground} on ${pair.background}`);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log(`\n📊 Results: ${passed}/${pairs.length} pass AAA`);

  if (failed > 0) {
    console.log(`\n⚠️  ${failed} color pairs need attention for AAA compliance`);
    console.log("\nRecommendations:");
    console.log("- Increase contrast by darkening backgrounds or lightening text");
    console.log("- Consider using larger text (18pt+) which only requires 4.5:1");
  }
}

runAccessibilityCheck();
