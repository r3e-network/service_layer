/**
 * DeFi Tests
 * Tests for src/lib/defi.ts
 */

import * as SecureStore from "expo-secure-store";
import { loadPositions, savePosition, calcTotalDeFiValue, getProtocolIcon, DeFiPosition } from "../src/lib/defi";

jest.mock("expo-secure-store");

const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

describe("defi", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("loadPositions", () => {
    it("should return empty array when no positions", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);
      const positions = await loadPositions();
      expect(positions).toEqual([]);
    });
  });

  describe("savePosition", () => {
    it("should save position", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);
      await savePosition({
        id: "p1",
        protocol: "Flamingo",
        type: "dex",
        asset: "NEO",
        amount: "10",
        value: 100,
        apy: 5,
      });
      expect(mockSecureStore.setItemAsync).toHaveBeenCalled();
    });
  });

  describe("calcTotalDeFiValue", () => {
    it("should sum values", () => {
      const positions = [{ value: 100 }, { value: 200 }] as unknown as DeFiPosition[];
      expect(calcTotalDeFiValue(positions)).toBe(300);
    });
  });

  describe("getProtocolIcon", () => {
    it("should return correct icons", () => {
      expect(getProtocolIcon("lending")).toBe("cash");
      expect(getProtocolIcon("dex")).toBe("swap-horizontal");
    });
  });
});
