import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { loadNotifications, markAsRead, getNotifIcon, Notification } from "@/lib/notifcenter";

export default function NotificationsScreen() {
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
      <Stack.Screen options={{ title: "Notifications" }} />
      {notifs.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="notifications-off-outline" size={64} color="#333" />
          <Text style={styles.emptyText}>No notifications</Text>
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
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  list: { padding: 16 },
  item: { flexDirection: "row", backgroundColor: "#1a1a1a", padding: 14, borderRadius: 12, marginBottom: 8, gap: 12 },
  unread: { borderLeftWidth: 3, borderLeftColor: "#00d4aa" },
  content: { flex: 1 },
  title: { color: "#fff", fontSize: 14, fontWeight: "600" },
  body: { color: "#888", fontSize: 12, marginTop: 2 },
  empty: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { color: "#666", fontSize: 16, marginTop: 16 },
});
