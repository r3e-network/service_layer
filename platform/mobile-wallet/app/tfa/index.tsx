import { View, Text, StyleSheet, TouchableOpacity, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { loadTFAConfig, saveTFAConfig, TFAConfig, TFAMethod, getTFAMethodLabel, getTFAMethodIcon } from "@/lib/tfa";

const METHODS: TFAMethod[] = ["totp", "sms", "email"];

export default function TFAScreen() {
  const [config, setConfig] = useState<TFAConfig | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadTFAConfig().then(setConfig);
    }, []),
  );

  const toggleEnabled = async () => {
    if (!config) return;
    const updated = { ...config, enabled: !config.enabled };
    setConfig(updated);
    await saveTFAConfig(updated);
  };

  const selectMethod = async (method: TFAMethod) => {
    if (!config) return;
    const updated = { ...config, method };
    setConfig(updated);
    await saveTFAConfig(updated);
  };

  if (!config) return null;

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "Two-Factor Auth" }} />
      <View style={styles.row}>
        <Text style={styles.label}>Enable 2FA</Text>
        <Switch value={config.enabled} onValueChange={toggleEnabled} trackColor={{ true: "#00d4aa" }} />
      </View>
      <Text style={styles.section}>Method</Text>
      {METHODS.map((m) => (
        <TouchableOpacity
          key={m}
          style={[styles.method, config.method === m && styles.selected]}
          onPress={() => selectMethod(m)}
        >
          <Ionicons name={getTFAMethodIcon(m) as any} size={24} color={config.method === m ? "#00d4aa" : "#888"} />
          <Text style={styles.methodLabel}>{getTFAMethodLabel(m)}</Text>
        </TouchableOpacity>
      ))}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a", padding: 16 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12 },
  label: { color: "#fff", fontSize: 16 },
  section: { color: "#888", fontSize: 12, marginTop: 24, marginBottom: 8 },
  method: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  selected: { borderWidth: 1, borderColor: "#00d4aa" },
  methodLabel: { color: "#fff", fontSize: 14 },
});
