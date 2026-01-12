/**
 * Neo MiniApp SDK Types for uni-app
 */

export interface PayGASResponse {
  request_id: string;
  user_id: string;
  intent: "payments";
  constraints: { settlement: "GAS_ONLY" };
  invocation: InvocationIntent;
  txid?: string | null;
  receipt_id?: string | null;
}

export interface VoteBNEOResponse {
  request_id: string;
  user_id: string;
  intent: "governance";
  constraints: { governance: "BNEO_ONLY" };
  invocation: InvocationIntent;
  txid?: string | null;
}

export interface RNGResponse {
  request_id: string;
  app_id: string;
  randomness: string;
  signature?: string;
  public_key?: string;
  attestation_hash?: string;
  report_hash?: string;
  anchored_tx?: unknown;
}

export interface PriceResponse {
  feed_id: string;
  pair: string;
  price: string;
  decimals: number;
  timestamp: string;
  sources: string[];
}

export interface EventsListParams {
  app_id?: string;
  event_name?: string;
  contract_hash?: string;
  limit?: number;
  after_id?: string;
}

export interface ContractEvent {
  id: string;
  tx_hash: string;
  block_index: number;
  contract_hash: string;
  event_name: string;
  app_id: string | null;
  state: unknown;
  created_at: string;
}

export interface EventsListResponse {
  events: ContractEvent[];
  has_more: boolean;
  last_id: string | null;
}

export interface TransactionsListParams {
  app_id?: string;
  limit?: number;
  after_id?: string;
}

export interface ChainTransaction {
  id: string;
  tx_hash: string | null;
  request_id: string;
  from_service: string;
  tx_type: string;
  contract_address: string;
  method_name: string;
  params: Record<string, unknown>;
  gas_consumed: number | null;
  status: string;
  retry_count: number;
  error_message: string | null;
  rpc_endpoint: string | null;
  submitted_at: string;
  confirmed_at: string | null;
}

export interface TransactionsListResponse {
  transactions: ChainTransaction[];
  has_more: boolean;
  last_id: string | null;
}

export interface InvocationIntent {
  contract_hash?: string;
  contract?: string;
  method: string;
  params?: unknown[];
  args?: unknown[];
}

/** App usage statistics */
export interface AppUsageStats {
  app_id: string;
  date: string;
  transactions: number;
  volume_gas: string;
  unique_users: number;
}

export interface MiniAppSDK {
  invoke(method: string, params?: Record<string, unknown>): Promise<unknown>;
  getConfig(): NeoSDKConfig;
  wallet: {
    getAddress(): Promise<string>;
    invokeIntent?(requestId: string): Promise<unknown>;
  };
  payments: {
    payGAS(appId: string, amount: string, memo?: string): Promise<PayGASResponse>;
  };
  governance: {
    vote(appId: string, proposalId: string, amount: string, support?: boolean): Promise<VoteBNEOResponse>;
    getCandidates(): Promise<CandidatesResponse>;
  };
  rng: {
    requestRandom(appId: string): Promise<RNGResponse>;
  };
  datafeed: {
    getPrice(symbol: string): Promise<PriceResponse>;
  };
  events?: {
    list(params?: EventsListParams): Promise<EventsListResponse>;
  };
  transactions?: {
    list(params?: TransactionsListParams): Promise<TransactionsListResponse>;
  };
  stats?: {
    getMyUsage(appId: string, date?: string): Promise<AppUsageStats>;
  };
}

export interface NeoSDKConfig {
  appId: string;
  contractHash?: string | null;
  debug?: boolean;
}

export type NetworkType = "testnet" | "mainnet";

/** Neo Governance Candidate */
export interface Candidate {
  address: string;
  publicKey: string;
  name?: string;
  votes: string;
  active: boolean;
}

/** Candidates list response */
export interface CandidatesResponse {
  candidates: Candidate[];
  totalVotes: string;
  blockHeight: number;
}
