import { View, Text, StyleSheet, FlatList, TouchableOpacity, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, router } from "expo-router";
import { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import {
  loadDevices,
  loadHardwareSettings,
  saveHardwareSettings,
  HardwareDevice,
  HardwareSettings,
  getDeviceTypeLabel,
  getDeviceIcon,
  formatLastUsed,
} from "@/lib/hardware";

export default function HardwareScreen() {
  const [devices, setDevices] = useState<HardwareDevice[]>([]);
  const [settings, setSettings] = useState<HardwareSettings | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadDevices().then(setDevices);
      loadHardwareSettings().then(setSettings);
    }, []),
  );

  const toggleSetting = async (key: keyof HardwareSettings) => {
    if (!settings) return;
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    await saveHardwareSettings(updated);
  };

  const renderDevice = ({ item }: { item: HardwareDevice }) => (
    <TouchableOpacity style={styles.device} onPress={() => router.push(`/hardware/${item.id}` as never)}>
      <Ionicons name={getDeviceIcon(item.type) as keyof typeof Ionicons.glyphMap} size={28} color="#00d4aa" />
      <View style={styles.deviceInfo}>
        <Text style={styles.deviceName}>{item.name}</Text>
        <Text style={styles.deviceMeta}>
          {getDeviceTypeLabel(item.type)} • {formatLastUsed(item.lastUsed)}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#666" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "Hardware Wallets" }} />

      <TouchableOpacity style={styles.addBtn} onPress={() => router.push("/hardware/pair" as never)}>
        <Ionicons name="add-circle" size={24} color="#00d4aa" />
        <Text style={styles.addText}>Pair New Device</Text>
      </TouchableOpacity>

      {devices.length > 0 ? (
        <FlatList
          data={devices}
          keyExtractor={(i) => i.id}
          renderItem={renderDevice}
          contentContainerStyle={styles.list}
        />
      ) : (
        <View style={styles.empty}>
          <Ionicons name="hardware-chip-outline" size={64} color="#333" />
          <Text style={styles.emptyText}>No devices paired</Text>
        </View>
      )}

      {settings && (
        <View style={styles.settings}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Auto-connect</Text>
            <Switch
              value={settings.autoConnect}
              onValueChange={() => toggleSetting("autoConnect")}
              trackColor={{ true: "#00d4aa" }}
            />
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Confirm on device</Text>
            <Switch
              value={settings.confirmOnDevice}
              onValueChange={() => toggleSetting("confirmOnDevice")}
              trackColor={{ true: "#00d4aa" }}
            />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  addBtn: { flexDirection: "row", alignItems: "center", padding: 16, gap: 8 },
  addText: { color: "#00d4aa", fontSize: 16, fontWeight: "600" },
  list: { padding: 16 },
  device: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  deviceInfo: { flex: 1 },
  deviceName: { color: "#fff", fontSize: 16, fontWeight: "600" },
  deviceMeta: { color: "#888", fontSize: 12, marginTop: 2 },
  empty: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { color: "#666", fontSize: 16, marginTop: 16 },
  settings: { padding: 16, borderTopWidth: 1, borderTopColor: "#222" },
  sectionTitle: { color: "#888", fontSize: 12, marginBottom: 12 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  label: { color: "#fff", fontSize: 14 },
});
