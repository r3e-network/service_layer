type Translations = Record<string, { en: string; zh: string }>;

export function createT(translations: Translations) {
  const lang = typeof navigator !== "undefined" && navigator.language.startsWith("zh") ? "zh" : "en";
  return (key: string): string => translations[key]?.[lang] || key;
}
