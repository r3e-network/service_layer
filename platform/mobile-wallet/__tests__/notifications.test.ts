/**
 * Notification Service Tests
 * Tests for src/lib/notifications.ts
 */

import * as SecureStore from "expo-secure-store";
import {
  loadNotifications,
  saveNotification,
  markAsRead,
  markAllAsRead,
  clearNotifications,
  getUnreadCount,
  loadSettings,
  saveSettings,
  generateNotificationId,
} from "../src/lib/notifications";

jest.mock("expo-secure-store");

const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

describe("Notification Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("loadNotifications", () => {
    it("should return empty array when no notifications", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);
      const result = await loadNotifications();
      expect(result).toEqual([]);
    });

    it("should return parsed notifications", async () => {
      const notifs = [{ id: "1", title: "Test", read: false }];
      mockSecureStore.getItemAsync.mockResolvedValue(JSON.stringify(notifs));
      const result = await loadNotifications();
      expect(result).toEqual(notifs);
    });
  });

  describe("saveNotification", () => {
    it("should save new notification", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue("[]");
      const notif = { id: "1", type: "tx_sent" as const, title: "Sent", body: "Test", timestamp: 123, read: false };
      await saveNotification(notif);
      expect(mockSecureStore.setItemAsync).toHaveBeenCalled();
    });
  });

  describe("markAsRead", () => {
    it("should mark notification as read", async () => {
      const notifs = [{ id: "1", read: false }];
      mockSecureStore.getItemAsync.mockResolvedValue(JSON.stringify(notifs));
      await markAsRead("1");
      expect(mockSecureStore.setItemAsync).toHaveBeenCalled();
    });
  });

  describe("markAllAsRead", () => {
    it("should mark all as read", async () => {
      const notifs = [
        { id: "1", read: false },
        { id: "2", read: false },
      ];
      mockSecureStore.getItemAsync.mockResolvedValue(JSON.stringify(notifs));
      await markAllAsRead();
      expect(mockSecureStore.setItemAsync).toHaveBeenCalled();
    });
  });

  describe("clearNotifications", () => {
    it("should clear all notifications", async () => {
      await clearNotifications();
      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith("notifications_list", "[]");
    });
  });

  describe("getUnreadCount", () => {
    it("should return unread count", async () => {
      const notifs = [
        { id: "1", read: false },
        { id: "2", read: true },
      ];
      mockSecureStore.getItemAsync.mockResolvedValue(JSON.stringify(notifs));
      const count = await getUnreadCount();
      expect(count).toBe(1);
    });
  });

  describe("loadSettings / saveSettings", () => {
    it("should return default settings", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);
      const settings = await loadSettings();
      expect(settings.enabled).toBe(true);
    });

    it("should save settings", async () => {
      const settings = { enabled: false, txSent: true, txReceived: true, txConfirmed: false };
      await saveSettings(settings);
      expect(mockSecureStore.setItemAsync).toHaveBeenCalled();
    });
  });

  describe("generateNotificationId", () => {
    it("should generate unique id", () => {
      const id = generateNotificationId();
      expect(id).toMatch(/^notif_\d+_[a-z0-9]+$/);
    });
  });
});
