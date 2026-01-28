/**
 * 2FA Support
 * Two-factor authentication management
 */

import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";

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
 * Generate cryptographically secure backup codes
 */
export async function generateBackupCodes(count: number = 8): Promise<string[]> {
  const codes: string[] = [];
  const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Exclude ambiguous chars
  for (let i = 0; i < count; i++) {
    const bytes = await Crypto.getRandomBytesAsync(8);
    let code = "";
    for (const byte of bytes) {
      code += CHARSET[byte % CHARSET.length];
    }
    codes.push(code);
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
