import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { loadBackupHistory, formatBackupDate, getBackupTypeLabel, BackupMetadata } from "@/lib/backup";

export default function BackupSettingsScreen() {
  const router = useRouter();
  const [history, setHistory] = useState<BackupMetadata[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadBackupHistory().then(setHistory);
    }, []),
  );

  const handleCloudBackup = () => {
    Alert.alert("Cloud Backup", "This will backup your wallet to iCloud/Google Drive", [
      { text: "Cancel", style: "cancel" },
      { text: "Backup", onPress: () => router.push("/backup/verify?type=cloud") },
    ]);
  };

  const handleLocalBackup = () => {
    router.push("/backup/verify?type=local");
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "Backup & Recovery" }} />
      <ScrollView>
        {/* Backup Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Create Backup</Text>
          <TouchableOpacity style={styles.optionCard} onPress={handleCloudBackup}>
            <Ionicons name="cloud-upload" size={28} color="#00d4aa" />
            <View style={styles.optionInfo}>
              <Text style={styles.optionTitle}>Cloud Backup</Text>
              <Text style={styles.optionDesc}>Encrypted backup to iCloud/Google Drive</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionCard} onPress={handleLocalBackup}>
            <Ionicons name="download" size={28} color="#00d4aa" />
            <View style={styles.optionInfo}>
              <Text style={styles.optionTitle}>Local Backup</Text>
              <Text style={styles.optionDesc}>Export encrypted file to device</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Restore */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Restore Wallet</Text>
          <TouchableOpacity style={styles.optionCard} onPress={() => router.push("/backup/restore")}>
            <Ionicons name="refresh" size={28} color="#f5a623" />
            <View style={styles.optionInfo}>
              <Text style={styles.optionTitle}>Restore from Backup</Text>
              <Text style={styles.optionDesc}>Recover wallet from backup file</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* History */}
        {history.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Backup History</Text>
            {history.map((item) => (
              <View key={item.id} style={styles.historyItem}>
                <Ionicons name={item.type === "cloud" ? "cloud" : "document"} size={20} color="#666" />
                <View style={styles.historyInfo}>
                  <Text style={styles.historyType}>{getBackupTypeLabel(item.type)}</Text>
                  <Text style={styles.historyDate}>{formatBackupDate(item.timestamp)}</Text>
                </View>
                <Text style={styles.historyCount}>{item.walletCount} wallets</Text>
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
