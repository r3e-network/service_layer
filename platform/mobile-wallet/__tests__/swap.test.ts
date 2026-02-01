/**
 * Swap Tests
 * Tests for src/lib/swap.ts
 */

import * as SecureStore from "expo-secure-store";
import {
  loadSwapHistory,
  saveSwapRecord,
  loadSwapSettings,
  saveSwapSettings,
  generateSwapId,
  formatSlippage,
  calcMinReceived,
} from "../src/lib/swap";

jest.mock("expo-secure-store");

const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

describe("swap", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("loadSwapHistory", () => {
    it("should return empty array when no history", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);
      const history = await loadSwapHistory();
      expect(history).toEqual([]);
    });
  });

  describe("saveSwapRecord", () => {
    it("should save record", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);
      const record = {
        id: "s1",
        from: "NEO",
        to: "GAS",
        fromAmount: "10",
        toAmount: "1",
        txHash: "0x1",
        timestamp: 123,
        status: "completed" as const,
      };
      await saveSwapRecord(record);
      expect(mockSecureStore.setItemAsync).toHaveBeenCalled();
    });
  });

  describe("loadSwapSettings", () => {
    it("should return defaults when no settings", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);
      const settings = await loadSwapSettings();
      expect(settings.slippage).toBe(0.5);
      expect(settings.deadline).toBe(20);
    });
  });

  describe("saveSwapSettings", () => {
    it("should save settings", async () => {
      await saveSwapSettings({ slippage: 1, deadline: 30, autoApprove: true });
      expect(mockSecureStore.setItemAsync).toHaveBeenCalled();
    });
  });

  describe("generateSwapId", () => {
    it("should generate unique IDs", () => {
      const id1 = generateSwapId();
      const id2 = generateSwapId();
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^swap_/);
    });
  });

  describe("formatSlippage", () => {
    it("should format slippage", () => {
      expect(formatSlippage(0.5)).toBe("0.5%");
      expect(formatSlippage(1)).toBe("1%");
    });
  });

  describe("calcMinReceived", () => {
    it("should calculate minimum received", () => {
      const min = calcMinReceived("100", 0.5);
      expect(parseFloat(min)).toBeCloseTo(99.5, 2);
    });
  });
});
