import { useState, useEffect, useMemo, useCallback } from "react";
import { fetchTrending, searchMiniApps, TrendingApp, SearchResult } from "@/lib/api/miniapps";

export interface MiniApp {
  app_id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  stats?: {
    users_24h: number;
    txs_24h: number;
    volume_24h: string;
  };
}

const BUILTIN_APPS: MiniApp[] = [
  { app_id: "lottery", name: "Neo Lottery", description: "Provably fair lottery", icon: "🎰", category: "Gaming" },
  { app_id: "coinflip", name: "Coin Flip", description: "50/50 coin flip", icon: "🪙", category: "Gaming" },
  { app_id: "dicegame", name: "Dice Game", description: "Roll and win", icon: "🎲", category: "Gaming" },
  { app_id: "redenvelope", name: "Red Envelope", description: "Send GAS gifts", icon: "🧧", category: "Social" },
  { app_id: "secretvote", name: "Secret Vote", description: "Private voting", icon: "🗳️", category: "Governance" },
  { app_id: "predictionmarket", name: "Prediction", description: "Trade outcomes", icon: "📊", category: "DeFi" },
];

const CATEGORIES = ["All", "Gaming", "DeFi", "Social", "Governance"];

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
    // Fallback filter
    if (selectedCategory === "All") return BUILTIN_APPS;
    return BUILTIN_APPS.filter((app) => app.category === selectedCategory);
  }, [searchQuery, searchResults, trendingApps, selectedCategory]);

  const clearSearch = useCallback(() => setSearchQuery(""), []);

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
  };
}

function mapTrendingToMiniApp(data: TrendingApp[]): MiniApp[] {
  return data.map((t) => ({
    app_id: t.app_id,
    name: t.name,
    description: "",
    icon: t.icon,
    category: t.category,
    stats: t.stats,
  }));
}

function mapSearchToMiniApp(data: SearchResult[]): MiniApp[] {
  return data.map((s) => ({
    app_id: s.app_id,
    name: s.name,
    description: s.description,
    icon: s.icon,
    category: s.category,
  }));
}
