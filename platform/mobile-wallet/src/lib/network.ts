/**
 * Network Configuration
 * Handles network selection and persistence for multi-chain support
 */

import * as SecureStore from "expo-secure-store";
import { setNetwork as setRpcNetwork, setChainId as setRpcChainId, Network } from "./neo/rpc";
import type { ChainId } from "@/types/miniapp";

const NETWORK_KEY = "selected_network";
const CHAIN_ID_KEY = "selected_chain_id";

export type { Network };

export async function loadNetwork(): Promise<Network> {
  const saved = await SecureStore.getItemAsync(NETWORK_KEY);
  const network = (saved as Network) || "mainnet";
  setRpcNetwork(network);
  return network;
}

export async function saveNetwork(network: Network): Promise<void> {
  await SecureStore.setItemAsync(NETWORK_KEY, network);
  setRpcNetwork(network);
}

export async function loadChainId(): Promise<ChainId | null> {
  const saved = await SecureStore.getItemAsync(CHAIN_ID_KEY);
  if (saved) {
    setRpcChainId(saved as ChainId);
    return saved as ChainId;
  }
  return null;
}

export async function saveChainId(chainId: ChainId): Promise<void> {
  await SecureStore.setItemAsync(CHAIN_ID_KEY, chainId);
  setRpcChainId(chainId);
}
