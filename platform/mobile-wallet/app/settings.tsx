import { View, Text, StyleSheet, TouchableOpacity, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useWalletStore } from "@/stores/wallet";

export default function SettingsScreen() {
  const router = useRouter();
  const { biometricsEnabled, biometricsAvailable, toggleBiometrics, lock, network, switchNetwork } = useWalletStore();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      {/* Security Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security</Text>
        <View style={styles.item}>
          <View style={styles.itemLeft}>
            <Ionicons name="finger-print" size={24} color="#00d4aa" />
            <View>
              <Text style={styles.itemText}>Biometric Authentication</Text>
              {!biometricsAvailable && <Text style={styles.itemHint}>Not available on this device</Text>}
            </View>
          </View>
          <Switch
            value={biometricsEnabled}
            onValueChange={toggleBiometrics}
            disabled={!biometricsAvailable}
            trackColor={{ false: "#333", true: "#00d4aa" }}
          />
        </View>
        <TouchableOpacity style={styles.item} onPress={lock}>
          <View style={styles.itemLeft}>
            <Ionicons name="lock-closed" size={24} color="#00d4aa" />
            <Text style={styles.itemText}>Lock Wallet</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.item} onPress={() => router.push("/export")}>
          <View style={styles.itemLeft}>
            <Ionicons name="key" size={24} color="#ef4444" />
            <Text style={styles.itemText}>Export Private Key</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Network Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Network</Text>
        <TouchableOpacity
          style={[styles.item, network === "mainnet" && styles.itemActive]}
          onPress={() => switchNetwork("mainnet")}
        >
          <View style={styles.itemLeft}>
            <Ionicons name="globe" size={24} color="#00d4aa" />
            <Text style={styles.itemText}>Neo N3 Mainnet</Text>
          </View>
          {network === "mainnet" && <Ionicons name="checkmark-circle" size={24} color="#00d4aa" />}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.item, network === "testnet" && styles.itemActive]}
          onPress={() => switchNetwork("testnet")}
        >
          <View style={styles.itemLeft}>
            <Ionicons name="flask" size={24} color="#f59e0b" />
            <Text style={styles.itemText}>Neo N3 Testnet</Text>
          </View>
          {network === "testnet" && <Ionicons name="checkmark-circle" size={24} color="#00d4aa" />}
        </TouchableOpacity>
      </View>

      {/* Tokens Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tokens</Text>
        <TouchableOpacity style={styles.item} onPress={() => router.push("/tokens")}>
          <View style={styles.itemLeft}>
            <Ionicons name="list" size={24} color="#00d4aa" />
            <Text style={styles.itemText}>Manage Tokens</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.item} onPress={() => router.push("/add-token")}>
          <View style={styles.itemLeft}>
            <Ionicons name="add-circle" size={24} color="#00d4aa" />
            <Text style={styles.itemText}>Add Custom Token</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Notifications Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <TouchableOpacity style={styles.item} onPress={() => router.push("/notifications")}>
          <View style={styles.itemLeft}>
            <Ionicons name="notifications" size={24} color="#00d4aa" />
            <Text style={styles.itemText}>Notification Center</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      {/* About Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.item}>
          <Text style={styles.itemText}>Version</Text>
          <Text style={styles.itemValue}>1.0.0</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  header: { padding: 20 },
  title: { fontSize: 28, fontWeight: "bold", color: "#fff" },
  section: { marginTop: 24, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 14, color: "#888", marginBottom: 12, textTransform: "uppercase" },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  itemLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  itemText: { color: "#fff", fontSize: 16 },
  itemHint: { color: "#888", fontSize: 12, marginTop: 2 },
  itemValue: { color: "#888", fontSize: 16 },
  itemActive: { borderColor: "#00d4aa", borderWidth: 1 },
});
