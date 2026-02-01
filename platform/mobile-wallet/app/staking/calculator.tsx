import { View, Text, StyleSheet, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { useState } from "react";
import { calculateRewards, formatGasAmount } from "@/lib/staking";

export default function CalculatorScreen() {
  const [neoAmount, setNeoAmount] = useState("");
  const [days, setDays] = useState("30");

  const neo = parseFloat(neoAmount) || 0;
  const d = parseInt(days) || 0;
  const estimated = calculateRewards(neo, d);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "Rewards Calculator" }} />
      <View style={styles.content}>
        <View style={styles.field}>
          <Text style={styles.label}>NEO Amount</Text>
          <TextInput
            style={styles.input}
            value={neoAmount}
            onChangeText={setNeoAmount}
            placeholder="0"
            placeholderTextColor="#666"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Staking Period (Days)</Text>
          <TextInput
            style={styles.input}
            value={days}
            onChangeText={setDays}
            placeholder="30"
            placeholderTextColor="#666"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.result}>
          <Text style={styles.resultLabel}>Estimated Rewards</Text>
          <Text style={styles.resultValue}>{formatGasAmount(estimated)}</Text>
          <Text style={styles.resultSymbol}>GAS</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  content: { padding: 20 },
  field: { marginBottom: 20 },
  label: { color: "#888", fontSize: 12, marginBottom: 8 },
  input: {
    backgroundColor: "#1a1a1a",
    color: "#fff",
    padding: 16,
    borderRadius: 12,
    fontSize: 18,
  },
  result: {
    backgroundColor: "#1a1a1a",
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 20,
  },
  resultLabel: { color: "#888", fontSize: 14 },
  resultValue: { color: "#fff", fontSize: 36, fontWeight: "bold", marginTop: 8 },
  resultSymbol: { color: "#00d4aa", fontSize: 16, marginTop: 4 },
});
