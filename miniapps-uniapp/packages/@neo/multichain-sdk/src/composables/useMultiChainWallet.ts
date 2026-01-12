/**
 * Multi-Chain Wallet Composable
 *
 * Vue composable for managing multi-chain wallet connections.
 */

import { ref, computed, readonly } from "vue";
import { getMultiChainBridge } from "../bridge";
import type { ChainId, ChainInfo, ChainAccount, MultiChainAccount } from "../types";

// Shared state across all component instances
const isConnected = ref(false);
const isConnecting = ref(false);
const activeChainId = ref<ChainId | null>(null);
const accounts = ref<Record<ChainId, ChainAccount>>({});
const supportedChains = ref<ChainInfo[]>([]);
const error = ref<string | null>(null);

export function useMultiChainWallet() {
  const bridge = getMultiChainBridge();

  // Computed
  const activeAccount = computed(() => {
    if (!activeChainId.value) return null;
    return accounts.value[activeChainId.value] || null;
  });

  const activeChain = computed(() => {
    if (!activeChainId.value) return null;
    return supportedChains.value.find((c) => c.id === activeChainId.value) || null;
  });

  // Methods
  async function loadChains(): Promise<void> {
    try {
      supportedChains.value = await bridge.getSupportedChains();
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Failed to load chains";
    }
  }

  async function connect(chainId?: ChainId): Promise<ChainAccount | null> {
    if (isConnecting.value) return null;

    isConnecting.value = true;
    error.value = null;

    try {
      const account = await bridge.connect(chainId);
      accounts.value[account.chainId] = account;
      activeChainId.value = account.chainId;
      isConnected.value = true;
      return account;
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Connection failed";
      return null;
    } finally {
      isConnecting.value = false;
    }
  }

  async function disconnect(): Promise<void> {
    try {
      await bridge.disconnect();
      isConnected.value = false;
      activeChainId.value = null;
      accounts.value = {};
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Disconnect failed";
    }
  }

  async function switchChain(chainId: ChainId): Promise<boolean> {
    error.value = null;

    try {
      await bridge.switchChain(chainId);
      activeChainId.value = chainId;

      // Reconnect to get new account for this chain
      if (!accounts.value[chainId]) {
        await connect(chainId);
      }
      return true;
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Chain switch failed";
      return false;
    }
  }

  async function getBalance(chainId?: ChainId): Promise<string | null> {
    const targetChain = chainId || activeChainId.value;
    if (!targetChain) return null;

    try {
      return await bridge.getBalance(targetChain);
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Failed to get balance";
      return null;
    }
  }

  return {
    // State (readonly)
    isConnected: readonly(isConnected),
    isConnecting: readonly(isConnecting),
    activeChainId: readonly(activeChainId),
    accounts: readonly(accounts),
    supportedChains: readonly(supportedChains),
    error: readonly(error),

    // Computed
    activeAccount,
    activeChain,

    // Methods
    loadChains,
    connect,
    disconnect,
    switchChain,
    getBalance,
  };
}
