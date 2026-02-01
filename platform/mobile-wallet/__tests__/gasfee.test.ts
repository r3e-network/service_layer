/**
 * Gas Fee Tests
 * Tests for src/lib/gasfee.ts
 */

import * as SecureStore from "expo-secure-store";
import {
  estimateFee,
  getAllTierEstimates,
  getNetworkStatus,
  loadFeeHistory,
  saveFeeRecord,
  generateFeeRecordId,
  formatFee,
  getAverageFee,
  getTxTypeLabel,
  FeeRecord,
} from "../src/lib/gasfee";

jest.mock("expo-secure-store");

const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

const mockRecord: FeeRecord = {
  id: "fee_123_abc",
  txHash: "0xabc123",
  txType: "transfer",
  fee: 0.0015,
  timestamp: 1704067200000,
};

describe("gasfee", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("estimateFee", () => {
    it("should estimate transfer fee for standard tier", () => {
      const est = estimateFee("transfer", "standard");
      expect(est.tier).toBe("standard");
      expect(est.networkFee).toBe(0.001);
      expect(est.systemFee).toBe(0.0005);
      expect(est.total).toBe(0.0015);
    });

    it("should estimate higher fee for fast tier", () => {
      const est = estimateFee("transfer", "fast");
      expect(est.networkFee).toBe(0.0015);
      expect(est.total).toBeGreaterThan(0.0015);
    });

    it("should estimate lower fee for economy tier", () => {
      const est = estimateFee("transfer", "economy");
      expect(est.networkFee).toBe(0.0007);
      expect(est.total).toBeLessThan(0.0015);
    });

    it("should estimate nep17 token transfer fee", () => {
      const est = estimateFee("nep17", "standard");
      expect(est.networkFee).toBe(0.002);
    });

    it("should estimate nep11 NFT transfer fee", () => {
      const est = estimateFee("nep11", "standard");
      expect(est.networkFee).toBe(0.005);
    });

    it("should estimate contract call fee", () => {
      const est = estimateFee("contract", "standard");
      expect(est.networkFee).toBe(0.01);
    });

    it("should include confirm time", () => {
      expect(estimateFee("transfer", "fast").confirmTime).toBe("~15s");
      expect(estimateFee("transfer", "standard").confirmTime).toBe("~30s");
      expect(estimateFee("transfer", "economy").confirmTime).toBe("~60s");
    });
  });

  describe("getAllTierEstimates", () => {
    it("should return estimates for all tiers", () => {
      const estimates = getAllTierEstimates("transfer");
      expect(estimates).toHaveLength(3);
      expect(estimates.map((e) => e.tier)).toEqual(["fast", "standard", "economy"]);
    });

    it("should order by fee descending", () => {
      const estimates = getAllTierEstimates("transfer");
      expect(estimates[0].total).toBeGreaterThan(estimates[1].total);
      expect(estimates[1].total).toBeGreaterThan(estimates[2].total);
    });
  });

  describe("getNetworkStatus", () => {
    it("should return low congestion for few pending tx", () => {
      const status = getNetworkStatus(10);
      expect(status.congestion).toBe("low");
    });

    it("should return medium congestion for moderate pending tx", () => {
      const status = getNetworkStatus(75);
      expect(status.congestion).toBe("medium");
    });

    it("should return high congestion for many pending tx", () => {
      const status = getNetworkStatus(150);
      expect(status.congestion).toBe("high");
    });

    it("should include avg block time", () => {
      const status = getNetworkStatus(10);
      expect(status.avgBlockTime).toBe(15);
    });

    it("should include pending tx count", () => {
      const status = getNetworkStatus(42);
      expect(status.pendingTx).toBe(42);
    });
  });

  describe("loadFeeHistory", () => {
    it("should return empty array when no history", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);
      const history = await loadFeeHistory();
      expect(history).toEqual([]);
    });

    it("should return stored history", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(JSON.stringify([mockRecord]));
      const history = await loadFeeHistory();
      expect(history).toHaveLength(1);
      expect(history[0].id).toBe("fee_123_abc");
    });
  });

  describe("saveFeeRecord", () => {
    it("should save record to empty history", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);
      await saveFeeRecord(mockRecord);
      expect(mockSecureStore.setItemAsync).toHaveBeenCalled();
    });

    it("should prepend record to existing history", async () => {
      const existing = [{ ...mockRecord, id: "old_record" }];
      mockSecureStore.getItemAsync.mockResolvedValue(JSON.stringify(existing));
      await saveFeeRecord({ ...mockRecord, id: "new_record" });
      const savedData = mockSecureStore.setItemAsync.mock.calls[0][1];
      const parsed = JSON.parse(savedData);
      expect(parsed[0].id).toBe("new_record");
    });
  });

  describe("generateFeeRecordId", () => {
    it("should generate unique IDs", () => {
      const id1 = generateFeeRecordId();
      const id2 = generateFeeRecordId();
      expect(id1).not.toBe(id2);
    });

    it("should start with fee_ prefix", () => {
      const id = generateFeeRecordId();
      expect(id.startsWith("fee_")).toBe(true);
    });
  });

  describe("formatFee", () => {
    it("should format to 8 decimal places", () => {
      expect(formatFee(0.00123456)).toBe("0.00123456");
    });

    it("should pad with zeros", () => {
      expect(formatFee(1)).toBe("1.00000000");
    });
  });

  describe("getAverageFee", () => {
    it("should return 0 for empty history", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);
      const avg = await getAverageFee();
      expect(avg).toBe(0);
    });

    it("should calculate average", async () => {
      const records = [
        { ...mockRecord, fee: 0.001 },
        { ...mockRecord, fee: 0.002 },
      ];
      mockSecureStore.getItemAsync.mockResolvedValue(JSON.stringify(records));
      const avg = await getAverageFee();
      expect(avg).toBe(0.0015);
    });
  });

  describe("getTxTypeLabel", () => {
    it("should return correct labels", () => {
      expect(getTxTypeLabel("transfer")).toBe("Transfer");
      expect(getTxTypeLabel("nep17")).toBe("Token Transfer");
      expect(getTxTypeLabel("nep11")).toBe("NFT Transfer");
      expect(getTxTypeLabel("contract")).toBe("Contract Call");
      expect(getTxTypeLabel("vote")).toBe("Vote");
    });
  });
});
