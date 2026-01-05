/**
 * MiniApp SDK Client for Mobile Wallet
 * Creates SDK instance for communication with Edge functions
 */

import type { MiniAppSDKConfig, MiniAppSDK } from "./sdk-types";

const DEFAULT_EDGE_URL = "https://neomini.app/functions/v1";

export function createMiniAppSDK(config: MiniAppSDKConfig): MiniAppSDK {
  const baseUrl = config.edgeBaseUrl || DEFAULT_EDGE_URL;

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

  return {
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
        return post("/pay-gas", { app_id: appId, amount, memo });
      },
      payGASAndInvoke: async (appId, amount, memo) => {
        return post("/pay-gas-invoke", { app_id: appId, amount, memo });
      },
    },
    governance: {
      vote: async (appId, proposalId, neoAmount, support) => {
        return post("/vote", { app_id: appId, proposal_id: proposalId, neo_amount: neoAmount, support });
      },
      voteAndInvoke: async (appId, proposalId, neoAmount, support) => {
        return post("/vote-invoke", { app_id: appId, proposal_id: proposalId, neo_amount: neoAmount, support });
      },
    },
    rng: {
      requestRandom: async (appId) => {
        return post("/rng", { app_id: appId });
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
        return get("/events-list", query);
      },
    },
    transactions: {
      list: async (params) => {
        const query: Record<string, string> = {};
        if (params.app_id) query.app_id = params.app_id;
        if (params.limit) query.limit = String(params.limit);
        if (params.after_id) query.after_id = params.after_id;
        return get("/transactions-list", query);
      },
    },
  };
}
