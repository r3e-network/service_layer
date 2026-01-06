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
            <View style={styles.headerIcon}>
              <Ionicons name="shield-checkmark" size={40} color="#000" />
            </View>
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
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.9)", justifyContent: "flex-end" },
  modal: { backgroundColor: "#ffffff", borderTopLeftRadius: 0, borderTopRightRadius: 0, borderTopWidth: 6, borderTopColor: "#000", padding: 24, paddingBottom: 40 },
  header: { alignItems: "center", marginBottom: 24 },
  headerIcon: { backgroundColor: "#00E599", padding: 12, borderWidth: 3, borderColor: "#000", shadowColor: "#000", shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, marginBottom: 12 },
  title: { fontSize: 24, fontWeight: "900", color: "#000", textTransform: "uppercase", letterSpacing: -1 },
  appInfo: { alignItems: "center", marginBottom: 20, padding: 16, backgroundColor: "#fff", borderWidth: 3, borderColor: "#000", shadowColor: "#000", shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0 },
  appName: { fontSize: 20, color: "#000", fontWeight: "900", textTransform: "uppercase" },
  appId: { fontSize: 13, color: "#666", fontWeight: "700", fontFamily: "monospace", marginTop: 4 },
  amountBox: { backgroundColor: "#FFDE59", padding: 20, borderWidth: 3, borderColor: "#000", borderRadius: 0, alignItems: "center", marginBottom: 24, shadowColor: "#000", shadowOffset: { width: 6, height: 6 }, shadowOpacity: 1, shadowRadius: 0 },
  amountLabel: { color: "#000", fontSize: 12, fontWeight: "900", textTransform: "uppercase", marginBottom: 4 },
  amount: { color: "#000", fontSize: 36, fontWeight: "900", fontStyle: "italic" },
  memo: { color: "#000", textAlign: "center", marginBottom: 24, fontWeight: "700", fontStyle: "italic", borderWidth: 2, borderColor: "#000", padding: 12, borderStyle: "dashed" },
  actions: { flexDirection: "row", gap: 16 },
  rejectBtn: { flex: 1, padding: 18, backgroundColor: "#EF4444", borderWidth: 3, borderColor: "#000", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0 },
  rejectText: { color: "#000", fontWeight: "900", textTransform: "uppercase" },
  approveBtn: { flex: 1, padding: 18, backgroundColor: "#00E599", borderWidth: 3, borderColor: "#000", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0 },
  approveText: { color: "#000", fontWeight: "900", textTransform: "uppercase" },
});
