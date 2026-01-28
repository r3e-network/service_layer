/**
 * Notification Center
 * Handles push notifications, price alerts, and tx alerts
 */

import * as SecureStore from "expo-secure-store";

const NOTIF_SETTINGS_KEY = "notification_settings";
const NOTIF_HISTORY_KEY = "notification_history";

export type NotifType = "transaction" | "price" | "security" | "system";

export interface NotifSettings {
  enabled: boolean;
  transactions: boolean;
  priceAlerts: boolean;
  security: boolean;
}

export interface Notification {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  read: boolean;
  timestamp: number;
}

const DEFAULT_SETTINGS: NotifSettings = {
  enabled: true,
  transactions: true,
  priceAlerts: true,
  security: true,
};

/**
 * Load notification settings
 */
export async function loadNotifSettings(): Promise<NotifSettings> {
  const data = await SecureStore.getItemAsync(NOTIF_SETTINGS_KEY);
  return data ? JSON.parse(data) : DEFAULT_SETTINGS;
}

/**
 * Save notification settings
 */
export async function saveNotifSettings(settings: NotifSettings): Promise<void> {
  await SecureStore.setItemAsync(NOTIF_SETTINGS_KEY, JSON.stringify(settings));
}

/**
 * Load notifications
 */
export async function loadNotifications(): Promise<Notification[]> {
  const data = await SecureStore.getItemAsync(NOTIF_HISTORY_KEY);
  return data ? JSON.parse(data) : [];
}

/**
 * Add notification
 */
export async function addNotification(
  notif: Omit<Notification, "id" | "read" | "timestamp">
): Promise<void> {
  const list = await loadNotifications();
  list.unshift({ ...notif, id: `notif_${Date.now()}`, read: false, timestamp: Date.now() });
  await SecureStore.setItemAsync(NOTIF_HISTORY_KEY, JSON.stringify(list.slice(0, 50)));
}

/**
 * Mark as read
 */
export async function markAsRead(id: string): Promise<void> {
  const list = await loadNotifications();
  const updated = list.map((n) => (n.id === id ? { ...n, read: true } : n));
  await SecureStore.setItemAsync(NOTIF_HISTORY_KEY, JSON.stringify(updated));
}

/**
 * Get unread count
 */
export async function getUnreadCount(): Promise<number> {
  const list = await loadNotifications();
  return list.filter((n) => !n.read).length;
}

/**
 * Get type icon
 */
export function getNotifIcon(type: NotifType): string {
  const icons: Record<NotifType, string> = {
    transaction: "swap-horizontal",
    price: "trending-up",
    security: "shield",
    system: "information-circle",
  };
  return icons[type];
}
