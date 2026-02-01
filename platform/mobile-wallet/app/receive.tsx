import { View, Text, StyleSheet, TouchableOpacity, Share, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { useState } from "react";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import { useWalletStore } from "@/stores/wallet";
import { generatePaymentURI } from "@/lib/qrcode";
import QRCode from "react-native-qrcode-svg";
import { useTranslation } from "@/hooks/useTranslation";

export default function ReceiveScreen() {
  const { address } = useWalletStore();
  const { t } = useTranslation();
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
      <Stack.Screen options={{ title: t("wallet.receive") }} />

      <View style={styles.content}>
        <Text style={styles.title}>{t("wallet.scan_to_pay")}</Text>

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
          <Text style={styles.label}>{t("wallet.request_amount")}</Text>
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
        <Text style={styles.addressLabel}>{t("wallet.your_address")}</Text>
        <Text style={styles.address}>{address}</Text>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.btn} onPress={copyAddress}>
            <Ionicons name="copy" size={20} color="#000" />
            <Text style={styles.btnText}>{t("common.copy")}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btn} onPress={shareAddress}>
            <Ionicons name="share" size={20} color="#000" />
            <Text style={styles.btnText}>{t("wallet.share")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { flex: 1, alignItems: "center", padding: 24 },
  title: { fontSize: 32, fontWeight: "900", color: "#000", marginBottom: 32, textTransform: "uppercase", letterSpacing: -1, fontStyle: "italic" },
  qrContainer: {
    backgroundColor: "#fff",
    padding: 24,
    borderWidth: 4,
    borderColor: "#000",
    shadowColor: "#000",
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 0,
    marginBottom: 40,
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
  },
  amountSection: { width: "100%", marginBottom: 32 },
  label: { color: "#000", fontSize: 12, marginBottom: 8, fontWeight: "900", textTransform: "uppercase" },
  amountRow: { flexDirection: "row", gap: 12 },
  amountInput: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 3,
    borderColor: "#000",
    padding: 16,
    color: "#000",
    fontSize: 24,
    fontWeight: "900",
    fontStyle: "italic",
  },
  assetPicker: { flexDirection: "row", gap: 8 },
  assetBtn: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderWidth: 3,
    borderColor: "#000",
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  assetActive: { backgroundColor: "#00E599" },
  assetText: { color: "#000", fontWeight: "900", textTransform: "uppercase" },
  addressLabel: { color: "#000", marginBottom: 8, fontWeight: "900", textTransform: "uppercase", fontSize: 12, opacity: 0.5 },
  address: { color: "#000", fontSize: 14, textAlign: "center", marginBottom: 40, paddingHorizontal: 20, fontWeight: "700" },
  actions: { flexDirection: "row", gap: 16, width: "100%" },
  btn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: "#ffde59",
    paddingVertical: 18,
    borderWidth: 3,
    borderColor: "#000",
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  btnText: { color: "#000", fontWeight: "900", textTransform: "uppercase" },
});
