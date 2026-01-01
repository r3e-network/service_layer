import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface SignRequest {
  appId: string;
  appName: string;
  message: string;
}

interface SignMessageModalProps {
  visible: boolean;
  request: SignRequest | null;
  onApprove: () => void;
  onReject: () => void;
}

export function SignMessageModal({ visible, request, onApprove, onReject }: SignMessageModalProps) {
  if (!request) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Ionicons name="finger-print" size={48} color="#00d4aa" />
            <Text style={styles.title}>Sign Message</Text>
          </View>

          <View style={styles.appInfo}>
            <Text style={styles.appName}>{request.appName}</Text>
            <Text style={styles.appId}>{request.appId}</Text>
          </View>

          <View style={styles.messageBox}>
            <Text style={styles.messageLabel}>Message to Sign</Text>
            <ScrollView style={styles.messageScroll}>
              <Text style={styles.message}>{request.message}</Text>
            </ScrollView>
          </View>

          <Text style={styles.warning}>Only sign messages from apps you trust. This proves your identity.</Text>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.rejectBtn} onPress={onReject}>
              <Text style={styles.rejectText}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.approveBtn} onPress={onApprove}>
              <Text style={styles.approveText}>Sign</Text>
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
  messageBox: { backgroundColor: "#0a0a0a", padding: 16, borderRadius: 12, marginBottom: 16, maxHeight: 150 },
  messageLabel: { color: "#888", fontSize: 12, marginBottom: 8 },
  messageScroll: { maxHeight: 100 },
  message: { color: "#fff", fontSize: 14, fontFamily: "monospace" },
  warning: { color: "#f59e0b", fontSize: 12, textAlign: "center", marginBottom: 16 },
  actions: { flexDirection: "row", gap: 12 },
  rejectBtn: { flex: 1, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: "#333", alignItems: "center" },
  rejectText: { color: "#fff", fontWeight: "600" },
  approveBtn: { flex: 1, padding: 16, borderRadius: 12, backgroundColor: "#00d4aa", alignItems: "center" },
  approveText: { color: "#fff", fontWeight: "600" },
});
