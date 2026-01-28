import { View, Text, StyleSheet, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import {
  loadGamificationData,
  GamificationData,
  Achievement,
  getXPForNextLevel,
  getAchievementIcon,
} from "@/lib/gamification";

export default function GamificationScreen() {
  const [data, setData] = useState<GamificationData | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadGamificationData().then(setData);
    }, []),
  );

  if (!data) return null;

  const nextLevelXP = getXPForNextLevel(data.level);
  const progress = (data.xp % 500) / 500;

  const renderAchievement = ({ item }: { item: Achievement }) => (
    <View style={[styles.achievement, !item.unlocked && styles.locked]}>
      <Ionicons name={getAchievementIcon(item.type) as keyof typeof Ionicons.glyphMap} size={24} color={item.unlocked ? "#00d4aa" : "#444"} />
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.desc}>{item.description}</Text>
      </View>
      <Text style={styles.xp}>+{item.xp} XP</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "Achievements" }} />

      <View style={styles.header}>
        <Text style={styles.level}>Level {data.level}</Text>
        <Text style={styles.xpText}>
          {data.xp} / {nextLevelXP} XP
        </Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
      </View>

      <FlatList
        data={data.achievements}
        keyExtractor={(i) => i.id}
        renderItem={renderAchievement}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  header: { padding: 16, backgroundColor: "#1a1a1a", margin: 16, borderRadius: 12 },
  level: { color: "#00d4aa", fontSize: 24, fontWeight: "700" },
  xpText: { color: "#888", fontSize: 12, marginTop: 4 },
  progressBar: { height: 6, backgroundColor: "#333", borderRadius: 3, marginTop: 8 },
  progressFill: { height: "100%", backgroundColor: "#00d4aa", borderRadius: 3 },
  list: { padding: 16, paddingTop: 0 },
  achievement: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  locked: { opacity: 0.5 },
  info: { flex: 1 },
  name: { color: "#fff", fontSize: 14, fontWeight: "600" },
  desc: { color: "#888", fontSize: 12, marginTop: 2 },
  xp: { color: "#00d4aa", fontSize: 12, fontWeight: "600" },
});
