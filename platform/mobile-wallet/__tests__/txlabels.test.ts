/**
 * Transaction Labels Tests
 * Tests for src/lib/txlabels.ts
 */

import * as SecureStore from "expo-secure-store";
import {
  loadLabels,
  getLabel,
  saveLabel,
  removeLabel,
  loadCategories,
  saveCategory,
  generateCategoryId,
  getCategoryById,
} from "../src/lib/txlabels";

jest.mock("expo-secure-store");

const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

describe("txlabels", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("loadLabels", () => {
    it("should return empty array when no labels", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);
      const labels = await loadLabels();
      expect(labels).toEqual([]);
    });
  });

  describe("getLabel", () => {
    it("should return null when not found", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);
      const label = await getLabel("0x123");
      expect(label).toBeNull();
    });

    it("should return label when found", async () => {
      const labels = [{ txHash: "0x123", label: "Test" }];
      mockSecureStore.getItemAsync.mockResolvedValue(JSON.stringify(labels));
      const label = await getLabel("0x123");
      expect(label?.label).toBe("Test");
    });
  });

  describe("saveLabel", () => {
    it("should add new label", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);
      await saveLabel({ txHash: "0x1", label: "Test", createdAt: 123 });
      expect(mockSecureStore.setItemAsync).toHaveBeenCalled();
    });

    it("should update existing label", async () => {
      const labels = [{ txHash: "0x1", label: "Old" }];
      mockSecureStore.getItemAsync.mockResolvedValue(JSON.stringify(labels));
      await saveLabel({ txHash: "0x1", label: "New", createdAt: 123 });
      expect(mockSecureStore.setItemAsync).toHaveBeenCalled();
    });
  });

  describe("removeLabel", () => {
    it("should remove label", async () => {
      const labels = [{ txHash: "0x1" }, { txHash: "0x2" }];
      mockSecureStore.getItemAsync.mockResolvedValue(JSON.stringify(labels));
      await removeLabel("0x1");
      expect(mockSecureStore.setItemAsync).toHaveBeenCalled();
    });
  });

  describe("loadCategories", () => {
    it("should return defaults when no custom", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);
      const cats = await loadCategories();
      expect(cats.length).toBeGreaterThan(0);
      expect(cats[0].id).toBe("income");
    });
  });

  describe("saveCategory", () => {
    it("should save category", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);
      await saveCategory({ id: "custom", name: "Custom", color: "#fff", icon: "star" });
      expect(mockSecureStore.setItemAsync).toHaveBeenCalled();
    });
  });

  describe("generateCategoryId", () => {
    it("should generate unique IDs", () => {
      const id1 = generateCategoryId();
      const id2 = generateCategoryId();
      expect(id1).not.toBe(id2);
    });
  });

  describe("getCategoryById", () => {
    it("should find category", () => {
      const cats = [{ id: "test", name: "Test", color: "#fff", icon: "star" }];
      expect(getCategoryById(cats, "test")?.name).toBe("Test");
    });

    it("should return undefined when not found", () => {
      expect(getCategoryById([], "test")).toBeUndefined();
    });
  });
});
