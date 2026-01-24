/**
 * MiniAppScreen - Full screen MiniApp viewer
 * Handles navigation and wallet integration
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, StyleSheet, TouchableOpacity, Text, SafeAreaView, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { ChainId, MiniAppInfo } from "@/types/miniapp";
import { fetchMiniAppDetail } from "@/lib/api/miniapps";
import { coerceMiniAppInfo, getBuiltinApp } from "@/lib/miniapp";
import { MiniAppViewer } from "@/components/miniapp";
import { useWalletStore } from "@/stores/wallet";
import { SignMessageModal } from "@/components/SignMessageModal";
import { signMessage as signNeoMessage } from "@/lib/neo/signing";
import { consumeIntent, resolveIntent } from "@/lib/miniapp/intent-cache";
import { invokeIntentInvocation, invokeNeoContract } from "@/lib/neo/invocation";
import { resolveChainType } from "@/lib/chains";

interface SignRequest {
  appId: string;
  appName: string;
  message: string;
}

export default function MiniAppScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  // Get wallet state
  const { address, isLocked, requireAuthForTransaction, switchChain, chainId } = useWalletStore();

  const [app, setApp] = useState<MiniAppInfo | null>(null);
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [appError, setAppError] = useState<string | null>(null);
  const [signRequest, setSignRequest] = useState<SignRequest | null>(null);
  const pendingSignRef = useRef<{
    resolve: (value: unknown) => void;
    reject: (error: Error) => void;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadApp = async () => {
      const appId = String(id || "").trim();
      setAppError(null);

      if (!appId) {
        setApp(null);
        setIsAppLoading(false);
        return;
      }

      const builtin = getBuiltinApp(appId);
      if (builtin) {
        setApp(builtin);
        setIsAppLoading(false);
        return;
      }

      setIsAppLoading(true);
      try {
        const detail = await fetchMiniAppDetail(appId);
        const normalized = detail ? coerceMiniAppInfo(detail, detail) : null;
        if (cancelled) return;
        setApp(normalized);
        if (!normalized) {
          setAppError("MiniApp not found");
        }
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "Failed to load MiniApp";
        setAppError(message);
        setApp(null);
      } finally {
        if (!cancelled) {
          setIsAppLoading(false);
        }
      }
    };

    loadApp();

    return () => {
      cancelled = true;
    };
  }, [id]);

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

      const cached = consumeIntent(requestId);
      if (!cached) {
        throw new Error("Unknown intent request_id");
      }
      if (cached.result) {
        return { tx_hash: cached.result.tx_hash };
      }

      // Require biometric auth for transaction
      const authorized = await requireAuthForTransaction();
      if (!authorized) {
        throw new Error("Transaction cancelled by user");
      }

      const intent = cached.invocation!;
      const confirmed = await new Promise<boolean>((resolve) => {
        Alert.alert(
          "Confirm Transaction",
          `Contract: ${intent.contract_address}\nMethod: ${intent.method}`,
          [
            { text: "Cancel", onPress: () => resolve(false), style: "cancel" },
            { text: "Confirm", onPress: () => resolve(true) },
          ],
        );
      });

      if (!confirmed) {
        throw new Error("Transaction cancelled by user");
      }

      const result = await invokeIntentInvocation(intent);
      resolveIntent(requestId, { tx_hash: result.tx_hash, txid: result.txid || result.tx_hash });
      return { tx_hash: result.tx_hash };
    },
    [address, isLocked, requireAuthForTransaction],
  );

  const invokeFunction = useCallback(
    async (params: {
      contract?: string;
      contractHash?: string;
      method?: string;
      operation?: string;
      args?: unknown[];
      chainId?: ChainId;
      chainType?: string;
      to?: string;
    }) => {
      if (!address) {
        throw new Error("Wallet not connected");
      }
      if (isLocked) {
        throw new Error("Wallet is locked");
      }

      const authorized = await requireAuthForTransaction();
      if (!authorized) {
        throw new Error("Transaction cancelled by user");
      }

      const targetChainId = params.chainId || (params as { chain_id?: ChainId }).chain_id || chainId;
      if (!targetChainId) {
        throw new Error("chainId required");
      }
      const targetChainType = params.chainType || resolveChainType(targetChainId);
      if (targetChainType === "evm") {
        throw new Error("EVM transactions are not supported in the mobile wallet");
      }

      const contract = params.contract || params.contractHash || params.to;
      const method = params.method || params.operation;
      if (!contract || !method) {
        throw new Error("contract and method required");
      }

      const confirmed = await new Promise<boolean>((resolve) => {
        Alert.alert("Confirm Contract Call", `Contract: ${contract}\nMethod: ${method}`, [
          { text: "Cancel", onPress: () => resolve(false), style: "cancel" },
          { text: "Confirm", onPress: () => resolve(true) },
        ]);
      });
      if (!confirmed) {
        throw new Error("Transaction cancelled by user");
      }

      const result = await invokeNeoContract({
        chainId: targetChainId,
        contract: String(contract),
        method: String(method),
        args: params.args ?? (params as { params?: unknown[] }).params,
      });

      return { txid: result.txid || result.tx_hash, tx_hash: result.tx_hash };
    },
    [address, chainId, isLocked, requireAuthForTransaction],
  );

  const switchChainForMiniapp = useCallback(
    async (targetChainId: ChainId) => {
      if (!targetChainId || typeof targetChainId !== "string") {
        throw new Error("chainId required");
      }
      if (isLocked) {
        throw new Error("Wallet is locked");
      }
      if (chainId === targetChainId) return;
      const confirmed = await new Promise<boolean>((resolve) => {
        Alert.alert("Switch Network", `Allow miniapp to switch to ${targetChainId}?`, [
          { text: "Cancel", onPress: () => resolve(false), style: "cancel" },
          { text: "Switch", onPress: () => resolve(true) },
        ]);
      });
      if (!confirmed) {
        throw new Error("Network switch cancelled by user");
      }
      await switchChain(targetChainId);
    },
    [chainId, isLocked, switchChain],
  );

  const signMessageForMiniapp = useCallback(
    async (message: string) => {
      if (!app) throw new Error("MiniApp not found");
      if (!address) throw new Error("Wallet not connected");
      if (isLocked) throw new Error("Wallet is locked");
      if (pendingSignRef.current) {
        throw new Error("Another signing request is pending");
      }
      return new Promise((resolve, reject) => {
        pendingSignRef.current = { resolve, reject };
        setSignRequest({
          appId: app.app_id,
          appName: app.name || app.app_id,
          message,
        });
      });
    },
    [address, app, isLocked],
  );

  const handleSignApprove = useCallback(async () => {
    const pending = pendingSignRef.current;
    if (!pending || !signRequest) return;
    try {
      const authorized = await requireAuthForTransaction();
      if (!authorized) {
        throw new Error("Signing cancelled by user");
      }
      const signed = await signNeoMessage(signRequest.message);
      if (!signed) {
        throw new Error("Signing failed");
      }
      pending.resolve({
        publicKey: signed.publicKey,
        data: signed.signature.toLowerCase(),
        message: signed.message,
        messageHex: signed.messageHex,
        salt: signed.salt,
      });
    } catch (err) {
      pending.reject(err instanceof Error ? err : new Error("Signing failed"));
    } finally {
      pendingSignRef.current = null;
      setSignRequest(null);
    }
  }, [requireAuthForTransaction, signRequest]);

  const handleSignReject = useCallback(() => {
    if (pendingSignRef.current) {
      pendingSignRef.current.reject(new Error("Signing cancelled by user"));
    }
    pendingSignRef.current = null;
    setSignRequest(null);
  }, []);

  if (isAppLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Loading MiniApp...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!app) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{appError || "MiniApp not found"}</Text>
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
          chainId={chainId}
          getAddress={getAddress}
          invokeIntent={invokeIntent}
          invokeFunction={invokeFunction}
          switchChain={switchChainForMiniapp}
          signMessage={signMessageForMiniapp}
          onError={(err) => console.error("MiniApp error:", err)}
        />
      </View>
      <SignMessageModal
        visible={signRequest !== null}
        request={signRequest}
        onApprove={handleSignApprove}
        onReject={handleSignReject}
      />
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
