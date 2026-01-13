/**
 * Multi-Chain RPC Client
 * Handles blockchain queries and transaction broadcasting for Neo N3 and EVM chains
 */

import type { ChainId } from "@/types/miniapp";
import { resolveChainType, getRpcUrl, type ChainType } from "@/lib/chains";

export type Network = "mainnet" | "testnet";

// Legacy Neo N3 RPC endpoints (fallback)
const NEO_RPC_ENDPOINTS: Record<Network, string> = {
  mainnet: "https://mainnet1.neo.coz.io:443",
  testnet: "https://testnet1.neo.coz.io:443",
};

// Neo N3 native contract addresses
const NEO_CONTRACTS = {
  NEO: "0xef4073a0f2b305a38ec4050e4d3d28bc40ea63f5",
  GAS: "0xd2a4cff31913016155e38e474a2c06d08be276cf",
};

export interface Balance {
  symbol: string;
  amount: string;
  decimals: number;
}

export interface RpcResponse<T> {
  jsonrpc: string;
  id: number;
  result?: T;
  error?: { code: number; message: string };
}

// Current chain state
let currentNetwork: Network = "mainnet";
let currentChainId: ChainId | null = null;

export function setNetwork(network: Network) {
  currentNetwork = network;
  // Update chainId based on network
  currentChainId = network === "mainnet" ? "neo-n3-mainnet" : "neo-n3-testnet";
}

export function getNetwork(): Network {
  return currentNetwork;
}

export function setChainId(chainId: ChainId) {
  currentChainId = chainId;
  // Update legacy network for backward compatibility
  if (chainId.includes("mainnet")) {
    currentNetwork = "mainnet";
  } else {
    currentNetwork = "testnet";
  }
}

export function getChainId(): ChainId | null {
  return currentChainId;
}

export function getCurrentChainType(): ChainType | undefined {
  return currentChainId ? resolveChainType(currentChainId) : "neo-n3";
}

function getCurrentRpcUrl(): string {
  if (currentChainId) {
    const url = getRpcUrl(currentChainId);
    if (url) return url;
  }
  return NEO_RPC_ENDPOINTS[currentNetwork];
}

async function rpcCall<T>(method: string, params: unknown[]): Promise<T> {
  const rpcUrl = getCurrentRpcUrl();
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const data: RpcResponse<T> = await response.json();
  if (data.error) throw new Error(data.error.message);
  return data.result as T;
}

export async function getNeoBalance(address: string): Promise<Balance> {
  const result = await rpcCall<{ balance: string }>("invokefunction", [
    NEO_CONTRACTS.NEO,
    "balanceOf",
    [{ type: "Hash160", value: addressToScriptHash(address) }],
  ]);
  return { symbol: "NEO", amount: result.balance || "0", decimals: 0 };
}

export async function getGasBalance(address: string): Promise<Balance> {
  const result = await rpcCall<{ balance: string }>("invokefunction", [
    NEO_CONTRACTS.GAS,
    "balanceOf",
    [{ type: "Hash160", value: addressToScriptHash(address) }],
  ]);
  const raw = result.balance || "0";
  const amount = (parseInt(raw) / 1e8).toFixed(8);
  return { symbol: "GAS", amount, decimals: 8 };
}

export async function getBalances(address: string): Promise<Balance[]> {
  const [neo, gas] = await Promise.all([getNeoBalance(address), getGasBalance(address)]);
  return [neo, gas];
}

const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

/**
 * Convert Neo address to script hash using base58 decode
 */
function addressToScriptHash(address: string): string {
  let num = 0n;
  for (const char of address) {
    num = num * 58n + BigInt(BASE58_ALPHABET.indexOf(char));
  }
  const hex = num.toString(16).padStart(50, "0");
  // Skip version byte (2 chars), take script hash (40 chars)
  return hex.substring(2, 42);
}

/**
 * Send raw transaction to network
 */
export async function sendRawTransaction(signedTx: string): Promise<{ hash: string }> {
  const result = await rpcCall<{ hash: string }>("sendrawtransaction", [signedTx]);
  return result;
}

/**
 * Get transaction status
 */
export async function getTransaction(txHash: string): Promise<unknown> {
  return rpcCall("getrawtransaction", [txHash, true]);
}

/**
 * Get NEP-17 token balance
 */
export async function getTokenBalance(address: string, contractAddress: string, decimals: number): Promise<Balance> {
  const result = await rpcCall<{ stack: Array<{ value: string }> }>("invokefunction", [
    contractAddress,
    "balanceOf",
    [{ type: "Hash160", value: addressToScriptHash(address) }],
  ]);
  const raw = result.stack?.[0]?.value || "0";
  const amount = decimals > 0 ? (parseInt(raw) / Math.pow(10, decimals)).toFixed(decimals) : raw;
  return { symbol: "", amount, decimals };
}
