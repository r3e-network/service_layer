/**
 * Social Recovery Tests
 * Tests for src/lib/recovery.ts
 */

import * as SecureStore from "expo-secure-store";
import {
  loadGuardians,
  addGuardian,
  removeGuardian,
  confirmGuardian,
  loadRecoveryConfig,
  saveRecoveryConfig,
  generateGuardianId,
  getRecoveryStatus,
  formatThreshold,
} from "../src/lib/recovery";

jest.mock("expo-secure-store");

const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

describe("recovery", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("loadGuardians", () => {
    it("should return empty array when no guardians", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);
      const guardians = await loadGuardians();
      expect(guardians).toEqual([]);
    });

    it("should return saved guardians", async () => {
      const saved = [{ id: "g1", name: "Alice" }];
      mockSecureStore.getItemAsync.mockResolvedValue(JSON.stringify(saved));
      const guardians = await loadGuardians();
      expect(guardians).toHaveLength(1);
    });
  });

  describe("addGuardian", () => {
    it("should add guardian", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);
      await addGuardian({ name: "Alice", email: "alice@test.com" });
      expect(mockSecureStore.setItemAsync).toHaveBeenCalled();
    });
  });

  describe("removeGuardian", () => {
    it("should remove guardian by id", async () => {
      const guardians = [{ id: "g1" }, { id: "g2" }];
      mockSecureStore.getItemAsync.mockResolvedValue(JSON.stringify(guardians));
      await removeGuardian("g1");
      expect(mockSecureStore.setItemAsync).toHaveBeenCalled();
    });
  });

  describe("confirmGuardian", () => {
    it("should confirm guardian", async () => {
      const guardians = [{ id: "g1", confirmed: false }];
      mockSecureStore.getItemAsync.mockResolvedValue(JSON.stringify(guardians));
      await confirmGuardian("g1");
      expect(mockSecureStore.setItemAsync).toHaveBeenCalled();
    });
  });

  describe("loadRecoveryConfig", () => {
    it("should return defaults when no config", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);
      const config = await loadRecoveryConfig();
      expect(config.enabled).toBe(false);
      expect(config.threshold).toBe(2);
    });
  });

  describe("saveRecoveryConfig", () => {
    it("should save config", async () => {
      await saveRecoveryConfig({
        enabled: true,
        threshold: 3,
        totalGuardians: 5,
        lastUpdated: Date.now(),
      });
      expect(mockSecureStore.setItemAsync).toHaveBeenCalled();
    });
  });

  describe("generateGuardianId", () => {
    it("should generate unique IDs", () => {
      const id1 = generateGuardianId();
      const id2 = generateGuardianId();
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^guard_/);
    });
  });

  describe("getRecoveryStatus", () => {
    it("should return Not configured when disabled", () => {
      const config = { enabled: false, threshold: 2, totalGuardians: 0, lastUpdated: 0 };
      expect(getRecoveryStatus(config, [])).toBe("Not configured");
    });

    it("should return Incomplete when below threshold", () => {
      const config = { enabled: true, threshold: 2, totalGuardians: 3, lastUpdated: 0 };
      const guardians = [{ id: "g1", confirmed: true }] as any;
      expect(getRecoveryStatus(config, guardians)).toBe("Incomplete");
    });

    it("should return Active when threshold met", () => {
      const config = { enabled: true, threshold: 2, totalGuardians: 3, lastUpdated: 0 };
      const guardians = [
        { id: "g1", confirmed: true },
        { id: "g2", confirmed: true },
      ] as any;
      expect(getRecoveryStatus(config, guardians)).toBe("Active");
    });
  });

  describe("formatThreshold", () => {
    it("should format threshold", () => {
      expect(formatThreshold(2, 5)).toBe("2 of 5");
    });
  });
});
