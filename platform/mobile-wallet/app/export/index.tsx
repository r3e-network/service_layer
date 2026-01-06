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
} from "@/lib/export";
import { useWalletStore } from "@/stores/wallet";
import { useTranslation } from "@/hooks/useTranslation";

export default function ExportScreen() {
  const [format, setFormat] = useState<ExportFormat>("csv");
  const [exporting, setExporting] = useState(false);
  const { address } = useWalletStore();
  const { t } = useTranslation();

  const handleExport = async () => {
    if (!address) {
      Alert.alert(t("wallet.error"), t("wallet.no_wallet"));
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
      generateCSV(exportData);
      await saveExportRecord({
        id: generateExportId(),
        format,
        dateRange: { start: Date.now() - 30 * 86400000, end: Date.now() },
        txCount: exportData.length,
        timestamp: Date.now(),
      });
      Alert.alert(t("wallet.success"), t("wallet.export_success").replace("{{count}}", String(exportData.length)));
    } catch {
      Alert.alert(t("wallet.error"), t("wallet.export_fail"));
    } finally {
      setExporting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: t("wallet.export_title") }} />
      <View style={styles.content}>
        <Text style={styles.label}>{t("wallet.export_format")}</Text>
        <View style={styles.formats}>
          {(["csv", "pdf"] as ExportFormat[]).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.formatBtn, format === f && styles.formatActive]}
              onPress={() => setFormat(f)}
            >
              <Text style={styles.formatText}>{f.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          style={[styles.btn, exporting && styles.btnDisabled]}
          onPress={handleExport}
          disabled={exporting}
        >
          <Ionicons name="download" size={20} color="#000" />
          <Text style={styles.btnText}>{exporting ? t("wallet.exporting") : t("wallet.export_action")}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 24 },
  label: { color: "#000", fontSize: 14, marginBottom: 12, fontWeight: "900", textTransform: "uppercase" },
  formats: { flexDirection: "row", gap: 16 },
  formatBtn: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
    borderWidth: 3,
    borderColor: "#000",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  formatActive: { backgroundColor: "#FFDE59" },
  formatText: { color: "#000", fontSize: 18, fontWeight: "900" },
  btn: {
    flexDirection: "row",
    backgroundColor: "#00E599",
    padding: 20,
    borderWidth: 4,
    borderColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginTop: 32,
    shadowColor: "#000",
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  btnDisabled: { opacity: 0.5, backgroundColor: "#f0f0f0" },
  btnText: { color: "#000", fontSize: 20, fontWeight: "900", textTransform: "uppercase" },
});
