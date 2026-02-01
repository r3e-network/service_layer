import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useWalletStore } from "@/stores/wallet";
import { getDailyRate, formatGasAmount } from "@/lib/staking";

export default function StakingDashboardScreen() {
  const router = useRouter();
  const { assets } = useWalletStore();

  const neoAsset = assets.find((a) => a.symbol === "NEO");
  const neoBalance = parseFloat(neoAsset?.balance || "0");
  const dailyRate = getDailyRate(neoBalance);
  const monthlyRate = dailyRate * 30;

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "Staking" }} />
      <ScrollView>
        {/* Stats Card */}
        <View style={styles.statsCard}>
          <Text style={styles.statsLabel}>Your NEO Balance</Text>
          <Text style={styles.statsValue}>{neoBalance} NEO</Text>
          <View style={styles.rateRow}>
            <View style={styles.rateItem}>
              <Text style={styles.rateLabel}>Daily</Text>
              <Text style={styles.rateValue}>{formatGasAmount(dailyRate)} GAS</Text>
            </View>
            <View style={styles.rateItem}>
              <Text style={styles.rateLabel}>Monthly</Text>
              <Text style={styles.rateValue}>{formatGasAmount(monthlyRate)} GAS</Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push("/staking/claim")}>
            <Ionicons name="gift" size={24} color="#00d4aa" />
            <Text style={styles.actionText}>Claim GAS</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push("/staking/history")}>
            <Ionicons name="time" size={24} color="#00d4aa" />
            <Text style={styles.actionText}>History</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push("/staking/calculator")}>
            <Ionicons name="calculator" size={24} color="#00d4aa" />
            <Text style={styles.actionText}>Calculator</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  statsCard: {
    margin: 16,
    padding: 20,
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
  },
  statsLabel: { color: "#888", fontSize: 14 },
  statsValue: { color: "#fff", fontSize: 32, fontWeight: "bold", marginTop: 8 },
  rateRow: { flexDirection: "row", marginTop: 20, gap: 20 },
  rateItem: { flex: 1 },
  rateLabel: { color: "#888", fontSize: 12 },
  rateValue: { color: "#00d4aa", fontSize: 16, fontWeight: "600", marginTop: 4 },
  actions: { flexDirection: "row", padding: 16, gap: 12 },
  actionBtn: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  actionText: { color: "#fff", fontSize: 12, marginTop: 8 },
});
