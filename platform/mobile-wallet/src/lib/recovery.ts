/**
 * Social Recovery
 * Guardian-based wallet recovery system
 */

import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";

const GUARDIANS_KEY = "social_guardians";
const RECOVERY_KEY = "recovery_config";

export interface Guardian {
  id: string;
  name: string;
  email?: string;
  address?: string;
  confirmed: boolean;
  addedAt: number;
}

export interface RecoveryConfig {
  enabled: boolean;
  threshold: number;
  totalGuardians: number;
  lastUpdated: number;
}

const DEFAULT_CONFIG: RecoveryConfig = {
  enabled: false,
  threshold: 2,
  totalGuardians: 0,
  lastUpdated: 0,
};

/**
 * Load guardians
 */
export async function loadGuardians(): Promise<Guardian[]> {
  const data = await SecureStore.getItemAsync(GUARDIANS_KEY);
  return data ? JSON.parse(data) : [];
}

/**
 * Add guardian
 */
export async function addGuardian(
  guardian: Omit<Guardian, "id" | "confirmed" | "addedAt">
): Promise<void> {
  const list = await loadGuardians();
  const id = await generateGuardianId();
  list.push({
    ...guardian,
    id,
    confirmed: false,
    addedAt: Date.now(),
  });
  await SecureStore.setItemAsync(GUARDIANS_KEY, JSON.stringify(list));
}

/**
 * Remove guardian
 */
export async function removeGuardian(id: string): Promise<void> {
  const list = await loadGuardians();
  const filtered = list.filter((g) => g.id !== id);
  await SecureStore.setItemAsync(GUARDIANS_KEY, JSON.stringify(filtered));
}

/**
 * Confirm guardian
 */
export async function confirmGuardian(id: string): Promise<void> {
  const list = await loadGuardians();
  const updated = list.map((g) => (g.id === id ? { ...g, confirmed: true } : g));
  await SecureStore.setItemAsync(GUARDIANS_KEY, JSON.stringify(updated));
}

/**
 * Load recovery config
 */
export async function loadRecoveryConfig(): Promise<RecoveryConfig> {
  const data = await SecureStore.getItemAsync(RECOVERY_KEY);
  return data ? JSON.parse(data) : DEFAULT_CONFIG;
}

/**
 * Save recovery config
 */
export async function saveRecoveryConfig(config: RecoveryConfig): Promise<void> {
  await SecureStore.setItemAsync(RECOVERY_KEY, JSON.stringify(config));
}

/**
 * Generate cryptographically secure guardian ID
 */
export async function generateGuardianId(): Promise<string> {
  const bytes = await Crypto.getRandomBytesAsync(8);
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `guard_${Date.now()}_${hex}`;
}

/**
 * Get recovery status label
 */
export function getRecoveryStatus(config: RecoveryConfig, guardians: Guardian[]): string {
  const confirmed = guardians.filter((g) => g.confirmed).length;
  if (!config.enabled) return "Not configured";
  if (confirmed < config.threshold) return "Incomplete";
  return "Active";
}

/**
 * Format threshold display
 */
export function formatThreshold(threshold: number, total: number): string {
  return `${threshold} of ${total}`;
}
