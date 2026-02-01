import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { getNFTById, NFT, isValidTokenId, transferNFT } from "@/lib/nft";
import { isValidNeoAddress } from "@/lib/qrcode";
import { useWalletStore } from "@/stores/wallet";

export default function NFTSendScreen() {
  const router = useRouter();
  const { tokenId } = useLocalSearchParams<{ tokenId: string }>();
  const { requireAuthForTransaction } = useWalletStore();
  const [nft, setNft] = useState<NFT | null>(null);
  const [recipient, setRecipient] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (tokenId && isValidTokenId(tokenId)) {
      getNFTById(tokenId).then((data) => setNft(data || null));
    }
  }, [tokenId]);

  const handleSend = async () => {
    if (!recipient.trim()) {
      Alert.alert("Error", "Please enter recipient address");
      return;
    }
    if (!isValidNeoAddress(recipient.trim())) {
      Alert.alert("Error", "Invalid Neo N3 address");
      return;
    }
    if (!nft || !tokenId) {
      Alert.alert("Error", "NFT not found");
      return;
    }

    const authorized = await requireAuthForTransaction();
    if (!authorized) return;

    setSending(true);
    try {
      const txHash = await transferNFT(nft.contractAddress, tokenId, recipient.trim());
      Alert.alert("Success", `NFT sent!\nTx: ${txHash.slice(0, 16)}...`);
      router.back();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Transfer failed";
      Alert.alert("Error", message);
    } finally {
      setSending(false);
    }
  };

  if (!nft) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: "Transfer NFT" }} />
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "Transfer NFT" }} />
      <View style={styles.content}>
        <View style={styles.nftPreview}>
          <Image source={{ uri: nft.metadata.image }} style={styles.nftImage} />
          <Text style={styles.nftName}>{nft.metadata.name}</Text>
        </View>

        <Text style={styles.label}>Recipient Address</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={recipient}
            onChangeText={setRecipient}
            placeholder="N..."
            placeholderTextColor="#666"
            autoCapitalize="none"
          />
          <TouchableOpacity style={styles.scanBtn} onPress={() => router.push("/scanner")}>
            <Ionicons name="scan" size={24} color="#00d4aa" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.sendBtn, sending && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={sending}
        >
          <Ionicons name="send" size={20} color="#000" />
          <Text style={styles.sendText}>{sending ? "Sending..." : "Send NFT"}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { color: "#666", fontSize: 16 },
  content: { padding: 20 },
  nftPreview: { alignItems: "center", marginBottom: 32 },
  nftImage: { width: 120, height: 120, borderRadius: 12, backgroundColor: "#1a1a1a" },
  nftName: { color: "#fff", fontSize: 16, fontWeight: "600", marginTop: 12 },
  label: { color: "#888", fontSize: 12, marginBottom: 8 },
  inputRow: { flexDirection: "row", gap: 8 },
  input: { flex: 1, backgroundColor: "#1a1a1a", color: "#fff", padding: 16, borderRadius: 12, fontSize: 16 },
  scanBtn: { backgroundColor: "#1a1a1a", padding: 16, borderRadius: 12, justifyContent: "center" },
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
  sendBtnDisabled: { opacity: 0.5 },
  sendText: { color: "#000", fontSize: 16, fontWeight: "600" },
});
