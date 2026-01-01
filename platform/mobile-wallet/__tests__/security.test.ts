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
});
