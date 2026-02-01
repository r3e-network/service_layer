/**
 * Geo-Restrictions
 * Region-based access control
 */

import * as SecureStore from "expo-secure-store";

const GEO_KEY = "geo_settings";

export interface GeoSettings {
  enabled: boolean;
  allowedRegions: string[];
  blockedRegions: string[];
  vpnDetection: boolean;
}

const DEFAULT_SETTINGS: GeoSettings = {
  enabled: false,
  allowedRegions: [],
  blockedRegions: [],
  vpnDetection: false,
};

/**
 * Load geo settings
 */
export async function loadGeoSettings(): Promise<GeoSettings> {
  const data = await SecureStore.getItemAsync(GEO_KEY);
  return data ? JSON.parse(data) : DEFAULT_SETTINGS;
}

/**
 * Save geo settings
 */
export async function saveGeoSettings(settings: GeoSettings): Promise<void> {
  await SecureStore.setItemAsync(GEO_KEY, JSON.stringify(settings));
}

/**
 * Check if region allowed
 */
export function isRegionAllowed(region: string, settings: GeoSettings): boolean {
  if (!settings.enabled) return true;
  if (settings.blockedRegions.includes(region)) return false;
  if (settings.allowedRegions.length === 0) return true;
  return settings.allowedRegions.includes(region);
}

/**
 * Get region name
 */
export function getRegionName(code: string): string {
  const regions: Record<string, string> = {
    US: "United States",
    CN: "China",
    JP: "Japan",
    KR: "South Korea",
    SG: "Singapore",
  };
  return regions[code] || code;
}
