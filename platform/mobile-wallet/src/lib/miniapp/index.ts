/**
 * MiniApp Module - Public API
 */

// Types
export type { MiniAppSDK, MiniAppSDKConfig } from "./sdk-types";
export type { BridgeConfig, BridgeMessage, BridgeResponse } from "./webview-bridge";

// Normalization utilities
export {
  normalizeCategory,
  normalizePermissions,
  normalizeLimits,
  normalizeStatus,
  coerceMiniAppInfo,
  buildMiniAppEntryUrl,
} from "./normalize";

// Builtin apps registry
export {
  BUILTIN_APPS,
  BUILTIN_APPS_MAP,
  GAMING_APPS,
  DEFI_APPS,
  SOCIAL_APPS,
  NFT_APPS,
  GOVERNANCE_APPS,
  UTILITY_APPS,
  getBuiltinApp,
  getAppsByCategory,
} from "./builtin-apps";

// SDK client
export { createMiniAppSDK } from "./sdk-client";

// WebView bridge
export { dispatchBridgeCall } from "./webview-bridge";

// Intent service
export { fetchIntent, submitTransaction } from "./intent-service";
export type { TransactionIntent, IntentResult } from "./intent-service";
