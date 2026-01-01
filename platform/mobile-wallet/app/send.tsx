import { useState, useEffect } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useWalletStore } from "@/stores/wallet";
import { buildTransferScript, signTransaction } from "@/lib/neo/transaction";
import { sendRawTransaction } from "@/lib/neo/rpc";
import { isValidNeoAddress } from "@/lib/qrcode";

export default function SendScreen() {
  const router = useRouter();
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
      Alert.alert("Error", "Please fill all fields");
      return;
    }
    if (!isValidNeoAddress(recipient)) {
      Alert.alert("Error", "Invalid Neo N3 address");
      return;
    }
    if (!address) {
      Alert.alert("Error", "No wallet connected");
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
      Alert.alert("Success", `Transaction sent!\nHash: ${result.hash.slice(0, 16)}...`);
      router.back();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Transaction failed";
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "Send" }} />

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

      <Text style={styles.balance}>Balance: {selectedAsset?.balance || "0"}</Text>

      {/* Recipient */}
      <Text style={styles.label}>Recipient Address</Text>
      <View style={styles.recipientRow}>
        <TextInput
          style={styles.recipientInput}
          placeholder="N..."
          placeholderTextColor="#666"
          value={recipient}
          onChangeText={setRecipient}
        />
        <TouchableOpacity style={styles.scanBtn} onPress={() => router.push("/scanner")}>
          <Ionicons name="scan" size={24} color="#00d4aa" />
        </TouchableOpacity>
      </View>

      {/* Amount */}
      <Text style={styles.label}>Amount</Text>
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
        <Ionicons name="send" size={20} color="#fff" />
        <Text style={styles.sendText}>{loading ? "Sending..." : "Send"}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a", padding: 20 },
  assetRow: { flexDirection: "row", gap: 12, marginBottom: 8 },
  assetBtn: { flex: 1, padding: 16, backgroundColor: "#1a1a1a", borderRadius: 12, alignItems: "center" },
  assetActive: { backgroundColor: "#00d4aa" },
  assetText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  balance: { color: "#888", marginBottom: 24, textAlign: "center" },
  label: { color: "#888", marginBottom: 8 },
  recipientRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  recipientInput: { flex: 1, backgroundColor: "#1a1a1a", color: "#fff", padding: 16, borderRadius: 12, fontSize: 16 },
  scanBtn: { backgroundColor: "#1a1a1a", padding: 16, borderRadius: 12, justifyContent: "center" },
  input: { backgroundColor: "#1a1a1a", color: "#fff", padding: 16, borderRadius: 12, marginBottom: 16, fontSize: 16 },
  sendBtn: {
    flexDirection: "row",
    backgroundColor: "#00d4aa",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 24,
  },
  sendBtnDisabled: { opacity: 0.5 },
  sendText: { color: "#fff", fontSize: 18, fontWeight: "600" },
});
