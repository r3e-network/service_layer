// Neo Treasury Data Fetching Utilities
// Uses the same APIs as https://neo-treasury.pages.dev/

// Neo N3 RPC endpoints (same as original site)
const RPC_ENDPOINTS = [
  "https://n3seed1.ngd.network:10332",
  "https://n3seed2.ngd.network:10332",
  "https://neo-rpc1.red4sec.com:443",
];

// Contract addresses
const NEO_CONTRACT = "0xef4073a0f2b305a38ec4050e4d3d28bc40ea63f5";
const GAS_CONTRACT = "0xd2a4cff31913016155e38e474a2c06d08be276cf";

// CoinGecko API for prices
const COINGECKO_API =
  "https://api.coingecko.com/api/v3/simple/price?ids=neo,gas&vs_currencies=usd&include_24hr_change=true";

// Treasury wallet addresses (from original site)
export const TREASURY_WALLETS = {
  foundation: [
    { address: "Nb7UjsXESNNt4BYE3FjfuGnkQ5GPvzqfrP", label: "Foundation Main" },
    { address: "NfeTbHCGhdmTsQppX2U7bUGTwav4jtQC4e", label: "Foundation Reserve" },
  ],
  ecoFund: [
    { address: "NcHGkZWZLBTHMW2goppyDqBhar11wniBS5", label: "Eco Fund Main" },
    { address: "NdcBU7pkQZhLafCyhkQQy1nDA3prR4bHRH", label: "Eco Fund Reserve" },
  ],
  council: [{ address: "NaGHNnUiCg9KwmMiuSgtL15DP23LC2q9zT", label: "Council" }],
  earlySupporters: [{ address: "NbkpbWnAJ6YzXZp1t6pa8fZ91mKx5PXBX7", label: "Early Supporters" }],
};

export interface TokenBalance {
  neo: number;
  gas: number;
}

export interface WalletBalance {
  address: string;
  label: string;
  neo: number;
  gas: number;
}

export interface CategoryBalance {
  name: string;
  wallets: WalletBalance[];
  totalNeo: number;
  totalGas: number;
  totalUsd: number;
}

export interface PriceData {
  neo: { usd: number; usd_24h_change: number };
  gas: { usd: number; usd_24h_change: number };
}

export interface TreasuryData {
  categories: CategoryBalance[];
  totalNeo: number;
  totalGas: number;
  totalUsd: number;
  prices: PriceData;
  lastUpdated: number;
}

// RPC call helper
async function rpcCall(method: string, params: unknown[]): Promise<unknown> {
  for (const endpoint of RPC_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method,
          params,
        }),
      });
      const data = await res.json();
      if (data.result) return data.result;
    } catch (e) {
      console.warn(`RPC ${endpoint} failed:`, e);
    }
  }
  throw new Error("All RPC endpoints failed");
}

// Get NEP-17 balances for an address
async function getNep17Balances(address: string): Promise<TokenBalance> {
  const result = (await rpcCall("getnep17balances", [address])) as {
    balance: Array<{ assethash: string; amount: string }>;
  };

  let neo = 0;
  let gas = 0;

  for (const b of result.balance || []) {
    if (b.assethash === NEO_CONTRACT) {
      neo = parseInt(b.amount) / 1; // NEO has 0 decimals
    } else if (b.assethash === GAS_CONTRACT) {
      gas = parseInt(b.amount) / 1e8; // GAS has 8 decimals
    }
  }

  return { neo, gas };
}

// Fetch prices from CoinGecko
export async function fetchPrices(): Promise<PriceData> {
  try {
    const res = await fetch(COINGECKO_API);
    return await res.json();
  } catch {
    return {
      neo: { usd: 0, usd_24h_change: 0 },
      gas: { usd: 0, usd_24h_change: 0 },
    };
  }
}

// Fetch all treasury data
export async function fetchTreasuryData(): Promise<TreasuryData> {
  const prices = await fetchPrices();
  const categories: CategoryBalance[] = [];

  const categoryConfigs = [
    { key: "foundation", name: "Neo Foundation" },
    { key: "ecoFund", name: "Eco Fund" },
    { key: "council", name: "Council" },
    { key: "earlySupporters", name: "Early Supporters" },
  ];

  for (const config of categoryConfigs) {
    const walletConfigs = TREASURY_WALLETS[config.key as keyof typeof TREASURY_WALLETS];
    const wallets: WalletBalance[] = [];
    let totalNeo = 0;
    let totalGas = 0;

    for (const w of walletConfigs) {
      try {
        const balance = await getNep17Balances(w.address);
        wallets.push({ ...w, ...balance });
        totalNeo += balance.neo;
        totalGas += balance.gas;
      } catch (e) {
        console.warn(`Failed to fetch ${w.address}:`, e);
        wallets.push({ ...w, neo: 0, gas: 0 });
      }
    }

    const totalUsd = totalNeo * prices.neo.usd + totalGas * prices.gas.usd;
    categories.push({ name: config.name, wallets, totalNeo, totalGas, totalUsd });
  }

  const totalNeo = categories.reduce((s, c) => s + c.totalNeo, 0);
  const totalGas = categories.reduce((s, c) => s + c.totalGas, 0);
  const totalUsd = totalNeo * prices.neo.usd + totalGas * prices.gas.usd;

  return { categories, totalNeo, totalGas, totalUsd, prices, lastUpdated: Date.now() };
}
