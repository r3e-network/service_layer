/**
 * Price Charts
 * Handles real-time prices, historical data, and price alerts
 * Basic prices from global API, chart data from CoinGecko
 */

import * as SecureStore from "expo-secure-store";
import { API_BASE_URL } from "./config";

const PRICE_ALERTS_KEY = "price_alerts";

export type Asset = "NEO" | "GAS";
export type TimeRange = "1H" | "1D" | "1W" | "1M" | "1Y";

export interface PriceData {
  asset: Asset;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  marketCap: number;
  lastUpdated: number;
}

export interface ChartPoint {
  timestamp: number;
  price: number;
}

export interface PriceAlert {
  id: string;
  asset: Asset;
  targetPrice: number;
  condition: "above" | "below";
  enabled: boolean;
  createdAt: number;
}

const COINGECKO_IDS: Record<Asset, string> = {
  NEO: "neo",
  GAS: "gas",
};

// CoinGecko API for chart data only
const COINGECKO_API = "https://api.coingecko.com/api/v3";

let priceCache: Record<Asset, PriceData> | null = null;
let lastFetch = 0;
const CACHE_TTL = 60000; // 1 minute

/**
 * Fetch prices from global price API
 */
async function fetchPrices(): Promise<Record<Asset, PriceData>> {
  const url = `${API_BASE_URL}/price`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Price API error: ${response.status}`);

  const data = await response.json();
  const now = Date.now();

  return {
    NEO: {
      asset: "NEO",
      price: data.neo?.usd || 0,
      change24h: data.neo?.usd_24h_change || 0,
      high24h: 0, // Not available from basic API
      low24h: 0,
      volume24h: 0,
      marketCap: 0,
      lastUpdated: now,
    },
    GAS: {
      asset: "GAS",
      price: data.gas?.usd || 0,
      change24h: data.gas?.usd_24h_change || 0,
      high24h: 0,
      low24h: 0,
      volume24h: 0,
      marketCap: 0,
      lastUpdated: now,
    },
  };
}

/**
 * Get current price for asset
 */
export async function getPrice(asset: Asset): Promise<PriceData> {
  const prices = await getAllPrices();
  return prices.find((p) => p.asset === asset)!;
}

/**
 * Get all prices with caching
 */
export async function getAllPrices(): Promise<PriceData[]> {
  const now = Date.now();
  if (priceCache && now - lastFetch < CACHE_TTL) {
    return Object.values(priceCache);
  }
  priceCache = await fetchPrices();
  lastFetch = now;
  return Object.values(priceCache);
}

/**
 * Fetch chart data from CoinGecko API
 */
export async function getChartData(asset: Asset, range: TimeRange): Promise<ChartPoint[]> {
  const coinId = COINGECKO_IDS[asset];
  const days = { "1H": 1, "1D": 1, "1W": 7, "1M": 30, "1Y": 365 }[range];
  const url = `${COINGECKO_API}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`;

  const response = await fetch(url);
  if (!response.ok) throw new Error(`API error: ${response.status}`);

  const data = await response.json();
  return data.prices.map(([timestamp, price]: [number, number]) => ({
    timestamp,
    price,
  }));
}

/**
 * Load price alerts
 */
export async function loadPriceAlerts(): Promise<PriceAlert[]> {
  const data = await SecureStore.getItemAsync(PRICE_ALERTS_KEY);
  return data ? JSON.parse(data) : [];
}

/**
 * Save price alert
 */
export async function savePriceAlert(alert: PriceAlert): Promise<void> {
  const alerts = await loadPriceAlerts();
  alerts.push(alert);
  await SecureStore.setItemAsync(PRICE_ALERTS_KEY, JSON.stringify(alerts));
}

/**
 * Generate alert ID
 */
export function generateAlertId(): string {
  return `alert_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Format price for display
 */
export function formatPrice(price: number): string {
  return price.toFixed(2);
}

/**
 * Format percentage change
 */
export function formatChange(change: number): string {
  const sign = change >= 0 ? "+" : "";
  return `${sign}${change.toFixed(2)}%`;
}

/**
 * Format volume
 */
export function formatVolume(volume: number): string {
  if (volume >= 1e9) return `$${(volume / 1e9).toFixed(2)}B`;
  if (volume >= 1e6) return `$${(volume / 1e6).toFixed(2)}M`;
  return `$${volume.toFixed(0)}`;
}
