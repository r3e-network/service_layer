/**
 * MiniApp Types for Mobile Wallet
 * Aligned with host-app types for full compatibility
 */

export type MiniAppCategory = "gaming" | "defi" | "governance" | "utility" | "social" | "nft";

export type MiniAppSource = "builtin" | "community" | "verified";

export type MiniAppPermissions = {
  payments?: boolean;
  governance?: boolean;
  randomness?: boolean;
  datafeed?: boolean;
  confidential?: boolean;
  automation?: boolean;
};

export type MiniAppLimits = {
  max_gas_per_tx?: string;
  daily_gas_cap_per_user?: string;
  governance_cap?: string;
};

export type MiniAppDeveloper = {
  name: string;
  address: string;
  verified?: boolean;
};

export type MiniAppStats = {
  users?: number;
  transactions?: number;
  users_24h?: number;
  txs_24h?: number;
  volume_24h?: string;
  growth?: number;
};

export type MiniAppInfo = {
  app_id: string;
  name: string;
  description: string;
  // Self-contained i18n: each MiniApp provides its own translations
  name_zh?: string;
  description_zh?: string;
  icon: string;
  category: MiniAppCategory;
  entry_url: string;
  contract_hash?: string | null;
  status?: "active" | "disabled" | "pending" | null;
  source?: MiniAppSource;
  stats?: MiniAppStats;
  developer?: MiniAppDeveloper;
  permissions: MiniAppPermissions;
  limits?: MiniAppLimits | null;
  features?: string[];
  created_at?: string;
};

export const CATEGORY_LABELS: Record<MiniAppCategory, string> = {
  gaming: "Gaming",
  defi: "DeFi",
  governance: "Governance",
  utility: "Utility",
  social: "Social",
  nft: "NFT",
};

export const CATEGORY_ICONS: Record<MiniAppCategory, string> = {
  gaming: "game-controller",
  defi: "trending-up",
  governance: "people",
  utility: "construct",
  social: "chatbubbles",
  nft: "images",
};

export const ALL_CATEGORIES: MiniAppCategory[] = ["gaming", "defi", "governance", "utility", "social", "nft"];
