import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useMiniApps } from "@/hooks/useMiniApps";
import { MiniAppCard } from "@/components/MiniAppCard";
import { SearchBar } from "@/components/SearchBar";
import { useTranslation } from "@/hooks/useTranslation";

export default function AppsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { apps, categories, selectedCategory, setCategory, searchQuery, setSearchQuery, clearSearch, isLoading, getCategoryDisplay } =
    useMiniApps();

  const handleAppPress = (appId: string) => {
    router.push(`/app/${appId}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>MiniApps</Text>
        <Text style={styles.subtitle}>{apps.length} {t("wallet.apps_available")}</Text>
      </View>

      {/* Search Bar */}
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        onClear={clearSearch}
        placeholder={t("wallet.search_miniapps")}
      />

      {/* Categories */}
      <FlatList
        horizontal
        data={categories}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        style={styles.categories}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.categoryChip, selectedCategory === item && styles.categoryActive]}
            onPress={() => setCategory(item)}
          >
            <Text style={[styles.categoryText, selectedCategory === item && styles.categoryTextActive]}>
              {getCategoryDisplay(item)}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Loading Indicator */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#00d4aa" />
        </View>
      )}

      {/* App Grid */}
      <FlatList
        data={apps}
        keyExtractor={(item) => item.app_id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => <MiniAppCard app={item} onPress={() => handleAppPress(item.app_id)} />}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{t("wallet.no_apps_found")}</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { padding: 24 },
  title: { fontSize: 40, fontWeight: "900", color: "#000", textTransform: "uppercase", fontStyle: "italic", letterSpacing: -1 },
  subtitle: { fontSize: 13, color: "#000", marginTop: 4, fontWeight: "800", textTransform: "uppercase", backgroundColor: "#00E599", alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 2, borderWidth: 2, borderColor: "#000" },
  categories: { maxHeight: 60, marginBottom: 20 },
  categoryChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderWidth: 3,
    borderColor: "#000",
    marginRight: 10,
    shadowColor: "#000",
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  categoryActive: { backgroundColor: "#ffde59", shadowOffset: { width: 0, height: 0 }, transform: [{ translateX: 2 }, { translateY: 2 }] },
  categoryText: { color: "#000", fontSize: 14, fontWeight: "900", textTransform: "uppercase" },
  categoryTextActive: { color: "#000" },
  grid: { padding: 12, paddingBottom: 40 },
  loadingContainer: { padding: 20, alignItems: "center" },
  emptyContainer: { padding: 60, alignItems: "center" },
  emptyText: { color: "#000", fontSize: 20, fontWeight: "900", textTransform: "uppercase", fontStyle: "italic", textAlign: "center" },
});
