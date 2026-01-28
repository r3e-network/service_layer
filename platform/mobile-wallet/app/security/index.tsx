import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { loadSecuritySettings, saveSecuritySettings, SecuritySettings } from "@/lib/security";

export default function SecuritySettingsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState<SecuritySettings | null>(null);

  useEffect(() => {
    loadSecuritySettings().then(setSettings);
  }, []);

  const updateSetting = async <K extends keyof SecuritySettings>(key: K, value: SecuritySettings[K]) => {
    if (!settings) return;
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    await saveSecuritySettings(updated);
  };

  if (!settings) return null;

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "Security" }} />
      <ScrollView>
        <SettingRow
          icon="lock-closed"
          label="Lock Method"
          value={settings.lockMethod}
          onPress={() => router.push("/security/lock-method" as never)}
        />
        <SettingRow
          icon="time"
          label="Auto-Lock"
          value={`${settings.autoLockTimeout} min`}
          onPress={() => router.push("/security/auto-lock" as never)}
        />
        <ToggleRow
          icon="eye-off"
          label="Hide Balance"
          value={settings.hideBalance}
          onToggle={(v) => updateSetting("hideBalance", v)}
        />
        <ToggleRow
          icon="checkmark-circle"
          label="Confirm Transactions"
          value={settings.transactionConfirm}
          onToggle={(v) => updateSetting("transactionConfirm", v)}
        />
        <SettingRow icon="list" label="Security Logs" onPress={() => router.push("/security/logs")} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingRow({
  icon,
  label,
  value,
  onPress,
}: {
  icon: string;
  label: string;
  value?: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={22} color="#00d4aa" />
      <Text style={styles.label}>{label}</Text>
      {value && <Text style={styles.value}>{value}</Text>}
      <Ionicons name="chevron-forward" size={18} color="#666" />
    </TouchableOpacity>
  );
}

function ToggleRow({
  icon,
  label,
  value,
  onToggle,
}: {
  icon: string;
  label: string;
  value: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={22} color="#00d4aa" />
      <Text style={styles.label}>{label}</Text>
      <Switch value={value} onValueChange={onToggle} trackColor={{ true: "#00d4aa" }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    padding: 16,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    gap: 12,
  },
  label: { flex: 1, color: "#fff", fontSize: 16 },
  value: { color: "#888", fontSize: 14 },
});
