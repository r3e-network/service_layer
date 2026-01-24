import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, Stack, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { fetchAppDetail, AppDetail } from "@/lib/api/app-detail";

export default function AppDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [app, setApp] = useState<AppDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchAppDetail(id).then((data) => {
        setApp(data);
        setLoading(false);
      });
    }
  }, [id]);

  const handleLaunch = () => {
    router.push(`/miniapp/${id}`);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: "Loading..." }} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#00d4aa" />
        </View>
      </SafeAreaView>
    );
  }

  if (!app) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: "Not Found" }} />
        <View style={styles.center}>
          <Text style={styles.errorText}>App not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: app.name }} />
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.icon}>{app.icon}</Text>
          <Text style={styles.name}>{app.name}</Text>
          <Text style={styles.category}>{app.category}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatBox label="Users 24h" value={app.stats.users_24h.toString()} />
          <StatBox label="Txs 24h" value={app.stats.txs_24h.toString()} />
          <StatBox label="Volume" value={app.stats.volume_24h} />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.description}>{app.description}</Text>
        </View>

        {/* Permissions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Permissions</Text>
          {Object.entries(app.permissions)
            .filter(([, enabled]) => enabled)
            .map(([perm]) => (
              <View key={perm} style={styles.permItem}>
                <Ionicons name="checkmark-circle" size={20} color="#00d4aa" />
                <Text style={styles.permText}>{perm}</Text>
              </View>
            ))}
        </View>

        {/* Launch Button */}
        <TouchableOpacity style={styles.launchBtn} onPress={handleLaunch}>
          <Text style={styles.launchText}>Launch App</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { color: "#888", fontSize: 16 },
  header: { alignItems: "center", padding: 24 },
  icon: { fontSize: 64, marginBottom: 12 },
  name: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  category: { fontSize: 14, color: "#888", marginTop: 4, textTransform: "capitalize" },
  statsRow: { flexDirection: "row", paddingHorizontal: 16, marginBottom: 24 },
  statBox: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    alignItems: "center",
  },
  statValue: { fontSize: 20, fontWeight: "bold", color: "#00d4aa" },
  statLabel: { fontSize: 12, color: "#888", marginTop: 4 },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: "#fff", marginBottom: 12 },
  description: { color: "#ccc", fontSize: 14, lineHeight: 22 },
  permItem: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  permText: { color: "#fff", fontSize: 14, textTransform: "capitalize" },
  launchBtn: { backgroundColor: "#00d4aa", margin: 20, padding: 16, borderRadius: 12, alignItems: "center" },
  launchText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
