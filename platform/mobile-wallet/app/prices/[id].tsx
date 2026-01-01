import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams } from "expo-router";
import { useState, useEffect } from "react";
import {
  getPrice,
  getChartData,
  formatPrice,
  formatChange,
  formatVolume,
  Asset,
  TimeRange,
  PriceData,
  ChartPoint,
} from "@/lib/prices";

const RANGES: TimeRange[] = ["1H", "1D", "1W", "1M", "1Y"];

export default function PriceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const asset = (id?.toUpperCase() || "NEO") as Asset;
  const [range, setRange] = useState<TimeRange>("1D");
  const [price, setPrice] = useState<PriceData | null>(null);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);

  useEffect(() => {
    getPrice(asset).then(setPrice);
  }, [asset]);

  useEffect(() => {
    getChartData(asset, range).then(setChartData);
  }, [asset, range]);

  const minPrice = chartData.length > 0 ? Math.min(...chartData.map((p) => p.price)) : 0;
  const maxPrice = chartData.length > 0 ? Math.max(...chartData.map((p) => p.price)) : 1;

  if (!price) return null;

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: asset }} />
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.price}>${formatPrice(price.price)}</Text>
          <Text style={[styles.change, price.change24h >= 0 ? styles.up : styles.down]}>
            {formatChange(price.change24h)}
          </Text>
        </View>

        {/* Simple Chart Visualization */}
        <View style={styles.chart}>
          {chartData.map((point, i) => {
            const height = ((point.price - minPrice) / (maxPrice - minPrice)) * 80 + 20;
            return (
              <View key={i} style={[styles.bar, { height }, price.change24h >= 0 ? styles.barUp : styles.barDown]} />
            );
          })}
        </View>

        {/* Range Selector */}
        <View style={styles.ranges}>
          {RANGES.map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.rangeBtn, range === r && styles.rangeBtnActive]}
              onPress={() => setRange(r)}
            >
              <Text style={[styles.rangeText, range === r && styles.rangeTextActive]}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats */}
        <View style={styles.stats}>
          <StatRow label="24h High" value={`$${formatPrice(price.high24h)}`} />
          <StatRow label="24h Low" value={`$${formatPrice(price.low24h)}`} />
          <StatRow label="24h Volume" value={formatVolume(price.volume24h)} />
          <StatRow label="Market Cap" value={formatVolume(price.marketCap)} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  header: { alignItems: "center", padding: 20 },
  price: { color: "#fff", fontSize: 36, fontWeight: "bold" },
  change: { fontSize: 18, marginTop: 4 },
  up: { color: "#00d4aa" },
  down: { color: "#ff4757" },
  chart: { flexDirection: "row", alignItems: "flex-end", height: 120, paddingHorizontal: 16, gap: 2 },
  bar: { flex: 1, borderRadius: 2 },
  barUp: { backgroundColor: "#00d4aa" },
  barDown: { backgroundColor: "#ff4757" },
  ranges: { flexDirection: "row", justifyContent: "center", padding: 16, gap: 8 },
  rangeBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: "#1a1a1a" },
  rangeBtnActive: { backgroundColor: "#00d4aa" },
  rangeText: { color: "#888", fontSize: 14 },
  rangeTextActive: { color: "#000" },
  stats: { margin: 16, backgroundColor: "#1a1a1a", borderRadius: 12, padding: 16 },
  statRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8 },
  statLabel: { color: "#888", fontSize: 14 },
  statValue: { color: "#fff", fontSize: 14 },
});
