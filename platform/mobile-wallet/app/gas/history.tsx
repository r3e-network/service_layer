import { View, Text, StyleSheet, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { loadFeeHistory, formatFee, getTxTypeLabel, FeeRecord } from "@/lib/gasfee";

export default function FeeHistoryScreen() {
  const [records, setRecords] = useState<FeeRecord[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadFeeHistory().then(setRecords);
    }, []),
  );

  const formatDate = (ts: number) => new Date(ts).toLocaleDateString();

  const renderRecord = ({ item }: { item: FeeRecord }) => (
    <View style={styles.record}>
      <Ionicons name="flash" size={24} color="#00d4aa" />
      <View style={styles.recordInfo}>
        <Text style={styles.recordType}>{getTxTypeLabel(item.txType)}</Text>
        <Text style={styles.recordDate}>{formatDate(item.timestamp)}</Text>
      </View>
      <Text style={styles.recordFee}>{formatFee(item.fee)} GAS</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "Fee History" }} />
      {records.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="receipt-outline" size={64} color="#333" />
          <Text style={styles.emptyText}>No fee records yet</Text>
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
  recordInfo: { flex: 1, marginLeft: 12 },
  recordType: { color: "#fff", fontSize: 14, fontWeight: "600" },
  recordDate: { color: "#888", fontSize: 12, marginTop: 2 },
  recordFee: { color: "#00d4aa", fontSize: 14, fontWeight: "600" },
  empty: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { color: "#666", fontSize: 16, marginTop: 16 },
});
