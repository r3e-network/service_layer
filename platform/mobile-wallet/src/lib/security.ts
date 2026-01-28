/**
 * Security Settings
 * Handles app lock, auto-lock, security logs, and failed attempt tracking
 *
 * @module security
 * @example
 * ```typescript
 * import { loadSecuritySettings, addSecurityLog, SecurityEventType } from '@/lib/security';
 *
 * // Log a security event
 * await addSecurityLog(SecurityEventType.AUTH_SUCCESS, 'Biometric auth');
 *
 * // Check if locked out
 * const lockout = await checkLockout();
 * if (lockout.isLocked) {
 *   console.log(`Locked for ${lockout.remainingSeconds}s`);
 * }
 * ```
 */

import * as SecureStore from "expo-secure-store";

const SECURITY_SETTINGS_KEY = "security_settings";
const SECURITY_LOGS_KEY = "security_logs";
const FAILED_ATTEMPTS_KEY = "failed_auth_attempts";

/** Maximum failed authentication attempts before lockout */
const MAX_FAILED_ATTEMPTS = 5;
/** Lockout duration in seconds after max failed attempts */
const LOCKOUT_DURATION_SECONDS = 300; // 5 minutes

export type LockMethod = "pin" | "biometric" | "both" | "none";

/**
 * Security event types for audit logging
 */
export enum SecurityEventType {
  AUTH_SUCCESS = "auth_success",
  AUTH_FAILURE = "auth_failure",
  LOCKOUT_TRIGGERED = "lockout_triggered",
  LOCKOUT_CLEARED = "lockout_cleared",
  SETTINGS_CHANGED = "settings_changed",
  WALLET_EXPORTED = "wallet_exported",
  WALLET_DELETED = "wallet_deleted",
  BACKUP_CREATED = "backup_created",
  BACKUP_RESTORED = "backup_restored",
  TRANSACTION_SIGNED = "transaction_signed",
  SUSPICIOUS_ACTIVITY = "suspicious_activity",
}

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

/**
 * Failed authentication attempt tracking
 */
export interface FailedAttempts {
  count: number;
  lastAttempt: number;
  lockoutUntil: number | null;
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
  t?: (key: string, options?: Record<string, string | number>) => string
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

/**
 * Load failed authentication attempts
 */
export async function loadFailedAttempts(): Promise<FailedAttempts> {
  const data = await SecureStore.getItemAsync(FAILED_ATTEMPTS_KEY);
  return data ? JSON.parse(data) : { count: 0, lastAttempt: 0, lockoutUntil: null };
}

/**
 * Record a failed authentication attempt
 * @returns Updated failed attempts state and whether lockout was triggered
 */
export async function recordFailedAttempt(): Promise<{ attempts: FailedAttempts; lockedOut: boolean }> {
  const attempts = await loadFailedAttempts();
  const now = Date.now();

  // Reset if last attempt was more than 30 minutes ago
  if (now - attempts.lastAttempt > 30 * 60 * 1000) {
    attempts.count = 0;
  }

  attempts.count += 1;
  attempts.lastAttempt = now;

  let lockedOut = false;
  if (attempts.count >= MAX_FAILED_ATTEMPTS) {
    attempts.lockoutUntil = now + LOCKOUT_DURATION_SECONDS * 1000;
    lockedOut = true;
    await addSecurityLog(SecurityEventType.LOCKOUT_TRIGGERED, `After ${attempts.count} failed attempts`);
  }

  await SecureStore.setItemAsync(FAILED_ATTEMPTS_KEY, JSON.stringify(attempts));
  return { attempts, lockedOut };
}

/**
 * Clear failed attempts after successful authentication
 */
export async function clearFailedAttempts(): Promise<void> {
  const attempts: FailedAttempts = { count: 0, lastAttempt: 0, lockoutUntil: null };
  await SecureStore.setItemAsync(FAILED_ATTEMPTS_KEY, JSON.stringify(attempts));
}

/**
 * Check if user is currently locked out
 * @returns Lockout status and remaining time
 */
export async function checkLockout(): Promise<{ isLocked: boolean; remainingSeconds: number }> {
  const attempts = await loadFailedAttempts();
  const now = Date.now();

  if (attempts.lockoutUntil && attempts.lockoutUntil > now) {
    return {
      isLocked: true,
      remainingSeconds: Math.ceil((attempts.lockoutUntil - now) / 1000),
    };
  }

  // Clear lockout if expired
  if (attempts.lockoutUntil && attempts.lockoutUntil <= now) {
    await clearFailedAttempts();
    await addSecurityLog(SecurityEventType.LOCKOUT_CLEARED, "Lockout period expired");
  }

  return { isLocked: false, remainingSeconds: 0 };
}
