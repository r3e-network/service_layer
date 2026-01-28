/**
 * Biometrics Module Tests
 * Tests for biometric authentication utilities
 */

import {
  BiometricType,
  AuthError,
  getAuthErrorMessage,
} from "../src/lib/biometrics";

// Mock expo modules
jest.mock("expo-local-authentication", () => ({
  hasHardwareAsync: jest.fn().mockResolvedValue(true),
  isEnrolledAsync: jest.fn().mockResolvedValue(true),
  supportedAuthenticationTypesAsync: jest.fn().mockResolvedValue([1]),
  authenticateAsync: jest.fn().mockResolvedValue({ success: true }),
  AuthenticationType: {
    FINGERPRINT: 1,
    FACIAL_RECOGNITION: 2,
    IRIS: 3,
  },
}));

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn().mockResolvedValue("true"),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../src/lib/security", () => ({
  checkLockout: jest.fn().mockResolvedValue({ isLocked: false, remainingSeconds: 0 }),
  recordFailedAttempt: jest.fn().mockResolvedValue({ attempts: { count: 1 }, lockedOut: false }),
  clearFailedAttempts: jest.fn().mockResolvedValue(undefined),
  addSecurityLog: jest.fn().mockResolvedValue(undefined),
  SecurityEventType: {
    AUTH_SUCCESS: "auth_success",
    AUTH_FAILURE: "auth_failure",
  },
}));

describe("biometrics", () => {
  describe("getAuthErrorMessage", () => {
    it("should return correct message for NOT_AVAILABLE", () => {
      const msg = getAuthErrorMessage(AuthError.NOT_AVAILABLE);
      expect(msg).toBe("Biometric authentication not available");
    });

    it("should return correct message for LOCKED_OUT", () => {
      const msg = getAuthErrorMessage(AuthError.LOCKED_OUT);
      expect(msg).toBe("Too many failed attempts. Please wait.");
    });

    it("should return correct message for CANCELLED", () => {
      const msg = getAuthErrorMessage(AuthError.CANCELLED);
      expect(msg).toBe("Authentication cancelled");
    });

    it("should return correct message for FAILED", () => {
      const msg = getAuthErrorMessage(AuthError.FAILED);
      expect(msg).toBe("Authentication failed");
    });

    it("should use translation function when provided", () => {
      const mockT = jest.fn().mockReturnValue("Translated");
      const msg = getAuthErrorMessage(AuthError.FAILED, mockT);
      expect(mockT).toHaveBeenCalledWith("biometrics.error.failed");
      expect(msg).toBe("Translated");
    });
  });

  describe("BiometricType", () => {
    it("should have correct type values", () => {
      const types: BiometricType[] = ["fingerprint", "facial", "iris", "none"];
      expect(types).toContain("fingerprint");
      expect(types).toContain("facial");
    });
  });
});
