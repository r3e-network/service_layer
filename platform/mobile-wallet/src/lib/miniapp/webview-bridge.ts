/**
 * MiniApp WebView Bridge for React Native
 * Handles postMessage communication between WebView and native app
 */

import type { ChainId, MiniAppPermissions } from "@/types/miniapp";
import type { MiniAppSDK } from "./sdk-types";
import { storeIntent, resolveIntent } from "./intent-cache";
import { waitForReceipt } from "@/lib/neo/invocation";

export type BridgeMessage = {
  type: string;
  id?: string;
  method?: string;
  params?: unknown[];
};

export type BridgeResponse = {
  type: "miniapp_sdk_response";
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
  invokeFunction?: (params: Record<string, unknown>) => Promise<unknown>;
  switchChain?: (chainId: ChainId) => Promise<void>;
  signMessage?: (message: string) => Promise<unknown>;
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
    case "governance.getCandidates":
      return Boolean(permissions.governance);
    case "rng.requestRandom":
      return Boolean(permissions.rng);
    case "datafeed.getPrice":
    case "datafeed.getPrices":
    case "datafeed.getNetworkStats":
    case "datafeed.getRecentTransactions":
      return Boolean(permissions.datafeed);
    case "wallet.signMessage":
      return Boolean(permissions.confidential);
    case "getConfig":
    case "wallet.getAddress":
    case "getAddress":
    case "wallet.switchChain":
    case "wallet.invokeIntent":
    case "invokeRead":
    case "invokeFunction":
    case "stats.getMyUsage":
    case "events.list":
    case "transactions.list":
      return true;
    default:
      return false;
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
  const { sdk, permissions, appId, getAddress, invokeIntent, invokeFunction, switchChain, signMessage } = config;

  if (!hasPermission(method, permissions)) {
    throw new Error(`permission denied: ${method}`);
  }

  const handlePayGas = async (requestedAppId: unknown, amount: unknown, memo: unknown) => {
    const scopedAppId = resolveScopedAppId(requestedAppId, appId);
    const memoValue = memo == null ? undefined : String(memo);
    const intent = await sdk.payments.payGAS(scopedAppId, String(amount ?? ""), memoValue);
    if (intent?.request_id && intent?.invocation) {
      storeIntent(intent.request_id, intent.invocation);
    }

    if (intent?.request_id) {
      const tx = await invokeIntent(String(intent.request_id));
      const txid =
        (tx as { tx_hash?: string; txid?: string; txHash?: string })?.tx_hash ||
        (tx as { tx_hash?: string; txid?: string; txHash?: string })?.txid ||
        (tx as { tx_hash?: string; txid?: string; txHash?: string })?.txHash ||
        null;
      let receiptId: string | null = null;
      if (txid) {
        receiptId = await waitForReceipt(txid, intent.chain_id).catch(() => null);
      }

      if (txid) {
        resolveIntent(intent.request_id, { tx_hash: txid, txid, receipt_id: receiptId });
      }

      return {
        ...intent,
        txid,
        receipt_id: receiptId ?? intent.receipt_id ?? null,
      };
    }

    return intent;
  };

  switch (method) {
    case "getConfig": {
      return sdk.getConfig ? sdk.getConfig() : null;
    }

    case "wallet.getAddress":
    case "getAddress":
      return getAddress();

    case "wallet.switchChain": {
      const [chainId] = params;
      if (!switchChain) throw new Error("wallet.switchChain not available");
      if (!chainId || typeof chainId !== "string") throw new Error("chainId required");
      await switchChain(chainId);
      return true;
    }

    case "wallet.invokeIntent": {
      const [requestId] = params;
      return invokeIntent(String(requestId ?? ""));
    }

    case "wallet.signMessage": {
      const [payload] = params;
      const message =
        typeof payload === "string"
          ? payload
          : payload && typeof payload === "object"
            ? String((payload as { message?: unknown }).message ?? "")
            : "";
      if (!message) throw new Error("message required");
      if (signMessage) return signMessage(message);
      if (sdk.wallet?.signMessage) return sdk.wallet.signMessage(message);
      throw new Error("wallet.signMessage not available");
    }

    case "payments.payGAS": {
      const [requestedAppId, amount, memo] = params;
      return handlePayGas(requestedAppId, amount, memo);
    }

    case "payments.payGASAndInvoke": {
      const [requestedAppId, amount, memo] = params;
      return handlePayGas(requestedAppId, amount, memo);
    }

    case "governance.vote": {
      const [requestedAppId, proposalId, neoAmount, support] = params;
      const scopedAppId = resolveScopedAppId(requestedAppId, appId);
      const supportValue = typeof support === "boolean" ? support : undefined;
      const intent = await sdk.governance.vote(scopedAppId, String(proposalId ?? ""), String(neoAmount ?? ""), supportValue);
      if (intent?.request_id && intent?.invocation) {
        storeIntent(intent.request_id, intent.invocation);
      }
      return intent;
    }

    case "governance.voteAndInvoke": {
      const [requestedAppId, proposalId, neoAmount, support] = params;
      const scopedAppId = resolveScopedAppId(requestedAppId, appId);
      const supportValue = typeof support === "boolean" ? support : undefined;
      if (!sdk.governance?.vote) throw new Error("governance.vote not available");
      const intent = await sdk.governance.vote(scopedAppId, String(proposalId ?? ""), String(neoAmount ?? ""), supportValue);
      if (intent?.request_id && intent?.invocation) {
        storeIntent(intent.request_id, intent.invocation);
      }
      if (!intent?.request_id) return intent;
      const tx = await invokeIntent(String(intent.request_id));
      const txid = (tx as { tx_hash?: string; txid?: string; txHash?: string })?.tx_hash ||
        (tx as { tx_hash?: string; txid?: string; txHash?: string })?.txid ||
        (tx as { tx_hash?: string; txid?: string; txHash?: string })?.txHash ||
        null;
      if (txid) {
        resolveIntent(intent.request_id, { tx_hash: txid, txid });
      }
      return { ...intent, txid };
    }

    case "governance.getCandidates": {
      if (!sdk.governance?.getCandidates) throw new Error("governance.getCandidates not available");
      return sdk.governance.getCandidates();
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

    case "datafeed.getPrices": {
      if (!sdk.datafeed?.getPrices) throw new Error("datafeed.getPrices not supported");
      return sdk.datafeed.getPrices();
    }

    case "datafeed.getNetworkStats": {
      if (!sdk.datafeed?.getNetworkStats) throw new Error("datafeed.getNetworkStats not supported");
      return sdk.datafeed.getNetworkStats();
    }

    case "datafeed.getRecentTransactions": {
      if (!sdk.datafeed?.getRecentTransactions) throw new Error("datafeed.getRecentTransactions not supported");
      const [limit] = params;
      const limitValue = typeof limit === "number" ? limit : undefined;
      return sdk.datafeed.getRecentTransactions(limitValue);
    }

    case "stats.getMyUsage": {
      const [requestedAppId, date] = params;
      const resolvedAppId = resolveScopedAppId(requestedAppId, appId);
      const dateValue = date == null ? undefined : String(date);
      if (!sdk.stats?.getMyUsage) throw new Error("stats.getMyUsage not supported");
      return sdk.stats.getMyUsage(resolvedAppId, dateValue);
    }

    case "events.list": {
      const [rawParams] = params;
      const p = rawParams && typeof rawParams === "object" ? { ...(rawParams as Record<string, unknown>) } : {};
      if (!sdk.events?.list) throw new Error("events.list not supported");
      return sdk.events.list({ ...p, app_id: resolveScopedAppId(p.app_id, appId) });
    }

    case "transactions.list": {
      const [rawParams] = params;
      const p = rawParams && typeof rawParams === "object" ? { ...(rawParams as Record<string, unknown>) } : {};
      if (!sdk.transactions?.list) throw new Error("transactions.list not supported");
      return sdk.transactions.list({ ...p, app_id: resolveScopedAppId(p.app_id, appId) });
    }

    case "invokeRead": {
      const [rawParams] = params;
      if (!sdk.invokeRead) throw new Error("invokeRead not supported");
      if (!rawParams || typeof rawParams !== "object") throw new Error("invokeRead params required");
      return sdk.invokeRead(rawParams as Record<string, unknown>);
    }

    case "invokeFunction": {
      const [rawParams] = params;
      if (!rawParams || typeof rawParams !== "object") throw new Error("invokeFunction params required");
      if (invokeFunction) return invokeFunction(rawParams as Record<string, unknown>);
      if (!sdk.invokeFunction) throw new Error("invokeFunction not supported");
      return sdk.invokeFunction(rawParams as Record<string, unknown>);
    }

    default:
      throw new Error(`unsupported method: ${method}`);
  }
}
