/**
 * Prices Tests
 * Tests for src/lib/prices.ts
 */

import * as SecureStore from "expo-secure-store";
import {
  getPrice,
  getAllPrices,
  getChartData,
  loadPriceAlerts,
  savePriceAlert,
  generateAlertId,
  formatPrice,
  formatChange,
  formatVolume,
} from "../src/lib/prices";

jest.mock("expo-secure-store");

const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

describe("prices", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getPrice", () => {
    it("should return NEO price", async () => {
      const price = await getPrice("NEO");
      expect(price.asset).toBe("NEO");
      expect(price.price).toBeGreaterThan(0);
    });

    it("should return GAS price", async () => {
      const price = await getPrice("GAS");
      expect(price.asset).toBe("GAS");
    });
  });

  describe("getAllPrices", () => {
    it("should return all prices", async () => {
      const prices = await getAllPrices();
      expect(prices).toHaveLength(2);
    });
  });

  describe("getChartData", () => {
    it("should return chart points", async () => {
      const data = await getChartData("NEO", "1D");
      expect(data.length).toBeGreaterThan(0);
      expect(data[0]).toHaveProperty("timestamp");
      expect(data[0]).toHaveProperty("price");
    });
  });

  describe("loadPriceAlerts", () => {
    it("should return empty array when no alerts", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);
      const alerts = await loadPriceAlerts();
      expect(alerts).toEqual([]);
    });
  });

  describe("savePriceAlert", () => {
    it("should save alert", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);
      const alert = {
        id: "a1",
        asset: "NEO" as const,
        targetPrice: 15,
        condition: "above" as const,
        enabled: true,
        createdAt: Date.now(),
      };
      await savePriceAlert(alert);
      expect(mockSecureStore.setItemAsync).toHaveBeenCalled();
    });
  });

  describe("generateAlertId", () => {
    it("should generate unique IDs", () => {
      const id1 = generateAlertId();
      const id2 = generateAlertId();
      expect(id1).not.toBe(id2);
    });
  });

  describe("formatPrice", () => {
    it("should format to 2 decimals", () => {
      expect(formatPrice(12.456)).toBe("12.46");
    });
  });

  describe("formatChange", () => {
    it("should format positive change", () => {
      expect(formatChange(2.5)).toBe("+2.50%");
    });

    it("should format negative change", () => {
      expect(formatChange(-1.5)).toBe("-1.50%");
    });
  });

  describe("formatVolume", () => {
    it("should format billions", () => {
      expect(formatVolume(1500000000)).toBe("$1.50B");
    });

    it("should format millions", () => {
      expect(formatVolume(45000000)).toBe("$45.00M");
    });
  });
});
