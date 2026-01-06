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
        <Ionicons name="wallet" size={20} color="#000" />
        <Text style={styles.triggerText} numberOfLines={1}>
          {activeAccount?.name || "SELECT WALLET"}
        </Text>
        <Ionicons name="chevron-down" size={16} color="#000" />
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setVisible(false)}>
          <View style={styles.dropdown}>
            <Text style={styles.title}>SWITCH WALLET</Text>
            <FlatList
              data={accounts}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.item, item.id === activeId && styles.activeItem]}
                  onPress={() => handleSelect(item.id)}
                >
                  <View>
                    <Text style={[styles.itemName, item.id === activeId && styles.activeText]}>{item.name}</Text>
                    <Text style={[styles.itemAddress, item.id === activeId && styles.activeText]}>
                      {`${item.address.slice(0, 8)}...${item.address.slice(-6)}`}
                    </Text>
                  </View>
                  {item.id === activeId && <Ionicons name="checkmark-circle" size={24} color="#000" />}
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
    gap: 8,
    padding: 12,
    backgroundColor: "#00E599", // Neo Green
    borderWidth: 3,
    borderColor: "#000",
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  triggerText: { color: "#000", fontSize: 14, fontWeight: "900", textTransform: "uppercase", maxWidth: 120 },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.9)", justifyContent: "center", padding: 20 },
  dropdown: { backgroundColor: "#ffffff", borderWidth: 4, borderColor: "#000", padding: 20, maxHeight: 400, shadowColor: "#fff", shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0 },
  title: { color: "#000", fontSize: 24, fontWeight: "900", textTransform: "uppercase", marginBottom: 20, textAlign: "center", backgroundColor: "#FFDE59", padding: 8, borderWidth: 3, borderColor: "#000", shadowColor: "#000", shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0 },
  item: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderWidth: 3, borderColor: "#000", marginBottom: 12, backgroundColor: "#fff" },
  activeItem: { backgroundColor: "#00E599", transform: [{ translateX: -4 }, { translateY: -4 }], shadowColor: "#000", shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0 },
  itemName: { color: "#000", fontSize: 16, fontWeight: "900", textTransform: "uppercase" },
  activeText: { color: "#000" },
  itemAddress: { color: "#000", fontSize: 12, marginTop: 4, fontWeight: "700", fontFamily: "monospace" },
});
