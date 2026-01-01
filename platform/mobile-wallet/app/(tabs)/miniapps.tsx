import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { MINIAPPS, getAppsByCategory, searchApps } from "@/data/miniapps-generated";
import { CATEGORY_LABELS, type MiniAppCategory, type MiniAppInfo } from "@neo/shared/types";
import { MINIAPP_BASE_URL } from "@/lib/config";

const CATEGORIES: (MiniAppCategory | "all")[] = [
  "all",
  "gaming",
  "defi",
  "governance",
  "utility",
  "social",
  "nft",
  "creative",
  "security",
  "tools",
];

export default function MiniAppsScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<MiniAppCategory | "all">("all");

  const filteredApps = selectedCategory === "all" ? MINIAPPS : getAppsByCategory(selectedCategory);

  const openMiniApp = (app: MiniAppInfo) => {
    // Construct full URL from base + entry_url
    const fullUrl = app.entry_url.startsWith("http") ? app.entry_url : `${MINIAPP_BASE_URL}${app.entry_url}`;
    router.push({ pathname: "/browser", params: { url: fullUrl, title: app.name } });
  };

  const renderItem = ({ item }: { item: MiniAppInfo }) => (
    <TouchableOpacity style={styles.card} onPress={() => openMiniApp(item)}>
      <View style={styles.iconBox}>
        <Text style={styles.icon}>{item.icon}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.desc}>{item.description}</Text>
        <Text style={styles.category}>{CATEGORY_LABELS[item.category]}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#666" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>MiniApps</Text>
        <Text style={styles.subtitle}>{filteredApps.length} apps available</Text>
      </View>

      {/* Category Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.filterChip, selectedCategory === cat && styles.filterChipActive]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text style={[styles.filterText, selectedCategory === cat && styles.filterTextActive]}>
              {cat === "all" ? "All" : CATEGORY_LABELS[cat]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filteredApps}
        keyExtractor={(item) => item.app_id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  header: { padding: 20, paddingBottom: 10 },
  title: { fontSize: 28, fontWeight: "bold", color: "#fff" },
  subtitle: { color: "#888", marginTop: 4 },
  filterRow: { paddingHorizontal: 16, marginBottom: 8 },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#1a1a1a",
    marginRight: 8,
  },
  filterChipActive: { backgroundColor: "#00d4aa" },
  filterText: { color: "#888", fontSize: 14 },
  filterTextActive: { color: "#fff", fontWeight: "600" },
  list: { padding: 16 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#2a2a2a",
    justifyContent: "center",
    alignItems: "center",
  },
  icon: { fontSize: 24 },
  info: { flex: 1, marginLeft: 12 },
  name: { color: "#fff", fontSize: 16, fontWeight: "600" },
  desc: { color: "#888", fontSize: 13, marginTop: 2 },
  category: { color: "#00d4aa", fontSize: 11, marginTop: 4 },
});
