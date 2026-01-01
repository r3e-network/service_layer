import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { getLocale, setLocale, LOCALES, Locale } from "@/lib/i18n";

export default function LanguageScreen() {
  const router = useRouter();
  const [current, setCurrent] = useState<Locale>("en");

  useEffect(() => {
    getLocale().then(setCurrent);
  }, []);

  const handleSelect = async (locale: Locale) => {
    await setLocale(locale);
    setCurrent(locale);
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "Language" }} />
      <View style={styles.list}>
        {(Object.keys(LOCALES) as Locale[]).map((locale) => (
          <TouchableOpacity
            key={locale}
            style={[styles.item, current === locale && styles.active]}
            onPress={() => handleSelect(locale)}
          >
            <Text style={styles.label}>{LOCALES[locale]}</Text>
            {current === locale && <Ionicons name="checkmark-circle" size={24} color="#00d4aa" />}
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  list: { padding: 16 },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  active: { borderColor: "#00d4aa", borderWidth: 1 },
  label: { color: "#fff", fontSize: 16 },
});
