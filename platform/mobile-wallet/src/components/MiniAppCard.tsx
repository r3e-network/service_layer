/**
 * MiniAppCard - Display card for MiniApp in grid/list
 */

import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import type { MiniAppInfo } from "@/types/miniapp";
import { CATEGORY_LABELS } from "@/types/miniapp";

interface MiniAppCardProps {
  app: MiniAppInfo;
  onPress: () => void;
}

export function MiniAppCard({ app, onPress }: MiniAppCardProps) {
  const categoryLabel = CATEGORY_LABELS[app.category] || app.category;
  const isImageIcon = app.icon?.startsWith("/") || app.icon?.startsWith("http");

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {isImageIcon ? (
        <Image source={{ uri: app.icon }} style={styles.iconImage} />
      ) : (
        <Text style={styles.iconEmoji}>{app.icon || "🧩"}</Text>
      )}
      <Text style={styles.name} numberOfLines={1}>
        {app.name}
      </Text>
      <Text style={styles.category}>{categoryLabel}</Text>
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
    minWidth: 100,
  },
  iconImage: {
    width: 48,
    height: 48,
    borderRadius: 12,
    marginBottom: 8,
  },
  iconEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  name: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  category: {
    color: "#888",
    fontSize: 12,
    marginTop: 4,
    textTransform: "capitalize",
  },
});
