// MiniApp Types for Mobile Wallet

export type MiniAppCategory = "gaming" | "defi" | "governance" | "utility" | "social" | "nft";

export type MiniAppInfo = {
  app_id: string;
  name: string;
  description: string;
  icon: string;
  category: MiniAppCategory;
  entry_url: string;
  status?: "active" | "disabled" | "pending";
  permissions: {
    payments?: boolean;
    governance?: boolean;
    randomness?: boolean;
    datafeed?: boolean;
    confidential?: boolean;
  };
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
