import { View, Text, StyleSheet, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { loadSecurityLogs, formatLogTime, SecurityLog } from "@/lib/security";

export default function SecurityLogsScreen() {
  const [logs, setLogs] = useState<SecurityLog[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadSecurityLogs().then(setLogs);
    }, []),
  );

  const renderLog = ({ item }: { item: SecurityLog }) => (
    <View style={styles.log}>
      <Ionicons name="shield-checkmark" size={20} color="#00d4aa" />
      <View style={styles.info}>
        <Text style={styles.event}>{item.event}</Text>
        <Text style={styles.time}>{formatLogTime(item.timestamp)}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "Security Logs" }} />
      {logs.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="document-text-outline" size={64} color="#333" />
          <Text style={styles.emptyText}>No security logs</Text>
        </View>
      ) : (
        <FlatList data={logs} keyExtractor={(i) => i.id} renderItem={renderLog} contentContainerStyle={styles.list} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  list: { padding: 16 },
  log: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
  },
  info: { flex: 1, marginLeft: 12 },
  event: { color: "#fff", fontSize: 14 },
  time: { color: "#666", fontSize: 11, marginTop: 2 },
  empty: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { color: "#666", fontSize: 16, marginTop: 16 },
});
