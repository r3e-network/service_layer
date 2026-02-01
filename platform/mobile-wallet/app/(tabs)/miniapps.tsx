import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { SvgUri } from "react-native-svg";
import { BUILTIN_APPS, getAppsByCategory } from "@/lib/miniapp";
import { CATEGORY_LABELS, type MiniAppCategory } from "@/types/miniapp";
import type { MiniAppInfo } from "@/types/miniapp";
import { MINIAPP_BASE_URL } from "@/lib/config";

const CATEGORIES: (MiniAppCategory | "all")[] = [
  "all",
  "gaming",
  "defi",
  "governance",
  "utility",
  "social",
  "nft",
];

export default function MiniAppsScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<MiniAppCategory | "all">("all");

  const filteredApps = selectedCategory === "all" ? BUILTIN_APPS : getAppsByCategory(selectedCategory);

  const openMiniApp = (app: MiniAppInfo) => {
    // Construct full URL from base + entry_url
    const fullUrl = app.entry_url.startsWith("http") ? app.entry_url : `${MINIAPP_BASE_URL}${app.entry_url}`;
    router.push({ pathname: "/browser", params: { url: fullUrl, title: app.name } });
  };

  const renderItem = ({ item }: { item: MiniAppInfo }) => {
    const iconUri = item.icon
      ? item.icon.startsWith("http")
        ? item.icon
        : `${MINIAPP_BASE_URL}${item.icon}`
      : "";
    const isSvg = iconUri.toLowerCase().split("?")[0].endsWith(".svg");

    return (
      <TouchableOpacity style={styles.card} onPress={() => openMiniApp(item)}>
        <View style={styles.iconBox}>
          {iconUri ? (
            isSvg ? (
              <SvgUri width={28} height={28} uri={iconUri} />
            ) : (
              <Image source={{ uri: iconUri }} style={styles.iconImage} resizeMode="contain" />
            )
          ) : (
            <Text style={styles.iconFallback}>{item.name?.slice(0, 1) || "?"}</Text>
          )}
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.desc}>{item.description}</Text>
          <Text style={styles.category}>{CATEGORY_LABELS[item.category]}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#666" />
      </TouchableOpacity>
    );
  };

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
  container: { flex: 1, backgroundColor: "#fff" },
  header: { padding: 24, paddingBottom: 16, backgroundColor: "#000" },
  title: { fontSize: 32, fontWeight: "900", color: "#00E599", textTransform: "uppercase", letterSpacing: -1 },
  subtitle: { color: "#fff", marginTop: 4, fontWeight: "bold", opacity: 0.7, fontSize: 12, textTransform: "uppercase" },
  filterRow: { paddingHorizontal: 16, marginVertical: 16 },
  filterChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#fff",
    marginRight: 10,
    borderWidth: 2,
    borderColor: "#000",
  },
  filterChipActive: { backgroundColor: "#00E599" },
  filterText: { color: "#000", fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  filterTextActive: { color: "#000" },
  list: { padding: 16 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderWidth: 3,
    borderColor: "#000",
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    marginBottom: 16,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderWidth: 2,
    borderColor: "#000",
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    transform: [{ rotate: "2deg" }],
  },
  iconImage: { width: 28, height: 28 },
  iconFallback: { fontSize: 20, fontWeight: "900", color: "#000" },
  info: { flex: 1, marginLeft: 16 },
  name: { color: "#000", fontSize: 18, fontWeight: "900", textTransform: "uppercase", fontStyle: "italic" },
  desc: { color: "#666", fontSize: 13, marginTop: 2, fontWeight: "500" },
  category: { color: "#000", fontSize: 10, fontWeight: "900", marginTop: 6, textTransform: "uppercase", backgroundColor: "#ffde59", alignSelf: "flex-start", paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: "#000" },
});
