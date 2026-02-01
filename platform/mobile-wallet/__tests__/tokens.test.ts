/**
 * Token Management Tests
 * Tests for src/lib/tokens.ts
 */

import * as SecureStore from "expo-secure-store";
import { loadTokens, saveToken, removeToken, Token } from "../src/lib/tokens";

jest.mock("expo-secure-store");

const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

describe("Token Storage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("loadTokens", () => {
    it("should return empty array when no tokens stored", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);
      const tokens = await loadTokens();
      expect(tokens).toEqual([]);
    });

    it("should return parsed tokens from storage", async () => {
      const storedTokens: Token[] = [{ contractAddress: "0x123", symbol: "FLM", name: "Flamingo", decimals: 8 }];
      mockSecureStore.getItemAsync.mockResolvedValue(JSON.stringify(storedTokens));
      const tokens = await loadTokens();
      expect(tokens).toEqual(storedTokens);
    });

    it("should handle multiple tokens", async () => {
      const storedTokens: Token[] = [
        { contractAddress: "0x123", symbol: "FLM", name: "Flamingo", decimals: 8 },
        { contractAddress: "0x456", symbol: "SWTH", name: "Switcheo", decimals: 8 },
      ];
      mockSecureStore.getItemAsync.mockResolvedValue(JSON.stringify(storedTokens));
      const tokens = await loadTokens();
      expect(tokens).toHaveLength(2);
    });
  });

  describe("saveToken", () => {
    it("should save new token to empty storage", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);
      const newToken: Token = { contractAddress: "0x123", symbol: "FLM", name: "Flamingo", decimals: 8 };
      await saveToken(newToken);
      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith("custom_tokens", JSON.stringify([newToken]));
    });

    it("should append token to existing list", async () => {
      const existing: Token[] = [{ contractAddress: "0x111", symbol: "OLD", name: "Old", decimals: 8 }];
      mockSecureStore.getItemAsync.mockResolvedValue(JSON.stringify(existing));
      const newToken: Token = { contractAddress: "0x222", symbol: "NEW", name: "New", decimals: 8 };
      await saveToken(newToken);
      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
        "custom_tokens",
        JSON.stringify([...existing, newToken]),
      );
    });

    it("should not duplicate existing token", async () => {
      const existing: Token[] = [{ contractAddress: "0x123", symbol: "FLM", name: "Flamingo", decimals: 8 }];
      mockSecureStore.getItemAsync.mockResolvedValue(JSON.stringify(existing));
      const duplicate: Token = { contractAddress: "0x123", symbol: "FLM", name: "Flamingo", decimals: 8 };
      await saveToken(duplicate);
      expect(mockSecureStore.setItemAsync).not.toHaveBeenCalled();
    });
  });

  describe("removeToken", () => {
    it("should remove token by contract address", async () => {
      const existing: Token[] = [
        { contractAddress: "0x123", symbol: "FLM", name: "Flamingo", decimals: 8 },
        { contractAddress: "0x456", symbol: "SWTH", name: "Switcheo", decimals: 8 },
      ];
      mockSecureStore.getItemAsync.mockResolvedValue(JSON.stringify(existing));
      await removeToken("0x123");
      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith("custom_tokens", JSON.stringify([existing[1]]));
    });

    it("should handle removing non-existent token", async () => {
      const existing: Token[] = [{ contractAddress: "0x123", symbol: "FLM", name: "Flamingo", decimals: 8 }];
      mockSecureStore.getItemAsync.mockResolvedValue(JSON.stringify(existing));
      await removeToken("0x999");
      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith("custom_tokens", JSON.stringify(existing));
    });

    it("should handle empty storage", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);
      await removeToken("0x123");
      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith("custom_tokens", "[]");
    });
  });
});
