import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { getNFTById, NFT } from "@/lib/nft";

export default function NFTDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [nft, setNft] = useState<NFT | null>(null);

  useEffect(() => {
    if (id) {
      getNFTById(id).then((data) => setNft(data || null));
    }
  }, [id]);

  if (!nft) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: "NFT Details" }} />
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: nft.metadata.name }} />
      <ScrollView>
        <Image source={{ uri: nft.metadata.image }} style={styles.image} />

        <View style={styles.info}>
          <Text style={styles.name}>{nft.metadata.name}</Text>
          <Text style={styles.collection}>{nft.collectionName}</Text>

          {nft.metadata.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{nft.metadata.description}</Text>
            </View>
          )}

          {nft.metadata.attributes && nft.metadata.attributes.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Attributes</Text>
              <View style={styles.attributes}>
                {nft.metadata.attributes.map((attr, i) => (
                  <View key={i} style={styles.attrCard}>
                    <Text style={styles.attrType}>{attr.trait_type}</Text>
                    <Text style={styles.attrValue}>{attr.value}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <TouchableOpacity style={styles.sendBtn} onPress={() => router.push(`/nft/send?tokenId=${nft.tokenId}`)}>
            <Ionicons name="send" size={20} color="#000" />
            <Text style={styles.sendText}>Transfer NFT</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { color: "#666", fontSize: 16 },
  image: { width: "100%", aspectRatio: 1, backgroundColor: "#1a1a1a" },
  info: { padding: 20 },
  name: { color: "#fff", fontSize: 24, fontWeight: "bold" },
  collection: { color: "#00d4aa", fontSize: 14, marginTop: 4 },
  section: { marginTop: 24 },
  sectionTitle: { color: "#888", fontSize: 12, marginBottom: 8 },
  description: { color: "#fff", fontSize: 14, lineHeight: 20 },
  attributes: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  attrCard: { backgroundColor: "#1a1a1a", padding: 12, borderRadius: 8, minWidth: 100 },
  attrType: { color: "#888", fontSize: 10, textTransform: "uppercase" },
  attrValue: { color: "#fff", fontSize: 14, fontWeight: "600", marginTop: 4 },
  sendBtn: {
    flexDirection: "row",
    backgroundColor: "#00d4aa",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 32,
  },
  sendText: { color: "#000", fontSize: 16, fontWeight: "600" },
});
