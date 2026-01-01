import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { loadMultisigWallets, createMultisig, MultisigWallet } from "@/lib/signing";

export default function MultisigScreen() {
  const [wallets, setWallets] = useState<MultisigWallet[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [threshold, setThreshold] = useState("2");
  const [keys, setKeys] = useState("");

  useFocusEffect(
    useCallback(() => {
      loadMultisigWallets().then(setWallets);
    }, []),
  );

  const handleCreate = async () => {
    const pubKeys = keys.split("\n").filter((k) => k.trim());
    if (!name.trim() || pubKeys.length < 2) {
      Alert.alert("Error", "Enter name and at least 2 public keys");
      return;
    }
    try {
      await createMultisig(name, parseInt(threshold) || 2, pubKeys);
      loadMultisigWallets().then(setWallets);
      setShowCreate(false);
      setName("");
      setKeys("");
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "Multi-Signature" }} />
      {showCreate ? (
        <View style={styles.form}>
          <Text style={styles.label}>Wallet Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="My Multisig"
            placeholderTextColor="#666"
          />
          <Text style={styles.label}>Threshold (M of N)</Text>
          <TextInput style={styles.input} value={threshold} onChangeText={setThreshold} keyboardType="numeric" />
          <Text style={styles.label}>Public Keys (one per line)</Text>
          <TextInput
            style={styles.textArea}
            value={keys}
            onChangeText={setKeys}
            multiline
            numberOfLines={4}
            placeholder="Enter public keys..."
            placeholderTextColor="#666"
          />
          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCreate(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.createBtn} onPress={handleCreate}>
              <Text style={styles.createText}>Create</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <>
          {wallets.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={64} color="#333" />
              <Text style={styles.emptyText}>No multisig wallets</Text>
            </View>
          ) : (
            <FlatList
              data={wallets}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.card}>
                  <Ionicons name="people" size={24} color="#00d4aa" />
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardName}>{item.name}</Text>
                    <Text style={styles.cardMeta}>
                      {item.threshold} of {item.publicKeys.length} signatures
                    </Text>
                  </View>
                </View>
              )}
              contentContainerStyle={styles.list}
            />
          )}
          <TouchableOpacity style={styles.fab} onPress={() => setShowCreate(true)}>
            <Ionicons name="add" size={28} color="#000" />
          </TouchableOpacity>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  list: { padding: 16 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  cardInfo: { flex: 1, marginLeft: 12 },
  cardName: { color: "#fff", fontSize: 16, fontWeight: "600" },
  cardMeta: { color: "#888", fontSize: 12, marginTop: 2 },
  empty: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { color: "#666", fontSize: 16, marginTop: 16 },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    backgroundColor: "#00d4aa",
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  form: { padding: 16 },
  label: { color: "#888", fontSize: 12, marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: "#1a1a1a", color: "#fff", padding: 14, borderRadius: 12, fontSize: 16 },
  textArea: {
    backgroundColor: "#1a1a1a",
    color: "#fff",
    padding: 14,
    borderRadius: 12,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: "top",
  },
  btnRow: { flexDirection: "row", gap: 12, marginTop: 20 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: "#666", alignItems: "center" },
  cancelText: { color: "#888", fontSize: 16 },
  createBtn: { flex: 1, backgroundColor: "#00d4aa", padding: 14, borderRadius: 12, alignItems: "center" },
  createText: { color: "#000", fontSize: 16, fontWeight: "600" },
});
