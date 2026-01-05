/**
 * MiniAppScreen - Full screen MiniApp viewer
 * Handles navigation and wallet integration
 */

import React, { useCallback } from "react";
import { View, StyleSheet, TouchableOpacity, Text, SafeAreaView, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { MiniAppInfo } from "@/types/miniapp";
import { getBuiltinApp, fetchIntent, submitTransaction } from "@/lib/miniapp";
import { MiniAppViewer } from "@/components/miniapp";
import { useWalletStore } from "@/stores/wallet";

export default function MiniAppScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  // Get wallet state
  const { address, isLocked, requireAuthForTransaction } = useWalletStore();

  // Get app from builtin registry
  const app = id ? getBuiltinApp(id) : null;

  // Wallet integration: get address
  const getAddress = useCallback(async (): Promise<string> => {
    if (!address) {
      throw new Error("Wallet not connected");
    }
    if (isLocked) {
      throw new Error("Wallet is locked");
    }
    return address;
  }, [address, isLocked]);

  // Wallet integration: invoke intent (sign and broadcast)
  const invokeIntent = useCallback(
    async (requestId: string): Promise<{ tx_hash: string }> => {
      if (!address) {
        throw new Error("Wallet not connected");
      }
      if (isLocked) {
        throw new Error("Wallet is locked");
      }

      // Require biometric auth for transaction
      const authorized = await requireAuthForTransaction();
      if (!authorized) {
        throw new Error("Transaction cancelled by user");
      }

      // Fetch intent details from backend
      const intent = await fetchIntent(requestId);

      // Show confirmation dialog
      const confirmed = await new Promise<boolean>((resolve) => {
        Alert.alert("Confirm Transaction", `Contract: ${intent.contract}\nMethod: ${intent.method}`, [
          { text: "Cancel", onPress: () => resolve(false), style: "cancel" },
          { text: "Confirm", onPress: () => resolve(true) },
        ]);
      });

      if (!confirmed) {
        throw new Error("Transaction cancelled by user");
      }

      // Submit transaction (signing handled by backend with user's session)
      const result = await submitTransaction(requestId, "");
      return { tx_hash: result.tx_hash };
    },
    [address, isLocked, requireAuthForTransaction],
  );

  if (!app) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>MiniApp not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {app.name}
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* MiniApp Content */}
      <View style={styles.content}>
        <MiniAppViewer
          app={app}
          getAddress={getAddress}
          invokeIntent={invokeIntent}
          onError={(err) => console.error("MiniApp error:", err)}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: {
    color: "#fff",
    fontSize: 18,
  },
  title: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginHorizontal: 8,
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    color: "#fff",
    fontSize: 18,
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: "#00E599",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: "#000",
    fontSize: 14,
    fontWeight: "600",
  },
});
