import { View, Text, StyleSheet, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { loadRewardHistory, RewardRecord } from "@/lib/staking";

export default function HistoryScreen() {
  const [records, setRecords] = useState<RewardRecord[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadRewardHistory().then(setRecords);
    }, []),
  );

  const formatDate = (ts: number) => new Date(ts).toLocaleDateString();

  const renderRecord = ({ item }: { item: RewardRecord }) => (
    <View style={styles.record}>
      <Ionicons name="gift" size={24} color="#00d4aa" />
      <View style={styles.recordInfo}>
        <Text style={styles.recordAmount}>+{item.amount} GAS</Text>
        <Text style={styles.recordDate}>{formatDate(item.timestamp)}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "Reward History" }} />
      {records.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="time-outline" size={64} color="#333" />
          <Text style={styles.emptyText}>No rewards claimed yet</Text>
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
  recordInfo: { marginLeft: 12 },
  recordAmount: { color: "#00d4aa", fontSize: 16, fontWeight: "600" },
  recordDate: { color: "#888", fontSize: 12, marginTop: 2 },
  empty: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { color: "#666", fontSize: 16, marginTop: 16 },
});
