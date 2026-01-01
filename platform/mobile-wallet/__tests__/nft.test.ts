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
  NFT,
} from "../src/lib/nft";

jest.mock("expo-secure-store");

const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

const mockNFT: NFT = {
  tokenId: "abc123",
  contractHash: "0x1234",
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
    it("should filter NFTs by contract hash", () => {
      const nfts = [mockNFT, { ...mockNFT, tokenId: "def456", contractHash: "0x5678" }];
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
  });
});
