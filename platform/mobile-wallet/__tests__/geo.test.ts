/**
 * Geo Tests
 * Tests for src/lib/geo.ts
 */

import * as SecureStore from "expo-secure-store";
import { loadGeoSettings, saveGeoSettings, isRegionAllowed, getRegionName } from "../src/lib/geo";

jest.mock("expo-secure-store");

const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

describe("geo", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("loadGeoSettings", () => {
    it("should return defaults when no settings", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);
      const settings = await loadGeoSettings();
      expect(settings.enabled).toBe(false);
    });
  });

  describe("saveGeoSettings", () => {
    it("should save settings", async () => {
      await saveGeoSettings({
        enabled: true,
        allowedRegions: ["US"],
        blockedRegions: [],
        vpnDetection: true,
      });
      expect(mockSecureStore.setItemAsync).toHaveBeenCalled();
    });
  });

  describe("isRegionAllowed", () => {
    it("should allow all when disabled", () => {
      const settings = { enabled: false, allowedRegions: [], blockedRegions: ["US"], vpnDetection: false };
      expect(isRegionAllowed("US", settings)).toBe(true);
    });

    it("should block blocked regions", () => {
      const settings = { enabled: true, allowedRegions: [], blockedRegions: ["CN"], vpnDetection: false };
      expect(isRegionAllowed("CN", settings)).toBe(false);
    });

    it("should allow only allowed regions", () => {
      const settings = { enabled: true, allowedRegions: ["US", "JP"], blockedRegions: [], vpnDetection: false };
      expect(isRegionAllowed("US", settings)).toBe(true);
      expect(isRegionAllowed("CN", settings)).toBe(false);
    });
  });

  describe("getRegionName", () => {
    it("should return region name", () => {
      expect(getRegionName("US")).toBe("United States");
      expect(getRegionName("XX")).toBe("XX");
    });
  });
});
