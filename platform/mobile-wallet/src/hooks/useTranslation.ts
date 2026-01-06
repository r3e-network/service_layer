import { useWalletStore } from "@/stores/wallet";
import { t } from "@/lib/i18n/translate";

export function useTranslation() {
    const { locale } = useWalletStore();

    return {
        t: (key: string) => t(locale, key),
        locale,
    };
}
