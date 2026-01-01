/**
 * Gas Fee Estimation
 * Handles transaction fee estimation and network status
 */

import * as SecureStore from "expo-secure-store";

const FEE_HISTORY_KEY = "gas_fee_history";

export type FeeTier = "fast" | "standard" | "economy";
export type TxType = "transfer" | "nep17" | "nep11" | "contract" | "vote";

export interface FeeEstimate {
  tier: FeeTier;
  networkFee: number;
  systemFee: number;
  total: number;
  confirmTime: string;
}

export interface NetworkStatus {
  congestion: "low" | "medium" | "high";
  avgBlockTime: number;
  pendingTx: number;
  lastBlock: number;
}

export interface FeeRecord {
  id: string;
  txHash: string;
  txType: TxType;
  fee: number;
  timestamp: number;
}

// Base fees by transaction type (in GAS)
const BASE_FEES: Record<TxType, number> = {
  transfer: 0.001,
  nep17: 0.002,
  nep11: 0.005,
  contract: 0.01,
  vote: 0.001,
};

// Tier multipliers
const TIER_MULTIPLIERS: Record<FeeTier, number> = {
  fast: 1.5,
  standard: 1.0,
  economy: 0.7,
};

// Confirmation times by tier
const CONFIRM_TIMES: Record<FeeTier, string> = {
  fast: "~15s",
  standard: "~30s",
  economy: "~60s",
};

/**
 * Estimate fee for a transaction type
 */
export function estimateFee(txType: TxType, tier: FeeTier): FeeEstimate {
  const baseFee = BASE_FEES[txType] || BASE_FEES.transfer;
  const multiplier = TIER_MULTIPLIERS[tier];
  const networkFee = baseFee * multiplier;
  const systemFee = baseFee * 0.5;

  return {
    tier,
    networkFee,
    systemFee,
    total: networkFee + systemFee,
    confirmTime: CONFIRM_TIMES[tier],
  };
}

/**
 * Get all tier estimates for a transaction type
 */
export function getAllTierEstimates(txType: TxType): FeeEstimate[] {
  return (["fast", "standard", "economy"] as FeeTier[]).map((tier) => estimateFee(txType, tier));
}

/**
 * Get network congestion status
 */
export function getNetworkStatus(pendingTx: number): NetworkStatus {
  let congestion: NetworkStatus["congestion"] = "low";
  if (pendingTx > 100) congestion = "high";
  else if (pendingTx > 50) congestion = "medium";

  return {
    congestion,
    avgBlockTime: 15,
    pendingTx,
    lastBlock: Date.now(),
  };
}

/**
 * Load fee history from storage
 */
export async function loadFeeHistory(): Promise<FeeRecord[]> {
  const data = await SecureStore.getItemAsync(FEE_HISTORY_KEY);
  return data ? JSON.parse(data) : [];
}

/**
 * Save fee record to history
 */
export async function saveFeeRecord(record: FeeRecord): Promise<void> {
  const history = await loadFeeHistory();
  history.unshift(record);
  // Keep last 100 records
  const trimmed = history.slice(0, 100);
  await SecureStore.setItemAsync(FEE_HISTORY_KEY, JSON.stringify(trimmed));
}

/**
 * Generate unique record ID
 */
export function generateFeeRecordId(): string {
  return `fee_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Format GAS amount for display
 */
export function formatFee(amount: number): string {
  return amount.toFixed(8);
}

/**
 * Calculate average fee from history
 */
export async function getAverageFee(): Promise<number> {
  const history = await loadFeeHistory();
  if (history.length === 0) return 0;
  const sum = history.reduce((acc, r) => acc + r.fee, 0);
  return sum / history.length;
}

/**
 * Get transaction type label
 */
export function getTxTypeLabel(txType: TxType): string {
  const labels: Record<TxType, string> = {
    transfer: "Transfer",
    nep17: "Token Transfer",
    nep11: "NFT Transfer",
    contract: "Contract Call",
    vote: "Vote",
  };
  return labels[txType] || "Unknown";
}

/**
 * Fetch pending transaction count from network
 */
export async function fetchPendingTxCount(): Promise<number> {
  try {
    const response = await fetch("https://mainnet1.neo.coz.io:443", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getrawmempool", params: [] }),
    });
    const data = await response.json();
    return Array.isArray(data.result) ? data.result.length : 0;
  } catch {
    return 0;
  }
}
