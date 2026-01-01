import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import { saveContact, isValidNeoAddress } from "@/lib/addressbook";

export default function AddContactScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [memo, setMemo] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter a name");
      return;
    }
    if (!address.trim()) {
      Alert.alert("Error", "Please enter an address");
      return;
    }
    if (!isValidNeoAddress(address.trim())) {
      Alert.alert("Error", "Invalid Neo N3 address");
      return;
    }

    setSaving(true);
    try {
      await saveContact({
        name: name.trim(),
        address: address.trim(),
        memo: memo.trim() || undefined,
      });
      router.back();
    } catch {
      Alert.alert("Error", "Failed to save contact");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "Add Contact" }} />
      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Contact name"
            placeholderTextColor="#666"
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Address</Text>
          <TextInput
            style={styles.input}
            value={address}
            onChangeText={setAddress}
            placeholder="Neo N3 address (starts with N)"
            placeholderTextColor="#666"
            autoCapitalize="none"
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Memo (optional)</Text>
          <TextInput
            style={[styles.input, styles.memoInput]}
            value={memo}
            onChangeText={setMemo}
            placeholder="Add a note"
            placeholderTextColor="#666"
            multiline
          />
        </View>
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>{saving ? "Saving..." : "Save Contact"}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  form: { padding: 16 },
  field: { marginBottom: 20 },
  label: { color: "#888", fontSize: 14, marginBottom: 8 },
  input: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    color: "#fff",
    fontSize: 16,
  },
  memoInput: { height: 100, textAlignVertical: "top" },
  saveBtn: {
    backgroundColor: "#00d4aa",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: "#000", fontSize: 16, fontWeight: "600" },
});
