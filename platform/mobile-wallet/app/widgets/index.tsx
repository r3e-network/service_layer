import { View, Text, StyleSheet, FlatList, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { loadWidgetConfigs, toggleWidget, WidgetConfig, getWidgetTypeLabel, getWidgetIcon } from "@/lib/widgets";

export default function WidgetsScreen() {
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadWidgetConfigs().then(setWidgets);
    }, []),
  );

  const handleToggle = async (id: string) => {
    await toggleWidget(id);
    loadWidgetConfigs().then(setWidgets);
  };

  const renderWidget = ({ item }: { item: WidgetConfig }) => (
    <View style={styles.item}>
      <Ionicons name={getWidgetIcon(item.type) as any} size={24} color="#00d4aa" />
      <View style={styles.info}>
        <Text style={styles.name}>{getWidgetTypeLabel(item.type)}</Text>
        <Text style={styles.size}>{item.size}</Text>
      </View>
      <Switch value={item.enabled} onValueChange={() => handleToggle(item.id)} trackColor={{ true: "#00d4aa" }} />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "Widgets" }} />
      <Text style={styles.hint}>Configure home screen widgets</Text>
      <FlatList
        data={widgets}
        keyExtractor={(i) => i.id}
        renderItem={renderWidget}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  hint: { color: "#666", fontSize: 12, padding: 16 },
  list: { padding: 16, paddingTop: 0 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  info: { flex: 1 },
  name: { color: "#fff", fontSize: 16, fontWeight: "600" },
  size: { color: "#888", fontSize: 12, marginTop: 2, textTransform: "capitalize" },
});
