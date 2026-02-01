import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useWalletStore } from "@/stores/wallet";
import { useTranslation } from "@/hooks/useTranslation";

export default function ImportScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { importWallet, isLoading } = useWalletStore();
  const [wif, setWif] = useState("");
  const [error, setError] = useState("");

  const handleImport = async () => {
    if (!wif.trim()) {
      setError(t("wallet.error_empty_wif"));
      return;
    }
    setError("");
    const success = await importWallet(wif.trim());
    if (success) {
      router.replace("/");
    } else {
      setError(t("wallet.error_invalid_wif"));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: t("wallet.import") }} />

      <View style={styles.content}>
        <View style={styles.iconBox}>
          <View style={styles.brutalIcon}>
            <Ionicons name="download" size={48} color="#000" />
          </View>
        </View>

        <Text style={styles.title}>{t("wallet.import")}</Text>
        <Text style={styles.subtitle}>{t("wallet.import_subtitle")}</Text>

        <TextInput
          style={styles.input}
          placeholder={t("wallet.wif_placeholder")}
          placeholderTextColor="#666"
          value={wif}
          onChangeText={setWif}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
        />

        {error ? <View style={styles.errorBox}><Text style={styles.error}>{error}</Text></View> : null}

        <TouchableOpacity style={styles.importBtn} onPress={handleImport} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color="#000" /> : <Text style={styles.importText}>{t("wallet.import")}</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { flex: 1, padding: 24, alignItems: "center", justifyContent: "center" },
  iconBox: { marginBottom: 32 },
  brutalIcon: {
    backgroundColor: "#00E599",
    padding: 20,
    borderWidth: 4,
    borderColor: "#000",
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  title: { fontSize: 32, fontWeight: "900", color: "#000", marginBottom: 12, textTransform: "uppercase", fontStyle: "italic", textAlign: "center" },
  subtitle: { color: "#333", textAlign: "center", marginBottom: 40, fontWeight: "700", textTransform: "uppercase", fontSize: 13 },
  input: {
    width: "100%",
    backgroundColor: "#fff",
    padding: 20,
    borderWidth: 3,
    borderColor: "#000",
    color: "#000",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  errorBox: {
    backgroundColor: "#ff7e7e",
    borderWidth: 2,
    borderColor: "#000",
    padding: 10,
    width: "100%",
    marginBottom: 20,
  },
  error: { color: "#000", fontWeight: "900", textTransform: "uppercase", fontSize: 12, textAlign: "center" },
  importBtn: {
    width: "100%",
    backgroundColor: "#ffde59",
    padding: 20,
    borderWidth: 4,
    borderColor: "#000",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  importText: { color: "#000", fontSize: 18, fontWeight: "900", textTransform: "uppercase" },
});
