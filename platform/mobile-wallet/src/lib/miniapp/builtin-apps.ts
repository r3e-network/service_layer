/**
 * Built-in MiniApp catalog - loaded from JSON data file
 * Mirrors host-app implementation for consistency
 */

import type { MiniAppInfo, MiniAppCategory } from "@/types/miniapp";
import { coerceMiniAppInfo } from "./normalize";
import miniappsData from "../../../../host-app/data/miniapps.json";

// Type assertion for JSON data (host-app may use "games" or "gaming" as keys)
type RawMiniAppData = Record<string, Omit<MiniAppInfo, "category">[]>;
const data = miniappsData as RawMiniAppData;

// Add category to each app
const addCategory = (
  apps: Omit<MiniAppInfo, "category">[] | undefined,
  category: MiniAppCategory,
): MiniAppInfo[] =>
  (apps ?? [])
    .map((app) => {
      const normalized = coerceMiniAppInfo(app, app as MiniAppInfo);
      return normalized ? { ...normalized, category } : null;
    })
    .filter((app): app is MiniAppInfo => Boolean(app));

// Category arrays
const gamingSource = [...(data.gaming ?? []), ...(data.games ?? [])];
export const GAMING_APPS = addCategory(gamingSource, "gaming");
export const DEFI_APPS = addCategory(data.defi, "defi");
export const SOCIAL_APPS = addCategory(data.social, "social");
export const NFT_APPS = addCategory(data.nft, "nft");
export const GOVERNANCE_APPS = addCategory(data.governance, "governance");
export const UTILITY_APPS = addCategory(data.utility, "utility");

// Combined list of all apps
export const BUILTIN_APPS: MiniAppInfo[] = [
  ...GAMING_APPS,
  ...DEFI_APPS,
  ...SOCIAL_APPS,
  ...NFT_APPS,
  ...GOVERNANCE_APPS,
  ...UTILITY_APPS,
];

// Lookup map by app_id
export const BUILTIN_APPS_MAP: Record<string, MiniAppInfo> = Object.fromEntries(
  BUILTIN_APPS.map((app) => [app.app_id, app]),
);

// Additional lookup map by short ID (without "miniapp-" prefix)
const BUILTIN_APPS_SHORT_MAP: Record<string, MiniAppInfo> = Object.fromEntries(
  BUILTIN_APPS.map((app) => {
    let shortId = app.app_id.replace("miniapp-", "");
    if (app.entry_url) {
      const match = app.entry_url.match(/\/miniapps\/([^/]+)/);
      if (match) shortId = match[1];
    }
    return [shortId, app];
  }),
);

/**
 * Find a built-in app by ID (supports both full ID and short ID)
 */
export function getBuiltinApp(appId: string): MiniAppInfo | undefined {
  return BUILTIN_APPS_MAP[appId] ?? BUILTIN_APPS_SHORT_MAP[appId];
}

/**
 * Get apps by category
 */
export function getAppsByCategory(category: MiniAppCategory): MiniAppInfo[] {
  switch (category) {
    case "gaming":
      return GAMING_APPS;
    case "defi":
      return DEFI_APPS;
    case "social":
      return SOCIAL_APPS;
    case "nft":
      return NFT_APPS;
    case "governance":
      return GOVERNANCE_APPS;
    case "utility":
      return UTILITY_APPS;
    default:
      return [];
  }
}
