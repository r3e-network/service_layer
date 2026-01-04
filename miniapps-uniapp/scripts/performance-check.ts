/**
 * Performance Validation Script
 * Checks animation performance and bundle size for all MiniApps
 */

import { readFileSync, readdirSync, existsSync, statSync } from "fs";
import { join } from "path";

interface PerformanceResult {
  app: string;
  passed: boolean;
  metrics: {
    animationCount: number;
    heavyAnimations: string[];
    bundleSizeKB: number | null;
    cssSize: number;
    recommendations: string[];
  };
}

const APPS_DIR = join(process.cwd(), "apps");

// Heavy animation patterns that may cause performance issues
const HEAVY_ANIMATION_PATTERNS = [
  /animation:.*infinite/g,
  /animation-iteration-count:\s*infinite/g,
  /@keyframes.*\{[\s\S]*?transform[\s\S]*?scale[\s\S]*?\}/g,
];

// Performance thresholds
const THRESHOLDS = {
  maxAnimations: 10,
  maxHeavyAnimations: 3,
  maxCssSizeKB: 50,
  maxBundleSizeKB: 500,
};

function analyzeApp(appName: string): PerformanceResult {
  const indexPath = join(APPS_DIR, appName, "src/pages/index/index.vue");
  const distPath = join(APPS_DIR, appName, "dist");

  if (!existsSync(indexPath)) {
    return {
      app: appName,
      passed: false,
      metrics: {
        animationCount: 0,
        heavyAnimations: [],
        bundleSizeKB: null,
        cssSize: 0,
        recommendations: ["File not found"],
      },
    };
  }

  const content = readFileSync(indexPath, "utf-8");
  const styleMatch = content.match(/<style[^>]*>([\s\S]*?)<\/style>/);
  const styleContent = styleMatch ? styleMatch[1] : "";

  // Count animations
  const keyframeMatches = styleContent.match(/@keyframes/g) || [];
  const animationCount = keyframeMatches.length;

  // Find heavy animations
  const heavyAnimations: string[] = [];
  const infiniteMatches = styleContent.match(/animation:[^;]*infinite/g) || [];
  heavyAnimations.push(...infiniteMatches.slice(0, 3));

  // CSS size
  const cssSize = Buffer.byteLength(styleContent, "utf-8");

  // Bundle size (if built)
  let bundleSizeKB: number | null = null;
  if (existsSync(distPath)) {
    const files = readdirSync(distPath, { recursive: true }) as string[];
    let totalSize = 0;
    for (const file of files) {
      const filePath = join(distPath, file);
      if (existsSync(filePath) && statSync(filePath).isFile()) {
        totalSize += statSync(filePath).size;
      }
    }
    bundleSizeKB = Math.round(totalSize / 1024);
  }

  // Generate recommendations
  const recommendations: string[] = [];
  if (animationCount > THRESHOLDS.maxAnimations) {
    recommendations.push(`Reduce animations (${animationCount} > ${THRESHOLDS.maxAnimations})`);
  }
  if (heavyAnimations.length > THRESHOLDS.maxHeavyAnimations) {
    recommendations.push("Consider using will-change or transform for heavy animations");
  }
  if (cssSize / 1024 > THRESHOLDS.maxCssSizeKB) {
    recommendations.push(`CSS too large (${Math.round(cssSize / 1024)}KB)`);
  }

  const passed = recommendations.length === 0;

  return {
    app: appName,
    passed,
    metrics: { animationCount, heavyAnimations, bundleSizeKB, cssSize, recommendations },
  };
}

function runPerformanceCheck(): void {
  console.log("⚡ Performance Validation\n");
  console.log("=".repeat(60));

  const apps = readdirSync(APPS_DIR).filter((f) => {
    const indexPath = join(APPS_DIR, f, "src/pages/index/index.vue");
    return existsSync(indexPath);
  });

  let passed = 0;
  let warnings = 0;

  for (const app of apps) {
    const result = analyzeApp(app);

    if (result.passed) {
      passed++;
      console.log(
        `✅ ${app} (${result.metrics.animationCount} anims, ${Math.round(result.metrics.cssSize / 1024)}KB CSS)`,
      );
    } else {
      warnings++;
      console.log(`⚠️  ${app}`);
      for (const rec of result.metrics.recommendations) {
        console.log(`   - ${rec}`);
      }
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log(`\n📊 Results: ${passed}/${apps.length} optimal`);
  if (warnings > 0) {
    console.log(`⚠️  ${warnings} apps have performance recommendations`);
  }
}

runPerformanceCheck();
