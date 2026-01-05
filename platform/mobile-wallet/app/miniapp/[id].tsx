import { useLocalSearchParams, Stack } from "expo-router";
import { WebView } from "react-native-webview";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { useState, useRef } from "react";
import { useWalletStore } from "@/stores/wallet";
import { PaymentModal } from "@/components/PaymentModal";
import { SignMessageModal } from "@/components/SignMessageModal";
import { signMessage } from "@/lib/neo/signing";

const MINIAPP_BASE_URL = "https://neomini.app";

interface PaymentRequest {
  appId: string;
  appName: string;
  amount: string;
  asset: "NEO" | "GAS";
  memo?: string;
}

interface SignRequest {
  appId: string;
  appName: string;
  message: string;
}

export default function MiniAppScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null);
  const [signRequest, setSignRequest] = useState<SignRequest | null>(null);
  const { address } = useWalletStore();

  const injectedJS = `
    window.NeoWallet = {
      getAddress: () => "${address || ""}",
      requestPayment: (params) => window.ReactNativeWebView.postMessage(JSON.stringify({type: "payment", ...params})),
      signMessage: (msg) => window.ReactNativeWebView.postMessage(JSON.stringify({type: "sign", message: msg})),
      getNetwork: () => "mainnet",
    };
    true;
  `;

  const handleMessage = (event: { nativeEvent: { data: string } }) => {
    const data = JSON.parse(event.nativeEvent.data);
    if (data.type === "payment") {
      setPaymentRequest({
        appId: id || "unknown",
        appName: data.appName || id || "MiniApp",
        amount: data.amount,
        asset: data.asset || "GAS",
        memo: data.memo,
      });
    } else if (data.type === "sign") {
      setSignRequest({
        appId: id || "unknown",
        appName: data.appName || id || "MiniApp",
        message: data.message,
      });
    }
  };

  const handleApprove = () => {
    webViewRef.current?.injectJavaScript(`window.NeoWallet.onPaymentResult({success: true}); true;`);
    setPaymentRequest(null);
  };

  const handleReject = () => {
    webViewRef.current?.injectJavaScript(
      `window.NeoWallet.onPaymentResult({success: false, error: "rejected"}); true;`,
    );
    setPaymentRequest(null);
  };

  const handleSignApprove = async () => {
    if (!signRequest) return;
    const result = await signMessage(signRequest.message);
    if (result) {
      webViewRef.current?.injectJavaScript(
        `window.NeoWallet.onSignResult(${JSON.stringify({ success: true, ...result })}); true;`,
      );
    } else {
      webViewRef.current?.injectJavaScript(
        `window.NeoWallet.onSignResult({success: false, error: "signing_failed"}); true;`,
      );
    }
    setSignRequest(null);
  };

  const handleSignReject = () => {
    webViewRef.current?.injectJavaScript(`window.NeoWallet.onSignResult({success: false, error: "rejected"}); true;`);
    setSignRequest(null);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: id || "MiniApp" }} />
      {loading && (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#00d4aa" />
        </View>
      )}
      <WebView
        ref={webViewRef}
        source={{ uri: `${MINIAPP_BASE_URL}/${id}/index.html` }}
        style={styles.webview}
        injectedJavaScript={injectedJS}
        onMessage={handleMessage}
        onLoadEnd={() => setLoading(false)}
      />
      <PaymentModal
        visible={paymentRequest !== null}
        request={paymentRequest}
        onApprove={handleApprove}
        onReject={handleReject}
      />
      <SignMessageModal
        visible={signRequest !== null}
        request={signRequest}
        onApprove={handleSignApprove}
        onReject={handleSignReject}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  webview: { flex: 1 },
  loader: { ...StyleSheet.absoluteFillObject, justifyContent: "center", alignItems: "center" },
});
