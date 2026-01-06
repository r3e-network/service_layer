/**
 * Theme System
 * Dark/Light theme management
 */

import * as SecureStore from "expo-secure-store";

const THEME_KEY = "app_theme";

export type ThemeMode = "dark" | "light" | "system";

export interface ThemeColors {
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  primary: string;
  border: string;
  error: string;
}

export interface Theme {
  mode: ThemeMode;
  colors: ThemeColors;
}

const DARK_COLORS: ThemeColors = {
  background: "#0f0f0f",
  surface: "#1a1a1a",
  text: "#ffffff",
  textSecondary: "#a0a0a0",
  primary: "#00e599",
  border: "#ffffff",
  error: "#ff4757",
};

const LIGHT_COLORS: ThemeColors = {
  background: "#f5f5f5",
  surface: "#ffffff",
  text: "#000000",
  textSecondary: "#555555",
  primary: "#00e599",
  border: "#000000",
  error: "#ff4757",
};

/**
 * Load theme mode
 */
export async function loadThemeMode(): Promise<ThemeMode> {
  const data = await SecureStore.getItemAsync(THEME_KEY);
  return (data as ThemeMode) || "dark";
}

/**
 * Save theme mode
 */
export async function saveThemeMode(mode: ThemeMode): Promise<void> {
  await SecureStore.setItemAsync(THEME_KEY, mode);
}

/**
 * Get colors for mode
 */
export function getThemeColors(mode: ThemeMode, systemDark: boolean): ThemeColors {
  if (mode === "system") {
    return systemDark ? DARK_COLORS : LIGHT_COLORS;
  }
  return mode === "dark" ? DARK_COLORS : LIGHT_COLORS;
}

/**
 * Get theme mode label
 */
export function getThemeModeLabel(mode: ThemeMode): string {
  const labels: Record<ThemeMode, string> = {
    dark: "Dark",
    light: "Light",
    system: "System",
  };
  return labels[mode];
}

/**
 * Get theme icon
 */
export function getThemeIcon(mode: ThemeMode): string {
  const icons: Record<ThemeMode, string> = {
    dark: "moon",
    light: "sunny",
    system: "phone-portrait",
  };
  return icons[mode];
}
