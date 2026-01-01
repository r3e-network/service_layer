import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useMiniApps } from "@/hooks/useMiniApps";
import { MiniAppCard } from "@/components/MiniAppCard";
import { SearchBar } from "@/components/SearchBar";

export default function AppsScreen() {
  const router = useRouter();
  const { apps, categories, selectedCategory, setCategory, searchQuery, setSearchQuery, clearSearch, isLoading } =
    useMiniApps();

  const handleAppPress = (appId: string) => {
    router.push(`/app/${appId}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>MiniApps</Text>
        <Text style={styles.subtitle}>{apps.length} apps available</Text>
      </View>

      {/* Search Bar */}
      <SearchBar value={searchQuery} onChangeText={setSearchQuery} onClear={clearSearch} />

      {/* Categories */}
      <FlatList
        horizontal
        data={categories}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        style={styles.categories}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.categoryChip, selectedCategory === item && styles.categoryActive]}
            onPress={() => setCategory(item)}
          >
            <Text style={[styles.categoryText, selectedCategory === item && styles.categoryTextActive]}>{item}</Text>
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
              <Text style={styles.emptyText}>No apps found</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  header: { padding: 20 },
  title: { fontSize: 28, fontWeight: "bold", color: "#fff" },
  subtitle: { fontSize: 14, color: "#888", marginTop: 4 },
  categories: { paddingHorizontal: 16, maxHeight: 50 },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    marginRight: 8,
  },
  categoryActive: { backgroundColor: "#00d4aa" },
  categoryText: { color: "#888", fontSize: 14 },
  categoryTextActive: { color: "#fff" },
  grid: { padding: 12 },
  loadingContainer: { padding: 16, alignItems: "center" },
  emptyContainer: { padding: 40, alignItems: "center" },
  emptyText: { color: "#888", fontSize: 16 },
});
