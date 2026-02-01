import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import {
  loadGuardians,
  loadRecoveryConfig,
  removeGuardian,
  Guardian,
  RecoveryConfig,
  getRecoveryStatus,
  formatThreshold,
} from "@/lib/recovery";

export default function RecoveryScreen() {
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [config, setConfig] = useState<RecoveryConfig | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadGuardians().then(setGuardians);
      loadRecoveryConfig().then(setConfig);
    }, []),
  );

  const handleRemove = (id: string) => {
    Alert.alert("Remove Guardian", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          await removeGuardian(id);
          loadGuardians().then(setGuardians);
        },
      },
    ]);
  };

  const renderGuardian = ({ item }: { item: Guardian }) => (
    <View style={styles.guardian}>
      <Ionicons
        name={item.confirmed ? "checkmark-circle" : "time-outline"}
        size={24}
        color={item.confirmed ? "#00d4aa" : "#888"}
      />
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.meta}>{item.email || item.address}</Text>
      </View>
      <TouchableOpacity onPress={() => handleRemove(item.id)}>
        <Ionicons name="trash-outline" size={20} color="#ff4444" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "Social Recovery" }} />

      {config && (
        <View style={styles.status}>
          <Text style={styles.statusLabel}>Status</Text>
          <Text style={styles.statusValue}>{getRecoveryStatus(config, guardians)}</Text>
          <Text style={styles.threshold}>Threshold: {formatThreshold(config.threshold, guardians.length)}</Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>Guardians</Text>

      {guardians.length > 0 ? (
        <FlatList
          data={guardians}
          keyExtractor={(i) => i.id}
          renderItem={renderGuardian}
          contentContainerStyle={styles.list}
        />
      ) : (
        <View style={styles.empty}>
          <Ionicons name="people-outline" size={64} color="#333" />
          <Text style={styles.emptyText}>No guardians added</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  status: { padding: 16, backgroundColor: "#1a1a1a", margin: 16, borderRadius: 12 },
  statusLabel: { color: "#888", fontSize: 12 },
  statusValue: { color: "#00d4aa", fontSize: 20, fontWeight: "700", marginTop: 4 },
  threshold: { color: "#666", fontSize: 12, marginTop: 8 },
  sectionTitle: { color: "#888", fontSize: 12, paddingHorizontal: 16, marginTop: 8 },
  list: { padding: 16 },
  guardian: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  info: { flex: 1 },
  name: { color: "#fff", fontSize: 16, fontWeight: "600" },
  meta: { color: "#888", fontSize: 12, marginTop: 2 },
  empty: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { color: "#666", fontSize: 16, marginTop: 16 },
});
