import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { LOCALES, Locale } from "@/lib/i18n";
import { useWalletStore } from "@/stores/wallet";
import { useTranslation } from "@/hooks/useTranslation";

export default function LanguageScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { locale: current, setLocale } = useWalletStore();

  const handleSelect = async (l: Locale) => {
    await setLocale(l);
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: t("settings.language") }} />
      <View style={styles.list}>
        {(Object.keys(LOCALES) as Locale[]).map((locale) => (
          <TouchableOpacity
            key={locale}
            style={[styles.item, current === locale && styles.active]}
            onPress={() => handleSelect(locale)}
          >
            <Text style={styles.label}>{LOCALES[locale]}</Text>
            {current === locale && <Ionicons name="checkmark-circle" size={24} color="#000" />}
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  list: { padding: 24 },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
    borderWidth: 3,
    borderColor: "#000",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  active: { backgroundColor: "#00E599", shadowOffset: { width: 0, height: 0 }, transform: [{ translateX: 4 }, { translateY: 4 }] },
  label: { color: "#000", fontSize: 18, fontWeight: "900", textTransform: "uppercase" },
});
