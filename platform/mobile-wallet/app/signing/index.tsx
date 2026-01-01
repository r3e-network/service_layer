import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { signOffline, saveSigningRecord, generateSigningId, isHardwareConnected } from "@/lib/signing";

export default function OfflineSigningScreen() {
  const router = useRouter();
  const [txData, setTxData] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [signing, setSigning] = useState(false);
  const [hwConnected, setHwConnected] = useState(false);

  useEffect(() => {
    isHardwareConnected().then(setHwConnected);
  }, []);

  const handleSign = async () => {
    if (!txData.trim()) {
      Alert.alert("Error", "Please enter transaction data");
      return;
    }
    if (!privateKey.trim()) {
      Alert.alert("Error", "Please enter private key");
      return;
    }

    setSigning(true);
    try {
      const tx = JSON.parse(txData);
      const signed = await signOffline(tx, privateKey);
      await saveSigningRecord({
        id: generateSigningId(),
        txHash: signed.hash,
        method: "software",
        status: "signed",
        timestamp: Date.now(),
        signers: [tx.from],
      });
      Alert.alert("Success", `Transaction signed!\nHash: ${signed.hash.slice(0, 20)}...`);
    } catch {
      Alert.alert("Error", "Failed to sign transaction");
    } finally {
      setSigning(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "Transaction Signing" }} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.methodRow}>
          <MethodCard icon="phone-portrait" label="Software" active />
          <MethodCard icon="hardware-chip" label="Hardware" active={hwConnected} />
          <MethodCard icon="people" label="Multisig" onPress={() => router.push("/signing/multisig")} />
        </View>

        <Text style={styles.label}>Transaction Data (JSON)</Text>
        <TextInput
          style={styles.textArea}
          value={txData}
          onChangeText={setTxData}
          placeholder='{"from":"...","to":"...","amount":"1"}'
          placeholderTextColor="#666"
          multiline
          numberOfLines={4}
        />

        <Text style={styles.label}>Private Key</Text>
        <TextInput
          style={styles.input}
          value={privateKey}
          onChangeText={setPrivateKey}
          placeholder="Enter private key"
          placeholderTextColor="#666"
          secureTextEntry
        />

        <TouchableOpacity style={[styles.btn, signing && styles.btnDisabled]} onPress={handleSign} disabled={signing}>
          <Text style={styles.btnText}>{signing ? "Signing..." : "Sign Transaction"}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.historyBtn} onPress={() => router.push("/signing/history")}>
          <Ionicons name="time" size={18} color="#00d4aa" />
          <Text style={styles.historyText}>View Signing History</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function MethodCard({
  icon,
  label,
  active,
  onPress,
}: {
  icon: string;
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.methodCard, active && styles.methodActive]}
      onPress={onPress}
      disabled={!onPress && !active}
    >
      <Ionicons name={icon as any} size={24} color={active ? "#00d4aa" : "#666"} />
      <Text style={[styles.methodLabel, active && styles.methodLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  content: { padding: 16 },
  methodRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  methodCard: { flex: 1, backgroundColor: "#1a1a1a", padding: 14, borderRadius: 12, alignItems: "center" },
  methodActive: { borderColor: "#00d4aa", borderWidth: 1 },
  methodLabel: { color: "#666", fontSize: 11, marginTop: 6 },
  methodLabelActive: { color: "#00d4aa" },
  label: { color: "#888", fontSize: 12, marginBottom: 6, marginTop: 12 },
  textArea: {
    backgroundColor: "#1a1a1a",
    color: "#fff",
    padding: 14,
    borderRadius: 12,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: "top",
  },
  input: { backgroundColor: "#1a1a1a", color: "#fff", padding: 14, borderRadius: 12, fontSize: 16 },
  btn: { backgroundColor: "#00d4aa", padding: 16, borderRadius: 12, alignItems: "center", marginTop: 20 },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: "#000", fontSize: 18, fontWeight: "600" },
  historyBtn: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 16 },
  historyText: { color: "#00d4aa", fontSize: 14 },
});
