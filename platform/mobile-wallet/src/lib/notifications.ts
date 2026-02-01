/**
 * Notification Service
 * Handles local notifications for transaction updates
 */

import * as SecureStore from "expo-secure-store";

const NOTIFICATIONS_KEY = "notifications_list";
const SETTINGS_KEY = "notification_settings";

export interface Notification {
  id: string;
  type: "tx_sent" | "tx_received" | "tx_confirmed";
  title: string;
  body: string;
  txHash?: string;
  timestamp: number;
  read: boolean;
}

export interface NotificationSettings {
  enabled: boolean;
  txSent: boolean;
  txReceived: boolean;
  txConfirmed: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  txSent: true,
  txReceived: true,
  txConfirmed: true,
};

export async function loadNotifications(): Promise<Notification[]> {
  const data = await SecureStore.getItemAsync(NOTIFICATIONS_KEY);
  return data ? JSON.parse(data) : [];
}

export async function saveNotification(notification: Notification): Promise<void> {
  const notifications = await loadNotifications();
  notifications.unshift(notification);
  // Keep only last 50 notifications
  const trimmed = notifications.slice(0, 50);
  await SecureStore.setItemAsync(NOTIFICATIONS_KEY, JSON.stringify(trimmed));
}

export async function markAsRead(id: string): Promise<void> {
  const notifications = await loadNotifications();
  const updated = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
  await SecureStore.setItemAsync(NOTIFICATIONS_KEY, JSON.stringify(updated));
}

export async function markAllAsRead(): Promise<void> {
  const notifications = await loadNotifications();
  const updated = notifications.map((n) => ({ ...n, read: true }));
  await SecureStore.setItemAsync(NOTIFICATIONS_KEY, JSON.stringify(updated));
}

export async function clearNotifications(): Promise<void> {
  await SecureStore.setItemAsync(NOTIFICATIONS_KEY, "[]");
}

export async function getUnreadCount(): Promise<number> {
  const notifications = await loadNotifications();
  return notifications.filter((n) => !n.read).length;
}

export async function loadSettings(): Promise<NotificationSettings> {
  const data = await SecureStore.getItemAsync(SETTINGS_KEY);
  return data ? JSON.parse(data) : DEFAULT_SETTINGS;
}

export async function saveSettings(settings: NotificationSettings): Promise<void> {
  await SecureStore.setItemAsync(SETTINGS_KEY, JSON.stringify(settings));
}

export function generateNotificationId(): string {
  return `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}
