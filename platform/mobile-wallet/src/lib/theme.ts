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

// Neo Modern Dark Theme (Matches tokens.scss)
const DARK_COLORS: ThemeColors = {
  background: "#05060d", // $neo-black / $bg-primary
  surface: "#121322", // $bg-elevated
  text: "#f8f8ff", // $text-primary
  textSecondary: "rgba(231, 232, 246, 0.72)", // $text-secondary
  primary: "#00e599", // $neo-green
  border: "rgba(159, 157, 243, 0.15)", // $border-color
  error: "#ef4444", // $status-error
};

const LIGHT_COLORS: ThemeColors = {
  background: "#f8f8ff", // $bg-primary-light
  surface: "#ffffff", // $bg-elevated-light
  text: "#1b1b2f", // $text-primary-light
  textSecondary: "#4a4a63",
  primary: "#00e599",
  border: "rgba(159, 157, 243, 0.2)",
  error: "#ef4444",
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
