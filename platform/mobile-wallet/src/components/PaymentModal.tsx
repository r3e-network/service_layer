import { View, Text, StyleSheet, TouchableOpacity, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface PaymentRequest {
  appId: string;
  appName: string;
  amount: string;
  asset: "NEO" | "GAS";
  memo?: string;
}

interface PaymentModalProps {
  visible: boolean;
  request: PaymentRequest | null;
  onApprove: () => void;
  onReject: () => void;
}

export function PaymentModal({ visible, request, onApprove, onReject }: PaymentModalProps) {
  if (!request) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Ionicons name="shield-checkmark" size={48} color="#00d4aa" />
            <Text style={styles.title}>Payment Request</Text>
          </View>

          <View style={styles.appInfo}>
            <Text style={styles.appName}>{request.appName}</Text>
            <Text style={styles.appId}>{request.appId}</Text>
          </View>

          <View style={styles.amountBox}>
            <Text style={styles.amountLabel}>Amount</Text>
            <Text style={styles.amount}>
              {request.amount} {request.asset}
            </Text>
          </View>

          {request.memo && <Text style={styles.memo}>Memo: {request.memo}</Text>}

          <View style={styles.actions}>
            <TouchableOpacity style={styles.rejectBtn} onPress={onReject}>
              <Text style={styles.rejectText}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.approveBtn} onPress={onApprove}>
              <Text style={styles.approveText}>Approve</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.8)", justifyContent: "flex-end" },
  modal: { backgroundColor: "#1a1a1a", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  header: { alignItems: "center", marginBottom: 24 },
  title: { fontSize: 20, fontWeight: "bold", color: "#fff", marginTop: 12 },
  appInfo: { alignItems: "center", marginBottom: 16 },
  appName: { fontSize: 18, color: "#fff", fontWeight: "600" },
  appId: { fontSize: 12, color: "#888" },
  amountBox: { backgroundColor: "#0a0a0a", padding: 16, borderRadius: 12, alignItems: "center", marginBottom: 16 },
  amountLabel: { color: "#888", fontSize: 12 },
  amount: { color: "#00d4aa", fontSize: 28, fontWeight: "bold", marginTop: 4 },
  memo: { color: "#888", textAlign: "center", marginBottom: 16 },
  actions: { flexDirection: "row", gap: 12 },
  rejectBtn: { flex: 1, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: "#333", alignItems: "center" },
  rejectText: { color: "#fff", fontWeight: "600" },
  approveBtn: { flex: 1, padding: 16, borderRadius: 12, backgroundColor: "#00d4aa", alignItems: "center" },
  approveText: { color: "#fff", fontWeight: "600" },
});
