/**
 * Export Tests
 * Tests for src/lib/export.ts
 */

import * as SecureStore from "expo-secure-store";
import {
  generateCSV,
  loadExportHistory,
  saveExportRecord,
  generateExportId,
  formatExportDate,
  getFormatLabel,
} from "../src/lib/export";

jest.mock("expo-secure-store");

const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

describe("export", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("generateCSV", () => {
    it("should generate CSV with headers", () => {
      const data = [
        { hash: "0x1", date: "2024-01-01", type: "send", amount: "10", asset: "NEO", fee: "0.001", status: "ok" },
      ];
      const csv = generateCSV(data);
      expect(csv).toContain("Hash,Date,Type");
      expect(csv).toContain("0x1");
    });
  });

  describe("loadExportHistory", () => {
    it("should return empty array when no history", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);
      const history = await loadExportHistory();
      expect(history).toEqual([]);
    });
  });

  describe("saveExportRecord", () => {
    it("should save record", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);
      await saveExportRecord({ id: "e1", format: "csv", dateRange: { start: 0, end: 1 }, txCount: 1, timestamp: 123 });
      expect(mockSecureStore.setItemAsync).toHaveBeenCalled();
    });
  });

  describe("generateExportId", () => {
    it("should generate unique IDs", () => {
      expect(generateExportId()).not.toBe(generateExportId());
    });
  });

  describe("formatExportDate", () => {
    it("should format date", () => {
      const result = formatExportDate(1704067200000);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe("getFormatLabel", () => {
    it("should return uppercase", () => {
      expect(getFormatLabel("csv")).toBe("CSV");
      expect(getFormatLabel("pdf")).toBe("PDF");
    });
  });
});
