import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { loadCachedNFTs, NFT } from "@/lib/nft";

export default function NFTGalleryScreen() {
  const router = useRouter();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadCachedNFTs().then((data) => {
        setNfts(data);
        setLoading(false);
      });
    }, []),
  );

  const renderNFT = ({ item }: { item: NFT }) => (
    <TouchableOpacity style={styles.nftCard} onPress={() => router.push(`/nft/${item.tokenId}`)}>
      <Image source={{ uri: item.metadata.image }} style={styles.nftImage} />
      <Text style={styles.nftName} numberOfLines={1}>
        {item.metadata.name}
      </Text>
      <Text style={styles.nftCollection} numberOfLines={1}>
        {item.collectionName}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "My NFTs" }} />
      {nfts.length === 0 && !loading ? (
        <View style={styles.empty}>
          <Ionicons name="images-outline" size={64} color="#333" />
          <Text style={styles.emptyText}>No NFTs yet</Text>
        </View>
      ) : (
        <FlatList
          data={nfts}
          keyExtractor={(item) => item.tokenId}
          renderItem={renderNFT}
          numColumns={2}
          contentContainerStyle={styles.grid}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  grid: { padding: 8 },
  nftCard: {
    flex: 1,
    margin: 8,
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    overflow: "hidden",
  },
  nftImage: { width: "100%", aspectRatio: 1, backgroundColor: "#333" },
  nftName: { color: "#fff", fontSize: 14, fontWeight: "600", padding: 8, paddingBottom: 2 },
  nftCollection: { color: "#888", fontSize: 12, paddingHorizontal: 8, paddingBottom: 8 },
  empty: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { color: "#666", fontSize: 16, marginTop: 16 },
});
