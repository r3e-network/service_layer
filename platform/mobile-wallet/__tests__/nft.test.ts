/**
 * NFT Tests
 * Tests for src/lib/nft.ts
 */

import * as SecureStore from "expo-secure-store";
import {
  loadCachedNFTs,
  cacheNFTs,
  getNFTById,
  filterByCollection,
  parseMetadata,
  isValidTokenId,
  transferNFT,
  NFT,
} from "../src/lib/nft";

jest.mock("expo-secure-store");
jest.mock("@noble/curves/nist", () => ({
  p256: {
    sign: jest.fn(() => ({
      toCompactHex: () => "mocksignature123",
    })),
  },
}));

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

const mockNFT: NFT = {
  tokenId: "abc123",
  contractAddress: "0x1234",
  collectionName: "Test Collection",
  metadata: { name: "Test NFT", image: "https://example.com/nft.png" },
  owner: "NXV7ZhHiyM1aHXwpVsRZC6BEaDQhNn2sfF",
};

describe("nft", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("loadCachedNFTs", () => {
    it("should return empty array when no cache", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);
      const nfts = await loadCachedNFTs();
      expect(nfts).toEqual([]);
    });

    it("should return cached NFTs", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(JSON.stringify([mockNFT]));
      const nfts = await loadCachedNFTs();
      expect(nfts).toHaveLength(1);
      expect(nfts[0].tokenId).toBe("abc123");
    });
  });

  describe("cacheNFTs", () => {
    it("should save NFTs to storage", async () => {
      await cacheNFTs([mockNFT]);
      expect(mockSecureStore.setItemAsync).toHaveBeenCalled();
    });
  });

  describe("getNFTById", () => {
    it("should find NFT by token ID", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(JSON.stringify([mockNFT]));
      const nft = await getNFTById("abc123");
      expect(nft?.metadata.name).toBe("Test NFT");
    });

    it("should return undefined for unknown ID", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue("[]");
      const nft = await getNFTById("unknown");
      expect(nft).toBeUndefined();
    });
  });

  describe("filterByCollection", () => {
    it("should filter NFTs by contract address", () => {
      const nfts = [mockNFT, { ...mockNFT, tokenId: "def456", contractAddress: "0x5678" }];
      const filtered = filterByCollection(nfts, "0x1234");
      expect(filtered).toHaveLength(1);
    });
  });

  describe("parseMetadata", () => {
    it("should parse valid JSON", () => {
      const json = '{"name":"Test","image":"img.png"}';
      const meta = parseMetadata(json);
      expect(meta?.name).toBe("Test");
    });

    it("should return null for invalid JSON", () => {
      expect(parseMetadata("invalid")).toBeNull();
    });
  });

  describe("isValidTokenId", () => {
    it("should validate hex token IDs", () => {
      expect(isValidTokenId("abc123")).toBe(true);
    });

    it("should reject invalid token IDs", () => {
      expect(isValidTokenId("")).toBe(false);
    });

    it("should reject non-hex characters", () => {
      expect(isValidTokenId("xyz123")).toBe(false);
      expect(isValidTokenId("abc!@#")).toBe(false);
    });
  });

  describe("transferNFT", () => {
    beforeEach(() => {
      mockFetch.mockClear();
    });

    it("should throw error when no private key", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);
      await expect(
        transferNFT("0xcontract", "abc123", "NXV7ZhHiyM1aHXwpVsRZC6BEaDQhNn2sfF")
      ).rejects.toThrow("No private key found");
    });

    it("should transfer NFT successfully", async () => {
      const mockPrivateKey = "a".repeat(64);
      mockSecureStore.getItemAsync.mockResolvedValue(mockPrivateKey);
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({ result: { hash: "0xtxhash123" } }),
      });

      const result = await transferNFT(
        "0xd2a4cff31913016155e38e474a2c06d08be276cf",
        "abc123",
        "NXV7ZhHiyM1aHXwpVsRZC6BEaDQhNn2sfF"
      );
      expect(result).toBe("0xtxhash123");
      expect(mockFetch).toHaveBeenCalled();
    });

    it("should throw error on RPC failure", async () => {
      const mockPrivateKey = "b".repeat(64);
      mockSecureStore.getItemAsync.mockResolvedValue(mockPrivateKey);
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({ error: { message: "RPC error" } }),
      });

      await expect(
        transferNFT("0xcontract", "def456", "NXV7ZhHiyM1aHXwpVsRZC6BEaDQhNn2sfF")
      ).rejects.toThrow("RPC error");
    });

    it("should return empty string when no hash in response", async () => {
      const mockPrivateKey = "c".repeat(64);
      mockSecureStore.getItemAsync.mockResolvedValue(mockPrivateKey);
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({ result: {} }),
      });

      const result = await transferNFT(
        "0xcontract",
        "abcdef789012",
        "NXV7ZhHiyM1aHXwpVsRZC6BEaDQhNn2sfF"
      );
      expect(result).toBe("");
    });
  });
});
