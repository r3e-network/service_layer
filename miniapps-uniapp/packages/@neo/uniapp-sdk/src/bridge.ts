/**
 * SDK Bridge - Connects uni-app to Neo MiniApp SDK
 */

import type { MiniAppSDK, NeoSDKConfig } from "./types";

declare global {
  interface Window {
    MiniAppSDK?: MiniAppSDK;
  }
}

/**
 * Allowed origins for SDK communication
 */
const ALLOWED_ORIGINS = [
  "https://miniapp.neo.org",
  "https://testnet.miniapp.neo.org",
  ...(process.env.NODE_ENV === "development"
    ? [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://localhost:3003",
        "http://localhost:3004",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3002",
      ]
    : []),
];

/**
 * Validate SDK injection to prevent tampering
 * Check for either new interface (invoke/getConfig) or legacy interface (wallet/payments)
 */
function validateSDK(sdk: MiniAppSDK): boolean {
  if (!sdk || typeof sdk !== "object") return false;
  // New interface: invoke + getConfig
  const hasNewInterface = typeof sdk.invoke === "function" && typeof sdk.getConfig === "function";
  // Legacy interface: wallet or payments object
  const hasLegacyInterface = typeof sdk.wallet === "object" || typeof sdk.payments === "object";
  return hasNewInterface || hasLegacyInterface;
}

/**
 * Create a postMessage-based SDK proxy for cross-origin iframes
 */
function createPostMessageSDK(): MiniAppSDK {
  const targetOrigin = getTargetOrigin();
  let requestId = 0;

  const invoke = (method: string, ...args: unknown[]): Promise<unknown> => {
    return new Promise((resolve, reject) => {
      const id = `sdk-${++requestId}-${Date.now()}`;
      const timer = setTimeout(() => {
        window.removeEventListener("message", handler);
        reject(new Error("SDK timeout"));
      }, 10000);

      const handler = (event: MessageEvent) => {
        if (!isValidOrigin(event.origin)) return;
        if (event.data?.type !== "neo_miniapp_sdk_response") return;
        if (event.data?.id !== id) return;

        clearTimeout(timer);
        window.removeEventListener("message", handler);

        if (event.data.ok) {
          resolve(event.data.result);
        } else {
          reject(new Error(event.data.error || "SDK call failed"));
        }
      };

      window.addEventListener("message", handler);
      window.parent.postMessage({ type: "neo_miniapp_sdk_request", id, method, params: args }, targetOrigin);
    });
  };

  return {
    invoke,
    getConfig: () => ({ appId: "", contractHash: null, debug: false }),
    getAddress: () => invoke("getAddress") as Promise<string>,
    wallet: {
      getAddress: () => invoke("wallet.getAddress") as Promise<string>,
      invokeIntent: (requestId: string) => invoke("wallet.invokeIntent", requestId),
    },
    payments: {
      payGAS: (appId: string, amount: string, memo?: string) => invoke("payments.payGAS", appId, amount, memo),
      payGASAndInvoke: (appId: string, amount: string, memo?: string) =>
        invoke("payments.payGASAndInvoke", appId, amount, memo),
    },
    governance: {
      vote: (appId: string, proposalId: string, amount: string, support?: boolean) =>
        invoke("governance.vote", appId, proposalId, amount, support),
      voteAndInvoke: (appId: string, proposalId: string, amount: string, support?: boolean) =>
        invoke("governance.voteAndInvoke", appId, proposalId, amount, support),
      getCandidates: () => invoke("governance.getCandidates"),
    },
    rng: {
      requestRandom: (appId: string) => invoke("rng.requestRandom", appId),
    },
    datafeed: {
      getPrice: (symbol: string) => invoke("datafeed.getPrice", symbol),
      getPrices: () => invoke("datafeed.getPrices"),
      getNetworkStats: () => invoke("datafeed.getNetworkStats"),
      getRecentTransactions: (limit?: number) => invoke("datafeed.getRecentTransactions", limit),
    },
    stats: {
      getMyUsage: (appId: string, date?: string) => invoke("stats.getMyUsage", appId, date),
    },
  } as MiniAppSDK;
}

/**
 * Wait for SDK to be ready
 */
export function waitForSDK(timeout = 5000): Promise<MiniAppSDK> {
  return new Promise((resolve, reject) => {
    // Check if SDK is already injected
    if (window.MiniAppSDK) {
      if (!validateSDK(window.MiniAppSDK)) {
        reject(new Error("SDK validation failed"));
        return;
      }
      resolve(window.MiniAppSDK);
      return;
    }

    const timer = setTimeout(() => {
      window.removeEventListener("miniapp-sdk-ready", handler);
      // Fallback to postMessage-based SDK for cross-origin iframes
      if (window.parent !== window) {
        console.log("[Neo SDK] Direct injection timeout, using postMessage bridge");
        const proxySDK = createPostMessageSDK();
        window.MiniAppSDK = proxySDK;
        resolve(proxySDK);
      } else {
        reject(new Error("SDK timeout"));
      }
    }, timeout);

    const handler = () => {
      clearTimeout(timer);
      window.removeEventListener("miniapp-sdk-ready", handler);
      if (window.MiniAppSDK) {
        if (!validateSDK(window.MiniAppSDK)) {
          reject(new Error("SDK validation failed"));
          return;
        }
        resolve(window.MiniAppSDK);
      } else {
        reject(new Error("SDK not found"));
      }
    };

    window.addEventListener("miniapp-sdk-ready", handler);
  });
}

/**
 * Create SDK bridge for H5 platform
 */
export function createH5Bridge(config: NeoSDKConfig): Promise<MiniAppSDK> {
  if (config.debug) {
    console.log("[Neo] Creating H5 bridge for:", config.appId);
  }
  return waitForSDK();
}

/**
 * Get SDK instance (sync, may be null)
 */
export function getSDKSync(): MiniAppSDK | null {
  return window.MiniAppSDK ?? null;
}

/**
 * Get target origin for postMessage
 */
function getTargetOrigin(): string {
  // First, try to detect parent origin from referrer (works in both dev and prod)
  try {
    const parentOrigin = document.referrer ? new URL(document.referrer).origin : null;
    if (parentOrigin && ALLOWED_ORIGINS.includes(parentOrigin)) {
      return parentOrigin;
    }
  } catch (e) {
    // Ignore URL parsing errors
  }

  // Second, check if we're in an iframe and try to get parent origin
  try {
    if (window.parent !== window && window.location.ancestorOrigins?.length > 0) {
      const ancestorOrigin = window.location.ancestorOrigins[0];
      if (ALLOWED_ORIGINS.includes(ancestorOrigin)) {
        return ancestorOrigin;
      }
    }
  } catch (e) {
    // Cross-origin access blocked, ignore
  }

  // Third, check if running on localhost (dev environment)
  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    // Use same port as current page for local dev
    return window.location.origin;
  }

  // Fallback to production domain
  return ALLOWED_ORIGINS[0];
}

/**
 * Validate message origin
 */
function isValidOrigin(origin: string): boolean {
  return ALLOWED_ORIGINS.includes(origin);
}

/**
 * Wallet state from host app
 */
export interface HostWalletState {
  connected: boolean;
  address: string | null;
  balance: { neo: string; gas: string } | null;
}

type WalletStateListener = (state: HostWalletState) => void;
const walletStateListeners: Set<WalletStateListener> = new Set();
let currentWalletState: HostWalletState = { connected: false, address: null, balance: null };

/**
 * Subscribe to wallet state changes from host
 */
export function subscribeToWalletState(listener: WalletStateListener): () => void {
  walletStateListeners.add(listener);
  // Immediately call with current state
  listener(currentWalletState);
  return () => walletStateListeners.delete(listener);
}

/**
 * Get current wallet state
 */
export function getWalletState(): HostWalletState {
  return currentWalletState;
}

/**
 * Initialize wallet state listener (call once on app startup)
 */
export function initWalletStateListener(): void {
  if (typeof window === "undefined") return;

  const handler = (event: MessageEvent) => {
    // Validate origin - allow parent origin in iframe context
    const parentOrigin = document.referrer ? new URL(document.referrer).origin : null;
    const validOrigins = [...ALLOWED_ORIGINS];
    if (parentOrigin) validOrigins.push(parentOrigin);

    if (!validOrigins.includes(event.origin)) return;

    const data = event.data;
    if (!data || typeof data !== "object") return;
    if (data.type !== "neo_wallet_state_change") return;

    currentWalletState = {
      connected: Boolean(data.connected),
      address: data.address || null,
      balance: data.balance || null,
    };

    // Notify all listeners
    walletStateListeners.forEach((listener) => {
      try {
        listener(currentWalletState);
      } catch (e) {
        console.error("[Neo SDK] Wallet state listener error:", e);
      }
    });
  };

  window.addEventListener("message", handler);
}

/**
 * Notify host that MiniApp is ready to receive messages
 */
function notifyHostReady(): void {
  if (typeof window === "undefined") return;
  const targetOrigin = getTargetOrigin();
  try {
    window.parent.postMessage({ type: "neo_miniapp_ready" }, targetOrigin);
  } catch (e) {
    // Ignore if not in iframe
  }
}

// Auto-initialize on module load
if (typeof window !== "undefined") {
  initWalletStateListener();
  // Notify host that MiniApp is ready after a short delay
  // to ensure all listeners are set up
  setTimeout(notifyHostReady, 100);
}

/**
 * Call SDK bridge method
 */
export async function callBridge(method: string, params?: Record<string, unknown>): Promise<unknown> {
  const sdk = await waitForSDK().catch(() => null);
  if (!sdk) {
    throw new Error("SDK not available");
  }

  const targetOrigin = getTargetOrigin();

  // Use postMessage to communicate with host
  return new Promise((resolve, reject) => {
    const id = `${method}-${Date.now()}`;
    const handler = (event: MessageEvent) => {
      // CRITICAL: Validate origin before processing message
      if (!isValidOrigin(event.origin)) {
        console.warn("[Neo SDK] Rejected message from invalid origin:", event.origin);
        return;
      }

      if (event.data?.id === id) {
        window.removeEventListener("message", handler);
        if (event.data.error) {
          reject(new Error(event.data.error));
        } else {
          resolve(event.data.result);
        }
      }
    };
    window.addEventListener("message", handler);
    // FIXED: Use specific origin instead of wildcard "*"
    window.parent.postMessage({ type: "bridge", method, params, id }, targetOrigin);
    // Timeout after 5s
    setTimeout(() => {
      window.removeEventListener("message", handler);
      reject(new Error("Bridge timeout"));
    }, 5000);
  });
}
