import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { parseQRCode } from "@/lib/qrcode";
import { isValidWCUri } from "@/lib/walletconnect";
import { useWCStore } from "@/stores/walletconnect";
import { useWalletStore } from "@/stores/wallet";

export default function ScannerScreen() {
  const router = useRouter();
  const [scanned, setScanned] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const { connect } = useWCStore();
  const { address, network } = useWalletStore();

  const handleScan = async (data: string) => {
    if (scanned) return;
    setScanned(true);

    const parsed = parseQRCode(data);

    switch (parsed.type) {
      case "address":
      case "payment": {
        const paymentData = parsed.data as { address: string; amount?: string };
        router.push({
          pathname: "/send",
          params: { to: paymentData.address, amount: paymentData.amount || "" },
        });
        break;
      }

      case "walletconnect":
        if (!address) {
          Alert.alert("Error", "Please create a wallet first");
          setScanned(false);
          return;
        }
        if (isValidWCUri(data)) {
          const topic = data.split("@")[0].slice(3);
          const meta = { name: "DApp", description: "", url: "", icons: [] };
          await connect(topic, meta, address, network);
          router.replace("/walletconnect");
        }
        break;

      default:
        Alert.alert("Unknown QR", "This QR code format is not supported");
        setScanned(false);
    }
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    handleScan(data);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "Scan QR Code" }} />
      <View style={styles.content}>
        {!permission ? (
          <View style={styles.permissionBox}>
            <Text style={styles.permissionText}>Requesting camera permission...</Text>
          </View>
        ) : !permission.granted ? (
          <View style={styles.permissionBox}>
            <Ionicons name="camera-outline" size={48} color="#888" />
            <Text style={styles.permissionText}>Camera access is required to scan QR codes</Text>
            <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
              <Text style={styles.permissionBtnText}>Grant Permission</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.cameraContainer}>
              <CameraView
                style={styles.camera}
                barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
              />
              <View style={styles.overlay}>
                <View style={styles.scanFrame} />
              </View>
            </View>
            <Text style={styles.hint}>Point camera at a QR code</Text>
            {scanned && (
              <TouchableOpacity style={styles.rescanBtn} onPress={() => setScanned(false)}>
                <Text style={styles.rescanText}>Tap to Scan Again</Text>
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
  hint: { color: "#888", fontSize: 14, marginTop: 20 },
  rescanBtn: { backgroundColor: "#1a1a1a", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, marginTop: 16 },
  rescanText: { color: "#00d4aa", fontSize: 14 },
});
