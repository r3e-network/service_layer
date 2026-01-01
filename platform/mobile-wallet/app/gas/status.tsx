import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { getNetworkStatus, fetchPendingTxCount, NetworkStatus } from "@/lib/gasfee";

export default function NetworkStatusScreen() {
  const [status, setStatus] = useState<NetworkStatus | null>(null);

  useEffect(() => {
    fetchPendingTxCount().then((pendingTx) => {
      setStatus(getNetworkStatus(pendingTx));
    });
  }, []);

  if (!status) return null;

  const congestionColors = {
    low: "#00d4aa",
    medium: "#f5a623",
    high: "#ff4757",
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "Network Status" }} />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Congestion Indicator */}
        <View style={styles.card}>
          <View style={[styles.indicator, { backgroundColor: congestionColors[status.congestion] }]} />
          <Text style={styles.cardTitle}>Network Congestion</Text>
          <Text style={[styles.congestionText, { color: congestionColors[status.congestion] }]}>
            {status.congestion.toUpperCase()}
          </Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.grid}>
          <StatCard icon="time" label="Avg Block Time" value={`${status.avgBlockTime}s`} />
          <StatCard icon="layers" label="Pending Tx" value={status.pendingTx.toString()} />
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Ionicons name="information-circle" size={20} color="#666" />
          <Text style={styles.infoText}>
            Network congestion affects transaction confirmation times. Choose a higher fee tier during high congestion.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon as any} size={24} color="#00d4aa" />
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  content: { padding: 16 },
  card: {
    backgroundColor: "#1a1a1a",
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  indicator: { width: 12, height: 12, borderRadius: 6, marginBottom: 12 },
  cardTitle: { color: "#888", fontSize: 14 },
  congestionText: { fontSize: 28, fontWeight: "bold", marginTop: 8 },
  grid: { flexDirection: "row", gap: 12 },
  statCard: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  statLabel: { color: "#888", fontSize: 12, marginTop: 8 },
  statValue: { color: "#fff", fontSize: 20, fontWeight: "600", marginTop: 4 },
  info: {
    flexDirection: "row",
    backgroundColor: "#1a1a1a",
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    gap: 12,
  },
  infoText: { flex: 1, color: "#888", fontSize: 13, lineHeight: 18 },
});
