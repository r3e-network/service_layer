import { View, Text, StyleSheet } from "react-native";
import { Asset } from "@/stores/wallet";

interface AssetCardProps {
  asset: Asset;
}

export function AssetCard({ asset }: AssetCardProps) {
  // Neo Green (#00E599) or Brutal Red (#EF4444)
  const changeColor = asset.usdChange >= 0 ? "#00E599" : "#EF4444";
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
    backgroundColor: "#ffffff",
    padding: 16,
    borderWidth: 3,
    borderColor: "#000000",
    borderRadius: 0,
    marginBottom: 16,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  left: { flexDirection: "row", alignItems: "center", gap: 16 },
  icon: { fontSize: 40 },
  symbol: { color: "#000", fontSize: 18, fontWeight: "900", textTransform: "uppercase" },
  name: { color: "#666", fontSize: 12, fontWeight: "700" },
  right: { alignItems: "flex-end" },
  balance: { color: "#000", fontSize: 20, fontWeight: "900" },
  usd: { color: "#666", fontSize: 14, fontWeight: "700" },
  change: { fontSize: 12, marginTop: 4, fontWeight: "900", backgroundColor: "#000", paddingHorizontal: 6, paddingVertical: 2 },
});
