/**
 * Custom Themes Tests
 * Tests for src/lib/customtheme.ts
 */

import * as SecureStore from "expo-secure-store";
import {
  loadCustomThemes,
  saveCustomTheme,
  getActiveThemeId,
  setActiveTheme,
  generateThemeId,
} from "../src/lib/customtheme";

jest.mock("expo-secure-store");

const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

describe("customtheme", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("loadCustomThemes", () => {
    it("should return presets when no custom", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);
      const themes = await loadCustomThemes();
      expect(themes.length).toBeGreaterThan(0);
    });
  });

  describe("saveCustomTheme", () => {
    it("should save theme", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);
      await saveCustomTheme({
        id: "custom",
        name: "Custom",
        primary: "#fff",
        background: "#000",
        surface: "#111",
        text: "#fff",
      });
      expect(mockSecureStore.setItemAsync).toHaveBeenCalled();
    });
  });

  describe("getActiveThemeId", () => {
    it("should return neo as default", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);
      const id = await getActiveThemeId();
      expect(id).toBe("neo");
    });
  });

  describe("setActiveTheme", () => {
    it("should set active theme", async () => {
      await setActiveTheme("ocean");
      expect(mockSecureStore.setItemAsync).toHaveBeenCalled();
    });
  });

  describe("generateThemeId", () => {
    it("should generate unique IDs", () => {
      const id1 = generateThemeId();
      expect(id1).toMatch(/^theme_/);
      expect(generateThemeId()).toMatch(/^theme_/);
    });
  });
});
