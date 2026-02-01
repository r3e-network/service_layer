/**
 * Fiat On-Ramp
 * Buy crypto with fiat currency
 */

import * as SecureStore from "expo-secure-store";

const FIAT_KEY = "fiat_config";
const FIAT_HISTORY_KEY = "fiat_history";

export type FiatCurrency = "USD" | "EUR" | "GBP" | "CNY";
export type PaymentMethod = "card" | "bank" | "apple_pay";

export interface FiatConfig {
  defaultCurrency: FiatCurrency;
  defaultPayment: PaymentMethod;
}

export interface FiatOrder {
  id: string;
  fiatAmount: string;
  fiatCurrency: FiatCurrency;
  cryptoAmount: string;
  cryptoAsset: string;
  status: "pending" | "completed" | "failed";
  timestamp: number;
}

const DEFAULT_CONFIG: FiatConfig = {
  defaultCurrency: "USD",
  defaultPayment: "card",
};

/**
 * Load fiat config
 */
export async function loadFiatConfig(): Promise<FiatConfig> {
  const data = await SecureStore.getItemAsync(FIAT_KEY);
  return data ? JSON.parse(data) : DEFAULT_CONFIG;
}

/**
 * Save fiat config
 */
export async function saveFiatConfig(config: FiatConfig): Promise<void> {
  await SecureStore.setItemAsync(FIAT_KEY, JSON.stringify(config));
}

/**
 * Load order history
 */
export async function loadFiatHistory(): Promise<FiatOrder[]> {
  const data = await SecureStore.getItemAsync(FIAT_HISTORY_KEY);
  return data ? JSON.parse(data) : [];
}

/**
 * Save order
 */
export async function saveFiatOrder(order: FiatOrder): Promise<void> {
  const history = await loadFiatHistory();
  history.unshift(order);
  await SecureStore.setItemAsync(FIAT_HISTORY_KEY, JSON.stringify(history.slice(0, 50)));
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency: FiatCurrency): string {
  const symbols: Record<FiatCurrency, string> = { USD: "$", EUR: "€", GBP: "£", CNY: "¥" };
  return symbols[currency];
}

/**
 * Get payment icon
 */
export function getPaymentIcon(method: PaymentMethod): string {
  const icons: Record<PaymentMethod, string> = {
    card: "card",
    bank: "business",
    apple_pay: "logo-apple",
  };
  return icons[method];
}
