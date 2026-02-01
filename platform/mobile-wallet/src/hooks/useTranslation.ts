import { useWalletStore } from "@/stores/wallet";
import { t } from "@/lib/i18n/translate";

export function useTranslation() {
  const { locale } = useWalletStore();

  return {
    t: (key: string, options?: Record<string, string | number>) => t(locale, key, options),
    locale,
  };
}
