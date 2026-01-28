import { View, Text, StyleSheet, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { loadLabels, loadCategories, TxLabel, Category, getCategoryById } from "@/lib/txlabels";

export default function LabelsScreen() {
  const [labels, setLabels] = useState<TxLabel[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadLabels().then(setLabels);
      loadCategories().then(setCategories);
    }, []),
  );

  const renderLabel = ({ item }: { item: TxLabel }) => {
    const cat = item.category ? getCategoryById(categories, item.category) : null;
    return (
      <View style={styles.item}>
        {cat && (
          <View style={[styles.catBadge, { backgroundColor: cat.color }]}>
            <Ionicons name={cat.icon as keyof typeof Ionicons.glyphMap} size={14} color="#fff" />
          </View>
        )}
        <View style={styles.info}>
          <Text style={styles.label}>{item.label}</Text>
          <Text style={styles.hash}>{item.txHash.slice(0, 16)}...</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "Transaction Labels" }} />

      {labels.length > 0 ? (
        <FlatList
          data={labels}
          keyExtractor={(i) => i.txHash}
          renderItem={renderLabel}
          contentContainerStyle={styles.list}
        />
      ) : (
        <View style={styles.empty}>
          <Ionicons name="pricetag-outline" size={64} color="#333" />
          <Text style={styles.emptyText}>No labels yet</Text>
          <Text style={styles.emptyHint}>Add labels from transaction details</Text>
        </View>
      )}
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
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  catBadge: { width: 28, height: 28, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  info: { flex: 1 },
  label: { color: "#fff", fontSize: 16, fontWeight: "600" },
  hash: { color: "#666", fontSize: 12, marginTop: 2 },
  empty: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { color: "#666", fontSize: 16, marginTop: 16 },
  emptyHint: { color: "#444", fontSize: 12, marginTop: 4 },
});
