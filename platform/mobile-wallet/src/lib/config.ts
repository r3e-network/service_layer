// App Configuration
// Environment-based settings for the mobile wallet

// MiniApp hosting - points to host-app server
// Development: http://localhost:3000
// Production: https://your-domain.com
export const MINIAPP_BASE_URL = process.env.EXPO_PUBLIC_MINIAPP_BASE_URL || "http://localhost:3000";

// API endpoints
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:3000/api";

// Network configuration
export const DEFAULT_NETWORK = process.env.EXPO_PUBLIC_DEFAULT_NETWORK || "testnet";
