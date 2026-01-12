/**
 * useWallet - Wallet composable for uni-app
 * Provides wallet connection, balance, and transaction management
 */
import { ref, onMounted, onUnmounted } from "vue";
import { getSDKSync, waitForSDK, subscribeToWalletState, getWalletState } from "../bridge";
import { apiGet } from "../api";

export interface RequireConnectionOptions {
  /** Show prompt instead of throwing error (default: true) */
  showPrompt?: boolean;
  /** Custom error message */
  errorMessage?: string;
}

export interface WalletBalances {
  GAS: string;
  NEO: string;
  [key: string]: string;
}

export interface WalletTransaction {
  tx_hash: string;
  block: number;
  timestamp: string;
  asset: string;
  amount: string;
  direction: "in" | "out";
  counterparty: string;
}

export function useWallet() {
  const address = ref<string | null>(null);
  const balances = ref<WalletBalances>({ GAS: "0", NEO: "0" });
  const isConnected = ref(false);
  const isLoading = ref(false);
  const error = ref<Error | null>(null);
  const showConnectionPrompt = ref(false);
  const connectionPromptMessage = ref<string | null>(null);

  const connect = async () => {
    isLoading.value = true;
    error.value = null;
    try {
      const sdk = await waitForSDK();
      address.value = await sdk.wallet.getAddress();
      isConnected.value = true;
    } catch (e) {
      error.value = e as Error;
    } finally {
      isLoading.value = false;
    }
  };

  const invokeIntent = async (requestId: string) => {
    const sdk = getSDKSync();
    if (!sdk?.wallet?.invokeIntent) {
      throw new Error("invokeIntent not available");
    }
    return sdk.wallet.invokeIntent(requestId);
  };

  const invokeContract = async (params: { scriptHash: string; operation: string; args: any[] }) => {
    const sdk = await waitForSDK();
    // Use the generic invoke method path
    return sdk.invoke("invokeFunction", {
      contract: params.scriptHash,
      method: params.operation,
      args: params.args,
    });
  };

  const invokeRead = async (params: { contractHash?: string; operation: string; args?: any[]; network?: string }) => {
    const sdk = await waitForSDK();
    const contractHash = params.contractHash || sdk.getConfig?.().contractHash;
    if (!contractHash) {
      throw new Error("contract hash not configured");
    }
    return sdk.invoke("invokeRead", {
      contract: contractHash,
      method: params.operation,
      args: params.args || [],
      network: params.network,
    });
  };

  const getContractHash = async () => {
    const sdk = await waitForSDK();
    return sdk.getConfig?.().contractHash ?? null;
  };

  const getAddress = async () => {
    const sdk = await waitForSDK();
    return sdk.wallet.getAddress();
  };

  const getBalance = async (token?: string): Promise<string | WalletBalances> => {
    isLoading.value = true;
    error.value = null;
    try {
      const data = await apiGet<{ balances: WalletBalances }>("/wallet-balance");
      // Safely handle missing or invalid balances
      const safeBalances = data?.balances ?? { GAS: "0", NEO: "0" };
      balances.value = safeBalances;

      if (token) {
        return safeBalances[token] || "0";
      }
      return safeBalances;
    } catch (e) {
      error.value = e as Error;
      throw e;
    } finally {
      isLoading.value = false;
    }
  };

  const getTransactions = async (limit = 20): Promise<WalletTransaction[]> => {
    isLoading.value = true;
    error.value = null;
    try {
      // Validate limit parameter
      const validLimit = Number.isNaN(limit) || limit < 1 ? 20 : Math.min(limit, 100);
      const data = await apiGet<{ transactions: WalletTransaction[] }>(`/wallet-transactions?limit=${validLimit}`);
      return data.transactions;
    } catch (e) {
      error.value = e as Error;
      throw e;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Check if wallet is connected, show prompt if not
   * @returns true if connected, false otherwise
   */
  const requireConnection = (options: RequireConnectionOptions = {}): boolean => {
    const { showPrompt = true, errorMessage } = options;

    if (isConnected.value) {
      return true;
    }

    if (showPrompt) {
      connectionPromptMessage.value = errorMessage || null;
      showConnectionPrompt.value = true;
    }

    return false;
  };

  /**
   * Close the connection prompt
   */
  const closeConnectionPrompt = () => {
    showConnectionPrompt.value = false;
    connectionPromptMessage.value = null;
  };

  /**
   * Clear any wallet errors
   */
  const clearError = () => {
    error.value = null;
  };

  // Track unsubscribe function
  let unsubscribeWalletState: (() => void) | null = null;

  onMounted(() => {
    // First, check host wallet state (from postMessage)
    const hostState = getWalletState();
    if (hostState.connected && hostState.address) {
      address.value = hostState.address;
      isConnected.value = true;
      if (hostState.balance) {
        balances.value = {
          GAS: hostState.balance.gas || "0",
          NEO: hostState.balance.neo || "0",
        };
      }
    }

    // Subscribe to wallet state changes from host
    unsubscribeWalletState = subscribeToWalletState((state) => {
      if (state.connected && state.address) {
        address.value = state.address;
        isConnected.value = true;
        if (state.balance) {
          balances.value = {
            GAS: state.balance.gas || "0",
            NEO: state.balance.neo || "0",
          };
        }
      } else {
        address.value = null;
        isConnected.value = false;
        balances.value = { GAS: "0", NEO: "0" };
      }
    });

    // Fallback: try SDK directly (only if not already connected via host state)
    // Use a flag to prevent race condition with subscription updates
    const sdk = getSDKSync();
    if (sdk && !isConnected.value) {
      const wasConnectedBefore = isConnected.value;
      sdk.wallet
        .getAddress()
        .then((addr) => {
          // Only update if state hasn't changed since we started
          if (!wasConnectedBefore && !isConnected.value) {
            address.value = addr;
            isConnected.value = true;
          }
        })
        .catch((e) => {
          console.debug("[Neo SDK] Fallback wallet connection failed:", e?.message || e);
        });
    }
  });

  onUnmounted(() => {
    if (unsubscribeWalletState) {
      unsubscribeWalletState();
    }
  });

  return {
    // State
    address,
    balances,
    isConnected,
    isLoading,
    error,
    showConnectionPrompt,
    connectionPromptMessage,
    // Actions
    connect,
    invokeIntent,
    invokeContract,
    invokeRead,
    getContractHash,
    getAddress,
    getBalance,
    getTransactions,
    // Connection management
    requireConnection,
    closeConnectionPrompt,
    clearError,
  };
}
