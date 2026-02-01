/**
 * Notification Center Tests
 * Tests for src/lib/notifcenter.ts
 */

import * as SecureStore from "expo-secure-store";
import {
  loadNotifSettings,
  saveNotifSettings,
  loadNotifications,
  addNotification,
  markAsRead,
  getUnreadCount,
  getNotifIcon,
} from "../src/lib/notifcenter";

jest.mock("expo-secure-store");

const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

describe("notifcenter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("loadNotifSettings", () => {
    it("should return defaults when no settings", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);
      const settings = await loadNotifSettings();
      expect(settings.enabled).toBe(true);
    });
  });

  describe("saveNotifSettings", () => {
    it("should save settings", async () => {
      await saveNotifSettings({ enabled: false, transactions: true, priceAlerts: true, security: true });
      expect(mockSecureStore.setItemAsync).toHaveBeenCalled();
    });
  });

  describe("loadNotifications", () => {
    it("should return empty array when no notifications", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);
      const notifs = await loadNotifications();
      expect(notifs).toEqual([]);
    });
  });

  describe("addNotification", () => {
    it("should add notification", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);
      await addNotification({ type: "transaction", title: "Test", body: "Body" });
      expect(mockSecureStore.setItemAsync).toHaveBeenCalled();
    });
  });

  describe("markAsRead", () => {
    it("should mark notification as read", async () => {
      const notifs = [{ id: "n1", type: "transaction", title: "T", body: "B", read: false, timestamp: 123 }];
      mockSecureStore.getItemAsync.mockResolvedValue(JSON.stringify(notifs));
      await markAsRead("n1");
      expect(mockSecureStore.setItemAsync).toHaveBeenCalled();
    });
  });

  describe("getUnreadCount", () => {
    it("should count unread", async () => {
      const notifs = [
        { id: "n1", read: false },
        { id: "n2", read: true },
      ];
      mockSecureStore.getItemAsync.mockResolvedValue(JSON.stringify(notifs));
      const count = await getUnreadCount();
      expect(count).toBe(1);
    });
  });

  describe("getNotifIcon", () => {
    it("should return correct icons", () => {
      expect(getNotifIcon("transaction")).toBe("swap-horizontal");
      expect(getNotifIcon("price")).toBe("trending-up");
    });
  });
});
