import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useWalletStore } from "@/stores/wallet";
import { saveRewardRecord, generateRecordId, formatGasAmount, getUnclaimedGas, claimGas } from "@/lib/staking";

export default function ClaimScreen() {
  const router = useRouter();
  const { requireAuthForTransaction, address } = useWalletStore();
  const [claiming, setClaiming] = useState(false);
  const [unclaimedGas, setUnclaimedGas] = useState(0);

  useEffect(() => {
    if (address) {
      getUnclaimedGas(address).then(setUnclaimedGas);
    }
  }, [address]);

  const handleClaim = async () => {
    if (unclaimedGas <= 0) {
      Alert.alert("No Rewards", "No GAS available to claim");
      return;
    }

    const authorized = await requireAuthForTransaction();
    if (!authorized) return;

    setClaiming(true);
    try {
      const txHash = await claimGas(address!);
      await saveRewardRecord({
        id: generateRecordId(),
        amount: formatGasAmount(unclaimedGas),
        timestamp: Date.now(),
        txHash,
      });
      Alert.alert("Success", `Claimed ${formatGasAmount(unclaimedGas)} GAS`);
      router.back();
    } catch {
      Alert.alert("Error", "Failed to claim rewards");
    } finally {
      setClaiming(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "Claim GAS" }} />
      <View style={styles.content}>
        <View style={styles.rewardCard}>
          <Ionicons name="gift" size={48} color="#00d4aa" />
          <Text style={styles.label}>Available to Claim</Text>
          <Text style={styles.amount}>{formatGasAmount(unclaimedGas)}</Text>
          <Text style={styles.symbol}>GAS</Text>
        </View>

        <TouchableOpacity
          style={[styles.claimBtn, claiming && styles.claimBtnDisabled]}
          onPress={handleClaim}
          disabled={claiming}
        >
          <Text style={styles.claimText}>{claiming ? "Claiming..." : "Claim Rewards"}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  content: { flex: 1, padding: 20, justifyContent: "center" },
  rewardCard: {
    backgroundColor: "#1a1a1a",
    padding: 32,
    borderRadius: 16,
    alignItems: "center",
  },
  label: { color: "#888", fontSize: 14, marginTop: 16 },
  amount: { color: "#fff", fontSize: 40, fontWeight: "bold", marginTop: 8 },
  symbol: { color: "#00d4aa", fontSize: 18, marginTop: 4 },
  claimBtn: {
    backgroundColor: "#00d4aa",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 32,
  },
  claimBtnDisabled: { opacity: 0.5 },
  claimText: { color: "#000", fontSize: 18, fontWeight: "600" },
});
