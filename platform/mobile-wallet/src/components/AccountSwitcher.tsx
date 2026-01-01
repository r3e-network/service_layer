import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList } from "react-native";
import { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { loadAccounts, getActiveAccountId, setActiveAccountId, Account } from "@/lib/accounts";

interface AccountSwitcherProps {
  onSwitch?: () => void;
}

export function AccountSwitcher({ onSwitch }: AccountSwitcherProps) {
  const [visible, setVisible] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [visible]);

  const loadData = async () => {
    const [accs, active] = await Promise.all([loadAccounts(), getActiveAccountId()]);
    setAccounts(accs);
    setActiveId(active);
  };

  const handleSelect = async (id: string) => {
    await setActiveAccountId(id);
    setActiveId(id);
    setVisible(false);
    onSwitch?.();
  };

  const activeAccount = accounts.find((a) => a.id === activeId);

  return (
    <>
      <TouchableOpacity style={styles.trigger} onPress={() => setVisible(true)}>
        <Ionicons name="wallet" size={20} color="#00d4aa" />
        <Text style={styles.triggerText} numberOfLines={1}>
          {activeAccount?.name || "Select Wallet"}
        </Text>
        <Ionicons name="chevron-down" size={16} color="#888" />
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setVisible(false)}>
          <View style={styles.dropdown}>
            <Text style={styles.title}>Switch Wallet</Text>
            <FlatList
              data={accounts}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.item, item.id === activeId && styles.activeItem]}
                  onPress={() => handleSelect(item.id)}
                >
                  <View>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemAddress}>{`${item.address.slice(0, 8)}...${item.address.slice(-6)}`}</Text>
                  </View>
                  {item.id === activeId && <Ionicons name="checkmark-circle" size={20} color="#00d4aa" />}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 8,
    backgroundColor: "#1a1a1a",
    borderRadius: 8,
  },
  triggerText: { color: "#fff", fontSize: 14, maxWidth: 120 },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", padding: 20 },
  dropdown: { backgroundColor: "#1a1a1a", borderRadius: 12, padding: 16, maxHeight: 300 },
  title: { color: "#fff", fontSize: 18, fontWeight: "600", marginBottom: 12 },
  item: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 12, borderRadius: 8 },
  activeItem: { backgroundColor: "#00d4aa20" },
  itemName: { color: "#fff", fontSize: 16 },
  itemAddress: { color: "#888", fontSize: 12, marginTop: 2 },
});
