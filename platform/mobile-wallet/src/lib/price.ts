/**
 * Price API Client
 * Fetches NEO/GAS prices from CoinGecko
 */

const COINGECKO_API = "https://api.coingecko.com/api/v3";

export interface TokenPrice {
  symbol: string;
  usd: number;
  usd_24h_change: number;
}

let priceCache: { prices: TokenPrice[]; timestamp: number } | null = null;
const CACHE_TTL = 60000; // 1 minute

export async function getTokenPrices(): Promise<TokenPrice[]> {
  // Return cached if fresh
  if (priceCache && Date.now() - priceCache.timestamp < CACHE_TTL) {
    return priceCache.prices;
  }

  const url = `${COINGECKO_API}/simple/price?ids=neo,gas&vs_currencies=usd&include_24hr_change=true`;
  const res = await fetch(url);
  const data = await res.json();

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
