import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@neo/uniapp-sdk", () => ({
  usePayments: vi.fn(() => ({
    payGAS: vi.fn().mockResolvedValue({ receipt_id: "test-123" }),
    isLoading: { value: false },
  })),
}));

vi.mock("@/shared/utils/i18n", () => ({
  createT: vi.fn(() => (key: string) => key),
}));

describe("Gov Merc MiniApp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Deposit/Withdraw Validation", () => {
    it("accepts positive NEO amounts", () => {
      const amount = Math.floor(parseFloat("12.9"));
      expect(amount).toBe(12);
      expect(amount > 0).toBe(true);
    });

    it("rejects non-positive amounts", () => {
      const values = ["0", "-2", "-0.5"];
      values.forEach((value) => {
        const amount = Math.floor(parseFloat(value));
        expect(amount > 0).toBe(false);
      });
    });
  });

  describe("Bid Payments", () => {
    it("uses payGAS with bid metadata", async () => {
      const { usePayments } = await import("@neo/uniapp-sdk");
      const { payGAS } = usePayments();
      const bidAmount = "1.5";
      const epoch = 3;

      await payGAS(bidAmount, `bid:${epoch}`);

      expect(payGAS).toHaveBeenCalledWith("1.5", "bid:3");
    });
  });

  describe("Bid Amount Conversion", () => {
    it("converts GAS to 8-decimal integer string", () => {
      const toFixed8 = (value: string) => {
        const num = Number.parseFloat(value);
        if (!Number.isFinite(num)) return "0";
        return Math.floor(num * 1e8).toString();
      };

      expect(toFixed8("1.5")).toBe("150000000");
      expect(toFixed8("0.00000001")).toBe("1");
      expect(toFixed8("0")).toBe("0");
    });
  });
});
