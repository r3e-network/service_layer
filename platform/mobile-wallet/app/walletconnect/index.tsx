import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useWCStore } from "@/stores/walletconnect";
import { WCSession } from "@/lib/walletconnect";
import { useTranslation } from "@/hooks/useTranslation";

export default function WalletConnectScreen() {
  const router = useRouter();
  const { sessions, initialize, disconnect } = useWCStore();
  const { t, locale } = useTranslation();

  useFocusEffect(
    useCallback(() => {
      initialize();
    }, []),
  );

  const handleDisconnect = (session: WCSession) => {
    Alert.alert(t("walletconnect.disconnectTitle"), t("walletconnect.disconnectPrompt", { name: session.peerMeta.name }), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("walletconnect.disconnect"),
        style: "destructive",
        onPress: () => disconnect(session.topic),
      },
    ]);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(locale);
  };

  const renderSession = ({ item }: { item: WCSession }) => (
    <View style={styles.sessionItem}>
      <View style={styles.sessionIcon}>
        <Ionicons name="link" size={24} color="#00d4aa" />
      </View>
      <View style={styles.sessionInfo}>
        <Text style={styles.sessionName}>{item.peerMeta.name}</Text>
        <Text style={styles.sessionUrl} numberOfLines={1}>
          {item.peerMeta.url}
        </Text>
        <Text style={styles.sessionDate}>{t("walletconnect.connectedOn", { date: formatDate(item.connectedAt) })}</Text>
      </View>
      <TouchableOpacity onPress={() => handleDisconnect(item)} style={styles.disconnectBtn}>
        <Ionicons name="close-circle" size={24} color="#ef4444" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: t("walletconnect.title"),
          headerRight: () => (
            <TouchableOpacity onPress={() => router.push("/walletconnect/scan")}>
              <Ionicons name="add" size={28} color="#00d4aa" />
            </TouchableOpacity>
          ),
        }}
      />
      {sessions.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="link-outline" size={64} color="#333" />
          <Text style={styles.emptyText}>{t("walletconnect.empty")}</Text>
          <TouchableOpacity style={styles.connectBtn} onPress={() => router.push("/walletconnect/scan")}>
            <Text style={styles.connectBtnText}>{t("walletconnect.connect")}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.topic}
          renderItem={renderSession}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  list: { padding: 16 },
  sessionItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  sessionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#0a0a0a",
    justifyContent: "center",
    alignItems: "center",
  },
  sessionInfo: { flex: 1, marginLeft: 12 },
  sessionName: { color: "#fff", fontSize: 16, fontWeight: "600" },
  sessionUrl: { color: "#888", fontSize: 12, marginTop: 2 },
  sessionDate: { color: "#666", fontSize: 11, marginTop: 4 },
  disconnectBtn: { padding: 8 },
  empty: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { color: "#666", fontSize: 16, marginTop: 16 },
  connectBtn: {
    marginTop: 24,
    backgroundColor: "#00d4aa",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  connectBtnText: { color: "#000", fontSize: 16, fontWeight: "600" },
});
