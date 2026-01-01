import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useWCStore } from "@/stores/walletconnect";
import { useWalletStore } from "@/stores/wallet";
import { getRequestType, signWCRequest, sendWCResponse } from "@/lib/walletconnect";

export default function WCApproveScreen() {
  const router = useRouter();
  const { pendingRequest, pendingMeta, setPendingRequest } = useWCStore();
  const { requireAuthForTransaction } = useWalletStore();

  if (!pendingRequest || !pendingMeta) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: "Approve Request" }} />
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No pending request</Text>
        </View>
      </SafeAreaView>
    );
  }

  const requestType = getRequestType(pendingRequest.method);

  const handleApprove = async () => {
    const authorized = await requireAuthForTransaction();
    if (!authorized) return;

    try {
      const signature = await signWCRequest(pendingRequest);
      await sendWCResponse(pendingRequest.id, signature);
      Alert.alert("Success", "Request approved and signed");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to sign request";
      Alert.alert("Error", message);
    } finally {
      setPendingRequest(null, null);
      router.back();
    }
  };

  const handleReject = () => {
    setPendingRequest(null, null);
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "Approve Request" }} />
      <ScrollView style={styles.content}>
        {/* DApp Info */}
        <View style={styles.dappInfo}>
          <View style={styles.dappIcon}>
            <Ionicons name="globe" size={32} color="#00d4aa" />
          </View>
          <Text style={styles.dappName}>{pendingMeta.name}</Text>
          <Text style={styles.dappUrl}>{pendingMeta.url}</Text>
        </View>

        {/* Request Type */}
        <View style={styles.requestBox}>
          <Text style={styles.requestLabel}>Request Type</Text>
          <Text style={styles.requestType}>
            {requestType === "sign_transaction"
              ? "Sign Transaction"
              : requestType === "sign_message"
                ? "Sign Message"
                : "Unknown"}
          </Text>
        </View>

        {/* Request Details */}
        <View style={styles.detailsBox}>
          <Text style={styles.detailsLabel}>Details</Text>
          <Text style={styles.detailsText}>Method: {pendingRequest.method}</Text>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.rejectBtn} onPress={handleReject}>
          <Text style={styles.rejectText}>Reject</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.approveBtn} onPress={handleApprove}>
          <Text style={styles.approveText}>Approve</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  content: { flex: 1, padding: 20 },
  empty: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { color: "#666", fontSize: 16 },
  dappInfo: { alignItems: "center", marginBottom: 30 },
  dappIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#1a1a1a",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  dappName: { color: "#fff", fontSize: 20, fontWeight: "600" },
  dappUrl: { color: "#888", fontSize: 14, marginTop: 4 },
  requestBox: {
    backgroundColor: "#1a1a1a",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  requestLabel: { color: "#888", fontSize: 12, marginBottom: 8 },
  requestType: { color: "#00d4aa", fontSize: 18, fontWeight: "600" },
  detailsBox: {
    backgroundColor: "#1a1a1a",
    padding: 16,
    borderRadius: 12,
  },
  detailsLabel: { color: "#888", fontSize: 12, marginBottom: 8 },
  detailsText: { color: "#fff", fontSize: 14 },
  actions: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
  },
  rejectBtn: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  rejectText: { color: "#ef4444", fontSize: 16, fontWeight: "600" },
  approveBtn: {
    flex: 1,
    backgroundColor: "#00d4aa",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  approveText: { color: "#000", fontSize: 16, fontWeight: "600" },
});
