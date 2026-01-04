export type Theme = "dark" | "light";

export function getThemeFromUrl(): Theme | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const theme = params.get("theme");
  if (theme === "light" || theme === "dark") return theme;
  return null;
}

export function getSystemTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function getCurrentTheme(): Theme {
  return getThemeFromUrl() || getSystemTheme();
}

export function applyTheme(theme: Theme): void {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.classList.remove("theme-light", "theme-dark");
  document.documentElement.classList.add(`theme-${theme}`);
}

export function initTheme(): Theme {
  const theme = getCurrentTheme();
  applyTheme(theme);
  return theme;
}

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
