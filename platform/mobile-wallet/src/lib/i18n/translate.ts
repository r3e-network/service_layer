/**
 * Translation utilities
 */

import en from "./locales/en";
import zh from "./locales/zh";
import ja from "./locales/ja";
import ko from "./locales/ko";
import type { Locale } from "./index";

const translations = { en, zh, ja, ko };

type TranslationKeys = typeof en;

export function t(locale: Locale, key: string): string {
  const keys = key.split(".");
  let value: unknown = translations[locale];

  for (const k of keys) {
    if (value && typeof value === "object") {
      value = (value as Record<string, unknown>)[k];
    } else {
      return key;
    }
  }

  return typeof value === "string" ? value : key;
}

export function getTranslations(locale: Locale): TranslationKeys {
  return translations[locale];
}
