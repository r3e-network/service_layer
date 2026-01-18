/**
 * Theme Tests
 * Tests for src/lib/theme.ts
 */

import * as SecureStore from "expo-secure-store";
import { loadThemeMode, saveThemeMode, getThemeColors, getThemeModeLabel, getThemeIcon } from "../src/lib/theme";

jest.mock("expo-secure-store");

const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

describe("theme", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("loadThemeMode", () => {
    it("should return dark as default", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);
      const mode = await loadThemeMode();
      expect(mode).toBe("dark");
    });

    it("should return saved mode", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue("light");
      const mode = await loadThemeMode();
      expect(mode).toBe("light");
    });
  });

  describe("saveThemeMode", () => {
    it("should save mode", async () => {
      await saveThemeMode("light");
      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith("app_theme", "light");
    });
  });

  describe("getThemeColors", () => {
    it("should return dark colors for dark mode", () => {
      const colors = getThemeColors("dark", false);
      expect(colors.background).toBe("#05060d");
    });

    it("should return light colors for light mode", () => {
      const colors = getThemeColors("light", false);
      expect(colors.background).toBe("#f8f8ff");
    });

    it("should follow system when system mode", () => {
      const darkColors = getThemeColors("system", true);
      expect(darkColors.background).toBe("#05060d");

      const lightColors = getThemeColors("system", false);
      expect(lightColors.background).toBe("#f8f8ff");
    });
  });

  describe("getThemeModeLabel", () => {
    it("should return correct labels", () => {
      expect(getThemeModeLabel("dark")).toBe("Dark");
      expect(getThemeModeLabel("light")).toBe("Light");
      expect(getThemeModeLabel("system")).toBe("System");
    });
  });

  describe("getThemeIcon", () => {
    it("should return correct icons", () => {
      expect(getThemeIcon("dark")).toBe("moon");
      expect(getThemeIcon("light")).toBe("sunny");
      expect(getThemeIcon("system")).toBe("phone-portrait");
    });
  });
});
