import { View, Text, StyleSheet, TouchableOpacity, Share, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { useState } from "react";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import { useWalletStore } from "@/stores/wallet";
import { generatePaymentURI } from "@/lib/qrcode";
import QRCode from "react-native-qrcode-svg";

export default function ReceiveScreen() {
  const { address } = useWalletStore();
  const [amount, setAmount] = useState("");
  const [asset, setAsset] = useState("GAS");

  const paymentURI = address ? generatePaymentURI({ address, amount: amount || undefined, asset }) : "";

  const copyAddress = async () => {
    if (address) {
      await Clipboard.setStringAsync(address);
    }
  };

  const shareAddress = async () => {
    if (address) {
      await Share.share({ message: address });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "Receive" }} />

      <View style={styles.content}>
        <Text style={styles.title}>Scan to Pay</Text>

        {/* QR Code */}
        <View style={styles.qrContainer}>
          {paymentURI ? (
            <QRCode value={paymentURI} size={180} backgroundColor="#fff" color="#000" />
          ) : (
            <View style={styles.qrPlaceholder}>
              <Ionicons name="qr-code" size={160} color="#333" />
            </View>
          )}
        </View>

        {/* Amount Input */}
        <View style={styles.amountSection}>
          <Text style={styles.label}>Request Amount (optional)</Text>
          <View style={styles.amountRow}>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor="#666"
              keyboardType="decimal-pad"
            />
            <View style={styles.assetPicker}>
              <TouchableOpacity
                style={[styles.assetBtn, asset === "GAS" && styles.assetActive]}
                onPress={() => setAsset("GAS")}
              >
                <Text style={styles.assetText}>GAS</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.assetBtn, asset === "NEO" && styles.assetActive]}
                onPress={() => setAsset("NEO")}
              >
                <Text style={styles.assetText}>NEO</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Address */}
        <Text style={styles.addressLabel}>Your Address</Text>
        <Text style={styles.address}>{address}</Text>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.btn} onPress={copyAddress}>
            <Ionicons name="copy" size={20} color="#fff" />
            <Text style={styles.btnText}>Copy</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btn} onPress={shareAddress}>
            <Ionicons name="share" size={20} color="#fff" />
            <Text style={styles.btnText}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  content: { flex: 1, alignItems: "center", padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", color: "#fff", marginBottom: 24 },
  qrContainer: { backgroundColor: "#fff", padding: 16, borderRadius: 16, marginBottom: 24 },
  qrPlaceholder: {
    width: 200,
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  amountSection: { width: "100%", marginBottom: 20 },
  label: { color: "#888", fontSize: 12, marginBottom: 8 },
  amountRow: { flexDirection: "row", gap: 12 },
  amountInput: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    color: "#fff",
    fontSize: 18,
  },
  assetPicker: { flexDirection: "row", gap: 4 },
  assetBtn: {
    backgroundColor: "#1a1a1a",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
  },
  assetActive: { backgroundColor: "#00d4aa" },
  assetText: { color: "#fff", fontWeight: "600" },
  addressLabel: { color: "#888", marginBottom: 8 },
  address: { color: "#fff", fontSize: 12, textAlign: "center", marginBottom: 24, paddingHorizontal: 20 },
  actions: { flexDirection: "row", gap: 16 },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#00d4aa",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  btnText: { color: "#fff", fontWeight: "600" },
});
