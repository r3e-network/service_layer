/**
 * Custom Token Management
 * Handles NEP-17 token storage and balance queries
 */

import * as SecureStore from "expo-secure-store";

const TOKENS_KEY = "custom_tokens";

export interface Token {
  contractAddress: string;
  symbol: string;
  name: string;
  decimals: number;
}

export async function loadTokens(): Promise<Token[]> {
  const data = await SecureStore.getItemAsync(TOKENS_KEY);
  return data ? JSON.parse(data) : [];
}

export async function saveToken(token: Token): Promise<void> {
  const tokens = await loadTokens();
  const exists = tokens.some((t) => t.contractAddress === token.contractAddress);
  if (!exists) {
    tokens.push(token);
    await SecureStore.setItemAsync(TOKENS_KEY, JSON.stringify(tokens));
  }
}

export async function removeToken(contractAddress: string): Promise<void> {
  const tokens = await loadTokens();
  const filtered = tokens.filter((t) => t.contractAddress !== contractAddress);
  await SecureStore.setItemAsync(TOKENS_KEY, JSON.stringify(filtered));
}
