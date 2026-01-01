import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { useState, useEffect, useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { loadTokens, removeToken, Token } from "@/lib/tokens";
import { useWalletStore } from "@/stores/wallet";

export default function TokensScreen() {
  const router = useRouter();
  const { deleteToken } = useWalletStore();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTokenList();
  }, []);

  const loadTokenList = async () => {
    setIsLoading(true);
    const list = await loadTokens();
    setTokens(list);
    setIsLoading(false);
  };

  const filteredTokens = useMemo(() => {
    if (!searchQuery.trim()) return tokens;
    const query = searchQuery.toLowerCase();
    return tokens.filter(
      (t) =>
        t.symbol.toLowerCase().includes(query) ||
        t.name.toLowerCase().includes(query) ||
        t.contractHash.toLowerCase().includes(query),
    );
  }, [tokens, searchQuery]);

  const handleDelete = (token: Token) => {
    Alert.alert("Delete Token", `Remove ${token.symbol} from your wallet?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteToken(token.contractHash);
          setTokens((prev) => prev.filter((t) => t.contractHash !== token.contractHash));
          setSelectedToken(null);
        },
      },
    ]);
  };

  const renderToken = ({ item }: { item: Token }) => (
    <TouchableOpacity style={styles.tokenItem} onPress={() => setSelectedToken(item)}>
      <View style={styles.tokenIcon}>
        <Text style={styles.tokenEmoji}>🪙</Text>
      </View>
      <View style={styles.tokenInfo}>
        <Text style={styles.tokenSymbol}>{item.symbol}</Text>
        <Text style={styles.tokenName}>{item.name}</Text>
      </View>
      <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
        <Ionicons name="trash-outline" size={20} color="#ef4444" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "Manage Tokens" }} />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, symbol or contract"
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {/* Token List */}
      {isLoading ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Loading...</Text>
        </View>
      ) : filteredTokens.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="wallet-outline" size={48} color="#666" />
          <Text style={styles.emptyText}>{searchQuery ? "No tokens match your search" : "No custom tokens added"}</Text>
          {!searchQuery && (
            <TouchableOpacity style={styles.addBtn} onPress={() => router.push("/add-token")}>
              <Text style={styles.addBtnText}>Add Token</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredTokens}
          keyExtractor={(item) => item.contractHash}
          renderItem={renderToken}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Add Button */}
      <TouchableOpacity style={styles.fab} onPress={() => router.push("/add-token")}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Token Detail Modal */}
      <TokenDetailModal token={selectedToken} onClose={() => setSelectedToken(null)} onDelete={handleDelete} />
    </SafeAreaView>
  );
}

interface TokenDetailModalProps {
  token: Token | null;
  onClose: () => void;
  onDelete: (token: Token) => void;
}

function TokenDetailModal({ token, onClose, onDelete }: TokenDetailModalProps) {
  if (!token) return null;

  return (
    <Modal visible={!!token} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Token Details</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Symbol</Text>
              <Text style={styles.detailValue}>{token.symbol}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Name</Text>
              <Text style={styles.detailValue}>{token.name}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Decimals</Text>
              <Text style={styles.detailValue}>{token.decimals}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Contract</Text>
              <Text style={styles.detailValueSmall} selectable>
                {token.contractHash}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.deleteModalBtn} onPress={() => onDelete(token)}>
            <Ionicons name="trash" size={20} color="#fff" />
            <Text style={styles.deleteModalText}>Remove Token</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: "#fff", fontSize: 16, paddingVertical: 12 },
  listContent: { paddingHorizontal: 16 },
  tokenItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  tokenIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2a2a2a",
    justifyContent: "center",
    alignItems: "center",
  },
  tokenEmoji: { fontSize: 20 },
  tokenInfo: { flex: 1, marginLeft: 12 },
  tokenSymbol: { color: "#fff", fontSize: 16, fontWeight: "600" },
  tokenName: { color: "#888", fontSize: 14, marginTop: 2 },
  deleteBtn: { padding: 8 },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { color: "#888", fontSize: 16, marginTop: 12 },
  addBtn: {
    marginTop: 16,
    backgroundColor: "#00d4aa",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addBtnText: { color: "#fff", fontWeight: "600" },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#00d4aa",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#1a1a1a",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  modalBody: { marginBottom: 24 },
  detailRow: { marginBottom: 16 },
  detailLabel: { color: "#888", fontSize: 14, marginBottom: 4 },
  detailValue: { color: "#fff", fontSize: 16 },
  detailValueSmall: { color: "#fff", fontSize: 12, fontFamily: "monospace" },
  deleteModalBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ef4444",
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  deleteModalText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
