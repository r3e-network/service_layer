/**
 * Portfolio Analytics
 * Portfolio tracking and performance analysis
 */

import * as SecureStore from "expo-secure-store";

const PORTFOLIO_KEY = "portfolio_data";

export interface PortfolioAsset {
  symbol: string;
  amount: string;
  value: number;
  change24h: number;
  allocation: number;
}

export interface PortfolioSnapshot {
  timestamp: number;
  totalValue: number;
  assets: PortfolioAsset[];
}

export interface PortfolioData {
  snapshots: PortfolioSnapshot[];
  lastUpdated: number;
}

/**
 * Load portfolio data
 */
export async function loadPortfolioData(): Promise<PortfolioData> {
  const data = await SecureStore.getItemAsync(PORTFOLIO_KEY);
  return data ? JSON.parse(data) : { snapshots: [], lastUpdated: 0 };
}

/**
 * Save portfolio snapshot
 */
export async function saveSnapshot(snapshot: PortfolioSnapshot): Promise<void> {
  const data = await loadPortfolioData();
  data.snapshots.push(snapshot);
  data.snapshots = data.snapshots.slice(-30);
  data.lastUpdated = Date.now();
  await SecureStore.setItemAsync(PORTFOLIO_KEY, JSON.stringify(data));
}

/**
 * Calculate total value
 */
export function calcTotalValue(assets: PortfolioAsset[]): number {
  return assets.reduce((sum, a) => sum + a.value, 0);
}

/**
 * Calculate 24h change
 */
export function calc24hChange(assets: PortfolioAsset[]): number {
  const total = calcTotalValue(assets);
  if (total === 0) return 0;
  const weighted = assets.reduce((sum, a) => sum + a.change24h * a.value, 0);
  return weighted / total;
}

/**
 * Format currency
 */
export function formatCurrency(value: number, locale = "en"): string {
  return `$${value.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Format percentage
 */
export function formatPercent(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}
