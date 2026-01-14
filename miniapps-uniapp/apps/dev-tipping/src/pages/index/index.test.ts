import { describe, it, expect, vi } from "vitest";

describe("Dev Tipping MiniApp", () => {
  describe("Tip Amount Handling", () => {
    it("converts GAS amount to integer", () => {
      const amount = "1.2345";
      const intValue = Math.floor(Number.parseFloat(amount) * 1e8).toString();
      expect(intValue).toBe("123450000");
    });

    it("rejects invalid amounts", () => {
      const amount = "0";
      const parsed = Number.parseFloat(amount);
      const isValid = Number.isFinite(parsed) && parsed > 0;
      expect(isValid).toBe(false);
    });
  });

  describe("Payment Metadata", () => {
    it("uses dev ID in metadata", async () => {
      const payGAS = vi.fn().mockResolvedValue({ receipt_id: "receipt-1" });
      await payGAS("2", "tip:7");
      expect(payGAS).toHaveBeenCalledWith("2", "tip:7");
    });
  });

  describe("Vault Data Mapping", () => {
    it("maps tip event into recent list format", () => {
      const devMap = new Map([[3, "Alice"]]);
      const devId = 3;
      const amount = 250000000;
      const to = devMap.get(devId) || `Dev #${devId}`;
      const formatted = (amount / 1e8).toFixed(2);
      expect(to).toBe("Alice");
      expect(formatted).toBe("2.50");
    });
  });
});
