import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { validateMnemonic, saveBackupMetadata, generateBackupId, BackupType } from "@/lib/backup";
import { useTranslation } from "@/hooks/useTranslation";

export default function VerifyMnemonicScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { type } = useLocalSearchParams<{ type: BackupType }>();
  const [mnemonic, setMnemonic] = useState("");
  const [verifying, setVerifying] = useState(false);

  const handleVerify = async () => {
    if (!validateMnemonic(mnemonic)) {
      Alert.alert(t("backup.invalidMnemonicTitle"), t("backup.invalidMnemonicMessage"));
      return;
    }

    setVerifying(true);
    try {
      const backupId = await generateBackupId();
      await saveBackupMetadata({
        id: backupId,
        type: type || "local",
        timestamp: Date.now(),
        walletCount: 1,
        encrypted: true,
      });
      Alert.alert(t("common.success"), t("backup.backupSuccessMessage"), [
        { text: t("common.ok"), onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert(t("common.error"), t("backup.backupErrorMessage"));
    } finally {
      setVerifying(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: t("backup.verifyTitle") }} />
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="shield-checkmark" size={48} color="#00d4aa" />
        </View>
        <Text style={styles.title}>{t("backup.verifyHeading")}</Text>
        <Text style={styles.desc}>{t("backup.verifyDesc")}</Text>

        <TextInput
          style={styles.input}
          value={mnemonic}
          onChangeText={setMnemonic}
          placeholder={t("backup.mnemonicPlaceholder")}
          placeholderTextColor="#666"
          multiline
          numberOfLines={4}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TouchableOpacity
          style={[styles.btn, verifying && styles.btnDisabled]}
          onPress={handleVerify}
          disabled={verifying}
        >
          <Text style={styles.btnText}>{verifying ? t("backup.verifying") : t("backup.verifyButton")}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  content: { flex: 1, padding: 20 },
  iconWrap: { alignItems: "center", marginTop: 20 },
  title: { color: "#fff", fontSize: 22, fontWeight: "bold", textAlign: "center", marginTop: 16 },
  desc: { color: "#888", fontSize: 14, textAlign: "center", marginTop: 8, marginBottom: 24 },
  input: {
    backgroundColor: "#1a1a1a",
    color: "#fff",
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: "top",
  },
  btn: {
    backgroundColor: "#00d4aa",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 24,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: "#000", fontSize: 18, fontWeight: "600" },
});
