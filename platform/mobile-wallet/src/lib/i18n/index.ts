/**
 * i18n Internationalization Module
 * Handles multi-language support
 */

import * as SecureStore from "expo-secure-store";

const LOCALE_KEY = "app_locale";

export type Locale = "en" | "zh" | "ja" | "ko";

export const LOCALES: Record<Locale, string> = {
  en: "English",
  zh: "中文",
  ja: "日本語",
  ko: "한국어",
};

export async function getLocale(): Promise<Locale> {
  const stored = await SecureStore.getItemAsync(LOCALE_KEY);
  return (stored as Locale) || "en";
}

export async function setLocale(locale: Locale): Promise<void> {
  await SecureStore.setItemAsync(LOCALE_KEY, locale);
}

export function isValidLocale(locale: string): locale is Locale {
  return ["en", "zh", "ja", "ko"].includes(locale);
}
