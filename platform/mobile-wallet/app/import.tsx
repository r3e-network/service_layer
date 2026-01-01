import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useWalletStore } from "@/stores/wallet";

export default function ImportScreen() {
  const router = useRouter();
  const { importWallet, isLoading } = useWalletStore();
  const [wif, setWif] = useState("");
  const [error, setError] = useState("");

  const handleImport = async () => {
    if (!wif.trim()) {
      setError("Please enter a WIF private key");
      return;
    }
    setError("");
    const success = await importWallet(wif.trim());
    if (success) {
      router.replace("/");
    } else {
      setError("Invalid WIF format");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "Import Wallet" }} />

      <View style={styles.content}>
        <View style={styles.iconBox}>
          <Ionicons name="download" size={48} color="#00d4aa" />
        </View>

        <Text style={styles.title}>Import Existing Wallet</Text>
        <Text style={styles.subtitle}>Enter your WIF private key to restore your wallet</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter WIF private key (starts with K or L)"
          placeholderTextColor="#666"
          value={wif}
          onChangeText={setWif}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity style={styles.importBtn} onPress={handleImport} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.importText}>Import Wallet</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  content: { flex: 1, padding: 20, alignItems: "center", justifyContent: "center" },
  iconBox: { marginBottom: 24 },
  title: { fontSize: 24, fontWeight: "bold", color: "#fff", marginBottom: 8 },
  subtitle: { color: "#888", textAlign: "center", marginBottom: 32 },
  input: {
    width: "100%",
    backgroundColor: "#1a1a1a",
    padding: 16,
    borderRadius: 12,
    color: "#fff",
    fontSize: 16,
    marginBottom: 16,
  },
  error: { color: "#ef4444", marginBottom: 16 },
  importBtn: {
    width: "100%",
    backgroundColor: "#00d4aa",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  importText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
