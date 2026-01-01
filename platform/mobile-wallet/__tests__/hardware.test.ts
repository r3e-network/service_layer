/**
 * Hardware Wallet Tests
 * Tests for src/lib/hardware.ts
 */

import * as SecureStore from "expo-secure-store";
import {
  loadDevices,
  saveDevice,
  removeDevice,
  loadHardwareSettings,
  saveHardwareSettings,
  generateDeviceId,
  getDeviceTypeLabel,
  getConnectionLabel,
  getDeviceIcon,
  formatLastUsed,
} from "../src/lib/hardware";

jest.mock("expo-secure-store");

const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

describe("hardware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("loadDevices", () => {
    it("should return empty array when no devices", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);
      const devices = await loadDevices();
      expect(devices).toEqual([]);
    });

    it("should return saved devices", async () => {
      const saved = [{ id: "hw1", name: "Ledger", type: "ledger" }];
      mockSecureStore.getItemAsync.mockResolvedValue(JSON.stringify(saved));
      const devices = await loadDevices();
      expect(devices).toHaveLength(1);
    });
  });

  describe("saveDevice", () => {
    it("should add new device", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);
      const device = {
        id: "hw1",
        name: "Ledger",
        type: "ledger" as const,
        connection: "bluetooth" as const,
        address: "addr1",
        path: "m/44'/888'/0'/0/0",
        paired: true,
        lastUsed: Date.now(),
      };
      await saveDevice(device);
      expect(mockSecureStore.setItemAsync).toHaveBeenCalled();
    });

    it("should update existing device", async () => {
      const existing = [{ id: "hw1", name: "Old", type: "ledger" }];
      mockSecureStore.getItemAsync.mockResolvedValue(JSON.stringify(existing));
      await saveDevice({ ...existing[0], name: "New" } as any);
      expect(mockSecureStore.setItemAsync).toHaveBeenCalled();
    });
  });

  describe("removeDevice", () => {
    it("should remove device by id", async () => {
      const devices = [{ id: "hw1" }, { id: "hw2" }];
      mockSecureStore.getItemAsync.mockResolvedValue(JSON.stringify(devices));
      await removeDevice("hw1");
      expect(mockSecureStore.setItemAsync).toHaveBeenCalled();
    });
  });

  describe("loadHardwareSettings", () => {
    it("should return defaults when no settings", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);
      const settings = await loadHardwareSettings();
      expect(settings.autoConnect).toBe(true);
      expect(settings.confirmOnDevice).toBe(true);
    });
  });

  describe("saveHardwareSettings", () => {
    it("should save settings", async () => {
      await saveHardwareSettings({
        autoConnect: false,
        confirmOnDevice: true,
        showAddressOnDevice: true,
      });
      expect(mockSecureStore.setItemAsync).toHaveBeenCalled();
    });
  });

  describe("generateDeviceId", () => {
    it("should generate unique IDs", () => {
      const id1 = generateDeviceId();
      const id2 = generateDeviceId();
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^hw_/);
    });
  });

  describe("getDeviceTypeLabel", () => {
    it("should return correct labels", () => {
      expect(getDeviceTypeLabel("ledger")).toBe("Ledger");
      expect(getDeviceTypeLabel("trezor")).toBe("Trezor");
      expect(getDeviceTypeLabel("keystone")).toBe("Keystone");
    });
  });

  describe("getConnectionLabel", () => {
    it("should return correct labels", () => {
      expect(getConnectionLabel("bluetooth")).toBe("Bluetooth");
      expect(getConnectionLabel("usb")).toBe("USB");
      expect(getConnectionLabel("qr")).toBe("QR Code");
    });
  });

  describe("getDeviceIcon", () => {
    it("should return correct icons", () => {
      expect(getDeviceIcon("ledger")).toBe("hardware-chip");
      expect(getDeviceIcon("trezor")).toBe("shield-checkmark");
    });
  });

  describe("formatLastUsed", () => {
    it("should format minutes", () => {
      const result = formatLastUsed(Date.now() - 5 * 60000);
      expect(result).toBe("5m ago");
    });

    it("should format hours", () => {
      const result = formatLastUsed(Date.now() - 3 * 3600000);
      expect(result).toBe("3h ago");
    });

    it("should format days", () => {
      const result = formatLastUsed(Date.now() - 2 * 86400000);
      expect(result).toBe("2d ago");
    });
  });
});
