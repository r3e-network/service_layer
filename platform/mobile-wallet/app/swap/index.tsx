import { View, Text, StyleSheet, TextInput, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { loadSwapSettings, SwapSettings, formatSlippage, calcMinReceived } from "@/lib/swap";

export default function SwapScreen() {
  const [fromToken, setFromToken] = useState("NEO");
  const [toToken, setToToken] = useState("GAS");
  const [fromAmount, setFromAmount] = useState("");
  const [settings, setSettings] = useState<SwapSettings | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadSwapSettings().then(setSettings);
    }, []),
  );

  const swapTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount("");
  };

  const toAmount = fromAmount ? (parseFloat(fromAmount) * 0.1).toFixed(4) : "";

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "Swap" }} />

      <View style={styles.card}>
        <Text style={styles.label}>From</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={fromAmount}
            onChangeText={setFromAmount}
            placeholder="0.0"
            placeholderTextColor="#666"
            keyboardType="decimal-pad"
          />
          <TouchableOpacity style={styles.tokenBtn}>
            <Text style={styles.tokenText}>{fromToken}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.swapBtn} onPress={swapTokens}>
        <Ionicons name="swap-vertical" size={24} color="#00d4aa" />
      </TouchableOpacity>

      <View style={styles.card}>
        <Text style={styles.label}>To</Text>
        <View style={styles.inputRow}>
          <Text style={styles.output}>{toAmount || "0.0"}</Text>
          <TouchableOpacity style={styles.tokenBtn}>
            <Text style={styles.tokenText}>{toToken}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {settings && fromAmount && (
        <View style={styles.info}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Slippage</Text>
            <Text style={styles.infoValue}>{formatSlippage(settings.slippage)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Min received</Text>
            <Text style={styles.infoValue}>{calcMinReceived(toAmount, settings.slippage)}</Text>
          </View>
        </View>
      )}

      <TouchableOpacity style={[styles.actionBtn, !fromAmount && styles.disabled]}>
        <Text style={styles.actionText}>Swap</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a", padding: 16 },
  card: { backgroundColor: "#1a1a1a", padding: 16, borderRadius: 12, marginBottom: 8 },
  label: { color: "#888", fontSize: 12, marginBottom: 8 },
  inputRow: { flexDirection: "row", alignItems: "center" },
  input: { flex: 1, color: "#fff", fontSize: 24, fontWeight: "600" },
  output: { flex: 1, color: "#fff", fontSize: 24, fontWeight: "600" },
  tokenBtn: { backgroundColor: "#333", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  tokenText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  swapBtn: { alignSelf: "center", padding: 8 },
  info: { backgroundColor: "#1a1a1a", padding: 12, borderRadius: 12, marginTop: 16 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  infoLabel: { color: "#888", fontSize: 12 },
  infoValue: { color: "#fff", fontSize: 12 },
  actionBtn: { backgroundColor: "#00d4aa", padding: 16, borderRadius: 12, marginTop: 24, alignItems: "center" },
  disabled: { opacity: 0.5 },
  actionText: { color: "#000", fontSize: 16, fontWeight: "700" },
});
