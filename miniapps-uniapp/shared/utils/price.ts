// Shared Price Feed Utility for MiniApps
// Uses the global price API from host-app

export interface PriceData {
  neo: { usd: number; usd_24h_change: number };
  gas: { usd: number; usd_24h_change: number };
  timestamp: number;
}

// Cache for price data
let priceCache: PriceData | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60 * 1000; // 1 minute local cache

/**
 * Get NEO and GAS prices from the global price feed
 * Uses host-app API with local caching
 */
export async function getPrices(): Promise<PriceData> {
  const now = Date.now();

  // Return cached data if still valid
  if (priceCache && now - cacheTimestamp < CACHE_TTL) {
    return priceCache;
  }

  try {
    // Try to get from host-app API via SDK
    const sdk = await import("@neo/uniapp-sdk").then((m) => m.waitForSDK?.() || null);
    if (sdk) {
      const data = await sdk.invoke("datafeed.getPrices", {});
      if (data) {
        priceCache = data as PriceData;
        cacheTimestamp = now;
        return priceCache;
      }
    }
  } catch {
    // Fallback to direct API call
  }

  // Fallback: direct API call
  const res = await fetch("/api/price");
  if (!res.ok) throw new Error("Failed to fetch prices");

  priceCache = await res.json();
  cacheTimestamp = now;
  return priceCache!;
}

/**
 * Format price with USD symbol
 */
export function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

/**
 * Format price change with + or - prefix
 */
export function formatPriceChange(change: number): string {
  const prefix = change >= 0 ? "+" : "";
  return `${prefix}${change.toFixed(2)}%`;
}

/**
 * Calculate USD value from token amounts
 */
export function calculateUsdValue(neo: number, gas: number, prices: PriceData): number {
  return neo * prices.neo.usd + gas * prices.gas.usd;
}
