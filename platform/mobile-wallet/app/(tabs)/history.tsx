import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { useState, useEffect, useCallback } from "react";
import { useWalletStore } from "@/stores/wallet";
import { fetchTransactions, Transaction } from "@/lib/api/transactions";
import { TransactionItem } from "@/components/TransactionItem";
import { useTranslation } from "@/hooks/useTranslation";

export default function HistoryScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { address } = useWalletStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadTransactions = useCallback(
    async (pageNum = 1, refresh = false) => {
      if (!address) return;

      if (refresh) setRefreshing(true);
      else if (pageNum === 1) setLoading(true);

      const data = await fetchTransactions(address, pageNum);

      if (refresh || pageNum === 1) {
        setTransactions(data.transactions);
      } else {
        setTransactions((prev) => [...prev, ...data.transactions]);
      }

      setHasMore(data.transactions.length === 20);
      setPage(pageNum);
      setLoading(false);
      setRefreshing(false);
    },
    [address],
  );

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const handleRefresh = () => loadTransactions(1, true);
  const handleLoadMore = () => {
    if (hasMore && !loading) loadTransactions(page + 1);
  };

  const navigateToDetail = (tx: Transaction) => {
    router.push({
      pathname: "/transaction/[id]",
      params: {
        id: tx.hash,
        type: tx.type,
        amount: tx.amount,
        asset: tx.asset,
        from: tx.from,
        to: tx.to,
        time: tx.time.toString(),
        block: tx.block.toString(),
        status: tx.status,
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: t("wallet.history_title") }} />

      {loading && transactions.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#00d4aa" />
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.hash}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#00d4aa" />}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          renderItem={({ item }) => <TransactionItem tx={item} onPress={() => navigateToDetail(item)} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.empty}>{t("wallet.history_empty")}</Text>
            </View>
          }
          ListFooterComponent={
            hasMore && transactions.length > 0 ? <ActivityIndicator style={styles.footer} color="#00d4aa" /> : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  list: { padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: { color: "#888", fontSize: 16 },
  footer: { padding: 16 },
});
