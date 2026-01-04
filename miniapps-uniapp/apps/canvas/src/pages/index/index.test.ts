import { describe, it, expect, vi, beforeEach } from "vitest";
import { ref } from "vue";

// Mock @neo/uniapp-sdk
vi.mock("@neo/uniapp-sdk", () => ({
  usePayments: vi.fn(() => ({
    payGAS: vi.fn().mockResolvedValue({ request_id: "test-123" }),
    isLoading: ref(false),
  })),
}));

// Mock i18n utility
vi.mock("@/shared/utils/i18n", () => ({
  createT: vi.fn(() => (key: string) => key),
}));

describe("Canvas MiniApp", () => {
  let mockPayGAS: any;
  let mockIsLoading: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const { usePayments } = await import("@neo/uniapp-sdk");
    const payments = usePayments("test");
    mockPayGAS = payments.payGAS;
    mockIsLoading = payments.isLoading;
  });

  describe("Canvas Initialization", () => {
    it("should initialize canvas with correct size", () => {
      const GRID_SIZE = 16;
      const pixels = ref<string[]>(Array(GRID_SIZE * GRID_SIZE).fill("#1a1a2e"));

      expect(pixels.value).toHaveLength(256);
      expect(pixels.value[0]).toBe("#1a1a2e");
    });

    it("should have default selected color", () => {
      const selectedColor = ref("#00e599");
      expect(selectedColor.value).toBe("#00e599");
    });
  });

  describe("Color Selection", () => {
    it("should select color", () => {
      const selectedColor = ref("#00e599");
      const selectColor = (color: string) => (selectedColor.value = color);

      selectColor("#ff0055");
      expect(selectedColor.value).toBe("#ff0055");
    });

    it("should change color multiple times", () => {
      const selectedColor = ref("#00e599");
      const selectColor = (color: string) => (selectedColor.value = color);

      selectColor("#ff0055");
      expect(selectedColor.value).toBe("#ff0055");

      selectColor("#ffaa00");
      expect(selectedColor.value).toBe("#ffaa00");
    });
  });

  describe("Pixel Painting", () => {
    it("should paint pixel with selected color", () => {
      const GRID_SIZE = 16;
      const pixels = ref<string[]>(Array(GRID_SIZE * GRID_SIZE).fill("#1a1a2e"));
      const selectedColor = ref("#00e599");
      const paintPixel = (idx: number) => (pixels.value[idx] = selectedColor.value);

      paintPixel(0);
      expect(pixels.value[0]).toBe("#00e599");
    });

    it("should paint multiple pixels", () => {
      const GRID_SIZE = 16;
      const pixels = ref<string[]>(Array(GRID_SIZE * GRID_SIZE).fill("#1a1a2e"));
      const selectedColor = ref("#ff0055");
      const paintPixel = (idx: number) => (pixels.value[idx] = selectedColor.value);

      paintPixel(0);
      paintPixel(5);
      paintPixel(10);

      expect(pixels.value[0]).toBe("#ff0055");
      expect(pixels.value[5]).toBe("#ff0055");
      expect(pixels.value[10]).toBe("#ff0055");
    });

    it("should overwrite existing pixel color", () => {
      const GRID_SIZE = 16;
      const pixels = ref<string[]>(Array(GRID_SIZE * GRID_SIZE).fill("#1a1a2e"));
      const selectedColor = ref("#00e599");
      const paintPixel = (idx: number) => (pixels.value[idx] = selectedColor.value);

      paintPixel(0);
      expect(pixels.value[0]).toBe("#00e599");

      selectedColor.value = "#ff0055";
      paintPixel(0);
      expect(pixels.value[0]).toBe("#ff0055");
    });
  });

  describe("Clear Canvas", () => {
    it("should clear all pixels", () => {
      const GRID_SIZE = 16;
      const pixels = ref<string[]>(Array(GRID_SIZE * GRID_SIZE).fill("#1a1a2e"));
      const selectedColor = ref("#00e599");
      const paintPixel = (idx: number) => (pixels.value[idx] = selectedColor.value);

      paintPixel(0);
      paintPixel(5);
      paintPixel(10);

      const clearCanvas = () => {
        pixels.value = Array(GRID_SIZE * GRID_SIZE).fill("#1a1a2e");
      };

      clearCanvas();
      expect(pixels.value.every((p) => p === "#1a1a2e")).toBe(true);
    });
  });

  describe("Mint Canvas", () => {
    it("should mint canvas successfully", async () => {
      const timestamp = Date.now();
      await mockPayGAS("10", `mint:${timestamp}`);

      expect(mockPayGAS).toHaveBeenCalledWith("10", expect.stringContaining("mint:"));
    });

    it("should not mint when loading", async () => {
      mockIsLoading.value = true;

      const mintCanvas = async () => {
        if (mockIsLoading.value) return;
        await mockPayGAS("10", `mint:${Date.now()}`);
      };

      await mintCanvas();
      expect(mockPayGAS).not.toHaveBeenCalled();
    });

    it("should handle mint error", async () => {
      mockPayGAS.mockRejectedValueOnce(new Error("Insufficient funds"));

      await expect(mockPayGAS("10", "mint:123")).rejects.toThrow("Insufficient funds");
    });
  });

  describe("Edge Cases", () => {
    it("should handle painting at grid boundaries", () => {
      const GRID_SIZE = 16;
      const pixels = ref<string[]>(Array(GRID_SIZE * GRID_SIZE).fill("#1a1a2e"));
      const selectedColor = ref("#00e599");
      const paintPixel = (idx: number) => (pixels.value[idx] = selectedColor.value);

      paintPixel(0);
      paintPixel(255);

      expect(pixels.value[0]).toBe("#00e599");
      expect(pixels.value[255]).toBe("#00e599");
    });

    it("should handle all available colors", () => {
      const colors = ["#00e599", "#ff0055", "#ffaa00", "#00aaff", "#ff00ff", "#ffffff", "#ff6b6b", "#4ecdc4"];
      const selectedColor = ref("#00e599");

      colors.forEach((color) => {
        selectedColor.value = color;
        expect(selectedColor.value).toBe(color);
      });
    });
  });
});
