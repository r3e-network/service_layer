/**
 * Fiat On-Ramp Tests
 * Tests for src/lib/fiat.ts
 */

import * as SecureStore from "expo-secure-store";
import {
  loadFiatConfig,
  saveFiatConfig,
  loadFiatHistory,
  saveFiatOrder,
  getCurrencySymbol,
  getPaymentIcon,
} from "../src/lib/fiat";

jest.mock("expo-secure-store");

const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

describe("fiat", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("loadFiatConfig", () => {
    it("should return defaults when no config", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);
      const config = await loadFiatConfig();
      expect(config.defaultCurrency).toBe("USD");
    });
  });

  describe("saveFiatConfig", () => {
    it("should save config", async () => {
      await saveFiatConfig({ defaultCurrency: "EUR", defaultPayment: "bank" });
      expect(mockSecureStore.setItemAsync).toHaveBeenCalled();
    });
  });

  describe("loadFiatHistory", () => {
    it("should return empty array when no history", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);
      const history = await loadFiatHistory();
      expect(history).toEqual([]);
    });
  });

  describe("saveFiatOrder", () => {
    it("should save order", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);
      await saveFiatOrder({
        id: "o1",
        fiatAmount: "100",
        fiatCurrency: "USD",
        cryptoAmount: "10",
        cryptoAsset: "NEO",
        status: "completed",
        timestamp: 123,
      });
      expect(mockSecureStore.setItemAsync).toHaveBeenCalled();
    });
  });

  describe("getCurrencySymbol", () => {
    it("should return correct symbols", () => {
      expect(getCurrencySymbol("USD")).toBe("$");
      expect(getCurrencySymbol("EUR")).toBe("€");
    });
  });

  describe("getPaymentIcon", () => {
    it("should return correct icons", () => {
      expect(getPaymentIcon("card")).toBe("card");
      expect(getPaymentIcon("bank")).toBe("business");
    });
  });
});
