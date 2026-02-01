import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { getAllPrices, formatPrice, formatChange, formatVolume, PriceData } from "@/lib/prices";

export default function PricesScreen() {
  const router = useRouter();
  const [prices, setPrices] = useState<PriceData[]>([]);

  useEffect(() => {
    getAllPrices().then(setPrices);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "Market" }} />
      <ScrollView>
        {prices.map((p) => (
          <TouchableOpacity
            key={p.asset}
            style={styles.card}
            onPress={() => router.push(`/prices/${p.asset.toLowerCase()}`)}
          >
            <View style={styles.left}>
              <Text style={styles.symbol}>{p.asset}</Text>
              <Text style={styles.volume}>Vol: {formatVolume(p.volume24h)}</Text>
            </View>
            <View style={styles.right}>
              <Text style={styles.price}>${formatPrice(p.price)}</Text>
              <Text style={[styles.change, p.change24h >= 0 ? styles.up : styles.down]}>
                {formatChange(p.change24h)}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  card: {
    flexDirection: "row",
    backgroundColor: "#1a1a1a",
    margin: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
  },
  left: { flex: 1 },
  symbol: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  volume: { color: "#888", fontSize: 12, marginTop: 4 },
  right: { alignItems: "flex-end" },
  price: { color: "#fff", fontSize: 18, fontWeight: "600" },
  change: { fontSize: 14, marginTop: 4 },
  up: { color: "#00d4aa" },
  down: { color: "#ff4757" },
});
