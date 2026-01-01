/**
 * Price Charts
 * Handles real-time prices, historical data, and price alerts
 */

import * as SecureStore from "expo-secure-store";

const PRICE_ALERTS_KEY = "price_alerts";
const PRICE_CACHE_KEY = "price_cache";

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

const API_BASE = "https://api.coingecko.com/api/v3";

let priceCache: Record<Asset, PriceData> | null = null;
let lastFetch = 0;
const CACHE_TTL = 60000; // 1 minute

/**
 * Fetch prices from CoinGecko API
 */
async function fetchPrices(): Promise<Record<Asset, PriceData>> {
  const ids = Object.values(COINGECKO_IDS).join(",");
  const url = `${API_BASE}/coins/markets?vs_currency=usd&ids=${ids}&sparkline=false`;

  const response = await fetch(url);
  if (!response.ok) throw new Error(`API error: ${response.status}`);

  const data = await response.json();
  const result: Record<Asset, PriceData> = {} as Record<Asset, PriceData>;

  for (const coin of data) {
    const asset = coin.id === "neo" ? "NEO" : "GAS";
    result[asset] = {
      asset,
      price: coin.current_price,
      change24h: coin.price_change_percentage_24h || 0,
      high24h: coin.high_24h,
      low24h: coin.low_24h,
      volume24h: coin.total_volume,
      marketCap: coin.market_cap,
      lastUpdated: Date.now(),
    };
  }
  return result;
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
  const url = `${API_BASE}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`;

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
