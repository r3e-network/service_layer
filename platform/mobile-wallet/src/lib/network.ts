/**
 * Network Configuration
 * Handles network selection and persistence
 */

import * as SecureStore from "expo-secure-store";
import { setNetwork as setRpcNetwork, Network } from "./neo/rpc";

const NETWORK_KEY = "selected_network";

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
