import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { isValidWCUri, parseWCUri } from "@/lib/walletconnect";
import { useWCStore } from "@/stores/walletconnect";
import { useWalletStore } from "@/stores/wallet";
import { useTranslation } from "@/hooks/useTranslation";

export default function WCScanScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [scanned, setScanned] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const { connect, isConnecting } = useWCStore();
  const { address, network } = useWalletStore();

  const handleScan = async (uri: string) => {
    if (scanned) return;
    setScanned(true);

    if (!isValidWCUri(uri)) {
      Alert.alert(t("walletconnect.invalidQrTitle"), t("walletconnect.invalidQrMessage"));
      setScanned(false);
      return;
    }

    const parsed = parseWCUri(uri);
    if (!parsed || parsed.version !== 2) {
      Alert.alert(t("walletconnect.unsupportedTitle"), t("walletconnect.unsupportedMessage"));
      setScanned(false);
      return;
    }

    if (!address) {
      Alert.alert(t("common.error"), t("walletconnect.noWalletMessage"));
      setScanned(false);
      return;
    }

    try {
      const meta = { name: "DApp", description: "Connected DApp", url: "", icons: [] };
      await connect(parsed.topic, meta, address, network);
      router.replace("/walletconnect");
    } catch (e) {
      const message = e instanceof Error ? e.message : t("walletconnect.connectionFailed");
      Alert.alert(t("common.error"), message);
      setScanned(false);
    }
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    handleScan(data);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: t("walletconnect.scanTitle") }} />
      <View style={styles.content}>
        {!permission ? (
          <View style={styles.permissionBox}>
            <Text style={styles.permissionText}>{t("walletconnect.requestingPermission")}</Text>
          </View>
        ) : !permission.granted ? (
          <View style={styles.permissionBox}>
            <Ionicons name="camera-outline" size={48} color="#888" />
            <Text style={styles.permissionText}>{t("walletconnect.permissionRequired")}</Text>
            <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
              <Text style={styles.permissionBtnText}>{t("walletconnect.grantPermission")}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.cameraContainer}>
              <CameraView
                style={styles.camera}
                barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                onBarcodeScanned={scanned || isConnecting ? undefined : handleBarCodeScanned}
              />
              <View style={styles.overlay}>
                <View style={styles.scanFrame} />
              </View>
            </View>
            <Text style={styles.hint}>{t("walletconnect.scanHint")}</Text>
            {(scanned || isConnecting) && (
              <TouchableOpacity style={styles.rescanBtn} onPress={() => setScanned(false)} disabled={isConnecting}>
                <Text style={styles.rescanText}>
                  {isConnecting ? t("walletconnect.connecting") : t("walletconnect.scanAgain")}
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  content: { flex: 1, padding: 20, alignItems: "center", justifyContent: "center" },
  permissionBox: { alignItems: "center", padding: 20 },
  permissionText: { color: "#888", fontSize: 16, textAlign: "center", marginTop: 16 },
  permissionBtn: {
    backgroundColor: "#00d4aa",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  permissionBtnText: { color: "#000", fontSize: 16, fontWeight: "600" },
  cameraContainer: { width: 280, height: 280, borderRadius: 20, overflow: "hidden", position: "relative" },
  camera: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: "center", alignItems: "center" },
  scanFrame: {
    width: 220,
    height: 220,
    borderWidth: 2,
    borderColor: "#00d4aa",
    borderRadius: 16,
    backgroundColor: "transparent",
  },
  hint: { color: "#888", fontSize: 14, textAlign: "center", marginTop: 20 },
  rescanBtn: { backgroundColor: "#1a1a1a", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, marginTop: 16 },
  rescanText: { color: "#00d4aa", fontSize: 14 },
});
