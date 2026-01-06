import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "@/hooks/useTranslation";

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
  const { t } = useTranslation();
  if (!request) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <View style={styles.brutalIcon}>
              <Ionicons name="finger-print" size={48} color="#000" />
            </View>
            <Text style={styles.title}>{t("wallet.sign_message") || "Sign Message"}</Text>
          </View>

          <View style={styles.appInfo}>
            <Text style={styles.appName}>{request.appName}</Text>
            <Text style={styles.appId}>{request.appId}</Text>
          </View>

          <View style={styles.messageBox}>
            <Text style={styles.messageLabel}>{t("wallet.message_to_sign") || "Message to Sign"}</Text>
            <ScrollView style={styles.messageScroll}>
              <Text style={styles.message}>{request.message}</Text>
            </ScrollView>
          </View>

          <Text style={styles.warning}>{t("wallet.sign_warning") || "Only sign messages from apps you trust. This proves your identity."}</Text>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.rejectBtn} onPress={onReject}>
              <Text style={styles.rejectText}>{t("common.reject") || "Reject"}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.approveBtn} onPress={onApprove}>
              <Text style={styles.approveText}>{t("wallet.sign") || "Sign"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "center", padding: 24 },
  modal: { backgroundColor: "#ffffff", borderWidth: 4, borderColor: "#000", padding: 24, shadowColor: "#000", shadowOffset: { width: 8, height: 8 }, shadowOpacity: 1, shadowRadius: 0 },
  header: { alignItems: "center", marginBottom: 24 },
  brutalIcon: { backgroundColor: "#00E599", padding: 16, borderWidth: 4, borderColor: "#000", shadowColor: "#000", shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0 },
  title: { fontSize: 32, fontWeight: "900", color: "#000", marginTop: 16, textTransform: "uppercase", fontStyle: "italic" },
  appInfo: { alignItems: "center", marginBottom: 20, padding: 16, backgroundColor: "#fff", borderWidth: 3, borderColor: "#000" },
  appName: { fontSize: 24, color: "#000", fontWeight: "900", textTransform: "uppercase" },
  appId: { fontSize: 13, color: "#444", fontWeight: "800", marginTop: 4 },
  messageBox: { backgroundColor: "#fff", padding: 16, borderWidth: 4, borderColor: "#000", marginBottom: 20, maxHeight: 200, shadowColor: "#000", shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0 },
  messageLabel: { color: "#000", fontSize: 12, marginBottom: 12, fontWeight: "900", textTransform: "uppercase", backgroundColor: "#00E599", alignSelf: "flex-start", paddingHorizontal: 6, paddingVertical: 2, borderWidth: 2, borderColor: "#000" },
  messageScroll: { maxHeight: 150 },
  message: { color: "#000", fontSize: 14, fontFamily: "monospace", fontWeight: "700" },
  warning: { color: "#000", fontSize: 12, textAlign: "center", marginBottom: 24, fontWeight: "800", textTransform: "uppercase", backgroundColor: "#EF4444", padding: 12, borderWidth: 3, borderColor: "#000" },
  actions: { flexDirection: "row", gap: 16 },
  rejectBtn: { flex: 1, padding: 20, backgroundColor: "#EF4444", borderWidth: 4, borderColor: "#000", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0 },
  rejectText: { color: "#000", fontWeight: "900", textTransform: "uppercase" },
  approveBtn: { flex: 1, padding: 20, backgroundColor: "#00E599", borderWidth: 4, borderColor: "#000", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0 },
  approveText: { color: "#000", fontWeight: "900", textTransform: "uppercase" },
});
