import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { loadThemeMode, saveThemeMode, ThemeMode, getThemeModeLabel, getThemeIcon } from "@/lib/theme";

const MODES: ThemeMode[] = ["dark", "light", "system"];

export default function ThemeScreen() {
  const [mode, setMode] = useState<ThemeMode>("dark");

  useFocusEffect(
    useCallback(() => {
      loadThemeMode().then(setMode);
    }, []),
  );

  const handleSelect = async (m: ThemeMode) => {
    setMode(m);
    await saveThemeMode(m);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "Theme" }} />
      <View style={styles.list}>
        {MODES.map((m) => (
          <TouchableOpacity
            key={m}
            style={[styles.item, mode === m && styles.selected]}
            onPress={() => handleSelect(m)}
          >
            <Ionicons name={getThemeIcon(m) as any} size={24} color={mode === m ? "#00d4aa" : "#888"} />
            <Text style={[styles.label, mode === m && styles.selectedLabel]}>{getThemeModeLabel(m)}</Text>
            {mode === m && <Ionicons name="checkmark" size={20} color="#00d4aa" />}
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  list: { padding: 16 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  selected: { borderWidth: 1, borderColor: "#00d4aa" },
  label: { flex: 1, color: "#888", fontSize: 16 },
  selectedLabel: { color: "#fff", fontWeight: "600" },
});
