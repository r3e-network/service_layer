// App Configuration
// Environment-based settings for the mobile wallet

const trimTrailingSlash = (value: string) => value.replace(/\/$/, "");

// MiniApp hosting - points to host-app server
// Development: http://localhost:3000
// Production: https://your-domain.com
export const MINIAPP_BASE_URL = trimTrailingSlash(
  process.env.EXPO_PUBLIC_MINIAPP_BASE_URL || "http://localhost:3000"
);

// API endpoints (host-app API routes)
export const API_BASE_URL = trimTrailingSlash(
  process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:3000/api"
);

// Edge functions base URL (Supabase functions or host-app proxy)
const EDGE_ENV_BASE =
  process.env.EXPO_PUBLIC_EDGE_BASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || "";
export const EDGE_BASE_URL = EDGE_ENV_BASE
  ? trimTrailingSlash(EDGE_ENV_BASE).endsWith("/functions/v1")
    ? trimTrailingSlash(EDGE_ENV_BASE)
    : `${trimTrailingSlash(EDGE_ENV_BASE)}/functions/v1`
  : `${MINIAPP_BASE_URL}/api/rpc`;

// Network configuration
export const DEFAULT_NETWORK = process.env.EXPO_PUBLIC_DEFAULT_NETWORK || "testnet";
