/**
 * App Detail API
 * Fetches MiniApp details and stats
 */

const API_BASE = "https://neomini.app/api";

export interface AppDetail {
  app_id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  permissions: string[];
  stats: AppStats;
}

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
    const [infoRes, statsRes] = await Promise.all([
      fetch(`${API_BASE}/miniapps/search?q=${appId}`),
      fetch(`${API_BASE}/miniapps/${appId}/stats`),
    ]);

    if (!infoRes.ok) return null;

    const infoData = await infoRes.json();
    const app = infoData.results?.[0];
    if (!app) return null;

    const statsData = statsRes.ok ? await statsRes.json() : null;

    return {
      app_id: app.app_id,
      name: app.name,
      description: app.description,
      icon: app.icon,
      category: app.category,
      permissions: ["payments", "rng"],
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
