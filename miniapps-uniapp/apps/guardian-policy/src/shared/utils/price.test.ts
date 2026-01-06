import { describe, it, expect, vi, beforeEach } from "vitest";
import { formatPrice, formatPriceChange, calculateUsdValue } from "./price";

describe("price utils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("formatPrice", () => {
    it("should format price with $ symbol", () => {
      expect(formatPrice(15.5)).toBe("$15.50");
      expect(formatPrice(0)).toBe("$0.00");
      expect(formatPrice(100.999)).toBe("$101.00");
    });
  });

  describe("formatPriceChange", () => {
    it("should format positive change with + prefix", () => {
      expect(formatPriceChange(2.5)).toBe("+2.50%");
      expect(formatPriceChange(0)).toBe("+0.00%");
    });

    it("should format negative change without + prefix", () => {
      expect(formatPriceChange(-1.5)).toBe("-1.50%");
    });
  });

  describe("calculateUsdValue", () => {
    it("should calculate USD value from NEO and GAS", () => {
      const prices = {
        neo: { usd: 15, usd_24h_change: 0 },
        gas: { usd: 4, usd_24h_change: 0 },
        timestamp: Date.now(),
      };

      expect(calculateUsdValue(10, 5, prices)).toBe(170); // 10*15 + 5*4
      expect(calculateUsdValue(0, 0, prices)).toBe(0);
      expect(calculateUsdValue(100, 0, prices)).toBe(1500);
    });
  });
});
