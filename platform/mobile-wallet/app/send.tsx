import { useState, useEffect } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useWalletStore } from "@/stores/wallet";
import { buildTransferScript, signTransaction } from "@/lib/neo/transaction";
import { sendRawTransaction } from "@/lib/neo/rpc";
import { isValidNeoAddress } from "@/lib/qrcode";
import { useTranslation } from "@/hooks/useTranslation";

export default function SendScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ to?: string; amount?: string }>();
  const { address, assets } = useWalletStore();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [asset, setAsset] = useState<"NEO" | "GAS">("GAS");
  const [loading, setLoading] = useState(false);

  // Pre-fill from QR scan params
  useEffect(() => {
    if (params.to) setRecipient(params.to);
    if (params.amount) setAmount(params.amount);
  }, [params.to, params.amount]);

  const selectedAsset = assets.find((a) => a.symbol === asset);

  const handleSend = async () => {
    if (!recipient || !amount) {
      Alert.alert(t("wallet.error"), t("wallet.fill_all_fields"));
      return;
    }
    if (!isValidNeoAddress(recipient)) {
      Alert.alert(t("wallet.error"), t("wallet.invalid_address"));
      return;
    }
    if (!address) {
      Alert.alert(t("wallet.error"), t("wallet.no_wallet"));
      return;
    }

    setLoading(true);
    try {
      const script = buildTransferScript({
        from: address,
        to: recipient,
        asset,
        amount,
      });
      const signature = await signTransaction(script);
      const result = await sendRawTransaction(signature);
      Alert.alert(t("wallet.success"), `${t("wallet.tx_sent")}\nHash: ${result.hash.slice(0, 16)}...`);
      router.back();
    } catch (e) {
      const message = e instanceof Error ? e.message : t("wallet.tx_failed");
      Alert.alert(t("wallet.error"), message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: t("wallet.send") }} />

      {/* Asset Selector */}
      <View style={styles.assetRow}>
        <TouchableOpacity
          style={[styles.assetBtn, asset === "NEO" && styles.assetActive]}
          onPress={() => setAsset("NEO")}
        >
          <Text style={styles.assetText}>💎 NEO</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.assetBtn, asset === "GAS" && styles.assetActive]}
          onPress={() => setAsset("GAS")}
        >
          <Text style={styles.assetText}>⛽ GAS</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.balance}>{t("wallet.balance")}: {selectedAsset?.balance || "0"}</Text>

      {/* Recipient */}
      <Text style={styles.label}>{t("wallet.recipient_address")}</Text>
      <View style={styles.recipientRow}>
        <TextInput
          style={styles.recipientInput}
          placeholder="N..."
          placeholderTextColor="#666"
          value={recipient}
          onChangeText={setRecipient}
        />
        <TouchableOpacity style={styles.scanBtn} onPress={() => router.push("/scanner")}>
          <Ionicons name="scan" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Amount */}
      <Text style={styles.label}>{t("wallet.amount")}</Text>
      <TextInput
        style={styles.input}
        placeholder="0.00"
        placeholderTextColor="#666"
        keyboardType="decimal-pad"
        value={amount}
        onChangeText={setAmount}
      />

      {/* Send Button */}
      <TouchableOpacity
        style={[styles.sendBtn, loading && styles.sendBtnDisabled]}
        onPress={handleSend}
        disabled={loading}
      >
        <Ionicons name="send" size={20} color="#000" />
        <Text style={styles.sendText}>{loading ? t("wallet.sending") : t("wallet.send")}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  assetRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  assetBtn: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
    borderWidth: 3,
    borderColor: "#000",
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    alignItems: "center",
  },
  assetActive: { backgroundColor: "#00E599" },
  assetText: { color: "#000", fontSize: 16, fontWeight: "900", textTransform: "uppercase", fontStyle: "italic" },
  balance: { color: "#000", marginBottom: 32, textAlign: "center", fontWeight: "900", fontSize: 14, textTransform: "uppercase", opacity: 0.5 },
  label: { color: "#000", marginBottom: 8, fontWeight: "900", textTransform: "uppercase", fontSize: 12 },
  recipientRow: { flexDirection: "row", gap: 12, marginBottom: 20 },
  recipientInput: {
    flex: 1,
    backgroundColor: "#fff",
    color: "#000",
    padding: 16,
    borderWidth: 3,
    borderColor: "#000",
    fontSize: 16,
    fontWeight: "bold",
  },
  scanBtn: {
    backgroundColor: "#fff",
    padding: 16,
    borderWidth: 3,
    borderColor: "#000",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  input: {
    backgroundColor: "#fff",
    color: "#000",
    padding: 16,
    borderWidth: 3,
    borderColor: "#000",
    marginBottom: 20,
    fontSize: 24,
    fontWeight: "900",
    fontStyle: "italic",
  },
  sendBtn: {
    flexDirection: "row",
    backgroundColor: "#00E599",
    padding: 20,
    borderWidth: 4,
    borderColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginTop: 24,
    shadowColor: "#000",
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  sendBtnDisabled: { opacity: 0.5, backgroundColor: "#f0f0f0" },
  sendText: { color: "#000", fontSize: 20, fontWeight: "900", textTransform: "uppercase" },
});
