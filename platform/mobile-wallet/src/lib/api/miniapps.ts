/**
 * MiniApp API Client
 * Fetches trending apps and search results from host-app API
 */

import { API_BASE_URL } from "@/lib/config";

const API_BASE = API_BASE_URL;

export interface TrendingApp {
  app_id: string;
  name: string;
  icon: string;
  category: string;
  entry_url: string;
  supportedChains?: string[];
  source?: string;
  score: number;
  stats: {
    users_24h: number;
    txs_24h: number;
    volume_24h: string;
    growth: number;
  };
}

export interface SearchResult {
  app_id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  entry_url: string;
  supportedChains?: string[];
  source?: string;
  score: number;
}

export interface TrendingResponse {
  trending: TrendingApp[];
  updated_at: string;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  query: string;
  suggestions?: string[];
}

/** Fetch trending MiniApps */
export async function fetchTrending(category?: string, limit = 20): Promise<TrendingApp[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (category && category !== "All") {
    params.set("category", category);
  }

  const res = await fetch(`${API_BASE}/miniapps/trending?${params}`);
  if (!res.ok) throw new Error("Failed to fetch trending");

  const data: TrendingResponse = await res.json();
  return data.trending;
}

/** Search MiniApps by query */
export async function searchMiniApps(query: string, category?: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];

  const params = new URLSearchParams({ q: query });
  if (category && category !== "All") {
    params.set("category", category);
  }

  const res = await fetch(`${API_BASE}/miniapps/search?${params}`);
  if (!res.ok) throw new Error("Failed to search");

  const data: SearchResponse = await res.json();
  return data.results;
}
