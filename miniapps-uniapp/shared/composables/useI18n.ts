import { ref } from "vue";
import { getLocale, type Locale, type TranslationMap } from "../utils/i18n";

type InterpolationArgs = Record<string, string | number>;

const DEFAULT_MESSAGES = {
  docBadge: { en: "Documentation", zh: "文档" },
  docFooter: { en: "NeoHub MiniApp Protocol v2.4.0", zh: "NeoHub MiniApp Protocol v2.4.0" },
} as const;

type DefaultMessages = typeof DEFAULT_MESSAGES;
type MergedMessages<T extends TranslationMap> = T & DefaultMessages;

const normalizeLocale = (lang?: string | null): Locale => {
  if (!lang) return "en";
  return lang.toLowerCase().startsWith("zh") ? "zh" : "en";
};

const interpolate = (value: string, args: InterpolationArgs): string =>
  value.replace(/\{(\w+)\}/g, (_, key) => String(args[key] ?? `{${key}}`));

export function createUseI18n<T extends TranslationMap>(messages: T) {
  const mergedMessages = { ...DEFAULT_MESSAGES, ...messages } as MergedMessages<T>;
  const currentLocale = ref<Locale>(getLocale());

  const t = (key: keyof MergedMessages<T>, args?: InterpolationArgs) => {
    const entry = mergedMessages[key];
    if (!entry) return String(key);

    let str = "";
    if (typeof entry === "string") {
      str = entry;
    } else {
      str = entry[currentLocale.value] || entry.en || entry.zh || String(key);
    }

    return args ? interpolate(str, args) : str;
  };

  const setLocale = (lang: string) => {
    currentLocale.value = normalizeLocale(lang);
  };

  // Automatically listen for language changes from the host app
  if (typeof window !== "undefined") {
    window.addEventListener("languageChange", (event: any) => {
      const newLang = event.detail?.language;
      if (newLang) {
        setLocale(newLang);
      }
    });
  }

  return () => ({
    locale: currentLocale,
    t,
    setLocale,
  });
}
