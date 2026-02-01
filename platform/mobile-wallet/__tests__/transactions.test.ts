/**
 * Transaction API Tests
 * Tests for src/lib/api/transactions.ts
 */

import { fetchTransactions } from "../src/lib/api/transactions";

global.fetch = jest.fn();

describe("Transaction API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("fetchTransactions", () => {
    it("should fetch and map transactions", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            items: [
              { txid: "0xabc", time: 1700000000, block: 100, from: "NFrom", to: "NTo", amount: "10", symbol: "NEO" },
            ],
            total: 1,
          }),
      });

      const result = await fetchTransactions("NTo", 1);
      expect(result.transactions).toHaveLength(1);
      expect(result.transactions[0].hash).toBe("0xabc");
      expect(result.transactions[0].type).toBe("receive");
    });

    it("should handle send transactions", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            items: [
              { txid: "0xdef", time: 1700000000, block: 100, from: "NUser", to: "NOther", amount: "5", symbol: "NEO" },
            ],
            total: 1,
          }),
      });

      const result = await fetchTransactions("NUser", 1);
      expect(result.transactions[0].type).toBe("send");
    });

    it("should format GAS amounts", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            items: [
              { txid: "0x123", time: 1700000000, block: 100, from: "NA", to: "NB", amount: "100000000", symbol: "GAS" },
            ],
            total: 1,
          }),
      });

      const result = await fetchTransactions("NB", 1);
      expect(result.transactions[0].amount).toBe("1.0000");
      expect(result.transactions[0].asset).toBe("GAS");
    });

    it("should handle fetch error", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({ ok: false });
      const result = await fetchTransactions("NAddr", 1);
      expect(result.transactions).toEqual([]);
    });

    it("should handle network error", async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));
      const result = await fetchTransactions("NAddr", 1);
      expect(result.transactions).toEqual([]);
      expect(result.total).toBe(0);
    });

    it("should handle empty items", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ items: null, total: 0 }),
      });
      const result = await fetchTransactions("NAddr", 1);
      expect(result.transactions).toEqual([]);
    });
  });
});
