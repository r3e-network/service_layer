import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  loadAccounts,
  saveAccount,
  updateAccount,
  removeAccount,
  getActiveAccountId,
  setActiveAccountId,
  generateAccountId,
  Account,
} from "@/lib/accounts";
import { generateWallet } from "@/lib/neo/wallet";
import { useWalletStore } from "@/stores/wallet";

export default function AccountsScreen() {
  const { refreshBalances } = useWalletStore();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [accs, active] = await Promise.all([loadAccounts(), getActiveAccountId()]);
    setAccounts(accs);
    setActiveId(active);
  };

  const handleCreate = async () => {
    const wallet = await generateWallet();
    const account: Account = {
      id: generateAccountId(),
      name: `Wallet ${accounts.length + 1}`,
      address: wallet.address,
      createdAt: Date.now(),
    };
    await saveAccount(account);
    if (accounts.length === 0) {
      await setActiveAccountId(account.id);
      setActiveId(account.id);
    }
    await loadData();
  };

  const handleSwitch = async (id: string) => {
    await setActiveAccountId(id);
    setActiveId(id);
    await refreshBalances();
    Alert.alert("Switched", "Active wallet changed");
  };

  const handleRename = async (id: string) => {
    if (!editName.trim()) return;
    await updateAccount(id, { name: editName.trim() });
    setEditingId(null);
    setEditName("");
    await loadData();
  };

  const handleDelete = (account: Account) => {
    if (account.id === activeId) {
      Alert.alert("Error", "Cannot delete active wallet");
      return;
    }
    Alert.alert("Delete Wallet", `Remove "${account.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await removeAccount(account.id);
          await loadData();
        },
      },
    ]);
  };

  const renderAccount = ({ item }: { item: Account }) => {
    const isActive = item.id === activeId;
    const isEditing = item.id === editingId;

    return (
      <View style={[styles.accountCard, isActive && styles.activeCard]}>
        <View style={styles.accountHeader}>
          {isEditing ? (
            <TextInput
              style={styles.nameInput}
              value={editName}
              onChangeText={setEditName}
              onSubmitEditing={() => handleRename(item.id)}
              autoFocus
            />
          ) : (
            <Text style={styles.accountName}>{item.name}</Text>
          )}
          {isActive && (
            <View style={styles.activeBadge}>
              <Text style={styles.badgeText}>Active</Text>
            </View>
          )}
        </View>
        <Text style={styles.address}>{`${item.address.slice(0, 12)}...${item.address.slice(-8)}`}</Text>
        <View style={styles.actions}>
          {!isActive && (
            <TouchableOpacity style={styles.actionBtn} onPress={() => handleSwitch(item.id)}>
              <Ionicons name="swap-horizontal" size={18} color="#00d4aa" />
              <Text style={styles.actionText}>Switch</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => {
              setEditingId(item.id);
              setEditName(item.name);
            }}
          >
            <Ionicons name="pencil" size={18} color="#888" />
            <Text style={styles.actionText}>Rename</Text>
          </TouchableOpacity>
          {!isActive && (
            <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item)}>
              <Ionicons name="trash" size={18} color="#ef4444" />
              <Text style={[styles.actionText, { color: "#ef4444" }]}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "Manage Wallets" }} />
      <FlatList
        data={accounts}
        keyExtractor={(item) => item.id}
        renderItem={renderAccount}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="wallet-outline" size={48} color="#666" />
            <Text style={styles.emptyText}>No wallets yet</Text>
          </View>
        }
      />
      <TouchableOpacity style={styles.createBtn} onPress={handleCreate}>
        <Ionicons name="add" size={24} color="#fff" />
        <Text style={styles.createText}>Create New Wallet</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  list: { padding: 24, paddingBottom: 100 },
  accountCard: {
    backgroundColor: "#fff",
    borderWidth: 4,
    borderColor: "#000",
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  activeCard: { backgroundColor: "#ffde59" },
  accountHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  accountName: { color: "#000", fontSize: 22, fontWeight: "900", textTransform: "uppercase", fontStyle: "italic" },
  nameInput: {
    flex: 1,
    color: "#000",
    fontSize: 20,
    backgroundColor: "#fff",
    borderWidth: 3,
    borderColor: "#000",
    padding: 10,
    fontWeight: "900"
  },
  activeBadge: {
    backgroundColor: "#000",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 2,
    borderColor: "#000",
    transform: [{ rotate: "2deg" }]
  },
  badgeText: { color: "#00E599", fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  address: {
    color: "#000",
    fontSize: 13,
    fontFamily: "monospace",
    fontWeight: "700",
    backgroundColor: "#f0f0f0",
    padding: 8,
    borderWidth: 2,
    borderColor: "#000"
  },
  actions: { flexDirection: "row", marginTop: 20, gap: 12 },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fff",
    borderWidth: 3,
    borderColor: "#000",
    paddingVertical: 8,
    paddingHorizontal: 12,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  actionText: { color: "#000", fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  empty: { alignItems: "center", marginTop: 100, padding: 40 },
  emptyText: { color: "#000", fontSize: 18, fontWeight: "900", textTransform: "uppercase", marginTop: 20, fontStyle: "italic" },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#00E599",
    margin: 16,
    padding: 24,
    borderWidth: 4,
    borderColor: "#000",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 16,
  },
  createText: { color: "#000", fontSize: 18, fontWeight: "900", textTransform: "uppercase" },
});
