/**
 * 2FA Tests
 * Tests for src/lib/tfa.ts
 */

import * as SecureStore from "expo-secure-store";
import { loadTFAConfig, saveTFAConfig, generateBackupCodes, getTFAMethodLabel, getTFAMethodIcon } from "../src/lib/tfa";

jest.mock("expo-secure-store");

const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

describe("tfa", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("loadTFAConfig", () => {
    it("should return defaults when no config", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);
      const config = await loadTFAConfig();
      expect(config.enabled).toBe(false);
      expect(config.method).toBe("totp");
    });
  });

  describe("saveTFAConfig", () => {
    it("should save config", async () => {
      await saveTFAConfig({
        enabled: true,
        method: "sms",
        verified: true,
        backupCodes: [],
      });
      expect(mockSecureStore.setItemAsync).toHaveBeenCalled();
    });
  });

  describe("generateBackupCodes", () => {
    it("should generate correct count", async () => {
      const codes = await generateBackupCodes(8);
      expect(codes).toHaveLength(8);
    });

    it("should generate unique codes", async () => {
      const codes = await generateBackupCodes(8);
      const unique = new Set(codes);
      expect(unique.size).toBe(8);
    });
  });

  describe("getTFAMethodLabel", () => {
    it("should return correct labels", () => {
      expect(getTFAMethodLabel("totp")).toBe("Authenticator App");
      expect(getTFAMethodLabel("sms")).toBe("SMS");
    });
  });

  describe("getTFAMethodIcon", () => {
    it("should return correct icons", () => {
      expect(getTFAMethodIcon("totp")).toBe("key");
      expect(getTFAMethodIcon("email")).toBe("mail");
    });
  });
});
