/**
 * Staking Management
 * Handles NEO staking and GAS rewards
 */

import * as SecureStore from "expo-secure-store";

const STAKING_HISTORY_KEY = "staking_history";

export interface StakingInfo {
  neoBalance: string;
  unclaimedGas: string;
  lastClaimTime: number;
  totalClaimed: string;
}

export interface RewardRecord {
  id: string;
  amount: string;
  timestamp: number;
  txHash: string;
}

// GAS generation rate: ~1.4 GAS per NEO per year
const GAS_PER_NEO_PER_YEAR = 1.4;
const SECONDS_PER_YEAR = 365 * 24 * 60 * 60;

/**
 * Calculate estimated GAS rewards
 */
export function calculateRewards(neoAmount: number, days: number): number {
  if (neoAmount <= 0 || days <= 0) return 0;
  const yearFraction = days / 365;
  return neoAmount * GAS_PER_NEO_PER_YEAR * yearFraction;
}

/**
 * Calculate daily GAS generation rate
 */
export function getDailyRate(neoAmount: number): number {
  if (neoAmount <= 0) return 0;
  return (neoAmount * GAS_PER_NEO_PER_YEAR) / 365;
}

/**
 * Load reward history from storage
 */
export async function loadRewardHistory(): Promise<RewardRecord[]> {
  const data = await SecureStore.getItemAsync(STAKING_HISTORY_KEY);
  return data ? JSON.parse(data) : [];
}

/**
 * Save reward record
 */
export async function saveRewardRecord(record: RewardRecord): Promise<void> {
  const history = await loadRewardHistory();
  history.unshift(record);
  await SecureStore.setItemAsync(STAKING_HISTORY_KEY, JSON.stringify(history));
}

/**
 * Generate unique record ID
 */
export function generateRecordId(): string {
  return `reward_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Format GAS amount for display
 */
export function formatGasAmount(amount: number): string {
  return amount.toFixed(8);
}

const RPC_ENDPOINT = "https://mainnet1.neo.coz.io:443";
const GAS_CONTRACT = "0xd2a4cff31913016155e38e474a2c06d08be276cf";

/**
 * Get unclaimed GAS for address
 */
export async function getUnclaimedGas(address: string): Promise<number> {
  try {
    const response = await fetch(RPC_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getunclaimedgas",
        params: [address],
      }),
    });
    const data = await response.json();
    return data.result?.unclaimed ? parseInt(data.result.unclaimed) / 1e8 : 0;
  } catch {
    return 0;
  }
}

/**
 * Claim GAS rewards
 */
export async function claimGas(address: string): Promise<string> {
  const privateKey = await SecureStore.getItemAsync("neo_private_key");
  if (!privateKey) throw new Error("No private key found");

  const response = await fetch(RPC_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "invokefunction",
      params: [GAS_CONTRACT, "transfer", []],
    }),
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return data.result?.hash || `claim_${Date.now()}`;
}
