import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { useState, useEffect, useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { loadTokens, removeToken, Token } from "@/lib/tokens";
import { useWalletStore } from "@/stores/wallet";
import { useTranslation } from "@/hooks/useTranslation";

export default function TokensScreen() {
  const router = useRouter();
  const { t } = useTranslation();
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
        t.contractAddress.toLowerCase().includes(query),
    );
  }, [tokens, searchQuery]);

  const handleDelete = (token: Token) => {
    Alert.alert(t("tokens.delete_title"), t("tokens.delete_confirm").replace("{{symbol}}", token.symbol), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: async () => {
          await deleteToken(token.contractAddress);
          setTokens((prev) => prev.filter((t) => t.contractAddress !== token.contractAddress));
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
      <Stack.Screen options={{ title: t("tokens.manage") }} />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={t("tokens.search_placeholder")}
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
          <Text style={styles.emptyText}>{t("tokens.loading")}</Text>
        </View>
      ) : filteredTokens.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="wallet-outline" size={48} color="#666" />
          <Text style={styles.emptyText}>{searchQuery ? t("tokens.no_match") : t("tokens.no_custom")}</Text>
          {!searchQuery && (
            <TouchableOpacity style={styles.addBtn} onPress={() => router.push("/add-token")}>
              <Text style={styles.addBtnText}>{t("tokens.add")}</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredTokens}
          keyExtractor={(item) => item.contractAddress}
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
  const { t } = useTranslation();
  if (!token) return null;

  return (
    <Modal visible={!!token} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t("tokens.details")}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t("tokens.symbol")}</Text>
              <Text style={styles.detailValue}>{token.symbol}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t("tokens.name")}</Text>
              <Text style={styles.detailValue}>{token.name}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t("tokens.decimals")}</Text>
              <Text style={styles.detailValue}>{token.decimals}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t("tokens.contract")}</Text>
              <Text style={styles.detailValueSmall} selectable>
                {token.contractAddress}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.deleteModalBtn} onPress={() => onDelete(token)}>
            <Ionicons name="trash" size={20} color="#fff" />
            <Text style={styles.deleteModalText}>{t("tokens.remove")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    margin: 16,
    paddingHorizontal: 16,
    borderWidth: 3,
    borderColor: "#000",
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  searchIcon: { marginRight: 12 },
  searchInput: { flex: 1, color: "#000", fontSize: 16, paddingVertical: 16, fontWeight: "bold" },
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },
  tokenItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderWidth: 3,
    borderColor: "#000",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  tokenIcon: {
    width: 48,
    height: 48,
    backgroundColor: "#00E599",
    borderWidth: 2,
    borderColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  tokenEmoji: { fontSize: 24 },
  tokenInfo: { flex: 1, marginLeft: 16 },
  tokenSymbol: { color: "#000", fontSize: 18, fontWeight: "900", textTransform: "uppercase" },
  tokenName: { color: "#666", fontSize: 12, marginTop: 2, fontWeight: "800", textTransform: "uppercase" },
  deleteBtn: { padding: 12, backgroundColor: "#ffde59", borderWidth: 2, borderColor: "#000" },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
  emptyText: { color: "#000", fontSize: 18, marginTop: 16, textAlign: "center", fontWeight: "900", textTransform: "uppercase", fontStyle: "italic" },
  addBtn: {
    marginTop: 24,
    backgroundColor: "#00E599",
    paddingHorizontal: 32,
    paddingVertical: 18,
    borderWidth: 3,
    borderColor: "#000",
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  addBtnText: { color: "#000", fontWeight: "900", textTransform: "uppercase", fontSize: 16 },
  fab: {
    position: "absolute",
    bottom: 32,
    right: 32,
    width: 64,
    height: 64,
    backgroundColor: "#00E599",
    borderWidth: 4,
    borderColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopWidth: 6,
    borderTopColor: "#000",
    padding: 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 32,
    borderBottomWidth: 4,
    borderBottomColor: "#000",
    paddingBottom: 16,
  },
  modalTitle: { color: "#000", fontSize: 24, fontWeight: "900", textTransform: "uppercase", fontStyle: "italic" },
  modalBody: { marginBottom: 32 },
  detailRow: { marginBottom: 20 },
  detailLabel: { color: "#666", fontSize: 12, marginBottom: 4, fontWeight: "900", textTransform: "uppercase" },
  detailValue: { color: "#000", fontSize: 18, fontWeight: "900" },
  detailValueSmall: { color: "#000", fontSize: 13, fontWeight: "700" },
  deleteModalBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ff7e7e",
    padding: 20,
    borderWidth: 3,
    borderColor: "#000",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  deleteModalText: { color: "#000", fontSize: 18, fontWeight: "900", textTransform: "uppercase" },
});
