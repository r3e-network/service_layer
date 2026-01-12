/**
 * SDK Bridge - Connects uni-app to Neo MiniApp SDK
 *
 * Refactored with centralized origin validation (SOLID: Single Responsibility)
 */

import type { MiniAppSDK, NeoSDKConfig } from "./types";
import { SDK_TIMEOUTS, PRODUCTION_ORIGINS, DEV_ORIGINS } from "./config";

declare global {
  interface Window {
    MiniAppSDK?: MiniAppSDK;
  }
}

// ============================================================================
// OriginValidator - Centralized origin validation (SOLID: Single Responsibility)
// ============================================================================

class OriginValidator {
  private readonly baseOrigins: Set<string>;
  private readonly dynamicOrigins: Set<string> = new Set();

  constructor() {
    this.baseOrigins = new Set([...PRODUCTION_ORIGINS, ...(process.env.NODE_ENV === "development" ? DEV_ORIGINS : [])]);
  }

  /** Get self origin safely */
  getSelfOrigin(): string | null {
    if (typeof window === "undefined") return null;
    try {
      const url = new URL(window.location.href);
      if (url.origin === "null") return null;
      if (url.protocol === "http:" || url.protocol === "https:") {
        return url.origin;
      }
    } catch {
      // ignore invalid URLs (e.g., about:blank)
    }
    return null;
  }

  /** Get referrer origin safely */
  getReferrerOrigin(): string | null {
    if (typeof document === "undefined" || !document.referrer) return null;
    try {
      return new URL(document.referrer).origin;
    } catch {
      return null;
    }
  }

  /** Get all valid origins (base + dynamic + contextual) */
  getAllowedOrigins(): Set<string> {
    const allowed = new Set(this.baseOrigins);

    // Add dynamic origins
    this.dynamicOrigins.forEach((o) => allowed.add(o));

    // Add referrer origin only if it's in baseOrigins (security fix)
    const referrer = this.getReferrerOrigin();
    if (referrer && this.baseOrigins.has(referrer)) {
      allowed.add(referrer);
    }

    // Add self origin
    const self = this.getSelfOrigin();
    if (self) allowed.add(self);

    // Add localhost origin in dev
    if (typeof window !== "undefined") {
      const host = window.location.hostname;
      if (host === "localhost" || host === "127.0.0.1") {
        allowed.add(window.location.origin);
      }
    }

    return allowed;
  }

  /** Check if origin is valid */
  isValid(origin: string): boolean {
    if (!origin || origin === "null") return false;
    return this.getAllowedOrigins().has(origin);
  }

  /** Get target origin for postMessage */
  getTargetOrigin(): string {
    // 1. Try referrer origin
    const referrer = this.getReferrerOrigin();
    if (referrer && this.baseOrigins.has(referrer)) {
      return referrer;
    }

    // 2. Try ancestor origins (iframe context)
    try {
      if (typeof window !== "undefined" && window.parent !== window && window.location.ancestorOrigins?.length > 0) {
        const ancestor = window.location.ancestorOrigins[0];
        if (this.baseOrigins.has(ancestor)) {
          return ancestor;
        }
      }
    } catch {
      // Cross-origin access blocked
    }

    // 3. Fall back to self origin
    const self = this.getSelfOrigin();
    if (self) return self;

    // 4. Check localhost
    if (typeof window !== "undefined") {
      const host = window.location.hostname;
      if (host === "localhost" || host === "127.0.0.1") {
        return window.location.origin;
      }
    }

    // 5. Fallback to production
    return PRODUCTION_ORIGINS[0];
  }

  /** Get safe target origin (throws if unknown) */
  getSafeTargetOrigin(): string {
    const target = this.getTargetOrigin();
    if (!target || target === "null") {
      // In production, reject unknown origins for security
      // Fall back to first production origin as last resort
      console.warn("[Neo SDK] Could not determine target origin, using production fallback");
      return PRODUCTION_ORIGINS[0];
    }
    return target;
  }

  /** Add dynamic origin (for runtime additions) */
  addDynamicOrigin(origin: string): void {
    if (origin && origin !== "null") {
      this.dynamicOrigins.add(origin);
    }
  }
}

// Singleton instance
const originValidator = new OriginValidator();

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
  const safeTargetOrigin = originValidator.getSafeTargetOrigin();
  let requestId = 0;

  const invoke = (method: string, ...args: unknown[]): Promise<unknown> => {
    return new Promise((resolve, reject) => {
      const id = `sdk-${++requestId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const timer = setTimeout(() => {
        window.removeEventListener("message", handler);
        reject(new Error("SDK invoke timeout"));
      }, SDK_TIMEOUTS.INVOKE);

      const handler = (event: MessageEvent) => {
        // Use centralized origin validation
        if (!originValidator.isValid(event.origin)) return;
        if (event.source !== window.parent) return;
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
      window.parent.postMessage({ type: "neo_miniapp_sdk_request", id, method, params: args }, safeTargetOrigin);
    });
  };

  // Cache for config fetched from host
  let cachedConfig: { appId: string; contractHash: string | null; debug: boolean } | null = null;

  return {
    invoke,
    getConfig: () => {
      // Return cached config or fetch from host
      if (cachedConfig) return cachedConfig;
      // Try to get config synchronously from window if available
      if (typeof window !== "undefined" && (window as any).__NEO_MINIAPP_CONFIG__) {
        cachedConfig = (window as any).__NEO_MINIAPP_CONFIG__;
        return cachedConfig;
      }
      // Return default config (will be updated async)
      return { appId: "", contractHash: null, debug: false };
    },
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
export function waitForSDK(timeout = SDK_TIMEOUTS.SDK_INIT): Promise<MiniAppSDK> {
  return new Promise((resolve, reject) => {
    // SSR guard
    if (typeof window === "undefined") {
      reject(new Error("SDK not available in SSR"));
      return;
    }

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
  if (typeof window === "undefined") return null;
  return window.MiniAppSDK ?? null;
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
let walletStateHandler: ((event: MessageEvent) => void) | null = null;
let walletStateInitialized = false;

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
 * Returns cleanup function to remove the listener
 */
export function initWalletStateListener(): (() => void) | null {
  if (typeof window === "undefined") return null;

  // Prevent duplicate initialization
  if (walletStateInitialized && walletStateHandler) {
    return () => cleanupWalletStateListener();
  }

  walletStateHandler = (event: MessageEvent) => {
    if (event.source !== window.parent) return;
    // Use centralized origin validation
    if (!originValidator.isValid(event.origin)) return;

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

  window.addEventListener("message", walletStateHandler);
  walletStateInitialized = true;

  return () => cleanupWalletStateListener();
}

/**
 * Cleanup wallet state listener (for testing/HMR)
 */
export function cleanupWalletStateListener(): void {
  if (typeof window === "undefined") return;
  if (walletStateHandler) {
    window.removeEventListener("message", walletStateHandler);
    walletStateHandler = null;
  }
  walletStateInitialized = false;
}

/**
 * Notify host that MiniApp is ready to receive messages
 */
function notifyHostReady(): void {
  if (typeof window === "undefined") return;
  const safeTargetOrigin = originValidator.getSafeTargetOrigin();
  try {
    window.parent.postMessage({ type: "neo_miniapp_ready" }, safeTargetOrigin);
  } catch {
    // Ignore if not in iframe
  }
}

// Auto-initialize on module load
if (typeof window !== "undefined") {
  initWalletStateListener();
  // Notify host that MiniApp is ready after a short delay
  // to ensure all listeners are set up
  setTimeout(notifyHostReady, SDK_TIMEOUTS.READY_NOTIFY);
}

/**
 * Call SDK bridge method
 */
export async function callBridge(method: string, params?: Record<string, unknown>): Promise<unknown> {
  const sdk = await waitForSDK().catch(() => null);
  if (!sdk) {
    throw new Error("SDK not available");
  }

  const safeTargetOrigin = originValidator.getSafeTargetOrigin();

  // Use postMessage to communicate with host
  return new Promise((resolve, reject) => {
    const id = `${method}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const handler = (event: MessageEvent) => {
      // CRITICAL: Validate origin before processing message
      if (event.source !== window.parent) return;
      if (!originValidator.isValid(event.origin)) {
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
    window.parent.postMessage({ type: "bridge", method, params, id }, safeTargetOrigin);
    // Timeout using centralized config
    setTimeout(() => {
      window.removeEventListener("message", handler);
      reject(new Error("Bridge call timeout"));
    }, SDK_TIMEOUTS.BRIDGE);
  });
}
