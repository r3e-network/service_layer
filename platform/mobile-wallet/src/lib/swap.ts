/**
 * In-App Swap
 * Token swap functionality
 */

import * as SecureStore from "expo-secure-store";

const SWAP_HISTORY_KEY = "swap_history";
const SWAP_SETTINGS_KEY = "swap_settings";

export interface SwapPair {
  from: string;
  to: string;
}

export interface SwapQuote {
  fromAmount: string;
  toAmount: string;
  rate: number;
  fee: string;
  priceImpact: number;
  route: string[];
}

export interface SwapRecord {
  id: string;
  from: string;
  to: string;
  fromAmount: string;
  toAmount: string;
  txHash: string;
  timestamp: number;
  status: "pending" | "completed" | "failed";
}

export interface SwapSettings {
  slippage: number;
  deadline: number;
  autoApprove: boolean;
}

const DEFAULT_SETTINGS: SwapSettings = {
  slippage: 0.5,
  deadline: 20,
  autoApprove: false,
};

/**
 * Load swap history
 */
export async function loadSwapHistory(): Promise<SwapRecord[]> {
  const data = await SecureStore.getItemAsync(SWAP_HISTORY_KEY);
  return data ? JSON.parse(data) : [];
}

/**
 * Save swap record
 */
export async function saveSwapRecord(record: SwapRecord): Promise<void> {
  const history = await loadSwapHistory();
  history.unshift(record);
  await SecureStore.setItemAsync(SWAP_HISTORY_KEY, JSON.stringify(history.slice(0, 50)));
}

/**
 * Load swap settings
 */
export async function loadSwapSettings(): Promise<SwapSettings> {
  const data = await SecureStore.getItemAsync(SWAP_SETTINGS_KEY);
  return data ? JSON.parse(data) : DEFAULT_SETTINGS;
}

/**
 * Save swap settings
 */
export async function saveSwapSettings(settings: SwapSettings): Promise<void> {
  await SecureStore.setItemAsync(SWAP_SETTINGS_KEY, JSON.stringify(settings));
}

/**
 * Generate swap ID
 */
export function generateSwapId(): string {
  return `swap_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Format slippage
 */
export function formatSlippage(slippage: number): string {
  return `${slippage}%`;
}

/**
 * Calculate minimum received
 */
export function calcMinReceived(amount: string, slippage: number): string {
  const num = parseFloat(amount);
  const min = num * (1 - slippage / 100);
  return min.toFixed(8);
}
