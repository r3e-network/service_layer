/**
 * Multi-Chain SDK Types
 *
 * Core type definitions for the multi-chain miniapp SDK.
 */

// ============================================================================
// Chain Types (re-export from host)
// ============================================================================

export type ChainType = "neo-n3" | "evm";
export type ChainId = string;

export interface ChainInfo {
  id: ChainId;
  name: string;
  type: ChainType;
  icon: string;
  isTestnet: boolean;
}

// ============================================================================
// Account Types
// ============================================================================

export interface ChainAccount {
  chainId: ChainId;
  address: string;
  balance?: string;
}

export interface MultiChainAccount {
  activeChainId: ChainId;
  accounts: Record<ChainId, ChainAccount>;
}

// ============================================================================
// Transaction Types
// ============================================================================

export interface TransactionRequest {
  chainId: ChainId;
  to: string;
  value?: string;
  data?: string;
}

export interface TransactionResult {
  chainId: ChainId;
  txHash: string;
  status: "pending" | "confirmed" | "failed";
}

// ============================================================================
// Contract Types
// ============================================================================

export interface ContractCallRequest {
  chainId: ChainId;
  contractAddress: string;
  method: string;
  args?: unknown[];
  value?: string;
}

export interface ContractReadRequest {
  chainId: ChainId;
  contractAddress: string;
  method: string;
  args?: unknown[];
}

export interface ContractReadResult<T = unknown> {
  chainId: ChainId;
  data: T;
}

// ============================================================================
// Event Types
// ============================================================================

export type EventType = "block" | "transaction" | "contract" | "transfer";

export interface EventFilter {
  chainId: ChainId;
  type: EventType;
  contractAddress?: string;
  fromBlock?: number | "latest";
  toBlock?: number | "latest";
}

export interface ChainEvent {
  chainId: ChainId;
  type: EventType;
  blockNumber: number;
  txHash?: string;
  data: unknown;
  timestamp: number;
}

export type EventCallback = (event: ChainEvent) => void;

export interface EventSubscription {
  id: string;
  filter: EventFilter;
  unsubscribe: () => void;
}

// ============================================================================
// Error Types
// ============================================================================

export type SDKErrorCode =
  | "CHAIN_NOT_SUPPORTED"
  | "WALLET_NOT_CONNECTED"
  | "TRANSACTION_FAILED"
  | "CONTRACT_CALL_FAILED"
  | "INVALID_CHAIN_ID"
  | "USER_REJECTED"
  | "NETWORK_ERROR"
  | "UNKNOWN_ERROR";

export interface SDKError {
  code: SDKErrorCode;
  message: string;
  chainId?: ChainId;
  details?: unknown;
}

// ============================================================================
// SDK Interface
// ============================================================================

export interface IMultiChainSDK {
  // Chain Management
  getSupportedChains(): Promise<ChainInfo[]>;
  getActiveChain(): Promise<ChainInfo | null>;
  switchChain(chainId: ChainId): Promise<void>;

  // Account Management
  connect(chainId?: ChainId): Promise<ChainAccount>;
  disconnect(): Promise<void>;
  getAccount(chainId?: ChainId): ChainAccount | null;
  getAllAccounts(): MultiChainAccount | null;

  // Transactions
  sendTransaction(request: TransactionRequest): Promise<TransactionResult>;
  waitForTransaction(chainId: ChainId, txHash: string): Promise<TransactionResult>;

  // Contract Interactions
  callContract(request: ContractCallRequest): Promise<TransactionResult>;
  readContract<T = unknown>(request: ContractReadRequest): Promise<ContractReadResult<T>>;

  // Events
  subscribe(filter: EventFilter, callback: EventCallback): EventSubscription;
  unsubscribe(subscriptionId: string): void;

  // Utilities
  getBalance(chainId: ChainId, address?: string): Promise<string>;
  formatUnits(value: string, decimals: number): string;
  parseUnits(value: string, decimals: number): string;
}
