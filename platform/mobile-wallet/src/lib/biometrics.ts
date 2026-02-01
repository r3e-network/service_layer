/**
 * Biometrics Utility Library
 * Handles fingerprint/face authentication for wallet security
 *
 * @module biometrics
 * @example
 * ```typescript
 * import { authenticate, getBiometricsStatus } from '@/lib/biometrics';
 *
 * const status = await getBiometricsStatus();
 * if (status.isAvailable && status.isEnabled) {
 *   const result = await authenticate('Confirm transaction');
 *   if (!result.success) {
 *     console.log('Auth failed:', result.error);
 *   }
 * }
 * ```
 */

import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import {
  checkLockout,
  recordFailedAttempt,
  clearFailedAttempts,
  addSecurityLog,
  SecurityEventType,
} from "./security";

const BIOMETRICS_ENABLED_KEY = "biometrics_enabled";

export type BiometricType = "fingerprint" | "facial" | "iris" | "none";

/**
 * Authentication result with detailed error information
 */
export interface AuthResult {
  success: boolean;
  error?: AuthError;
  lockedOut?: boolean;
  remainingAttempts?: number;
}

/**
 * Authentication error types
 */
export enum AuthError {
  NOT_AVAILABLE = "not_available",
  NOT_ENROLLED = "not_enrolled",
  CANCELLED = "cancelled",
  FAILED = "failed",
  LOCKED_OUT = "locked_out",
  SYSTEM_ERROR = "system_error",
}

export interface BiometricsStatus {
  isAvailable: boolean;
  isEnabled: boolean;
  type: BiometricType;
}

/**
 * Check if device supports biometrics
 */
export async function checkBiometricsAvailable(): Promise<boolean> {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return compatible && enrolled;
}

/**
 * Get biometric type available on device
 */
export async function getBiometricType(): Promise<BiometricType> {
  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    return "facial";
  }
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    return "fingerprint";
  }
  if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
    return "iris";
  }
  return "none";
}

/**
 * Get full biometrics status
 */
export async function getBiometricsStatus(): Promise<BiometricsStatus> {
  const isAvailable = await checkBiometricsAvailable();
  const isEnabled = await isBiometricsEnabled();
  const type = await getBiometricType();

  return { isAvailable, isEnabled, type };
}

/**
 * Check if user has enabled biometrics
 */
export async function isBiometricsEnabled(): Promise<boolean> {
  const value = await SecureStore.getItemAsync(BIOMETRICS_ENABLED_KEY);
  return value === "true";
}

/**
 * Enable/disable biometrics
 */
export async function setBiometricsEnabled(enabled: boolean): Promise<void> {
  await SecureStore.setItemAsync(BIOMETRICS_ENABLED_KEY, enabled ? "true" : "false");
}

/**
 * Authenticate user with biometrics (strict mode - no device fallback)
 * Integrates with security lockout system
 */
export async function authenticate(reason: string): Promise<AuthResult> {
  // Check lockout status first
  const lockout = await checkLockout();
  if (lockout.isLocked) {
    return {
      success: false,
      error: AuthError.LOCKED_OUT,
      lockedOut: true,
      remainingAttempts: 0,
    };
  }

  const isAvailable = await checkBiometricsAvailable();
  if (!isAvailable) {
    return { success: false, error: AuthError.NOT_AVAILABLE };
  }

  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      cancelLabel: "Cancel",
      disableDeviceFallback: true, // SECURITY: Prevent PIN/pattern bypass
      fallbackLabel: "", // Hide fallback option
    });

    if (result.success) {
      await clearFailedAttempts();
      await addSecurityLog(SecurityEventType.AUTH_SUCCESS, "Biometric authentication");
      return { success: true };
    }

    // Handle failure
    if (result.error === "user_cancel") {
      return { success: false, error: AuthError.CANCELLED };
    }

    // Record failed attempt
    const { attempts, lockedOut } = await recordFailedAttempt();
    await addSecurityLog(SecurityEventType.AUTH_FAILURE, "Biometric authentication failed");

    return {
      success: false,
      error: AuthError.FAILED,
      lockedOut,
      remainingAttempts: Math.max(0, 5 - attempts.count),
    };
  } catch {
    return { success: false, error: AuthError.SYSTEM_ERROR };
  }
}

/**
 * Require biometric auth for sensitive operations
 * Returns AuthResult for detailed error handling
 */
export async function requireAuth(reason: string): Promise<AuthResult> {
  const isEnabled = await isBiometricsEnabled();
  if (!isEnabled) return { success: true }; // Skip if disabled

  return authenticate(reason);
}

/**
 * Get error message for authentication error
 */
export function getAuthErrorMessage(
  error: AuthError,
  t?: (key: string) => string
): string {
  if (t) {
    const keyMap: Record<AuthError, string> = {
      [AuthError.NOT_AVAILABLE]: "biometrics.error.notAvailable",
      [AuthError.NOT_ENROLLED]: "biometrics.error.notEnrolled",
      [AuthError.CANCELLED]: "biometrics.error.cancelled",
      [AuthError.FAILED]: "biometrics.error.failed",
      [AuthError.LOCKED_OUT]: "biometrics.error.lockedOut",
      [AuthError.SYSTEM_ERROR]: "biometrics.error.systemError",
    };
    return t(keyMap[error]);
  }

  const messages: Record<AuthError, string> = {
    [AuthError.NOT_AVAILABLE]: "Biometric authentication not available",
    [AuthError.NOT_ENROLLED]: "No biometrics enrolled on device",
    [AuthError.CANCELLED]: "Authentication cancelled",
    [AuthError.FAILED]: "Authentication failed",
    [AuthError.LOCKED_OUT]: "Too many failed attempts. Please wait.",
    [AuthError.SYSTEM_ERROR]: "System error occurred",
  };
  return messages[error];
}
