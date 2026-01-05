/**
 * MiniApp WebView Bridge for React Native
 * Handles postMessage communication between WebView and native app
 */

import type { MiniAppPermissions } from "@/types/miniapp";
import type { MiniAppSDK } from "./sdk-types";

export type BridgeMessage = {
  type: string;
  id?: string;
  method?: string;
  params?: unknown[];
};

export type BridgeResponse = {
  type: "neo_miniapp_sdk_response";
  id: string;
  ok: boolean;
  result?: unknown;
  error?: string;
};

export type BridgeConfig = {
  appId: string;
  permissions: MiniAppPermissions;
  sdk: MiniAppSDK;
  getAddress: () => Promise<string>;
  invokeIntent: (requestId: string) => Promise<{ tx_hash: string }>;
};

/**
 * Check if a method requires specific permission
 */
function hasPermission(method: string, permissions: MiniAppPermissions): boolean {
  switch (method) {
    case "payments.payGAS":
    case "payments.payGASAndInvoke":
      return Boolean(permissions.payments);
    case "governance.vote":
    case "governance.voteAndInvoke":
      return Boolean(permissions.governance);
    case "rng.requestRandom":
      return Boolean(permissions.randomness);
    case "datafeed.getPrice":
      return Boolean(permissions.datafeed);
    default:
      return true;
  }
}

/**
 * Resolve and validate app_id for scoped operations
 */
function resolveScopedAppId(requested: unknown, appId: string): string {
  const trimmed = String(requested ?? "").trim();
  if (trimmed && trimmed !== appId) {
    throw new Error("app_id mismatch");
  }
  return appId;
}

/**
 * Dispatch bridge call to appropriate SDK method
 */
export async function dispatchBridgeCall(config: BridgeConfig, method: string, params: unknown[]): Promise<unknown> {
  const { sdk, permissions, appId, getAddress, invokeIntent } = config;

  if (!hasPermission(method, permissions)) {
    throw new Error(`permission denied: ${method}`);
  }

  switch (method) {
    case "wallet.getAddress":
    case "getAddress":
      return getAddress();

    case "wallet.invokeIntent": {
      const [requestId] = params;
      return invokeIntent(String(requestId ?? ""));
    }

    case "payments.payGAS": {
      const [requestedAppId, amount, memo] = params;
      const scopedAppId = resolveScopedAppId(requestedAppId, appId);
      const memoValue = memo == null ? undefined : String(memo);
      return sdk.payments.payGAS(scopedAppId, String(amount ?? ""), memoValue);
    }

    case "governance.vote": {
      const [requestedAppId, proposalId, neoAmount, support] = params;
      const scopedAppId = resolveScopedAppId(requestedAppId, appId);
      const supportValue = typeof support === "boolean" ? support : undefined;
      return sdk.governance.vote(scopedAppId, String(proposalId ?? ""), String(neoAmount ?? ""), supportValue);
    }

    case "rng.requestRandom": {
      const [requestedAppId] = params;
      const scopedAppId = resolveScopedAppId(requestedAppId, appId);
      return sdk.rng.requestRandom(scopedAppId);
    }

    case "datafeed.getPrice": {
      const [symbol] = params;
      return sdk.datafeed.getPrice(String(symbol ?? ""));
    }

    case "stats.getMyUsage": {
      const [requestedAppId, date] = params;
      const resolvedAppId = resolveScopedAppId(requestedAppId, appId);
      const dateValue = date == null ? undefined : String(date);
      return sdk.stats.getMyUsage(resolvedAppId, dateValue);
    }

    case "events.list": {
      const [rawParams] = params;
      const p = rawParams && typeof rawParams === "object" ? { ...(rawParams as Record<string, unknown>) } : {};
      return sdk.events.list({ ...p, app_id: resolveScopedAppId(p.app_id, appId) });
    }

    case "transactions.list": {
      const [rawParams] = params;
      const p = rawParams && typeof rawParams === "object" ? { ...(rawParams as Record<string, unknown>) } : {};
      return sdk.transactions.list({ ...p, app_id: resolveScopedAppId(p.app_id, appId) });
    }

    default:
      throw new Error(`unsupported method: ${method}`);
  }
}
