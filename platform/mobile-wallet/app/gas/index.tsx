import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { getAllTierEstimates, formatFee, TxType, FeeTier, FeeEstimate } from "@/lib/gasfee";

const TX_TYPES: { type: TxType; label: string; icon: string }[] = [
  { type: "transfer", label: "Transfer", icon: "send" },
  { type: "nep17", label: "Token", icon: "swap-horizontal" },
  { type: "nep11", label: "NFT", icon: "image" },
  { type: "contract", label: "Contract", icon: "code" },
];

export default function GasEstimationScreen() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<TxType>("transfer");
  const [selectedTier, setSelectedTier] = useState<FeeTier>("standard");

  const estimates = getAllTierEstimates(selectedType);
  const selected = estimates.find((e) => e.tier === selectedTier);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "Gas Estimation" }} />
      <ScrollView>
        {/* Transaction Type Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transaction Type</Text>
          <View style={styles.typeRow}>
            {TX_TYPES.map((t) => (
              <TouchableOpacity
                key={t.type}
                style={[styles.typeBtn, selectedType === t.type && styles.typeBtnActive]}
                onPress={() => setSelectedType(t.type)}
              >
                <Ionicons name={t.icon as keyof typeof Ionicons.glyphMap} size={20} color={selectedType === t.type ? "#00d4aa" : "#888"} />
                <Text style={[styles.typeText, selectedType === t.type && styles.typeTextActive]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Fee Tiers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fee Tier</Text>
          {estimates.map((est) => (
            <TierCard
              key={est.tier}
              estimate={est}
              selected={selectedTier === est.tier}
              onSelect={() => setSelectedTier(est.tier)}
            />
          ))}
        </View>

        {/* Summary */}
        {selected && (
          <View style={styles.summary}>
            <Text style={styles.summaryLabel}>Estimated Total Fee</Text>
            <Text style={styles.summaryValue}>{formatFee(selected.total)} GAS</Text>
            <Text style={styles.summaryTime}>Confirm: {selected.confirmTime}</Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push("/gas/status")}>
            <Ionicons name="pulse" size={20} color="#00d4aa" />
            <Text style={styles.actionText}>Network Status</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push("/gas/history")}>
            <Ionicons name="time" size={20} color="#00d4aa" />
            <Text style={styles.actionText}>Fee History</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function TierCard({
  estimate,
  selected,
  onSelect,
}: {
  estimate: FeeEstimate;
  selected: boolean;
  onSelect: () => void;
}) {
  const tierIcons: Record<FeeTier, string> = {
    fast: "rocket",
    standard: "speedometer",
    economy: "leaf",
  };

  return (
    <TouchableOpacity style={[styles.tierCard, selected && styles.tierCardActive]} onPress={onSelect}>
      <Ionicons name={tierIcons[estimate.tier] as keyof typeof Ionicons.glyphMap} size={24} color={selected ? "#00d4aa" : "#666"} />
      <View style={styles.tierInfo}>
        <Text style={[styles.tierName, selected && styles.tierNameActive]}>
          {estimate.tier.charAt(0).toUpperCase() + estimate.tier.slice(1)}
        </Text>
        <Text style={styles.tierTime}>{estimate.confirmTime}</Text>
      </View>
      <Text style={[styles.tierFee, selected && styles.tierFeeActive]}>{formatFee(estimate.total)} GAS</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  section: { padding: 16 },
  sectionTitle: { color: "#888", fontSize: 12, marginBottom: 12 },
  typeRow: { flexDirection: "row", gap: 8 },
  typeBtn: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  typeBtnActive: { borderColor: "#00d4aa", borderWidth: 1 },
  typeText: { color: "#888", fontSize: 11, marginTop: 4 },
  typeTextActive: { color: "#00d4aa" },
  tierCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  tierCardActive: { borderColor: "#00d4aa", borderWidth: 1 },
  tierInfo: { flex: 1, marginLeft: 12 },
  tierName: { color: "#fff", fontSize: 16, fontWeight: "600" },
  tierNameActive: { color: "#00d4aa" },
  tierTime: { color: "#666", fontSize: 12, marginTop: 2 },
  tierFee: { color: "#888", fontSize: 14 },
  tierFeeActive: { color: "#00d4aa", fontWeight: "600" },
  summary: {
    margin: 16,
    padding: 24,
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    alignItems: "center",
  },
  summaryLabel: { color: "#888", fontSize: 14 },
  summaryValue: { color: "#fff", fontSize: 32, fontWeight: "bold", marginTop: 8 },
  summaryTime: { color: "#00d4aa", fontSize: 14, marginTop: 4 },
  actions: { flexDirection: "row", padding: 16, gap: 12 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#1a1a1a",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  actionText: { color: "#fff", fontSize: 14 },
});
