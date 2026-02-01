/**
 * i18n Tests
 * Tests for src/lib/i18n/
 */

import * as SecureStore from "expo-secure-store";
import { getLocale, setLocale, isValidLocale } from "../src/lib/i18n";
import { t, getTranslations } from "../src/lib/i18n/translate";

jest.mock("expo-secure-store");

const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

describe("i18n", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getLocale", () => {
    it("should return stored locale", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue("zh");
      const locale = await getLocale();
      expect(locale).toBe("zh");
    });

    it("should return en as default", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);
      const locale = await getLocale();
      expect(locale).toBe("en");
    });
  });

  describe("setLocale", () => {
    it("should save locale", async () => {
      await setLocale("ja");
      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith("app_locale", "ja");
    });
  });

  describe("isValidLocale", () => {
    it("should return true for valid locales", () => {
      expect(isValidLocale("en")).toBe(true);
      expect(isValidLocale("zh")).toBe(true);
      expect(isValidLocale("ja")).toBe(true);
      expect(isValidLocale("ko")).toBe(true);
    });

    it("should return false for invalid locales", () => {
      expect(isValidLocale("fr")).toBe(false);
      expect(isValidLocale("")).toBe(false);
    });
  });
});

describe("translate", () => {
  describe("t", () => {
    it("should return translation for key", () => {
      expect(t("en", "common.confirm")).toBe("Confirm");
      expect(t("zh", "common.confirm")).toBe("确认");
    });

    it("should return key if not found", () => {
      expect(t("en", "invalid.key")).toBe("invalid.key");
    });
  });

  describe("getTranslations", () => {
    it("should return translations object", () => {
      const trans = getTranslations("en");
      expect(trans.common.confirm).toBe("Confirm");
    });
  });
});
