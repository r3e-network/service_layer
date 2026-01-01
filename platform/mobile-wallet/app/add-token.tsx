import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useWalletStore } from "@/stores/wallet";

export default function AddTokenScreen() {
  const router = useRouter();
  const { addToken, isLoading } = useWalletStore();
  const [contractHash, setContractHash] = useState("");
  const [symbol, setSymbol] = useState("");
  const [name, setName] = useState("");
  const [decimals, setDecimals] = useState("8");
  const [error, setError] = useState("");

  const validateContractHash = (hash: string): boolean => {
    const cleanHash = hash.startsWith("0x") ? hash : `0x${hash}`;
    return /^0x[a-fA-F0-9]{40}$/.test(cleanHash);
  };

  const handleAdd = async () => {
    setError("");

    if (!contractHash.trim()) {
      setError("Please enter contract hash");
      return;
    }

    if (!validateContractHash(contractHash.trim())) {
      setError("Invalid contract hash format");
      return;
    }

    if (!symbol.trim()) {
      setError("Please enter token symbol");
      return;
    }

    if (!name.trim()) {
      setError("Please enter token name");
      return;
    }

    const dec = parseInt(decimals, 10);
    if (isNaN(dec) || dec < 0 || dec > 18) {
      setError("Decimals must be 0-18");
      return;
    }

    try {
      const cleanHash = contractHash.trim().startsWith("0x") ? contractHash.trim() : `0x${contractHash.trim()}`;

      await addToken({
        contractHash: cleanHash,
        symbol: symbol.trim().toUpperCase(),
        name: name.trim(),
        decimals: dec,
      });

      Alert.alert("Success", "Token added successfully", [{ text: "OK", onPress: () => router.back() }]);
    } catch {
      setError("Failed to add token");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "Add Token" }} />

      <View style={styles.content}>
        <View style={styles.iconBox}>
          <Ionicons name="add-circle" size={48} color="#00d4aa" />
        </View>

        <Text style={styles.title}>Add Custom Token</Text>
        <Text style={styles.subtitle}>Add any NEP-17 token by contract hash</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Contract Hash</Text>
          <TextInput
            style={styles.input}
            placeholder="0x..."
            placeholderTextColor="#666"
            value={contractHash}
            onChangeText={setContractHash}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Symbol</Text>
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
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Flamingo"
            placeholderTextColor="#666"
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Decimals</Text>
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
          {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.addText}>Add Token</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  content: { flex: 1, padding: 20 },
  iconBox: { alignItems: "center", marginBottom: 16, marginTop: 20 },
  title: { fontSize: 24, fontWeight: "bold", color: "#fff", textAlign: "center", marginBottom: 8 },
  subtitle: { color: "#888", textAlign: "center", marginBottom: 24 },
  inputGroup: { marginBottom: 16 },
  label: { color: "#888", fontSize: 14, marginBottom: 8 },
  input: {
    backgroundColor: "#1a1a1a",
    padding: 16,
    borderRadius: 12,
    color: "#fff",
    fontSize: 16,
  },
  error: { color: "#ef4444", marginBottom: 16, textAlign: "center" },
  addBtn: {
    backgroundColor: "#00d4aa",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  addText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
