/**
 * DApp Favorites Tests
 * Tests for src/lib/dapp/favorites.ts
 */

import * as SecureStore from "expo-secure-store";
import { loadFavorites, addFavorite, removeFavorite, isFavorite } from "../src/lib/dapp/favorites";

jest.mock("expo-secure-store");

const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

describe("DApp Favorites", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("loadFavorites", () => {
    it("should return empty array when no favorites", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);
      const result = await loadFavorites();
      expect(result).toEqual([]);
    });

    it("should return parsed favorites", async () => {
      const favorites = [{ url: "https://test.com", name: "Test", addedAt: 123 }];
      mockSecureStore.getItemAsync.mockResolvedValue(JSON.stringify(favorites));
      const result = await loadFavorites();
      expect(result).toEqual(favorites);
    });
  });

  describe("addFavorite", () => {
    it("should add new favorite", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);
      await addFavorite({ url: "https://new.com", name: "New" });
      expect(mockSecureStore.setItemAsync).toHaveBeenCalled();
    });

    it("should not add duplicate", async () => {
      const existing = [{ url: "https://test.com", name: "Test", addedAt: 123 }];
      mockSecureStore.getItemAsync.mockResolvedValue(JSON.stringify(existing));
      await addFavorite({ url: "https://test.com", name: "Test" });
      expect(mockSecureStore.setItemAsync).not.toHaveBeenCalled();
    });
  });

  describe("removeFavorite", () => {
    it("should remove favorite by url", async () => {
      const existing = [
        { url: "https://a.com", name: "A", addedAt: 1 },
        { url: "https://b.com", name: "B", addedAt: 2 },
      ];
      mockSecureStore.getItemAsync.mockResolvedValue(JSON.stringify(existing));
      await removeFavorite("https://a.com");
      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith("dapp_favorites", JSON.stringify([existing[1]]));
    });
  });

  describe("isFavorite", () => {
    it("should return true if favorite exists", async () => {
      const existing = [{ url: "https://test.com", name: "Test", addedAt: 123 }];
      mockSecureStore.getItemAsync.mockResolvedValue(JSON.stringify(existing));
      const result = await isFavorite("https://test.com");
      expect(result).toBe(true);
    });

    it("should return false if not favorite", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);
      const result = await isFavorite("https://other.com");
      expect(result).toBe(false);
    });
  });
});
