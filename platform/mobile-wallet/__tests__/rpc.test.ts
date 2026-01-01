/**
 * RPC Client Tests
 * Tests for src/lib/neo/rpc.ts
 */

import {
  getTokenBalance,
  setNetwork,
  getNetwork,
  getNeoBalance,
  getGasBalance,
  getBalances,
  sendRawTransaction,
  getTransaction,
} from "../src/lib/neo/rpc";

// Mock fetch
global.fetch = jest.fn();

describe("RPC Client", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setNetwork("mainnet");
  });

  describe("setNetwork / getNetwork", () => {
    it("should default to mainnet", () => {
      expect(getNetwork()).toBe("mainnet");
    });

    it("should switch to testnet", () => {
      setNetwork("testnet");
      expect(getNetwork()).toBe("testnet");
    });

    it("should switch back to mainnet", () => {
      setNetwork("testnet");
      setNetwork("mainnet");
      expect(getNetwork()).toBe("mainnet");
    });
  });

  describe("getTokenBalance", () => {
    it("should return balance for token", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        json: () =>
          Promise.resolve({
            jsonrpc: "2.0",
            id: 1,
            result: { stack: [{ value: "100000000" }] },
          }),
      });

      const balance = await getTokenBalance("NAddr123", "0xcontract", 8);
      expect(balance.amount).toBe("1.00000000");
      expect(balance.decimals).toBe(8);
    });

    it("should handle zero balance", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        json: () =>
          Promise.resolve({
            jsonrpc: "2.0",
            id: 1,
            result: { stack: [{ value: "0" }] },
          }),
      });

      const balance = await getTokenBalance("NAddr123", "0xcontract", 8);
      expect(balance.amount).toBe("0.00000000");
    });

    it("should handle missing stack", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        json: () =>
          Promise.resolve({
            jsonrpc: "2.0",
            id: 1,
            result: { stack: [] },
          }),
      });

      const balance = await getTokenBalance("NAddr123", "0xcontract", 8);
      expect(balance.amount).toBe("0.00000000");
    });

    it("should handle zero decimals", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        json: () =>
          Promise.resolve({
            jsonrpc: "2.0",
            id: 1,
            result: { stack: [{ value: "100" }] },
          }),
      });

      const balance = await getTokenBalance("NAddr123", "0xcontract", 0);
      expect(balance.amount).toBe("100");
    });
  });

  describe("getNeoBalance", () => {
    it("should return NEO balance", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        json: () =>
          Promise.resolve({
            jsonrpc: "2.0",
            id: 1,
            result: { balance: "100" },
          }),
      });
      const balance = await getNeoBalance("NAddr123");
      expect(balance.symbol).toBe("NEO");
      expect(balance.amount).toBe("100");
      expect(balance.decimals).toBe(0);
    });

    it("should handle missing balance", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        json: () =>
          Promise.resolve({
            jsonrpc: "2.0",
            id: 1,
            result: {},
          }),
      });
      const balance = await getNeoBalance("NAddr123");
      expect(balance.amount).toBe("0");
    });
  });

  describe("getGasBalance", () => {
    it("should return GAS balance with decimals", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        json: () =>
          Promise.resolve({
            jsonrpc: "2.0",
            id: 1,
            result: { balance: "100000000" },
          }),
      });
      const balance = await getGasBalance("NAddr123");
      expect(balance.symbol).toBe("GAS");
      expect(balance.amount).toBe("1.00000000");
      expect(balance.decimals).toBe(8);
    });
  });

  describe("getBalances", () => {
    it("should return both NEO and GAS balances", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: () => Promise.resolve({ jsonrpc: "2.0", id: 1, result: { balance: "10" } }),
        })
        .mockResolvedValueOnce({
          json: () => Promise.resolve({ jsonrpc: "2.0", id: 1, result: { balance: "500000000" } }),
        });
      const balances = await getBalances("NAddr123");
      expect(balances).toHaveLength(2);
      expect(balances[0].symbol).toBe("NEO");
      expect(balances[1].symbol).toBe("GAS");
    });
  });

  describe("sendRawTransaction", () => {
    it("should send transaction and return hash", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        json: () =>
          Promise.resolve({
            jsonrpc: "2.0",
            id: 1,
            result: { hash: "0xabc123" },
          }),
      });
      const result = await sendRawTransaction("signedTxHex");
      expect(result.hash).toBe("0xabc123");
    });
  });

  describe("getTransaction", () => {
    it("should return transaction details", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        json: () =>
          Promise.resolve({
            jsonrpc: "2.0",
            id: 1,
            result: { txid: "0xabc", confirmations: 10 },
          }),
      });
      const tx = await getTransaction("0xabc");
      expect(tx).toEqual({ txid: "0xabc", confirmations: 10 });
    });
  });
});
