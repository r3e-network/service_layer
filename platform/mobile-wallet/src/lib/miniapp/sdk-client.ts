/**
 * MiniApp SDK Client for Mobile Wallet
 * Creates SDK instance for communication with Edge functions
 */

import type { MiniAppSDKConfig, MiniAppSDK } from "./sdk-types";
import { getRpcUrl, resolveChainType } from "@/lib/chains";
import type { ChainType } from "@/lib/chains";

const DEFAULT_EDGE_URL = "https://neomini.app/functions/v1";
let rpcRequestId = 0;

export function createMiniAppSDK(config: MiniAppSDKConfig): MiniAppSDK {
  const baseUrl = config.edgeBaseUrl || DEFAULT_EDGE_URL;
  const chainId = config.chainId ?? null;
  const chainType = config.chainType ?? resolveChainType(chainId);
  const contractAddress = config.contractAddress ?? null;
  const supportedChains = config.supportedChains;
  const chainContracts = config.chainContracts;

  async function fetchWithAuth(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (config.getAuthToken) {
      const token = await config.getAuthToken();
      if (token) headers["Authorization"] = `Bearer ${token}`;
    }

    if (config.getAPIKey) {
      const apiKey = await config.getAPIKey();
      if (apiKey) headers["X-API-Key"] = apiKey;
    }

    return fetch(`${baseUrl}${endpoint}`, { ...options, headers });
  }

  async function post<T>(endpoint: string, body: unknown): Promise<T> {
    const res = await fetchWithAuth(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || "Request failed");
    }
    return res.json();
  }

  async function get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const url = params ? `${endpoint}?${new URLSearchParams(params)}` : endpoint;
    const res = await fetchWithAuth(url);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || "Request failed");
    }
    return res.json();
  }

  async function rpcCall(
    method: string,
    params: unknown[],
    targetChainId?: string | null,
    targetChainType?: ChainType,
  ) {
    const resolvedChainType = targetChainType || chainType || resolveChainType(targetChainId ?? null);
    const rpcUrl = getRpcUrl(targetChainId ?? null, resolvedChainType);
    if (!rpcUrl) {
      throw new Error("RPC endpoint unavailable");
    }
    const res = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: ++rpcRequestId,
        method,
        params,
      }),
    });
    if (!res.ok) {
      throw new Error(`RPC request failed: ${res.status}`);
    }
    const data = await res.json();
    if (data.error) {
      throw new Error(data.error.message || "RPC error");
    }
    return data.result;
  }

  return {
    getConfig: () => ({
      appId: config.appId,
      chainId,
      chainType: chainType || undefined,
      contractAddress,
      supportedChains,
      chainContracts,
      debug: false,
    }),
    invokeRead: async (params) => {
      const contract = params.contract || contractAddress;
      const method = params.method || (params as { operation?: string }).operation;
      const targetChainId = params.chainId || chainId;
      const targetChainType = params.chainType || chainType || resolveChainType(targetChainId ?? null);

      if (targetChainType === "evm") {
        const to = params.to || contract;
        const data = params.data;
        if (!to || !data) {
          throw new Error("EVM invokeRead requires contract/to and data");
        }
        return rpcCall("eth_call", [{ to, data }, "latest"], targetChainId, targetChainType);
      }

      if (!contract) throw new Error("contract address required");
      if (!method) throw new Error("method required");
      return rpcCall("invokefunction", [contract, method, params.args || []], targetChainId, targetChainType);
    },
    invokeFunction: async () => {
      throw new Error("invokeFunction is not supported in the mobile wallet host");
    },
    wallet: {
      getAddress: async () => {
        // This will be overridden by the bridge to use native wallet
        throw new Error("wallet.getAddress must be provided by native bridge");
      },
      invokeIntent: async (requestId: string) => {
        // This will be overridden by the bridge to use native wallet
        throw new Error("wallet.invokeIntent must be provided by native bridge");
      },
    },
    payments: {
      payGAS: async (appId, amount, memo) => {
        return post("/pay-gas", { app_id: appId, amount, memo, chain_id: chainId || undefined });
      },
      payGASAndInvoke: async (appId, amount, memo) => {
        return post("/pay-gas-invoke", { app_id: appId, amount, memo, chain_id: chainId || undefined });
      },
    },
    governance: {
      vote: async (appId, proposalId, neoAmount, support) => {
        return post("/vote", {
          app_id: appId,
          proposal_id: proposalId,
          neo_amount: neoAmount,
          support,
          chain_id: chainId || undefined,
        });
      },
      voteAndInvoke: async (appId, proposalId, neoAmount, support) => {
        return post("/vote-invoke", {
          app_id: appId,
          proposal_id: proposalId,
          neo_amount: neoAmount,
          support,
          chain_id: chainId || undefined,
        });
      },
    },
    rng: {
      requestRandom: async (appId) => {
        return post("/rng", { app_id: appId, chain_id: chainId || undefined });
      },
    },
    datafeed: {
      getPrice: async (symbol) => {
        return get("/price", { symbol });
      },
    },
    stats: {
      getMyUsage: async (appId, date) => {
        const params: Record<string, string> = { app_id: appId };
        if (date) params.date = date;
        if (chainId) params.chain_id = chainId;
        return get("/usage", params);
      },
    },
    events: {
      list: async (params) => {
        const query: Record<string, string> = {};
        if (params.app_id) query.app_id = params.app_id;
        if (params.event_name) query.event_name = params.event_name;
        if (params.limit) query.limit = String(params.limit);
        if (params.after_id) query.after_id = params.after_id;
        if (chainId) query.chain_id = chainId;
        return get("/events-list", query);
      },
    },
    transactions: {
      list: async (params) => {
        const query: Record<string, string> = {};
        if (params.app_id) query.app_id = params.app_id;
        if (params.limit) query.limit = String(params.limit);
        if (params.after_id) query.after_id = params.after_id;
        if (chainId) query.chain_id = chainId;
        return get("/transactions-list", query);
      },
    },
  };
}
