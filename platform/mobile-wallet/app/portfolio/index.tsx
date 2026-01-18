import { View, Text, StyleSheet, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "@/hooks/useTranslation";
import {
  loadPortfolioData,
  PortfolioAsset,
  calcTotalValue,
  calc24hChange,
  formatCurrency,
  formatPercent,
} from "@/lib/portfolio";

export default function PortfolioScreen() {
  const { t, locale } = useTranslation();
  const [assets, setAssets] = useState<PortfolioAsset[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadPortfolioData().then((data) => {
        if (data.snapshots.length > 0) {
          setAssets(data.snapshots[data.snapshots.length - 1].assets);
        }
      });
    }, []),
  );

  const total = calcTotalValue(assets);
  const change = calc24hChange(assets);

  const renderAsset = ({ item }: { item: PortfolioAsset }) => (
    <View style={styles.asset}>
      <View style={styles.assetInfo}>
        <Text style={styles.symbol}>{item.symbol}</Text>
        <Text style={styles.amount}>{item.amount}</Text>
      </View>
      <View style={styles.assetValue}>
        <Text style={styles.value}>{formatCurrency(item.value, locale)}</Text>
        <Text style={[styles.change, item.change24h >= 0 ? styles.up : styles.down]}>
          {formatPercent(item.change24h)}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: t("portfolio.title") }} />
      <View style={styles.header}>
        <Text style={styles.totalLabel}>{t("portfolio.totalValue")}</Text>
        <Text style={styles.totalValue}>{formatCurrency(total, locale)}</Text>
        <Text style={[styles.totalChange, change >= 0 ? styles.up : styles.down]}>
          {formatPercent(change)} {t("portfolio.change24hSuffix")}
        </Text>
      </View>
      <FlatList
        data={assets}
        keyExtractor={(i) => i.symbol}
        renderItem={renderAsset}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  header: { padding: 16, backgroundColor: "#1a1a1a", margin: 16, borderRadius: 12 },
  totalLabel: { color: "#888", fontSize: 12 },
  totalValue: { color: "#fff", fontSize: 28, fontWeight: "700", marginTop: 4 },
  totalChange: { fontSize: 14, marginTop: 4 },
  list: { padding: 16, paddingTop: 0 },
  asset: { flexDirection: "row", backgroundColor: "#1a1a1a", padding: 14, borderRadius: 12, marginBottom: 8 },
  assetInfo: { flex: 1 },
  symbol: { color: "#fff", fontSize: 16, fontWeight: "600" },
  amount: { color: "#888", fontSize: 12, marginTop: 2 },
  assetValue: { alignItems: "flex-end" },
  value: { color: "#fff", fontSize: 14 },
  change: { fontSize: 12, marginTop: 2 },
  up: { color: "#00d4aa" },
  down: { color: "#ff4444" },
});
