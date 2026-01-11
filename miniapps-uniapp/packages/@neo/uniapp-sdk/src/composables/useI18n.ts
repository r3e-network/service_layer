import { ref, computed, onMounted } from "vue";
import { callBridge } from "../bridge";

export type Locale = "en" | "zh";

/** Valid locale values for validation */
const VALID_LOCALES: readonly Locale[] = ["en", "zh"] as const;

function isValidLocale(value: unknown): value is Locale {
  return typeof value === "string" && VALID_LOCALES.includes(value as Locale);
}

/**
 * Global locale state - shared across all composable instances
 * This ensures consistent locale across the entire MiniApp
 */
const currentLocale = ref<Locale>("en");
let initialized = false;

export function useI18n(appId: string) {
  // Get locale from host platform
  const initLocale = async () => {
    if (initialized) return;
    initialized = true;

    try {
      const result = (await callBridge("getLocale", { appId })) as { locale?: string } | null;
      if (result?.locale && isValidLocale(result.locale)) {
        currentLocale.value = result.locale;
      }
    } catch {
      // Fallback to localStorage with validation
      const stored = localStorage.getItem("lang");
      if (isValidLocale(stored)) {
        currentLocale.value = stored;
      }
    }
  };

  // Initialize on mount (proper async handling)
  onMounted(() => {
    initLocale();
  });

  const locale = computed(() => currentLocale.value);

  const setLocale = async (newLocale: Locale) => {
    currentLocale.value = newLocale;
    localStorage.setItem("lang", newLocale);
    try {
      await callBridge("setLocale", { appId, locale: newLocale });
    } catch {
      // Silent fail
    }
  };

  return { locale, setLocale };
}
