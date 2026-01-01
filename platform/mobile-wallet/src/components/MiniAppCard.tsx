import { Text, StyleSheet, TouchableOpacity } from "react-native";
import { MiniApp } from "@/hooks/useMiniApps";

interface MiniAppCardProps {
  app: MiniApp;
  onPress: () => void;
}

export function MiniAppCard({ app, onPress }: MiniAppCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Text style={styles.icon}>{app.icon}</Text>
      <Text style={styles.name} numberOfLines={1}>
        {app.name}
      </Text>
      <Text style={styles.category}>{app.category}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    padding: 16,
    borderRadius: 12,
    margin: 4,
    alignItems: "center",
  },
  icon: { fontSize: 40, marginBottom: 8 },
  name: { color: "#fff", fontSize: 14, fontWeight: "600" },
  category: { color: "#888", fontSize: 12, marginTop: 4 },
});
