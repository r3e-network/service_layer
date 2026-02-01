/**
 * Auto-Claim Tests
 * Tests for src/lib/autoclaim.ts
 */

import * as SecureStore from "expo-secure-store";
import { loadAutoClaimConfig, saveAutoClaimConfig, isClaimDue, getFrequencyLabel } from "../src/lib/autoclaim";

jest.mock("expo-secure-store");

const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

describe("autoclaim", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("loadAutoClaimConfig", () => {
    it("should return defaults when no config", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);
      const config = await loadAutoClaimConfig();
      expect(config.enabled).toBe(false);
      expect(config.frequency).toBe("weekly");
    });
  });

  describe("saveAutoClaimConfig", () => {
    it("should save config", async () => {
      await saveAutoClaimConfig({
        enabled: true,
        threshold: "5",
        frequency: "daily",
        lastClaim: 123,
      });
      expect(mockSecureStore.setItemAsync).toHaveBeenCalled();
    });
  });

  describe("isClaimDue", () => {
    it("should return false when disabled", () => {
      const config = { enabled: false, threshold: "1", frequency: "daily" as const, lastClaim: 0 };
      expect(isClaimDue(config)).toBe(false);
    });

    it("should return true when daily and over 24h", () => {
      const config = { enabled: true, threshold: "1", frequency: "daily" as const, lastClaim: Date.now() - 86400001 };
      expect(isClaimDue(config)).toBe(true);
    });

    it("should return false for manual", () => {
      const config = { enabled: true, threshold: "1", frequency: "manual" as const, lastClaim: 0 };
      expect(isClaimDue(config)).toBe(false);
    });
  });

  describe("getFrequencyLabel", () => {
    it("should return correct labels", () => {
      expect(getFrequencyLabel("daily")).toBe("Daily");
      expect(getFrequencyLabel("weekly")).toBe("Weekly");
    });
  });
});
