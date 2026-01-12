export interface PriceData {
  neo: { usd: number; usd_24h_change: number };
  gas: { usd: number; usd_24h_change: number };
  timestamp: number;
}

const DEFAULT_PRICE: PriceData = {
  neo: { usd: 0, usd_24h_change: 0 },
  gas: { usd: 0, usd_24h_change: 0 },
  timestamp: 0,
};

const CACHE_TTL = 60_000;

// SSR-safe cache: only cache on client side to avoid cross-request pollution
interface PriceCache {
  data: PriceData | null;
  lastFetch: number;
}

function getCache(): PriceCache {
  if (typeof window === "undefined") {
    // SSR: return fresh cache per request
    return { data: null, lastFetch: 0 };
  }
  // Client: use window-scoped cache
  const w = window as typeof window & { __priceCache?: PriceCache };
  if (!w.__priceCache) {
    w.__priceCache = { data: null, lastFetch: 0 };
  }
  return w.__priceCache;
}

async function fetchPriceFrom(url: string): Promise<PriceData> {
  const res = await fetch(url, { method: "GET", credentials: "include" });
  if (!res.ok) {
    throw new Error(`Price fetch failed: ${res.status}`);
  }
  const data = await res.json();
  const now = Date.now();
  return {
    neo: {
      usd: Number(data.neo?.usd ?? 0),
      usd_24h_change: Number(data.neo?.usd_24h_change ?? 0),
    },
    gas: {
      usd: Number(data.gas?.usd ?? 0),
      usd_24h_change: Number(data.gas?.usd_24h_change ?? 0),
    },
    timestamp: Number(data.timestamp ?? now),
  };
}

export async function getPrices(): Promise<PriceData> {
  const now = Date.now();
  const priceCache = getCache();

  if (priceCache.data && now - priceCache.lastFetch < CACHE_TTL) {
    return priceCache.data;
  }

  const apiBase = typeof import.meta !== "undefined" ? (import.meta as any).env?.VITE_API_BASE : undefined;
  const endpoints = ["/api/price"];
  if (apiBase) {
    endpoints.push(`${apiBase.replace(/\/$/, "")}/price`);
  }

  for (const url of endpoints) {
    try {
      const result = await fetchPriceFrom(url);
      priceCache.data = result;
      priceCache.lastFetch = now;
      return result;
    } catch {
      // Try next endpoint.
    }
  }

  const fallback = priceCache.data || { ...DEFAULT_PRICE, timestamp: now };
  priceCache.data = fallback;
  priceCache.lastFetch = now;
  return fallback;
}
