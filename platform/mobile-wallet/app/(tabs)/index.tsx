import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect } from "react";
import { useRouter } from "expo-router";
import { useWalletStore } from "@/stores/wallet";
import { AssetCard } from "@/components/AssetCard";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "@/hooks/useTranslation";

export default function WalletScreen() {
  const router = useRouter();
  const { t } = useTranslation();
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
          <View style={styles.brutalIconLarge}>
            <Ionicons name="wallet" size={80} color="#000" />
          </View>
          <Text style={styles.lockedText}>{t("wallet.welcome")}</Text>
          <TouchableOpacity style={styles.unlockButton} onPress={createWallet}>
            <Text style={styles.unlockButtonText}>{t("wallet.create")}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.importButton} onPress={() => router.push("/import")}>
            <Text style={styles.importButtonText}>{t("wallet.import")}</Text>
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
          <View style={[styles.brutalIconLarge, { backgroundColor: "#ffde59" }]}>
            <Ionicons name="lock-closed" size={80} color="#000" />
          </View>
          <Text style={styles.lockedText}>{t("wallet.locked")}</Text>
          <TouchableOpacity style={styles.unlockButton} onPress={unlock}>
            <Text style={styles.unlockButtonText}>{t("wallet.unlock")}</Text>
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
          <Text style={styles.title}>{t("wallet.title")}</Text>
          <Text style={styles.address} numberOfLines={1}>
            {`${address.slice(0, 8)}...${address.slice(-6)}`}
          </Text>
        </View>

        {/* Total Balance */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>{t("wallet.balance")}</Text>
          <Text style={styles.balanceValue}>${totalUsdValue}</Text>
          <TouchableOpacity onPress={refreshBalances} style={styles.refreshBtn}>
            <Ionicons name="refresh" size={24} color="#00E599" />
          </TouchableOpacity>
        </View>

        {/* Assets */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("wallet.assets")}</Text>
          {assets.map((asset) => (
            <AssetCard key={asset.symbol} asset={asset} />
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={() => router.push("/send")}>
            <Ionicons name="arrow-up" size={24} color="#000" />
            <Text style={styles.actionText}>{t("wallet.send")}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => router.push("/receive")}>
            <Ionicons name="arrow-down" size={24} color="#000" />
            <Text style={styles.actionText}>{t("wallet.receive")}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => router.push("/history")}>
            <Ionicons name="time" size={24} color="#000" />
            <Text style={styles.actionText}>{t("wallet.history")}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { padding: 32, backgroundColor: "#000", borderBottomWidth: 6, borderBottomColor: "#00E599" },
  title: { fontSize: 44, fontWeight: "900", color: "#00E599", textTransform: "uppercase", letterSpacing: -2, fontStyle: "italic" },
  address: { fontSize: 13, color: "#fff", marginTop: 8, fontWeight: "800", opacity: 0.8, fontFamily: "monospace" },
  balanceCard: {
    margin: 20,
    padding: 32,
    backgroundColor: "#fff",
    borderWidth: 4,
    borderColor: "#000",
    shadowColor: "#000",
    shadowOffset: { width: 10, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0,
    position: "relative",
  },
  balanceLabel: { fontSize: 14, color: "#000", fontWeight: "900", textTransform: "uppercase", letterSpacing: 1 },
  balanceValue: { fontSize: 56, fontWeight: "900", color: "#000", marginTop: 8, fontStyle: "italic", letterSpacing: -2 },
  refreshBtn: { position: "absolute", top: 16, right: 16, padding: 8 },
  section: { padding: 24 },
  sectionTitle: { fontSize: 24, fontWeight: "900", color: "#000", marginBottom: 20, textTransform: "uppercase", fontStyle: "italic", borderBottomWidth: 4, borderBottomColor: "#000", alignSelf: "flex-start" },
  actions: { flexDirection: "row", justifyContent: "space-between", padding: 20, gap: 16 },
  actionButton: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#ffde59",
    paddingVertical: 20,
    borderWidth: 4,
    borderColor: "#000",
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  actionText: { color: "#000", marginTop: 8, fontSize: 13, fontWeight: "900", textTransform: "uppercase" },
  lockedContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40, backgroundColor: "#fff" },
  brutalIconLarge: {
    backgroundColor: "#00E599",
    padding: 32,
    borderWidth: 6,
    borderColor: "#000",
    shadowColor: "#000",
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 0,
    marginBottom: 32,
  },
  lockedText: { fontSize: 36, fontWeight: "900", color: "#000", textTransform: "uppercase", textAlign: "center", fontStyle: "italic", letterSpacing: -1 },
  unlockButton: {
    marginTop: 48,
    backgroundColor: "#00E599",
    paddingHorizontal: 32,
    paddingVertical: 22,
    borderWidth: 5,
    borderColor: "#000",
    shadowColor: "#000",
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 0,
    width: "100%",
    alignItems: "center",
  },
  unlockButtonText: { color: "#000", fontWeight: "900", textTransform: "uppercase", fontSize: 18 },
  importButton: {
    marginTop: 32,
    paddingVertical: 12,
  },
  importButtonText: { color: "#000", fontWeight: "900", textTransform: "uppercase", textDecorationLine: "underline", fontSize: 15 },
});
