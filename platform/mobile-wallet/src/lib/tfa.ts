/**
 * 2FA Support
 * Two-factor authentication management
 */

import * as SecureStore from "expo-secure-store";

const TFA_KEY = "tfa_config";

export type TFAMethod = "totp" | "sms" | "email";

export interface TFAConfig {
  enabled: boolean;
  method: TFAMethod;
  verified: boolean;
  backupCodes: string[];
}

const DEFAULT_CONFIG: TFAConfig = {
  enabled: false,
  method: "totp",
  verified: false,
  backupCodes: [],
};

/**
 * Load 2FA config
 */
export async function loadTFAConfig(): Promise<TFAConfig> {
  const data = await SecureStore.getItemAsync(TFA_KEY);
  return data ? JSON.parse(data) : DEFAULT_CONFIG;
}

/**
 * Save 2FA config
 */
export async function saveTFAConfig(config: TFAConfig): Promise<void> {
  await SecureStore.setItemAsync(TFA_KEY, JSON.stringify(config));
}

/**
 * Generate backup codes
 */
export function generateBackupCodes(count: number = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    codes.push(Math.random().toString(36).slice(2, 10).toUpperCase());
  }
  return codes;
}

/**
 * Get method label
 */
export function getTFAMethodLabel(method: TFAMethod): string {
  const labels: Record<TFAMethod, string> = {
    totp: "Authenticator App",
    sms: "SMS",
    email: "Email",
  };
  return labels[method];
}

/**
 * Get method icon
 */
export function getTFAMethodIcon(method: TFAMethod): string {
  const icons: Record<TFAMethod, string> = {
    totp: "key",
    sms: "chatbubble",
    email: "mail",
  };
  return icons[method];
}
