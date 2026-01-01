/**
 * Portfolio Tests
 * Tests for src/lib/portfolio.ts
 */

import * as SecureStore from "expo-secure-store";
import {
  loadPortfolioData,
  saveSnapshot,
  calcTotalValue,
  calc24hChange,
  formatCurrency,
  formatPercent,
} from "../src/lib/portfolio";

jest.mock("expo-secure-store");

const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

describe("portfolio", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("loadPortfolioData", () => {
    it("should return empty data when no saved", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);
      const data = await loadPortfolioData();
      expect(data.snapshots).toEqual([]);
    });
  });

  describe("saveSnapshot", () => {
    it("should save snapshot", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);
      await saveSnapshot({ timestamp: 123, totalValue: 100, assets: [] });
      expect(mockSecureStore.setItemAsync).toHaveBeenCalled();
    });
  });

  describe("calcTotalValue", () => {
    it("should sum asset values", () => {
      const assets = [{ value: 100 }, { value: 200 }] as any;
      expect(calcTotalValue(assets)).toBe(300);
    });
  });

  describe("calc24hChange", () => {
    it("should calculate weighted change", () => {
      const assets = [
        { value: 100, change24h: 10 },
        { value: 100, change24h: -10 },
      ] as any;
      expect(calc24hChange(assets)).toBe(0);
    });

    it("should return 0 for empty", () => {
      expect(calc24hChange([])).toBe(0);
    });
  });

  describe("formatCurrency", () => {
    it("should format currency", () => {
      expect(formatCurrency(1234.56)).toBe("$1,234.56");
    });
  });

  describe("formatPercent", () => {
    it("should format positive", () => {
      expect(formatPercent(5.5)).toBe("+5.50%");
    });

    it("should format negative", () => {
      expect(formatPercent(-3.2)).toBe("-3.20%");
    });
  });
});
