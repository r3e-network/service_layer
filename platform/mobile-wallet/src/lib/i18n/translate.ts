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

function interpolate(template: string, values?: Record<string, string | number>): string {
  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (_, token) => String(values[token] ?? `{${token}}`));
}

export function t(locale: Locale, key: string, values?: Record<string, string | number>): string {
  const keys = key.split(".");
  let value: unknown = translations[locale];

  for (const k of keys) {
    if (value && typeof value === "object") {
      value = (value as Record<string, unknown>)[k];
    } else {
      return key;
    }
  }

  if (typeof value !== "string") return key;
  return interpolate(value, values);
}

export function getTranslations(locale: Locale): TranslationKeys {
  return translations[locale];
}
