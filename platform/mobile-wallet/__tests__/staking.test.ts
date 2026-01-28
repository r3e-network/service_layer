/**
 * Staking Tests
 * Tests for src/lib/staking.ts
 */

import * as SecureStore from "expo-secure-store";
import {
  calculateRewards,
  getDailyRate,
  loadRewardHistory,
  saveRewardRecord,
  generateRecordId,
  formatGasAmount,
  getUnclaimedGas,
  claimGas,
  RewardRecord,
} from "../src/lib/staking";

jest.mock("expo-secure-store");

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

const mockRecord: RewardRecord = {
  id: "reward_123_abc",
  amount: "0.12345678",
  timestamp: 1704067200000,
  txHash: "0xabc123",
};

describe("staking", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("calculateRewards", () => {
    it("should calculate rewards for valid inputs", () => {
      // 100 NEO for 365 days = 140 GAS (1.4 GAS/NEO/year)
      const rewards = calculateRewards(100, 365);
      expect(rewards).toBeCloseTo(140, 2);
    });

    it("should calculate rewards for 30 days", () => {
      // 100 NEO for 30 days
      const rewards = calculateRewards(100, 30);
      const expected = 100 * 1.4 * (30 / 365);
      expect(rewards).toBeCloseTo(expected, 6);
    });

    it("should return 0 for zero NEO", () => {
      expect(calculateRewards(0, 30)).toBe(0);
    });

    it("should return 0 for negative NEO", () => {
      expect(calculateRewards(-10, 30)).toBe(0);
    });

    it("should return 0 for zero days", () => {
      expect(calculateRewards(100, 0)).toBe(0);
    });

    it("should return 0 for negative days", () => {
      expect(calculateRewards(100, -5)).toBe(0);
    });

    it("should handle fractional NEO amounts", () => {
      const rewards = calculateRewards(50.5, 365);
      expect(rewards).toBeCloseTo(70.7, 2);
    });
  });

  describe("getDailyRate", () => {
    it("should calculate daily rate correctly", () => {
      // 100 NEO daily rate = 100 * 1.4 / 365
      const rate = getDailyRate(100);
      const expected = (100 * 1.4) / 365;
      expect(rate).toBeCloseTo(expected, 6);
    });

    it("should return 0 for zero NEO", () => {
      expect(getDailyRate(0)).toBe(0);
    });

    it("should return 0 for negative NEO", () => {
      expect(getDailyRate(-50)).toBe(0);
    });

    it("should handle small amounts", () => {
      const rate = getDailyRate(1);
      expect(rate).toBeGreaterThan(0);
      expect(rate).toBeLessThan(0.01);
    });
  });

  describe("loadRewardHistory", () => {
    it("should return empty array when no history", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);
      const history = await loadRewardHistory();
      expect(history).toEqual([]);
    });

    it("should return stored history", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(JSON.stringify([mockRecord]));
      const history = await loadRewardHistory();
      expect(history).toHaveLength(1);
      expect(history[0].id).toBe("reward_123_abc");
    });

    it("should parse multiple records", async () => {
      const records = [mockRecord, { ...mockRecord, id: "reward_456_def" }];
      mockSecureStore.getItemAsync.mockResolvedValue(JSON.stringify(records));
      const history = await loadRewardHistory();
      expect(history).toHaveLength(2);
    });
  });

  describe("saveRewardRecord", () => {
    it("should save record to empty history", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);
      await saveRewardRecord(mockRecord);
      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
        "staking_history",
        expect.stringContaining(mockRecord.id),
      );
    });

    it("should prepend record to existing history", async () => {
      const existing = [{ ...mockRecord, id: "old_record" }];
      mockSecureStore.getItemAsync.mockResolvedValue(JSON.stringify(existing));

      const newRecord = { ...mockRecord, id: "new_record" };
      await saveRewardRecord(newRecord);

      const savedData = mockSecureStore.setItemAsync.mock.calls[0][1];
      const parsed = JSON.parse(savedData);
      expect(parsed[0].id).toBe("new_record");
      expect(parsed[1].id).toBe("old_record");
    });
  });

  describe("generateRecordId", () => {
    it("should generate unique IDs", () => {
      const id1 = generateRecordId();
      const id2 = generateRecordId();
      expect(id1).not.toBe(id2);
    });

    it("should start with reward_ prefix", () => {
      const id = generateRecordId();
      expect(id.startsWith("reward_")).toBe(true);
    });

    it("should contain timestamp", () => {
      const before = Date.now();
      const id = generateRecordId();
      const after = Date.now();

      const parts = id.split("_");
      const timestamp = parseInt(parts[1]);
      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe("formatGasAmount", () => {
    it("should format to 8 decimal places", () => {
      expect(formatGasAmount(1.23456789)).toBe("1.23456789");
    });

    it("should pad with zeros", () => {
      expect(formatGasAmount(1)).toBe("1.00000000");
    });

    it("should handle zero", () => {
      expect(formatGasAmount(0)).toBe("0.00000000");
    });

    it("should handle small amounts", () => {
      expect(formatGasAmount(0.00000001)).toBe("0.00000001");
    });

    it("should truncate extra decimals", () => {
      expect(formatGasAmount(1.123456789)).toBe("1.12345679");
    });
  });

  describe("getUnclaimedGas", () => {
    beforeEach(() => {
      mockFetch.mockClear();
    });

    it("should return unclaimed GAS amount", async () => {
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({
          result: { unclaimed: "500000000" } // 5 GAS in satoshis
        }),
      });

      const gas = await getUnclaimedGas("NXV7ZhHiyM1aHXwpVsRZC6BEaDQhNn2sfF");
      expect(gas).toBe(5);
    });

    it("should return 0 when no unclaimed GAS", async () => {
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({ result: {} }),
      });

      const gas = await getUnclaimedGas("NXV7ZhHiyM1aHXwpVsRZC6BEaDQhNn2sfF");
      expect(gas).toBe(0);
    });

    it("should return 0 on fetch error", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      const gas = await getUnclaimedGas("NXV7ZhHiyM1aHXwpVsRZC6BEaDQhNn2sfF");
      expect(gas).toBe(0);
    });
  });

  describe("claimGas", () => {
    beforeEach(() => {
      mockFetch.mockClear();
    });

    it("should throw error when no private key", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);
      await expect(claimGas("NXV7ZhHiyM1aHXwpVsRZC6BEaDQhNn2sfF"))
        .rejects.toThrow("No private key found");
    });

    it("should claim GAS successfully", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue("a".repeat(64));
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({ result: { hash: "0xclaimhash" } }),
      });

      const hash = await claimGas("NXV7ZhHiyM1aHXwpVsRZC6BEaDQhNn2sfF");
      expect(hash).toBe("0xclaimhash");
    });

    it("should throw error on RPC failure", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue("b".repeat(64));
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({ error: { message: "Claim failed" } }),
      });

      await expect(claimGas("NXV7ZhHiyM1aHXwpVsRZC6BEaDQhNn2sfF"))
        .rejects.toThrow("Claim failed");
    });

    it("should return generated hash when no hash in response", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue("c".repeat(64));
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({ result: {} }),
      });

      const hash = await claimGas("NXV7ZhHiyM1aHXwpVsRZC6BEaDQhNn2sfF");
      expect(hash.startsWith("claim_")).toBe(true);
    });
  });
});
