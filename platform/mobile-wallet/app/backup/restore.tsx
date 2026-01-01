import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { validateMnemonic, restoreWalletFromMnemonic } from "@/lib/backup";
import { useWalletStore } from "@/stores/wallet";

export default function RestoreScreen() {
  const router = useRouter();
  const { setAddress } = useWalletStore();
  const [mnemonic, setMnemonic] = useState("");
  const [password, setPassword] = useState("");
  const [restoring, setRestoring] = useState(false);

  const handleRestore = async () => {
    if (!validateMnemonic(mnemonic)) {
      Alert.alert("Invalid", "Please enter a valid 12 or 24 word mnemonic");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Invalid", "Password must be at least 6 characters");
      return;
    }

    setRestoring(true);
    try {
      const wallet = await restoreWalletFromMnemonic(mnemonic.trim(), password);
      setAddress(wallet.address);
      Alert.alert("Success", "Wallet restored successfully", [{ text: "OK", onPress: () => router.replace("/") }]);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to restore wallet";
      Alert.alert("Error", message);
    } finally {
      setRestoring(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "Restore Wallet" }} />
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="refresh-circle" size={48} color="#f5a623" />
        </View>
        <Text style={styles.title}>Restore Your Wallet</Text>
        <Text style={styles.desc}>Enter your recovery phrase and set a new password</Text>

        <Text style={styles.label}>Recovery Phrase</Text>
        <TextInput
          style={styles.mnemonicInput}
          value={mnemonic}
          onChangeText={setMnemonic}
          placeholder="Enter 12 or 24 words..."
          placeholderTextColor="#666"
          multiline
          numberOfLines={3}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={styles.label}>New Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Min 6 characters"
          placeholderTextColor="#666"
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.btn, restoring && styles.btnDisabled]}
          onPress={handleRestore}
          disabled={restoring}
        >
          <Text style={styles.btnText}>{restoring ? "Restoring..." : "Restore Wallet"}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  content: { flex: 1, padding: 20 },
  iconWrap: { alignItems: "center", marginTop: 10 },
  title: { color: "#fff", fontSize: 22, fontWeight: "bold", textAlign: "center", marginTop: 12 },
  desc: { color: "#888", fontSize: 14, textAlign: "center", marginTop: 8, marginBottom: 20 },
  label: { color: "#888", fontSize: 12, marginBottom: 6, marginTop: 12 },
  mnemonicInput: {
    backgroundColor: "#1a1a1a",
    color: "#fff",
    padding: 14,
    borderRadius: 12,
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: "top",
  },
  input: { backgroundColor: "#1a1a1a", color: "#fff", padding: 14, borderRadius: 12, fontSize: 16 },
  btn: { backgroundColor: "#f5a623", padding: 16, borderRadius: 12, alignItems: "center", marginTop: 24 },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: "#000", fontSize: 18, fontWeight: "600" },
});
