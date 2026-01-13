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
  // Updated to match Neo Branding
  { id: "neo", name: "Neo Green", primary: "#00e599", background: "#05060d", surface: "#121322", text: "#f8f8ff" },
  { id: "ocean", name: "Ocean Blue", primary: "#22d3ee", background: "#0b0c16", surface: "#151828", text: "#f8f8ff" },
  { id: "sunset", name: "Sunset", primary: "#fb923c", background: "#1a0a0a", surface: "#2a1a1a", text: "#f8f8ff" },
  { id: "erobo", name: "E-Robo Purple", primary: "#9f9df3", background: "#05060d", surface: "#121322", text: "#f8f8ff" },
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
