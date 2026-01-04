/**
 * MiniApp i18n utilities
 * Reads language from URL parameter and provides translation helpers
 */

export type SupportedLocale = "en" | "zh";
export const DEFAULT_LOCALE: SupportedLocale = "en";

/**
 * Get current locale from URL parameter
 * Falls back to 'en' if not specified or unsupported
 */
export function getLocale(): SupportedLocale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;

  const params = new URLSearchParams(window.location.search);
  const lang = params.get("lang");

  if (lang === "zh") return "zh";
  return "en";
}

/**
 * Simple translation function factory
 * @param translations - Object with en/zh translations
 * @returns Translation function that dynamically reads locale
 */
export function createT<T extends Record<string, { en: string; zh: string }>>(
  translations: T,
): (key: keyof T) => string {
  return (key: keyof T) => {
    const locale = getLocale(); // Get locale on each call
    const entry = translations[key];
    if (!entry) return String(key);
    return entry[locale] || entry.en;
  };
}

/**
 * Common translations shared across MiniApps
 */
export const commonTranslations = {
  loading: { en: "Loading...", zh: "加载中..." },
  error: { en: "Error", zh: "错误" },
  success: { en: "Success", zh: "成功" },
  confirm: { en: "Confirm", zh: "确认" },
  cancel: { en: "Cancel", zh: "取消" },
  submit: { en: "Submit", zh: "提交" },
  back: { en: "Back", zh: "返回" },
  connectWallet: { en: "Connect Wallet", zh: "连接钱包" },
  walletConnected: { en: "Wallet Connected", zh: "钱包已连接" },
  insufficientBalance: { en: "Insufficient Balance", zh: "余额不足" },
  transactionPending: { en: "Transaction Pending", zh: "交易处理中" },
  transactionSuccess: { en: "Transaction Successful", zh: "交易成功" },
  transactionFailed: { en: "Transaction Failed", zh: "交易失败" },
};

export const t = createT(commonTranslations);
