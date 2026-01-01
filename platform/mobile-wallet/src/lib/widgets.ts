/**
 * Widget Support
 * Home screen widget configuration and data
 */

import * as SecureStore from "expo-secure-store";

const WIDGET_CONFIG_KEY = "widget_config";

export type WidgetType = "balance" | "price" | "gas" | "quick_send";
export type WidgetSize = "small" | "medium" | "large";

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  size: WidgetSize;
  enabled: boolean;
  settings: Record<string, unknown>;
}

export interface WidgetData {
  balance?: { neo: string; gas: string };
  price?: { neo: number; gas: number; change: number };
  gasPrice?: number;
}

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: "w1", type: "balance", size: "medium", enabled: true, settings: {} },
  { id: "w2", type: "price", size: "small", enabled: true, settings: { asset: "NEO" } },
];

/**
 * Load widget configs
 */
export async function loadWidgetConfigs(): Promise<WidgetConfig[]> {
  const data = await SecureStore.getItemAsync(WIDGET_CONFIG_KEY);
  return data ? JSON.parse(data) : DEFAULT_WIDGETS;
}

/**
 * Save widget configs
 */
export async function saveWidgetConfigs(configs: WidgetConfig[]): Promise<void> {
  await SecureStore.setItemAsync(WIDGET_CONFIG_KEY, JSON.stringify(configs));
}

/**
 * Toggle widget
 */
export async function toggleWidget(id: string): Promise<void> {
  const configs = await loadWidgetConfigs();
  const updated = configs.map((w) => (w.id === id ? { ...w, enabled: !w.enabled } : w));
  await saveWidgetConfigs(updated);
}

/**
 * Generate widget ID
 */
export function generateWidgetId(): string {
  return `widget_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Get widget type label
 */
export function getWidgetTypeLabel(type: WidgetType): string {
  const labels: Record<WidgetType, string> = {
    balance: "Balance",
    price: "Price Ticker",
    gas: "GAS Price",
    quick_send: "Quick Send",
  };
  return labels[type];
}

/**
 * Get widget icon
 */
export function getWidgetIcon(type: WidgetType): string {
  const icons: Record<WidgetType, string> = {
    balance: "wallet",
    price: "trending-up",
    gas: "flame",
    quick_send: "send",
  };
  return icons[type];
}
