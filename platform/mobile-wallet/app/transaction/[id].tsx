import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as WebBrowser from "expo-web-browser";
import { useWalletStore } from "@/stores/wallet";

const EXPLORER_URL = "https://dora.coz.io/transaction/neo3/mainnet";

export default function TransactionDetailScreen() {
  const params = useLocalSearchParams<{
    id: string;
    type: string;
    amount: string;
    asset: string;
    from: string;
    to: string;
    time: string;
    block: string;
    status: string;
  }>();

  const { network } = useWalletStore();
  const isReceive = params.type === "receive";

  const copyToClipboard = async (text: string, label: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert("Copied", `${label} copied to clipboard`);
  };

  const openExplorer = async () => {
    const url = `${EXPLORER_URL.replace("mainnet", network)}/${params.id}`;
    await WebBrowser.openBrowserAsync(url);
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(parseInt(timestamp));
    return date.toLocaleString();
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "Transaction Details" }} />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Status Header */}
        <View style={styles.header}>
          <View style={[styles.statusIcon, { backgroundColor: isReceive ? "#22c55e20" : "#ef444420" }]}>
            <Ionicons
              name={isReceive ? "arrow-down" : "arrow-up"}
              size={32}
              color={isReceive ? "#22c55e" : "#ef4444"}
            />
          </View>
          <Text style={styles.statusText}>{isReceive ? "Received" : "Sent"}</Text>
          <Text style={[styles.amount, { color: isReceive ? "#22c55e" : "#ef4444" }]}>
            {isReceive ? "+" : "-"}
            {params.amount} {params.asset}
          </Text>
        </View>

        {/* Details Section */}
        <View style={styles.section}>
          <DetailRow label="Status" value={params.status || "Confirmed"} icon="checkmark-circle" iconColor="#22c55e" />
          <DetailRow label="Time" value={formatDate(params.time || "0")} icon="time" />
          <DetailRow label="Block" value={params.block || "N/A"} icon="cube" />
        </View>

        {/* Addresses Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Addresses</Text>
          <AddressRow
            label="From"
            address={params.from || ""}
            onCopy={() => copyToClipboard(params.from || "", "From address")}
          />
          <AddressRow
            label="To"
            address={params.to || ""}
            onCopy={() => copyToClipboard(params.to || "", "To address")}
          />
        </View>

        {/* Transaction Hash */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transaction Hash</Text>
          <TouchableOpacity style={styles.hashBox} onPress={() => copyToClipboard(params.id || "", "Transaction hash")}>
            <Text style={styles.hashText} selectable>
              {params.id}
            </Text>
            <Ionicons name="copy-outline" size={20} color="#00d4aa" />
          </TouchableOpacity>
        </View>

        {/* Explorer Button */}
        <TouchableOpacity style={styles.explorerBtn} onPress={openExplorer}>
          <Ionicons name="open-outline" size={20} color="#fff" />
          <Text style={styles.explorerText}>View in Explorer</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({
  label,
  value,
  icon,
  iconColor = "#888",
}: {
  label: string;
  value: string;
  icon: string;
  iconColor?: string;
}) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailLeft}>
        <Ionicons name={icon as any} size={18} color={iconColor} />
        <Text style={styles.detailLabel}>{label}</Text>
      </View>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function AddressRow({ label, address, onCopy }: { label: string; address: string; onCopy: () => void }) {
  return (
    <View style={styles.addressRow}>
      <Text style={styles.addressLabel}>{label}</Text>
      <TouchableOpacity style={styles.addressBox} onPress={onCopy}>
        <Text style={styles.addressText} numberOfLines={1}>
          {address}
        </Text>
        <Ionicons name="copy-outline" size={16} color="#00d4aa" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  content: { padding: 20 },
  header: { alignItems: "center", marginBottom: 24 },
  statusIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  statusText: { color: "#888", fontSize: 16 },
  amount: { fontSize: 28, fontWeight: "bold", marginTop: 8 },
  section: { backgroundColor: "#1a1a1a", borderRadius: 12, padding: 16, marginBottom: 16 },
  sectionTitle: { color: "#888", fontSize: 14, marginBottom: 12 },
  detailRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8 },
  detailLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  detailLabel: { color: "#888", fontSize: 14 },
  detailValue: { color: "#fff", fontSize: 14 },
  addressRow: { marginBottom: 12 },
  addressLabel: { color: "#888", fontSize: 12, marginBottom: 4 },
  addressBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#2a2a2a", padding: 12, borderRadius: 8 },
  addressText: { flex: 1, color: "#fff", fontSize: 12, fontFamily: "monospace" },
  hashBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#2a2a2a", padding: 12, borderRadius: 8 },
  hashText: { flex: 1, color: "#fff", fontSize: 11, fontFamily: "monospace" },
  explorerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#00d4aa",
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  explorerText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
