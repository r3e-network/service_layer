/**
 * Security Settings
 * Handles app lock, auto-lock, and security logs
 */

import * as SecureStore from "expo-secure-store";

const SECURITY_SETTINGS_KEY = "security_settings";
const SECURITY_LOGS_KEY = "security_logs";

export type LockMethod = "pin" | "biometric" | "both" | "none";

export interface SecuritySettings {
  lockMethod: LockMethod;
  autoLockTimeout: number; // minutes, 0 = immediate
  hideBalance: boolean;
  transactionConfirm: boolean;
}

export interface SecurityLog {
  id: string;
  event: string;
  timestamp: number;
  details?: string;
}

const DEFAULT_SETTINGS: SecuritySettings = {
  lockMethod: "biometric",
  autoLockTimeout: 5,
  hideBalance: false,
  transactionConfirm: true,
};

/**
 * Load security settings
 */
export async function loadSecuritySettings(): Promise<SecuritySettings> {
  const data = await SecureStore.getItemAsync(SECURITY_SETTINGS_KEY);
  return data ? JSON.parse(data) : DEFAULT_SETTINGS;
}

/**
 * Save security settings
 */
export async function saveSecuritySettings(settings: SecuritySettings): Promise<void> {
  await SecureStore.setItemAsync(SECURITY_SETTINGS_KEY, JSON.stringify(settings));
}

/**
 * Load security logs
 */
export async function loadSecurityLogs(): Promise<SecurityLog[]> {
  const data = await SecureStore.getItemAsync(SECURITY_LOGS_KEY);
  return data ? JSON.parse(data) : [];
}

/**
 * Add security log entry
 */
export async function addSecurityLog(event: string, details?: string): Promise<void> {
  const logs = await loadSecurityLogs();
  logs.unshift({
    id: `log_${Date.now()}`,
    event,
    timestamp: Date.now(),
    details,
  });
  const trimmed = logs.slice(0, 100);
  await SecureStore.setItemAsync(SECURITY_LOGS_KEY, JSON.stringify(trimmed));
}

/**
 * Get lock method label
 */
export function getLockMethodLabel(
  method: LockMethod,
  t?: (key: string, options?: Record<string, string | number>) => string,
): string {
  if (t) {
    const keyMap: Record<LockMethod, string> = {
      pin: "security.lockMethod.pin",
      biometric: "security.lockMethod.biometric",
      both: "security.lockMethod.both",
      none: "security.lockMethod.none",
    };
    return t(keyMap[method]);
  }
  const labels: Record<LockMethod, string> = {
    pin: "PIN Code",
    biometric: "Biometric",
    both: "PIN + Biometric",
    none: "None",
  };
  return labels[method];
}

/**
 * Format log timestamp
 */
export function formatLogTime(timestamp: number, locale = "en"): string {
  return new Date(timestamp).toLocaleString(locale);
}
