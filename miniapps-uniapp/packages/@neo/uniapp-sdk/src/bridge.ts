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
  ...(process.env.NODE_ENV === "development" ? ["http://localhost:3000", "http://127.0.0.1:3000"] : []),
];

/**
 * Validate SDK injection to prevent tampering
 */
function validateSDK(sdk: MiniAppSDK): boolean {
  return sdk && typeof sdk === "object" && typeof sdk.invoke === "function" && typeof sdk.getConfig === "function";
}

/**
 * Wait for SDK to be ready
 */
export function waitForSDK(timeout = 5000): Promise<MiniAppSDK> {
  return new Promise((resolve, reject) => {
    if (window.MiniAppSDK) {
      if (!validateSDK(window.MiniAppSDK)) {
        reject(new Error("SDK validation failed"));
        return;
      }
      resolve(window.MiniAppSDK);
      return;
    }

    const timer = setTimeout(() => {
      reject(new Error("SDK timeout"));
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
  // In production, use the first allowed origin (main domain)
  if (process.env.NODE_ENV === "production") {
    return ALLOWED_ORIGINS[0];
  }
  // In development, try to detect parent origin or use localhost
  try {
    const parentOrigin = document.referrer ? new URL(document.referrer).origin : null;
    if (parentOrigin && ALLOWED_ORIGINS.includes(parentOrigin)) {
      return parentOrigin;
    }
  } catch (e) {
    // Fallback to localhost in dev
  }
  return "http://localhost:3000";
}

/**
 * Validate message origin
 */
function isValidOrigin(origin: string): boolean {
  return ALLOWED_ORIGINS.includes(origin);
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
