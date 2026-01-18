import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { loadBackupHistory, formatBackupDate, getBackupTypeLabel, BackupMetadata } from "@/lib/backup";
import { useTranslation } from "@/hooks/useTranslation";

export default function BackupSettingsScreen() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const [history, setHistory] = useState<BackupMetadata[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadBackupHistory().then(setHistory);
    }, []),
  );

  const handleCloudBackup = () => {
    Alert.alert(t("backup.cloudAlertTitle"), t("backup.cloudAlertMessage"), [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("backup.backupAction"), onPress: () => router.push("/backup/verify?type=cloud") },
    ]);
  };

  const handleLocalBackup = () => {
    router.push("/backup/verify?type=local");
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: t("backup.title") }} />
      <ScrollView>
        {/* Backup Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("backup.createTitle")}</Text>
          <TouchableOpacity style={styles.optionCard} onPress={handleCloudBackup}>
            <Ionicons name="cloud-upload" size={28} color="#00d4aa" />
            <View style={styles.optionInfo}>
              <Text style={styles.optionTitle}>{t("backup.cloudTitle")}</Text>
              <Text style={styles.optionDesc}>{t("backup.cloudDesc")}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionCard} onPress={handleLocalBackup}>
            <Ionicons name="download" size={28} color="#00d4aa" />
            <View style={styles.optionInfo}>
              <Text style={styles.optionTitle}>{t("backup.localTitle")}</Text>
              <Text style={styles.optionDesc}>{t("backup.localDesc")}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Restore */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("backup.restoreTitle")}</Text>
          <TouchableOpacity style={styles.optionCard} onPress={() => router.push("/backup/restore")}>
            <Ionicons name="refresh" size={28} color="#f5a623" />
            <View style={styles.optionInfo}>
              <Text style={styles.optionTitle}>{t("backup.restoreFromBackup")}</Text>
              <Text style={styles.optionDesc}>{t("backup.restoreDesc")}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* History */}
        {history.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("backup.historyTitle")}</Text>
            {history.map((item) => (
              <View key={item.id} style={styles.historyItem}>
                <Ionicons name={item.type === "cloud" ? "cloud" : "document"} size={20} color="#666" />
                <View style={styles.historyInfo}>
                  <Text style={styles.historyType}>{getBackupTypeLabel(item.type, t)}</Text>
                  <Text style={styles.historyDate}>{formatBackupDate(item.timestamp, locale)}</Text>
                </View>
                <Text style={styles.historyCount}>{t("backup.walletsCount", { count: item.walletCount })}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  section: { padding: 16 },
  sectionTitle: { color: "#888", fontSize: 12, marginBottom: 12 },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  optionInfo: { flex: 1, marginLeft: 12 },
  optionTitle: { color: "#fff", fontSize: 16, fontWeight: "600" },
  optionDesc: { color: "#888", fontSize: 12, marginTop: 2 },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    padding: 12,
    borderRadius: 8,
    marginBottom: 6,
  },
  historyInfo: { flex: 1, marginLeft: 10 },
  historyType: { color: "#fff", fontSize: 14 },
  historyDate: { color: "#666", fontSize: 11, marginTop: 2 },
  historyCount: { color: "#888", fontSize: 12 },
});
