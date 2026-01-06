import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { loadNotifications, markAsRead, getNotifIcon, Notification } from "@/lib/notifcenter";
import { useTranslation } from "@/hooks/useTranslation";

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const [notifs, setNotifs] = useState<Notification[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadNotifications().then(setNotifs);
    }, []),
  );

  const handlePress = async (item: Notification) => {
    if (!item.read) {
      await markAsRead(item.id);
      loadNotifications().then(setNotifs);
    }
  };

  const renderItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity style={[styles.item, !item.read && styles.unread]} onPress={() => handlePress(item)}>
      <Ionicons name={getNotifIcon(item.type) as any} size={24} color="#00d4aa" />
      <View style={styles.content}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.body}>{item.body}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: t("notifications.title") }} />
      {notifs.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="notifications-off-outline" size={64} color="#333" />
          <Text style={styles.emptyText}>{t("notifications.empty")}</Text>
        </View>
      ) : (
        <FlatList
          data={notifs}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  list: { padding: 24, paddingBottom: 40 },
  item: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 18,
    borderWidth: 3,
    borderColor: "#000",
    marginBottom: 16,
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  unread: { backgroundColor: "#ffde59" },
  content: { flex: 1 },
  title: { color: "#000", fontSize: 16, fontWeight: "900", textTransform: "uppercase" },
  body: { color: "#333", fontSize: 13, marginTop: 4, fontWeight: "700" },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
  emptyText: { color: "#000", fontSize: 20, fontWeight: "900", textTransform: "uppercase", marginTop: 20, fontStyle: "italic" },
});
