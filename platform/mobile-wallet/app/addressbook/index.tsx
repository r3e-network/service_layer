import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { useState, useEffect, useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { loadContacts, removeContact, Contact } from "@/lib/addressbook";

export default function AddressBookScreen() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchContacts = async () => {
    setLoading(true);
    const data = await loadContacts();
    setContacts(data.sort((a, b) => b.updatedAt - a.updatedAt));
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchContacts();
    }, []),
  );

  const handleDelete = (contact: Contact) => {
    Alert.alert("Delete Contact", `Remove "${contact.name}" from address book?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await removeContact(contact.id);
          fetchContacts();
        },
      },
    ]);
  };

  const renderContact = ({ item }: { item: Contact }) => (
    <TouchableOpacity style={styles.contactItem} onPress={() => router.push(`/addressbook/edit?id=${item.id}`)}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{item.name}</Text>
        <Text style={styles.contactAddress} numberOfLines={1}>
          {item.address}
        </Text>
        {item.memo && (
          <Text style={styles.contactMemo} numberOfLines={1}>
            {item.memo}
          </Text>
        )}
      </View>
      <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteBtn}>
        <Ionicons name="trash-outline" size={20} color="#ef4444" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: "Address Book",
          headerRight: () => (
            <TouchableOpacity onPress={() => router.push("/addressbook/add")}>
              <Ionicons name="add" size={28} color="#00d4aa" />
            </TouchableOpacity>
          ),
        }}
      />
      {contacts.length === 0 && !loading ? (
        <View style={styles.empty}>
          <Ionicons name="people-outline" size={64} color="#333" />
          <Text style={styles.emptyText}>No contacts yet</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => router.push("/addressbook/add")}>
            <Text style={styles.addBtnText}>Add Contact</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={contacts}
          keyExtractor={(item) => item.id}
          renderItem={renderContact}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  list: { padding: 16 },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#00d4aa",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { color: "#000", fontSize: 18, fontWeight: "bold" },
  contactInfo: { flex: 1, marginLeft: 12 },
  contactName: { color: "#fff", fontSize: 16, fontWeight: "600" },
  contactAddress: { color: "#888", fontSize: 12, marginTop: 2 },
  contactMemo: { color: "#666", fontSize: 12, marginTop: 2, fontStyle: "italic" },
  deleteBtn: { padding: 8 },
  empty: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { color: "#666", fontSize: 16, marginTop: 16 },
  addBtn: {
    marginTop: 24,
    backgroundColor: "#00d4aa",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addBtnText: { color: "#000", fontSize: 16, fontWeight: "600" },
});
