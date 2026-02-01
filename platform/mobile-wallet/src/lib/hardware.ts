/**
 * Hardware Wallet Support
 * Ledger and other hardware wallet integration
 */

import * as SecureStore from "expo-secure-store";

const HW_DEVICES_KEY = "hardware_devices";
const HW_SETTINGS_KEY = "hardware_settings";

export type HardwareType = "ledger" | "trezor" | "keystone";
export type ConnectionType = "bluetooth" | "usb" | "qr";

export interface HardwareDevice {
  id: string;
  name: string;
  type: HardwareType;
  connection: ConnectionType;
  address: string;
  path: string;
  paired: boolean;
  lastUsed: number;
}

export interface HardwareSettings {
  autoConnect: boolean;
  confirmOnDevice: boolean;
  showAddressOnDevice: boolean;
}

const DEFAULT_SETTINGS: HardwareSettings = {
  autoConnect: true,
  confirmOnDevice: true,
  showAddressOnDevice: true,
};

/**
 * Load paired devices
 */
export async function loadDevices(): Promise<HardwareDevice[]> {
  const data = await SecureStore.getItemAsync(HW_DEVICES_KEY);
  return data ? JSON.parse(data) : [];
}

/**
 * Save device
 */
export async function saveDevice(device: HardwareDevice): Promise<void> {
  const devices = await loadDevices();
  const idx = devices.findIndex((d) => d.id === device.id);
  if (idx >= 0) {
    devices[idx] = device;
  } else {
    devices.push(device);
  }
  await SecureStore.setItemAsync(HW_DEVICES_KEY, JSON.stringify(devices));
}

/**
 * Remove device
 */
export async function removeDevice(id: string): Promise<void> {
  const devices = await loadDevices();
  const filtered = devices.filter((d) => d.id !== id);
  await SecureStore.setItemAsync(HW_DEVICES_KEY, JSON.stringify(filtered));
}

/**
 * Load hardware settings
 */
export async function loadHardwareSettings(): Promise<HardwareSettings> {
  const data = await SecureStore.getItemAsync(HW_SETTINGS_KEY);
  return data ? JSON.parse(data) : DEFAULT_SETTINGS;
}

/**
 * Save hardware settings
 */
export async function saveHardwareSettings(settings: HardwareSettings): Promise<void> {
  await SecureStore.setItemAsync(HW_SETTINGS_KEY, JSON.stringify(settings));
}

/**
 * Generate device ID
 */
export function generateDeviceId(): string {
  return `hw_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Get device type label
 */
export function getDeviceTypeLabel(type: HardwareType): string {
  const labels: Record<HardwareType, string> = {
    ledger: "Ledger",
    trezor: "Trezor",
    keystone: "Keystone",
  };
  return labels[type];
}

/**
 * Get connection type label
 */
export function getConnectionLabel(conn: ConnectionType): string {
  const labels: Record<ConnectionType, string> = {
    bluetooth: "Bluetooth",
    usb: "USB",
    qr: "QR Code",
  };
  return labels[conn];
}

/**
 * Get device icon
 */
export function getDeviceIcon(type: HardwareType): string {
  const icons: Record<HardwareType, string> = {
    ledger: "hardware-chip",
    trezor: "shield-checkmark",
    keystone: "qr-code",
  };
  return icons[type];
}

/**
 * Format last used time
 */
export function formatLastUsed(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
