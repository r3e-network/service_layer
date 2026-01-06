/**
 * Price API Client
 * Fetches NEO/GAS prices from global price API
 */

import { API_BASE_URL } from "./config";

export interface TokenPrice {
  symbol: string;
  usd: number;
  usd_24h_change: number;
}

export interface PriceResponse {
  neo: { usd: number; usd_24h_change: number };
  gas: { usd: number; usd_24h_change: number };
  timestamp: number;
}

let priceCache: { prices: TokenPrice[]; timestamp: number } | null = null;
const CACHE_TTL = 60000; // 1 minute

export async function getTokenPrices(): Promise<TokenPrice[]> {
  // Return cached if fresh
  if (priceCache && Date.now() - priceCache.timestamp < CACHE_TTL) {
    return priceCache.prices;
  }

  const url = `${API_BASE_URL}/price`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Price API error: ${res.status}`);

  const data: PriceResponse = await res.json();

  const prices: TokenPrice[] = [
    { symbol: "NEO", usd: data.neo?.usd || 0, usd_24h_change: data.neo?.usd_24h_change || 0 },
    { symbol: "GAS", usd: data.gas?.usd || 0, usd_24h_change: data.gas?.usd_24h_change || 0 },
  ];

  priceCache = { prices, timestamp: Date.now() };
  return prices;
}

export function calculateUsdValue(balance: string, price: number): string {
  return (parseFloat(balance) * price).toFixed(2);
}
