import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useWalletStore } from "@/stores/wallet";
import { useTranslation } from "@/hooks/useTranslation";

export default function AddTokenScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { addToken, isLoading } = useWalletStore();
  const [contractAddress, setContractAddress] = useState("");
  const [symbol, setSymbol] = useState("");
  const [name, setName] = useState("");
  const [decimals, setDecimals] = useState("8");
  const [error, setError] = useState("");

  const validateContractAddress = (address: string): boolean => {
    const cleanAddress = address.startsWith("0x") ? address : `0x${address}`;
    return /^0x[a-fA-F0-9]{40}$/.test(cleanAddress);
  };

  const handleAdd = async () => {
    setError("");

    if (!contractAddress.trim()) {
      setError(t("tokens.enter_hash"));
      return;
    }

    if (!validateContractAddress(contractAddress.trim())) {
      setError(t("tokens.invalid_hash"));
      return;
    }

    if (!symbol.trim()) {
      setError(t("tokens.enter_symbol"));
      return;
    }

    if (!name.trim()) {
      setError(t("tokens.enter_name"));
      return;
    }

    const dec = parseInt(decimals, 10);
    if (isNaN(dec) || dec < 0 || dec > 18) {
      setError(t("tokens.invalid_decimals"));
      return;
    }

    try {
      const cleanAddress = contractAddress.trim().startsWith("0x")
        ? contractAddress.trim()
        : `0x${contractAddress.trim()}`;

      await addToken({
        contractAddress: cleanAddress,
        symbol: symbol.trim().toUpperCase(),
        name: name.trim(),
        decimals: dec,
      });

      Alert.alert(t("wallet.success"), t("tokens.add_success"), [{ text: t("common.confirm"), onPress: () => router.back() }]);
    } catch {
      setError(t("tokens.add_fail"));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: t("settings.add_custom_token") }} />

      <View style={styles.content}>
        <View style={styles.iconBox}>
          <Ionicons name="add-circle" size={48} color="#00d4aa" />
        </View>

        <Text style={styles.title}>{t("settings.add_custom_token")}</Text>
        <Text style={styles.subtitle}>{t("tokens.add_custom_subtitle")}</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t("tokens.contract")}</Text>
          <TextInput
            style={styles.input}
            placeholder="0x..."
            placeholderTextColor="#666"
            value={contractAddress}
            onChangeText={setContractAddress}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t("tokens.symbol")}</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. FLM"
            placeholderTextColor="#666"
            value={symbol}
            onChangeText={setSymbol}
            autoCapitalize="characters"
            maxLength={10}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t("tokens.name")}</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Flamingo"
            placeholderTextColor="#666"
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t("tokens.decimals")}</Text>
          <TextInput
            style={styles.input}
            placeholder="8"
            placeholderTextColor="#666"
            value={decimals}
            onChangeText={setDecimals}
            keyboardType="number-pad"
            maxLength={2}
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity style={styles.addBtn} onPress={handleAdd} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.addText}>{t("tokens.add")}</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { flex: 1, padding: 24 },
  iconBox: { alignItems: "center", marginBottom: 20, marginTop: 10 },
  title: { fontSize: 32, fontWeight: "900", color: "#000", textAlign: "center", marginBottom: 8, textTransform: "uppercase", fontStyle: "italic" },
  subtitle: { color: "#666", textAlign: "center", marginBottom: 32, fontWeight: "800", textTransform: "uppercase", fontSize: 12 },
  inputGroup: { marginBottom: 20 },
  label: { color: "#000", fontSize: 12, marginBottom: 8, fontWeight: "900", textTransform: "uppercase" },
  input: {
    backgroundColor: "#fff",
    padding: 16,
    borderWidth: 3,
    borderColor: "#000",
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  error: { color: "#EF4444", marginBottom: 20, textAlign: "center", fontWeight: "900", textTransform: "uppercase", backgroundColor: "#000", padding: 8, borderWidth: 2, borderColor: "#EF4444" },
  addBtn: {
    backgroundColor: "#00E599",
    padding: 20,
    borderWidth: 4,
    borderColor: "#000",
    alignItems: "center",
    marginTop: 12,
    shadowColor: "#000",
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  },
  addText: { color: "#000", fontSize: 18, fontWeight: "900", textTransform: "uppercase" },
});
