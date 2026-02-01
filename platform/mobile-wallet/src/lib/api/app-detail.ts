/**
 * App Detail API
 * Fetches MiniApp details and stats
 */

import { API_BASE_URL } from "@/lib/config";
import type { MiniAppInfo } from "@/types/miniapp";

const API_BASE = API_BASE_URL;

export type AppDetail = MiniAppInfo & { stats: AppStats };

export interface AppStats {
  users_24h: number;
  txs_24h: number;
  volume_24h: string;
  total_users: number;
  rating: number;
  reviews: number;
}

/**
 * Fetch app details by ID
 */
export async function fetchAppDetail(appId: string): Promise<AppDetail | null> {
  try {
    const encodedId = encodeURIComponent(appId);
    const [infoRes, statsRes] = await Promise.all([
      fetch(`${API_BASE}/miniapps/${encodedId}/detail`),
      fetch(`${API_BASE}/miniapps/${encodedId}/stats`),
    ]);

    if (!infoRes.ok) return null;

    const infoData = await infoRes.json();
    const app = infoData.app as MiniAppInfo | undefined;
    if (!app) return null;

    const statsData = statsRes.ok ? await statsRes.json() : null;

    const entryUrl = app.entry_url || `/miniapps/${app.app_id}/index.html`;

    return {
      ...app,
      entry_url: entryUrl,
      permissions: app.permissions ?? {},
      supportedChains: app.supportedChains ?? [],
      stats: statsData?.stats || getDefaultStats(),
    };
  } catch {
    return null;
  }
}

function getDefaultStats(): AppStats {
  return {
    users_24h: 0,
    txs_24h: 0,
    volume_24h: "0",
    total_users: 0,
    rating: 0,
    reviews: 0,
  };
}
