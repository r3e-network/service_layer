/**
 * Multi-Chain Contract Composable
 *
 * Vue composable for interacting with smart contracts across chains.
 */

import { ref, readonly } from "vue";
import { getMultiChainBridge } from "../bridge";
import type { ChainId, ContractCallRequest, ContractReadRequest, TransactionResult } from "../types";

export function useMultiChainContract() {
  const bridge = getMultiChainBridge();
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const lastTxResult = ref<TransactionResult | null>(null);

  async function callContract(
    chainId: ChainId,
    contractAddress: string,
    method: string,
    args?: unknown[],
    value?: string,
  ): Promise<TransactionResult | null> {
    isLoading.value = true;
    error.value = null;

    try {
      const request: ContractCallRequest = {
        chainId,
        contractAddress,
        method,
        args,
        value,
      };
      const result = await bridge.callContract(request);
      lastTxResult.value = result;
      return result;
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Contract call failed";
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  async function readContract<T = unknown>(
    chainId: ChainId,
    contractAddress: string,
    method: string,
    args?: unknown[],
  ): Promise<T | null> {
    isLoading.value = true;
    error.value = null;

    try {
      const request: ContractReadRequest = {
        chainId,
        contractAddress,
        method,
        args,
      };
      const result = await bridge.readContract<T>(request);
      return result.data;
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Contract read failed";
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  async function waitForTx(chainId: ChainId, txHash: string): Promise<TransactionResult | null> {
    try {
      return await bridge.waitForTransaction(chainId, txHash);
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Wait for tx failed";
      return null;
    }
  }

  return {
    isLoading: readonly(isLoading),
    error: readonly(error),
    lastTxResult: readonly(lastTxResult),
    callContract,
    readContract,
    waitForTx,
  };
}
