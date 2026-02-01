import { View, Text, StyleSheet, TouchableOpacity, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useWalletStore } from "@/stores/wallet";
import { useTranslation } from "@/hooks/useTranslation";

export default function SettingsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { biometricsEnabled, biometricsAvailable, toggleBiometrics, lock, network, switchNetwork } = useWalletStore();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t("settings.title")}</Text>
      </View>

      {/* Security Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("settings.security")}</Text>
        <View style={styles.item}>
          <View style={styles.itemLeft}>
            <Ionicons name="finger-print" size={24} color="#000" />
            <View>
              <Text style={styles.itemText}>{t("settings.biometrics")}</Text>
              {!biometricsAvailable && <Text style={styles.itemHint}>{t("settings.not_available_device")}</Text>}
            </View>
          </View>
          <Switch
            value={biometricsEnabled}
            onValueChange={toggleBiometrics}
            disabled={!biometricsAvailable}
            trackColor={{ false: "#333", true: "#00E599" }}
            thumbColor={biometricsEnabled ? "#000" : "#fff"}
          />
        </View>
        <TouchableOpacity style={styles.item} onPress={lock}>
          <View style={styles.itemLeft}>
            <Ionicons name="lock-closed" size={24} color="#000" />
            <Text style={styles.itemText}>{t("settings.lock")}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.item} onPress={() => router.push("/export")}>
          <View style={styles.itemLeft}>
            <Ionicons name="key" size={24} color="#EF4444" />
            <Text style={styles.itemText}>{t("settings.export")}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Network Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("settings.network")}</Text>
        <TouchableOpacity
          style={[styles.item, network === "mainnet" && styles.itemActive]}
          onPress={() => switchNetwork("mainnet")}
        >
          <View style={styles.itemLeft}>
            <Ionicons name="globe" size={24} color="#000" />
            <Text style={styles.itemText}>{t("settings.mainnet")}</Text>
          </View>
          {network === "mainnet" && <Ionicons name="checkmark-circle" size={24} color="#000" />}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.item, network === "testnet" && styles.itemActive]}
          onPress={() => switchNetwork("testnet")}
        >
          <View style={styles.itemLeft}>
            <Ionicons name="flask" size={24} color="#000" />
            <Text style={styles.itemText}>{t("settings.testnet")}</Text>
          </View>
          {network === "testnet" && <Ionicons name="checkmark-circle" size={24} color="#000" />}
        </TouchableOpacity>
      </View>

      {/* Tokens Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("settings.tokens")}</Text>
        <TouchableOpacity style={styles.item} onPress={() => router.push("/tokens")}>
          <View style={styles.itemLeft}>
            <Ionicons name="list" size={24} color="#000" />
            <Text style={styles.itemText}>{t("settings.manage_tokens")}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.item} onPress={() => router.push("/add-token")}>
          <View style={styles.itemLeft}>
            <Ionicons name="add-circle" size={24} color="#000" />
            <Text style={styles.itemText}>{t("settings.add_custom_token")}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Notifications Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("notifications.title")}</Text>
        <TouchableOpacity style={styles.item} onPress={() => router.push("/notifications")}>
          <View style={styles.itemLeft}>
            <Ionicons name="notifications" size={24} color="#000" />
            <Text style={styles.itemText}>{t("settings.notification_center")}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Language Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("settings.language")}</Text>
        <TouchableOpacity style={styles.item} onPress={() => router.push("/language")}>
          <View style={styles.itemLeft}>
            <Ionicons name="language" size={24} color="#000" />
            <Text style={styles.itemText}>{t("settings.language")}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#000" />
        </TouchableOpacity>
      </View>

      {/* About Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("settings.about")}</Text>
        <View style={styles.item}>
          <Text style={styles.itemText}>{t("settings.version")}</Text>
          <Text style={styles.itemValue}>1.0.0</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { padding: 24, backgroundColor: "#000" },
  title: { fontSize: 32, fontWeight: "900", color: "#00E599", textTransform: "uppercase", letterSpacing: -1, fontStyle: "italic" },
  section: { marginTop: 32, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 14, color: "#000", marginBottom: 16, textTransform: "uppercase", fontWeight: "900", letterSpacing: 1 },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
    borderWidth: 3,
    borderColor: "#000",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  itemLeft: { flexDirection: "row", alignItems: "center", gap: 16 },
  itemText: { color: "#000", fontSize: 16, fontWeight: "800", textTransform: "uppercase" },
  itemHint: { color: "#666", fontSize: 11, marginTop: 4, fontWeight: "bold" },
  itemValue: { color: "#000", fontSize: 16, fontWeight: "900", fontStyle: "italic" },
  itemActive: { backgroundColor: "#00E599", transform: [{ translateX: -4 }, { translateY: -4 }], shadowOffset: { width: 8, height: 8 } },
});
