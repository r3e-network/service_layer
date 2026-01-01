/**
 * Custom Themes
 * User-defined color themes
 */

import * as SecureStore from "expo-secure-store";

const CUSTOM_THEMES_KEY = "custom_themes";
const ACTIVE_THEME_KEY = "active_theme";

export interface CustomTheme {
  id: string;
  name: string;
  primary: string;
  background: string;
  surface: string;
  text: string;
}

const PRESET_THEMES: CustomTheme[] = [
  { id: "neo", name: "Neo Green", primary: "#00d4aa", background: "#0a0a0a", surface: "#1a1a1a", text: "#ffffff" },
  { id: "ocean", name: "Ocean Blue", primary: "#0088ff", background: "#0a1020", surface: "#1a2030", text: "#ffffff" },
  { id: "sunset", name: "Sunset", primary: "#ff6644", background: "#1a0a0a", surface: "#2a1a1a", text: "#ffffff" },
];

/**
 * Load custom themes
 */
export async function loadCustomThemes(): Promise<CustomTheme[]> {
  const data = await SecureStore.getItemAsync(CUSTOM_THEMES_KEY);
  return data ? JSON.parse(data) : PRESET_THEMES;
}

/**
 * Save custom theme
 */
export async function saveCustomTheme(theme: CustomTheme): Promise<void> {
  const themes = await loadCustomThemes();
  const idx = themes.findIndex((t) => t.id === theme.id);
  if (idx >= 0) {
    themes[idx] = theme;
  } else {
    themes.push(theme);
  }
  await SecureStore.setItemAsync(CUSTOM_THEMES_KEY, JSON.stringify(themes));
}

/**
 * Get active theme ID
 */
export async function getActiveThemeId(): Promise<string> {
  const id = await SecureStore.getItemAsync(ACTIVE_THEME_KEY);
  return id || "neo";
}

/**
 * Set active theme
 */
export async function setActiveTheme(id: string): Promise<void> {
  await SecureStore.setItemAsync(ACTIVE_THEME_KEY, id);
}

/**
 * Generate theme ID
 */
export function generateThemeId(): string {
  return `theme_${Date.now()}`;
}
