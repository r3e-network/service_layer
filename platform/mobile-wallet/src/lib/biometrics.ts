/**
 * Biometrics Utility Library
 * Handles fingerprint/face authentication for wallet security
 */

import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";

const BIOMETRICS_ENABLED_KEY = "biometrics_enabled";

export type BiometricType = "fingerprint" | "facial" | "iris" | "none";

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
 */
export async function authenticate(reason: string): Promise<boolean> {
  const isAvailable = await checkBiometricsAvailable();
  if (!isAvailable) return false;

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: reason,
    cancelLabel: "Cancel",
    disableDeviceFallback: true, // SECURITY: Prevent PIN/pattern bypass
    fallbackLabel: "", // Hide fallback option
  });

  return result.success;
}

/**
 * Require biometric auth for sensitive operations
 */
export async function requireAuth(reason: string): Promise<boolean> {
  const isEnabled = await isBiometricsEnabled();
  if (!isEnabled) return true; // Skip if disabled

  return authenticate(reason);
}
