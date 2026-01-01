import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Transaction } from "@/lib/api/transactions";

interface TransactionItemProps {
  tx: Transaction;
  onPress?: () => void;
}

export function TransactionItem({ tx, onPress }: TransactionItemProps) {
  const isReceive = tx.type === "receive";
  const icon = isReceive ? "arrow-down" : "arrow-up";
  const color = isReceive ? "#22c55e" : "#ef4444";
  const sign = isReceive ? "+" : "-";

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={[styles.iconBox, { backgroundColor: color + "20" }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={styles.info}>
        <Text style={styles.type}>{isReceive ? "Received" : "Sent"}</Text>
        <Text style={styles.hash} numberOfLines={1}>
          {tx.hash.slice(0, 10)}...{tx.hash.slice(-6)}
        </Text>
      </View>
      <View style={styles.amount}>
        <Text style={[styles.value, { color }]}>
          {sign}
          {tx.amount} {tx.asset}
        </Text>
        <Text style={styles.time}>{formatTime(tx.time)}</Text>
      </View>
    </TouchableOpacity>
  );
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return date.toLocaleDateString();
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    marginBottom: 8,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  info: { flex: 1, marginLeft: 12 },
  type: { color: "#fff", fontSize: 16, fontWeight: "600" },
  hash: { color: "#888", fontSize: 12, marginTop: 2 },
  amount: { alignItems: "flex-end" },
  value: { fontSize: 16, fontWeight: "600" },
  time: { color: "#888", fontSize: 12, marginTop: 2 },
});
