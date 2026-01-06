/**
 * Theme detection utility for MiniApps
 * Detects theme from URL parameters or system preference
 */

export type Theme = "dark" | "light";

/**
 * Get theme from URL parameter (passed by host app)
 */
export function getThemeFromUrl(): Theme | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const theme = params.get("theme");
  if (theme === "light" || theme === "dark") {
    return theme;
  }
  return null;
}

/**
 * Get theme from system preference
 */
export function getSystemTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

/**
 * Get current theme (URL param > system preference > default dark)
 */
export function getCurrentTheme(): Theme {
  return getThemeFromUrl() || getSystemTheme();
}

/**
 * Apply theme to document
 */
export function applyTheme(theme: Theme): void {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.classList.remove("theme-light", "theme-dark");
  document.documentElement.classList.add(`theme-${theme}`);
}

/**
 * Initialize theme detection and apply
 */
export function initTheme(): Theme {
  const theme = getCurrentTheme();
  applyTheme(theme);
  return theme;
}

/**
 * Listen for theme changes from host app via postMessage
 */
export function listenForThemeChanges(callback?: (theme: Theme) => void): () => void {
  if (typeof window === "undefined") return () => {};

  const handler = (event: MessageEvent) => {
    if (event.data?.type === "theme-change" && event.data?.theme) {
      const theme = event.data.theme as Theme;
      applyTheme(theme);
      callback?.(theme);
    }
  };

  window.addEventListener("message", handler);
  return () => window.removeEventListener("message", handler);
}
