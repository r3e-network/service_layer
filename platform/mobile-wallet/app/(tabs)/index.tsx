import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect } from "react";
import { useRouter } from "expo-router";
import { useWalletStore } from "@/stores/wallet";
import { AssetCard } from "@/components/AssetCard";
import { Ionicons } from "@expo/vector-icons";

export default function WalletScreen() {
  const router = useRouter();
  const { address, assets, totalUsdValue, isLocked, isLoading, unlock, createWallet, initialize, refreshBalances } =
    useWalletStore();

  useEffect(() => {
    initialize();
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.lockedContainer}>
          <ActivityIndicator size="large" color="#00d4aa" />
        </View>
      </SafeAreaView>
    );
  }

  // No wallet - show create screen
  if (!address) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.lockedContainer}>
          <Ionicons name="wallet-outline" size={64} color="#00d4aa" />
          <Text style={styles.lockedText}>Welcome to Neo Wallet</Text>
          <TouchableOpacity style={styles.unlockButton} onPress={createWallet}>
            <Text style={styles.unlockButtonText}>Create New Wallet</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.importButton} onPress={() => router.push("/import")}>
            <Text style={styles.importButtonText}>Import Existing Wallet</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Wallet locked
  if (isLocked) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.lockedContainer}>
          <Ionicons name="lock-closed" size={64} color="#00d4aa" />
          <Text style={styles.lockedText}>Wallet Locked</Text>
          <TouchableOpacity style={styles.unlockButton} onPress={unlock}>
            <Text style={styles.unlockButtonText}>Unlock with Biometrics</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Neo Wallet</Text>
          <Text style={styles.address} numberOfLines={1}>
            {`${address.slice(0, 8)}...${address.slice(-6)}`}
          </Text>
        </View>

        {/* Total Balance */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Text style={styles.balanceValue}>${totalUsdValue}</Text>
          <TouchableOpacity onPress={refreshBalances} style={styles.refreshBtn}>
            <Ionicons name="refresh" size={20} color="#00d4aa" />
          </TouchableOpacity>
        </View>

        {/* Assets */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Assets</Text>
          {assets.map((asset) => (
            <AssetCard key={asset.symbol} asset={asset} />
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={() => router.push("/send")}>
            <Ionicons name="arrow-up" size={24} color="#fff" />
            <Text style={styles.actionText}>Send</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => router.push("/receive")}>
            <Ionicons name="arrow-down" size={24} color="#fff" />
            <Text style={styles.actionText}>Receive</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => router.push("/history")}>
            <Ionicons name="time" size={24} color="#fff" />
            <Text style={styles.actionText}>History</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  header: { padding: 20 },
  title: { fontSize: 28, fontWeight: "bold", color: "#fff" },
  address: { fontSize: 14, color: "#888", marginTop: 4 },
  balanceCard: {
    margin: 20,
    padding: 24,
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
  },
  balanceLabel: { fontSize: 14, color: "#888" },
  balanceValue: { fontSize: 36, fontWeight: "bold", color: "#fff", marginTop: 8 },
  refreshBtn: { position: "absolute", top: 16, right: 16 },
  section: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "600", color: "#fff", marginBottom: 12 },
  actions: { flexDirection: "row", justifyContent: "space-around", padding: 20 },
  actionButton: {
    alignItems: "center",
    backgroundColor: "#00d4aa",
    padding: 16,
    borderRadius: 12,
    width: 80,
  },
  actionText: { color: "#fff", marginTop: 4, fontSize: 12 },
  lockedContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  lockedText: { fontSize: 20, color: "#fff", marginTop: 16 },
  unlockButton: {
    marginTop: 24,
    backgroundColor: "#00d4aa",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  unlockButtonText: { color: "#fff", fontWeight: "600" },
  importButton: {
    marginTop: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  importButtonText: { color: "#00d4aa", fontWeight: "600" },
});
