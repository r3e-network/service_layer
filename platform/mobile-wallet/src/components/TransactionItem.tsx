import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Transaction } from "@/lib/api/transactions";
import { useTranslation } from "@/hooks/useTranslation";

interface TransactionItemProps {
  tx: Transaction;
  onPress?: () => void;
}

export function TransactionItem({ tx, onPress }: TransactionItemProps) {
  const { t, locale } = useTranslation();
  const isReceive = tx.type === "receive";
  const icon = isReceive ? "arrow-down" : "arrow-up";
  // Neo Green (#00E599) or Brutal Red (#EF4444)
  const color = isReceive ? "#00E599" : "#EF4444";
  const sign = isReceive ? "+" : "-";

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={[styles.iconBox, { backgroundColor: color }]}>
        <Ionicons name={icon} size={24} color="#000" />
      </View>
      <View style={styles.info}>
        <Text style={styles.type}>{isReceive ? t("transactions.received") : t("transactions.sent")}</Text>
        <Text style={styles.hash} numberOfLines={1}>
          {tx.hash.slice(0, 10)}...{tx.hash.slice(-6)}
        </Text>
      </View>
      <View style={styles.amount}>
        <View style={[styles.badge, { backgroundColor: color }]}>
          <Text style={styles.value}>
            {sign}
            {tx.amount} {tx.asset}
          </Text>
        </View>
        <Text style={styles.time}>{formatTime(tx.time, locale, t)}</Text>
      </View>
    </TouchableOpacity>
  );
}

function formatTime(
  timestamp: number,
  locale: string,
  t: (key: string, options?: Record<string, string | number>) => string,
): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) return t("transactions.justNow").toUpperCase();
  if (diff < 3600000) return t("transactions.minutesAgo", { count: Math.floor(diff / 60000) }).toUpperCase();
  if (diff < 86400000) return t("transactions.hoursAgo", { count: Math.floor(diff / 3600000) }).toUpperCase();
  return date.toLocaleDateString(locale).toUpperCase();
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#ffffff",
    borderWidth: 3,
    borderColor: "#000",
    borderRadius: 0,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderWidth: 2,
    borderColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  info: { flex: 1, marginLeft: 16 },
  type: { color: "#000", fontSize: 16, fontWeight: "900", textTransform: "uppercase" },
  hash: { color: "#000", fontSize: 12, marginTop: 2, fontWeight: "700", fontFamily: "monospace" },
  amount: { alignItems: "flex-end" },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 2,
    borderColor: "#000",
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    marginBottom: 4,
    backgroundColor: "#fff",
  },
  value: { color: "#000", fontSize: 14, fontWeight: "900", textTransform: "uppercase" },
  time: { color: "#666", fontSize: 10, fontWeight: "900", textTransform: "uppercase" },
});
