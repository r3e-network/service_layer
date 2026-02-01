import { View, Text, StyleSheet, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { loadSigningHistory, getMethodLabel, formatSigningDate, SigningRecord } from "@/lib/signing";
import { useTranslation } from "@/hooks/useTranslation";

export default function SigningHistoryScreen() {
  const { t, locale } = useTranslation();
  const [records, setRecords] = useState<SigningRecord[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadSigningHistory().then(setRecords);
    }, []),
  );

  const statusColors = { pending: "#f5a623", signed: "#00d4aa", broadcast: "#00d4aa", failed: "#ff4757" };
  const statusLabels: Record<string, string> = {
    pending: t("signing.status.pending"),
    signed: t("signing.status.signed"),
    broadcast: t("signing.status.broadcast"),
    failed: t("signing.status.failed"),
  };

  const renderRecord = ({ item }: { item: SigningRecord }) => (
    <View style={styles.record}>
      <Ionicons name="create" size={24} color={statusColors[item.status]} />
      <View style={styles.info}>
        <Text style={styles.hash}>{item.txHash.slice(0, 20)}...</Text>
        <Text style={styles.meta}>
          {getMethodLabel(item.method, t)} • {formatSigningDate(item.timestamp, locale)}
        </Text>
      </View>
      <Text style={[styles.status, { color: statusColors[item.status] }]}>
        {statusLabels[item.status] || item.status}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: t("signing.title") }} />
      {records.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="document-text-outline" size={64} color="#333" />
          <Text style={styles.emptyText}>{t("signing.empty")}</Text>
        </View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => item.id}
          renderItem={renderRecord}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  list: { padding: 16 },
  record: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  info: { flex: 1, marginLeft: 12 },
  hash: { color: "#fff", fontSize: 14, fontFamily: "monospace" },
  meta: { color: "#888", fontSize: 11, marginTop: 2 },
  status: { fontSize: 12, fontWeight: "600", textTransform: "uppercase" },
  empty: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { color: "#666", fontSize: 16, marginTop: 16 },
});
