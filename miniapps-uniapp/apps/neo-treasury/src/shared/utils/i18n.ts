import { readQueryParam } from "./url";

export type Locale = "en" | "zh";

export type TranslationValue =
  | string
  | {
      en?: string;
      zh?: string;
    };

export type TranslationMap = Record<string, TranslationValue>;

function normalizeLocale(value?: string | null): Locale {
  const raw = (value || "").toLowerCase();
  if (raw.startsWith("zh")) return "zh";
  return "en";
}

export function getLocale(): Locale {
  const queryLocale = readQueryParam("lang") || readQueryParam("locale");
  if (queryLocale) return normalizeLocale(queryLocale);
  if (typeof navigator !== "undefined") {
    return normalizeLocale(navigator.language || navigator.languages?.[0]);
  }
  return "en";
}

export function createT(translations: TranslationMap, localeOverride?: string): (key: string) => string {
  const locale = normalizeLocale(localeOverride || getLocale());
  return (key: string) => {
    const entry = translations[key];
    if (!entry) return key;
    if (typeof entry === "string") return entry;
    return entry[locale] || entry.en || entry.zh || key;
  };
}
