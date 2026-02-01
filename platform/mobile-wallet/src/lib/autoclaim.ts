/**
 * Auto-Claim GAS
 * Automatic GAS claiming functionality
 */

import * as SecureStore from "expo-secure-store";

const AUTOCLAIM_KEY = "autoclaim_config";

export interface AutoClaimConfig {
  enabled: boolean;
  threshold: string;
  frequency: "daily" | "weekly" | "manual";
  lastClaim: number;
}

const DEFAULT_CONFIG: AutoClaimConfig = {
  enabled: false,
  threshold: "1",
  frequency: "weekly",
  lastClaim: 0,
};

/**
 * Load auto-claim config
 */
export async function loadAutoClaimConfig(): Promise<AutoClaimConfig> {
  const data = await SecureStore.getItemAsync(AUTOCLAIM_KEY);
  return data ? JSON.parse(data) : DEFAULT_CONFIG;
}

/**
 * Save auto-claim config
 */
export async function saveAutoClaimConfig(config: AutoClaimConfig): Promise<void> {
  await SecureStore.setItemAsync(AUTOCLAIM_KEY, JSON.stringify(config));
}

/**
 * Check if claim is due
 */
export function isClaimDue(config: AutoClaimConfig): boolean {
  if (!config.enabled) return false;
  const now = Date.now();
  const diff = now - config.lastClaim;
  const day = 86400000;
  if (config.frequency === "daily") return diff >= day;
  if (config.frequency === "weekly") return diff >= day * 7;
  return false;
}

/**
 * Get frequency label
 */
export function getFrequencyLabel(freq: AutoClaimConfig["frequency"]): string {
  const labels = { daily: "Daily", weekly: "Weekly", manual: "Manual" };
  return labels[freq];
}
