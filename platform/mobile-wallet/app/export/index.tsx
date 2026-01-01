import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  generateCSV,
  saveExportRecord,
  generateExportId,
  ExportFormat,
  getTransactionHistory,
  Transaction,
} from "@/lib/export";
import { useWalletStore } from "@/stores/wallet";

export default function ExportScreen() {
  const [format, setFormat] = useState<ExportFormat>("csv");
  const [exporting, setExporting] = useState(false);
  const { address } = useWalletStore();

  const handleExport = async () => {
    if (!address) {
      Alert.alert("Error", "No wallet connected");
      return;
    }
    setExporting(true);
    try {
      const transactions = await getTransactionHistory(address);
      const exportData = transactions.map((tx) => ({
        hash: tx.hash,
        date: new Date(tx.timestamp).toISOString().split("T")[0],
        type: tx.type,
        amount: tx.amount,
        asset: tx.asset,
        fee: tx.fee || "0",
        status: tx.status,
      }));
      const csv = generateCSV(exportData);
      await saveExportRecord({
        id: generateExportId(),
        format,
        dateRange: { start: Date.now() - 30 * 86400000, end: Date.now() },
        txCount: exportData.length,
        timestamp: Date.now(),
      });
      Alert.alert("Success", `Exported ${exportData.length} transactions`);
    } catch {
      Alert.alert("Error", "Export failed");
    } finally {
      setExporting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "Export" }} />
      <View style={styles.content}>
        <Text style={styles.label}>Format</Text>
        <View style={styles.formats}>
          {(["csv", "pdf"] as ExportFormat[]).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.formatBtn, format === f && styles.formatActive]}
              onPress={() => setFormat(f)}
            >
              <Text style={[styles.formatText, format === f && styles.formatTextActive]}>{f.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          style={[styles.btn, exporting && styles.btnDisabled]}
          onPress={handleExport}
          disabled={exporting}
        >
          <Ionicons name="download" size={20} color="#000" />
          <Text style={styles.btnText}>{exporting ? "Exporting..." : "Export"}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  content: { padding: 20 },
  label: { color: "#888", fontSize: 12, marginBottom: 8 },
  formats: { flexDirection: "row", gap: 12 },
  formatBtn: { flex: 1, padding: 16, backgroundColor: "#1a1a1a", borderRadius: 12, alignItems: "center" },
  formatActive: { borderColor: "#00d4aa", borderWidth: 1 },
  formatText: { color: "#888", fontSize: 16 },
  formatTextActive: { color: "#00d4aa" },
  btn: {
    flexDirection: "row",
    backgroundColor: "#00d4aa",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 24,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: "#000", fontSize: 18, fontWeight: "600" },
});
