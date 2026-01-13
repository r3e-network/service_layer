/**
 * useMiniApps Hook
 * Manages MiniApp discovery, search, and filtering
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { fetchTrending, searchMiniApps, TrendingApp, SearchResult } from "@/lib/api/miniapps";
import type { MiniAppInfo, MiniAppCategory } from "@/types/miniapp";
import { BUILTIN_APPS, getAppsByCategory } from "@/lib/miniapp";

// Re-export MiniAppInfo as MiniApp for backward compatibility
export type MiniApp = MiniAppInfo;

const CATEGORIES: Array<"All" | MiniAppCategory> = ["All", "gaming", "defi", "governance", "utility", "social", "nft"];

const CATEGORY_DISPLAY: Record<string, string> = {
  All: "All",
  gaming: "Gaming",
  defi: "DeFi",
  governance: "Governance",
  utility: "Utility",
  social: "Social",
  nft: "NFT",
};

export function useMiniApps() {
  const [selectedCategory, setCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [trendingApps, setTrendingApps] = useState<MiniApp[]>([]);
  const [searchResults, setSearchResults] = useState<MiniApp[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch trending on mount and category change
  useEffect(() => {
    if (searchQuery) return; // Skip if searching

    const loadTrending = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchTrending(selectedCategory);
        setTrendingApps(mapTrendingToMiniApp(data));
      } catch {
        // Fallback to builtin apps
        setTrendingApps(BUILTIN_APPS);
      } finally {
        setIsLoading(false);
      }
    };

    loadTrending();
  }, [selectedCategory, searchQuery]);

  // Search with debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await searchMiniApps(searchQuery, selectedCategory);
        setSearchResults(mapSearchToMiniApp(data));
      } catch {
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory]);

  const apps = useMemo(() => {
    if (searchQuery.trim()) return searchResults;
    if (trendingApps.length > 0) return trendingApps;
    // Fallback to builtin apps
    if (selectedCategory === "All") return BUILTIN_APPS;
    return getAppsByCategory(selectedCategory as MiniAppCategory);
  }, [searchQuery, searchResults, trendingApps, selectedCategory]);

  const clearSearch = useCallback(() => setSearchQuery(""), []);

  // Get display name for category
  const getCategoryDisplay = useCallback((cat: string) => CATEGORY_DISPLAY[cat] || cat, []);

  return {
    apps,
    categories: CATEGORIES,
    selectedCategory,
    setCategory,
    searchQuery,
    setSearchQuery,
    clearSearch,
    isLoading,
    error,
    getCategoryDisplay,
  };
}

function mapTrendingToMiniApp(data: TrendingApp[]): MiniApp[] {
  return data.map((t) => ({
    app_id: t.app_id,
    name: t.name,
    description: "",
    icon: t.icon,
    category: (t.category?.toLowerCase() || "utility") as MiniAppCategory,
    entry_url: `/miniapps/${t.app_id}/index.html`,
    stats: {
      users_24h: t.stats?.users_24h,
      txs_24h: t.stats?.txs_24h,
      volume_24h: t.stats?.volume_24h,
    },
    permissions: {},
    supportedChains: ["neo-n3-mainnet", "neo-n3-testnet"],
  }));
}

function mapSearchToMiniApp(data: SearchResult[]): MiniApp[] {
  return data.map((s) => ({
    app_id: s.app_id,
    name: s.name,
    description: s.description,
    icon: s.icon,
    category: (s.category?.toLowerCase() || "utility") as MiniAppCategory,
    entry_url: `/miniapps/${s.app_id}/index.html`,
    permissions: {},
    supportedChains: ["neo-n3-mainnet", "neo-n3-testnet"],
  }));
}
