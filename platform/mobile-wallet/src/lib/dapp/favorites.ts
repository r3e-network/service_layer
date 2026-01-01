/**
 * DApp Favorites Management
 * Handles storage and retrieval of favorite DApps
 */

import * as SecureStore from "expo-secure-store";

const FAVORITES_KEY = "dapp_favorites";

export interface DApp {
  url: string;
  name: string;
  icon?: string;
  addedAt: number;
}

export async function loadFavorites(): Promise<DApp[]> {
  const data = await SecureStore.getItemAsync(FAVORITES_KEY);
  return data ? JSON.parse(data) : [];
}

export async function addFavorite(dapp: Omit<DApp, "addedAt">): Promise<void> {
  const favorites = await loadFavorites();
  const exists = favorites.some((f) => f.url === dapp.url);
  if (!exists) {
    favorites.unshift({ ...dapp, addedAt: Date.now() });
    await SecureStore.setItemAsync(FAVORITES_KEY, JSON.stringify(favorites));
  }
}

export async function removeFavorite(url: string): Promise<void> {
  const favorites = await loadFavorites();
  const filtered = favorites.filter((f) => f.url !== url);
  await SecureStore.setItemAsync(FAVORITES_KEY, JSON.stringify(filtered));
}

export async function isFavorite(url: string): Promise<boolean> {
  const favorites = await loadFavorites();
  return favorites.some((f) => f.url === url);
}
