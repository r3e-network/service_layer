/**
 * Security Tests
 * Tests for src/lib/security.ts
 */

import * as SecureStore from "expo-secure-store";
import {
  loadSecuritySettings,
  saveSecuritySettings,
  loadSecurityLogs,
  addSecurityLog,
  getLockMethodLabel,
  formatLogTime,
  loadFailedAttempts,
  recordFailedAttempt,
  clearFailedAttempts,
  checkLockout,
  SecurityEventType,
} from "../src/lib/security";

jest.mock("expo-secure-store");

const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

describe("security", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("loadSecuritySettings", () => {
    it("should return defaults when no settings", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);
      const settings = await loadSecuritySettings();
      expect(settings.lockMethod).toBe("biometric");
    });

    it("should return stored settings", async () => {
      const stored = { lockMethod: "pin", autoLockTimeout: 10, hideBalance: true, transactionConfirm: false };
      mockSecureStore.getItemAsync.mockResolvedValue(JSON.stringify(stored));
      const settings = await loadSecuritySettings();
      expect(settings.lockMethod).toBe("pin");
    });
  });

  describe("saveSecuritySettings", () => {
    it("should save settings", async () => {
      const settings = {
        lockMethod: "both" as const,
        autoLockTimeout: 5,
        hideBalance: false,
        transactionConfirm: true,
      };
      await saveSecuritySettings(settings);
      expect(mockSecureStore.setItemAsync).toHaveBeenCalled();
    });
  });

  describe("loadSecurityLogs", () => {
    it("should return empty array when no logs", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);
      const logs = await loadSecurityLogs();
      expect(logs).toEqual([]);
    });
  });

  describe("addSecurityLog", () => {
    it("should add log entry", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);
      await addSecurityLog("Login", "Success");
      expect(mockSecureStore.setItemAsync).toHaveBeenCalled();
    });
  });

  describe("getLockMethodLabel", () => {
    it("should return correct labels", () => {
      expect(getLockMethodLabel("pin")).toBe("PIN Code");
      expect(getLockMethodLabel("biometric")).toBe("Biometric");
      expect(getLockMethodLabel("both")).toBe("PIN + Biometric");
      expect(getLockMethodLabel("none")).toBe("None");
    });
  });

  describe("formatLogTime", () => {
    it("should format timestamp", () => {
      const result = formatLogTime(1704067200000);
      expect(result).toBeDefined();
    });
  });

  describe("loadFailedAttempts", () => {
    it("should return defaults when no data", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);
      const attempts = await loadFailedAttempts();
      expect(attempts.count).toBe(0);
      expect(attempts.lockoutUntil).toBeNull();
    });

    it("should return stored attempts", async () => {
      const stored = { count: 3, lastAttempt: Date.now(), lockoutUntil: null };
      mockSecureStore.getItemAsync.mockResolvedValue(JSON.stringify(stored));
      const attempts = await loadFailedAttempts();
      expect(attempts.count).toBe(3);
    });
  });

  describe("recordFailedAttempt", () => {
    it("should increment count", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);
      const result = await recordFailedAttempt();
      expect(result.attempts.count).toBe(1);
      expect(result.lockedOut).toBe(false);
    });

    it("should trigger lockout after max attempts", async () => {
      const stored = { count: 4, lastAttempt: Date.now(), lockoutUntil: null };
      // Mock different responses for different keys
      mockSecureStore.getItemAsync.mockImplementation((key: string) => {
        if (key === "failed_auth_attempts") {
          return Promise.resolve(JSON.stringify(stored));
        }
        return Promise.resolve("[]"); // Return empty array for security logs
      });
      const result = await recordFailedAttempt();
      expect(result.lockedOut).toBe(true);
    });
  });

  describe("clearFailedAttempts", () => {
    it("should reset attempts", async () => {
      await clearFailedAttempts();
      expect(mockSecureStore.setItemAsync).toHaveBeenCalled();
    });
  });

  describe("checkLockout", () => {
    it("should return not locked when no lockout", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);
      const result = await checkLockout();
      expect(result.isLocked).toBe(false);
    });

    it("should return locked when lockout active", async () => {
      const future = Date.now() + 300000;
      const stored = { count: 5, lastAttempt: Date.now(), lockoutUntil: future };
      mockSecureStore.getItemAsync.mockResolvedValue(JSON.stringify(stored));
      const result = await checkLockout();
      expect(result.isLocked).toBe(true);
      expect(result.remainingSeconds).toBeGreaterThan(0);
    });
  });

  describe("SecurityEventType", () => {
    it("should have correct event types", () => {
      expect(SecurityEventType.AUTH_SUCCESS).toBe("auth_success");
      expect(SecurityEventType.AUTH_FAILURE).toBe("auth_failure");
      expect(SecurityEventType.LOCKOUT_TRIGGERED).toBe("lockout_triggered");
    });
  });
});
