/**
 * Multi-Chain SDK Bridge
 *
 * Handles communication between miniapps and the host application
 * via postMessage for multi-chain operations.
 */

import type {
  ChainId,
  ChainInfo,
  ChainAccount,
  MultiChainAccount,
  TransactionRequest,
  TransactionResult,
  ContractCallRequest,
  ContractReadRequest,
  ContractReadResult,
  EventFilter,
  EventCallback,
  EventSubscription,
  IMultiChainSDK,
  SDKError,
  SDKErrorCode,
} from "./types";

// ============================================================================
// Message Types
// ============================================================================

type MessageType =
  | "MULTICHAIN_GET_CHAINS"
  | "MULTICHAIN_GET_ACTIVE_CHAIN"
  | "MULTICHAIN_SWITCH_CHAIN"
  | "MULTICHAIN_CONNECT"
  | "MULTICHAIN_DISCONNECT"
  | "MULTICHAIN_GET_ACCOUNT"
  | "MULTICHAIN_GET_ALL_ACCOUNTS"
  | "MULTICHAIN_SEND_TX"
  | "MULTICHAIN_WAIT_TX"
  | "MULTICHAIN_CALL_CONTRACT"
  | "MULTICHAIN_READ_CONTRACT"
  | "MULTICHAIN_SUBSCRIBE"
  | "MULTICHAIN_UNSUBSCRIBE"
  | "MULTICHAIN_GET_BALANCE"
  | "MULTICHAIN_EVENT";

interface BridgeMessage<T = unknown> {
  id: string;
  type: MessageType;
  payload?: T;
}

interface BridgeResponse<T = unknown> {
  id: string;
  success: boolean;
  data?: T;
  error?: SDKError;
}

// ============================================================================
// Utilities
// ============================================================================

function generateId(): string {
  return `mc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function createSDKError(code: SDKErrorCode, message: string, details?: unknown): SDKError {
  return { code, message, details };
}

// ============================================================================
// Bridge Implementation
// ============================================================================

class MultiChainBridge implements IMultiChainSDK {
  private pendingRequests = new Map<
    string,
    {
      resolve: (value: unknown) => void;
      reject: (error: SDKError) => void;
    }
  >();

  private eventSubscriptions = new Map<string, EventCallback>();
  private isInitialized = false;

  constructor() {
    this.setupMessageListener();
  }

  private setupMessageListener(): void {
    if (typeof window === "undefined") return;

    window.addEventListener("message", (event) => {
      this.handleMessage(event.data);
    });

    this.isInitialized = true;
  }

  private handleMessage(data: unknown): void {
    if (!data || typeof data !== "object") return;

    const message = data as BridgeResponse;
    if (!message.id) return;

    // Handle event notifications
    if ((data as BridgeMessage).type === "MULTICHAIN_EVENT") {
      this.handleEventNotification(data as BridgeMessage);
      return;
    }

    // Handle request responses
    const pending = this.pendingRequests.get(message.id);
    if (!pending) return;

    this.pendingRequests.delete(message.id);

    if (message.success) {
      pending.resolve(message.data);
    } else {
      pending.reject(message.error || createSDKError("UNKNOWN_ERROR", "Unknown error"));
    }
  }

  private handleEventNotification(message: BridgeMessage): void {
    const { payload } = message;
    if (!payload || typeof payload !== "object") return;

    const eventData = payload as { subscriptionId: string; event: unknown };
    const callback = this.eventSubscriptions.get(eventData.subscriptionId);
    if (callback) {
      callback(eventData.event as Parameters<EventCallback>[0]);
    }
  }

  private sendMessage<T, R>(type: MessageType, payload?: T): Promise<R> {
    return new Promise((resolve, reject) => {
      const id = generateId();
      const message: BridgeMessage<T> = { id, type, payload };

      this.pendingRequests.set(id, {
        resolve: resolve as (value: unknown) => void,
        reject,
      });

      // Send to parent (host app)
      if (typeof window !== "undefined" && window.parent) {
        window.parent.postMessage(message, "*");
      } else {
        reject(createSDKError("NETWORK_ERROR", "No parent window available"));
      }

      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(createSDKError("NETWORK_ERROR", "Request timeout"));
        }
      }, 30000);
    });
  }

  // ============================================================================
  // Chain Management
  // ============================================================================

  async getSupportedChains(): Promise<ChainInfo[]> {
    return this.sendMessage<void, ChainInfo[]>("MULTICHAIN_GET_CHAINS");
  }

  async getActiveChain(): Promise<ChainInfo | null> {
    return this.sendMessage<void, ChainInfo | null>("MULTICHAIN_GET_ACTIVE_CHAIN");
  }

  async switchChain(chainId: ChainId): Promise<void> {
    return this.sendMessage<{ chainId: ChainId }, void>("MULTICHAIN_SWITCH_CHAIN", { chainId });
  }

  // ============================================================================
  // Account Management
  // ============================================================================

  async connect(chainId?: ChainId): Promise<ChainAccount> {
    return this.sendMessage<{ chainId?: ChainId }, ChainAccount>("MULTICHAIN_CONNECT", { chainId });
  }

  async disconnect(): Promise<void> {
    return this.sendMessage<void, void>("MULTICHAIN_DISCONNECT");
  }

  getAccount(chainId?: ChainId): ChainAccount | null {
    // Sync method - returns cached value
    // For async version, use connect()
    console.warn("getAccount is sync and returns cached value. Use connect() for fresh data.");
    return null;
  }

  getAllAccounts(): MultiChainAccount | null {
    // Sync method - returns cached value
    console.warn("getAllAccounts is sync and returns cached value.");
    return null;
  }

  // ============================================================================
  // Transactions
  // ============================================================================

  async sendTransaction(request: TransactionRequest): Promise<TransactionResult> {
    return this.sendMessage<TransactionRequest, TransactionResult>("MULTICHAIN_SEND_TX", request);
  }

  async waitForTransaction(chainId: ChainId, txHash: string): Promise<TransactionResult> {
    return this.sendMessage<{ chainId: ChainId; txHash: string }, TransactionResult>("MULTICHAIN_WAIT_TX", {
      chainId,
      txHash,
    });
  }

  // ============================================================================
  // Contract Interactions
  // ============================================================================

  async callContract(request: ContractCallRequest): Promise<TransactionResult> {
    return this.sendMessage<ContractCallRequest, TransactionResult>("MULTICHAIN_CALL_CONTRACT", request);
  }

  async readContract<T = unknown>(request: ContractReadRequest): Promise<ContractReadResult<T>> {
    return this.sendMessage<ContractReadRequest, ContractReadResult<T>>("MULTICHAIN_READ_CONTRACT", request);
  }

  // ============================================================================
  // Events
  // ============================================================================

  subscribe(filter: EventFilter, callback: EventCallback): EventSubscription {
    const subscriptionId = generateId();

    this.eventSubscriptions.set(subscriptionId, callback);

    // Send subscription request to host
    this.sendMessage<{ subscriptionId: string; filter: EventFilter }, void>("MULTICHAIN_SUBSCRIBE", {
      subscriptionId,
      filter,
    }).catch((error) => {
      console.error("Failed to subscribe:", error);
      this.eventSubscriptions.delete(subscriptionId);
    });

    return {
      id: subscriptionId,
      filter,
      unsubscribe: () => this.unsubscribe(subscriptionId),
    };
  }

  unsubscribe(subscriptionId: string): void {
    this.eventSubscriptions.delete(subscriptionId);
    this.sendMessage<{ subscriptionId: string }, void>("MULTICHAIN_UNSUBSCRIBE", { subscriptionId }).catch(
      console.error,
    );
  }

  // ============================================================================
  // Utilities
  // ============================================================================

  async getBalance(chainId: ChainId, address?: string): Promise<string> {
    return this.sendMessage<{ chainId: ChainId; address?: string }, string>("MULTICHAIN_GET_BALANCE", {
      chainId,
      address,
    });
  }

  formatUnits(value: string, decimals: number): string {
    const num = BigInt(value);
    const divisor = BigInt(10 ** decimals);
    const intPart = num / divisor;
    const fracPart = num % divisor;
    const fracStr = fracPart.toString().padStart(decimals, "0").replace(/0+$/, "");
    return fracStr ? `${intPart}.${fracStr}` : intPart.toString();
  }

  parseUnits(value: string, decimals: number): string {
    const [intPart, fracPart = ""] = value.split(".");
    const paddedFrac = fracPart.padEnd(decimals, "0").slice(0, decimals);
    return BigInt(intPart + paddedFrac).toString();
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

let bridgeInstance: MultiChainBridge | null = null;

export function getMultiChainBridge(): IMultiChainSDK {
  if (!bridgeInstance) {
    bridgeInstance = new MultiChainBridge();
  }
  return bridgeInstance;
}

export { MultiChainBridge };
