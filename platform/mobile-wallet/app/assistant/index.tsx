import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { loadChatHistory, saveChatMessage, ChatMessage } from "@/lib/aiassistant";

export default function AssistantScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");

  useFocusEffect(
    useCallback(() => {
      loadChatHistory().then(setMessages);
    }, []),
  );

  const handleSend = async () => {
    if (!input.trim()) return;
    await saveChatMessage({ role: "user", content: input });
    setInput("");
    loadChatHistory().then(setMessages);
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <View style={[styles.msg, item.role === "user" ? styles.userMsg : styles.aiMsg]}>
      <Text style={styles.msgText}>{item.content}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "AI Assistant" }} />
      <FlatList
        data={messages}
        keyExtractor={(i) => i.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.list}
      />
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask anything..."
          placeholderTextColor="#666"
        />
        <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
          <Ionicons name="send" size={20} color="#000" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  list: { padding: 16 },
  msg: { padding: 12, borderRadius: 12, marginBottom: 8, maxWidth: "80%" },
  userMsg: { backgroundColor: "#00d4aa", alignSelf: "flex-end" },
  aiMsg: { backgroundColor: "#1a1a1a", alignSelf: "flex-start" },
  msgText: { color: "#fff", fontSize: 14 },
  inputRow: { flexDirection: "row", padding: 16, gap: 8, borderTopWidth: 1, borderTopColor: "#222" },
  input: { flex: 1, backgroundColor: "#1a1a1a", padding: 12, borderRadius: 12, color: "#fff" },
  sendBtn: {
    backgroundColor: "#00d4aa",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
});
