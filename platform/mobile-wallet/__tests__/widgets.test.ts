/**
 * Widget Tests
 * Tests for src/lib/widgets.ts
 */

import * as SecureStore from "expo-secure-store";
import {
  loadWidgetConfigs,
  saveWidgetConfigs,
  toggleWidget,
  generateWidgetId,
  getWidgetTypeLabel,
  getWidgetIcon,
} from "../src/lib/widgets";

jest.mock("expo-secure-store");

const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

describe("widgets", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("loadWidgetConfigs", () => {
    it("should return defaults when no config", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);
      const configs = await loadWidgetConfigs();
      expect(configs.length).toBeGreaterThan(0);
    });

    it("should return saved configs", async () => {
      const saved = [{ id: "w1", type: "balance", enabled: true }];
      mockSecureStore.getItemAsync.mockResolvedValue(JSON.stringify(saved));
      const configs = await loadWidgetConfigs();
      expect(configs).toHaveLength(1);
    });
  });

  describe("saveWidgetConfigs", () => {
    it("should save configs", async () => {
      await saveWidgetConfigs([]);
      expect(mockSecureStore.setItemAsync).toHaveBeenCalled();
    });
  });

  describe("toggleWidget", () => {
    it("should toggle widget enabled state", async () => {
      const configs = [{ id: "w1", enabled: true }];
      mockSecureStore.getItemAsync.mockResolvedValue(JSON.stringify(configs));
      await toggleWidget("w1");
      expect(mockSecureStore.setItemAsync).toHaveBeenCalled();
    });
  });

  describe("generateWidgetId", () => {
    it("should generate unique IDs", () => {
      const id1 = generateWidgetId();
      const id2 = generateWidgetId();
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^widget_/);
    });
  });

  describe("getWidgetTypeLabel", () => {
    it("should return correct labels", () => {
      expect(getWidgetTypeLabel("balance")).toBe("Balance");
      expect(getWidgetTypeLabel("price")).toBe("Price Ticker");
      expect(getWidgetTypeLabel("gas")).toBe("GAS Price");
    });
  });

  describe("getWidgetIcon", () => {
    it("should return correct icons", () => {
      expect(getWidgetIcon("balance")).toBe("wallet");
      expect(getWidgetIcon("price")).toBe("trending-up");
    });
  });
});
