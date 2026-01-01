import { View, Text, StyleSheet } from "react-native";
import { Asset } from "@/stores/wallet";

interface AssetCardProps {
  asset: Asset;
}

export function AssetCard({ asset }: AssetCardProps) {
  const changeColor = asset.usdChange >= 0 ? "#00d4aa" : "#ef4444";
  const changeSign = asset.usdChange >= 0 ? "+" : "";

  return (
    <View style={styles.card}>
      <View style={styles.left}>
        <Text style={styles.icon}>{asset.icon}</Text>
        <View>
          <Text style={styles.symbol}>{asset.symbol}</Text>
          <Text style={styles.name}>{asset.name}</Text>
        </View>
      </View>
      <View style={styles.right}>
        <Text style={styles.balance}>{asset.balance}</Text>
        <Text style={styles.usd}>${asset.usdValue}</Text>
        <Text style={[styles.change, { color: changeColor }]}>
          {changeSign}
          {asset.usdChange?.toFixed(2) || "0.00"}%
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#1a1a1a",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  left: { flexDirection: "row", alignItems: "center", gap: 12 },
  icon: { fontSize: 32 },
  symbol: { color: "#fff", fontSize: 16, fontWeight: "600" },
  name: { color: "#888", fontSize: 12 },
  right: { alignItems: "flex-end" },
  balance: { color: "#fff", fontSize: 16, fontWeight: "600" },
  usd: { color: "#888", fontSize: 12 },
  change: { fontSize: 10, marginTop: 2 },
});
