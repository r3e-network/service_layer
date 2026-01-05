/**
 * MiniApp SDK Types for Mobile Wallet
 * Defines the SDK interface exposed to MiniApps via WebView bridge
 */

export type MiniAppSDKConfig = {
  edgeBaseUrl: string;
  appId?: string;
  getAuthToken?: () => Promise<string | undefined>;
  getAPIKey?: () => Promise<string | undefined>;
};

export type PayGASResponse = {
  request_id: string;
  intent?: {
    contract: string;
    method: string;
    params: unknown[];
  };
};

export type VoteResponse = {
  request_id: string;
  intent?: {
    contract: string;
    method: string;
    params: unknown[];
  };
};

export type RandomResponse = {
  randomness: string;
  attestation?: {
    signature: string;
    public_key: string;
    attestation_hash: string;
  };
};

export type PriceResponse = {
  symbol: string;
  price: string;
  timestamp: string;
};

export type UsageResponse = {
  app_id: string;
  date: string;
  gas_used: string;
  transaction_count: number;
};

export type EventsListParams = {
  app_id?: string;
  event_name?: string;
  limit?: number;
  after_id?: string;
};

export type TransactionsListParams = {
  app_id?: string;
  limit?: number;
  after_id?: string;
};

export type ListResponse<T> = {
  items: T[];
  has_more: boolean;
  last_id?: string;
};

export interface MiniAppSDK {
  getAddress?: () => Promise<string>;
  wallet: {
    getAddress: () => Promise<string>;
    invokeIntent: (requestId: string) => Promise<{ tx_hash: string }>;
  };
  payments: {
    payGAS: (appId: string, amount: string, memo?: string) => Promise<PayGASResponse>;
    payGASAndInvoke?: (appId: string, amount: string, memo?: string) => Promise<{ tx_hash: string }>;
  };
  governance: {
    vote: (appId: string, proposalId: string, neoAmount: string, support?: boolean) => Promise<VoteResponse>;
    voteAndInvoke?: (
      appId: string,
      proposalId: string,
      neoAmount: string,
      support?: boolean,
    ) => Promise<{ tx_hash: string }>;
  };
  rng: {
    requestRandom: (appId: string) => Promise<RandomResponse>;
  };
  datafeed: {
    getPrice: (symbol: string) => Promise<PriceResponse>;
  };
  stats: {
    getMyUsage: (appId: string, date?: string) => Promise<UsageResponse>;
  };
  events: {
    list: (params: EventsListParams) => Promise<ListResponse<unknown>>;
  };
  transactions: {
    list: (params: TransactionsListParams) => Promise<ListResponse<unknown>>;
  };
}
