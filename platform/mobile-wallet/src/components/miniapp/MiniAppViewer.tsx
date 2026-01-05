/**
 * MiniAppViewer - Main component for rendering MiniApps
 * Uses WebView with SDK bridge for communication
 */

import React, { useRef, useState, useCallback, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import type { MiniAppInfo } from "@/types/miniapp";
import { MiniAppLoader } from "./MiniAppLoader";
import { createMiniAppSDK, dispatchBridgeCall, buildMiniAppEntryUrl } from "@/lib/miniapp";
import type { BridgeConfig, BridgeMessage } from "@/lib/miniapp";

interface MiniAppViewerProps {
  app: MiniAppInfo;
  locale?: string;
  theme?: "light" | "dark";
  getAddress: () => Promise<string>;
  invokeIntent: (requestId: string) => Promise<{ tx_hash: string }>;
  onReady?: () => void;
  onError?: (error: Error) => void;
}

const EDGE_BASE_URL = "https://neomini.app/functions/v1";

// Base URL for MiniApp static assets
const MINIAPP_BASE_URL = "https://neomini.app";

/**
 * JavaScript to inject into WebView for SDK bridge
 */
const INJECTED_JS = `
(function() {
  if (window.MiniAppSDK) return;

  const pending = new Map();
  let reqId = 0;

  function request(method, params) {
    return new Promise((resolve, reject) => {
      const id = String(++reqId);
      pending.set(id, { resolve, reject });
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'neo_miniapp_sdk_request',
        id,
        method,
        params: params || []
      }));
      setTimeout(() => {
        if (pending.has(id)) {
          pending.delete(id);
          reject(new Error('Request timeout'));
        }
      }, 30000);
    });
  }

  window.MiniAppSDK = {
    wallet: {
      getAddress: () => request('wallet.getAddress'),
      invokeIntent: (requestId) => request('wallet.invokeIntent', [requestId])
    },
    payments: {
      payGAS: (appId, amount, memo) => request('payments.payGAS', [appId, amount, memo])
    },
    governance: {
      vote: (appId, proposalId, neoAmount, support) =>
        request('governance.vote', [appId, proposalId, neoAmount, support])
    },
    rng: {
      requestRandom: (appId) => request('rng.requestRandom', [appId])
    },
    datafeed: {
      getPrice: (symbol) => request('datafeed.getPrice', [symbol])
    },
    stats: {
      getMyUsage: (appId, date) => request('stats.getMyUsage', [appId, date])
    },
    events: {
      list: (params) => request('events.list', [params])
    },
    transactions: {
      list: (params) => request('transactions.list', [params])
    }
  };

  window.addEventListener('message', function(e) {
    try {
      const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
      if (data.type === 'neo_miniapp_sdk_response' && data.id) {
        const p = pending.get(data.id);
        if (p) {
          pending.delete(data.id);
          if (data.ok) p.resolve(data.result);
          else p.reject(new Error(data.error || 'Request failed'));
        }
      }
    } catch {}
  });

  window.dispatchEvent(new Event('miniapp-sdk-ready'));
  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'neo_miniapp_ready' }));
})();
true;
`;

export function MiniAppViewer({
  app,
  locale = "en",
  theme = "dark",
  getAddress,
  invokeIntent,
  onReady,
  onError,
}: MiniAppViewerProps) {
  const webViewRef = useRef<WebView>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Create SDK instance
  const sdk = useMemo(() => createMiniAppSDK({ edgeBaseUrl: EDGE_BASE_URL, appId: app.app_id }), [app.app_id]);

  // Build bridge config
  const bridgeConfig: BridgeConfig = useMemo(
    () => ({
      appId: app.app_id,
      permissions: app.permissions,
      sdk,
      getAddress,
      invokeIntent,
    }),
    [app.app_id, app.permissions, sdk, getAddress, invokeIntent],
  );

  // Build entry URL with params
  const entryUrl = useMemo(() => {
    const supportedLocale = locale === "zh" ? "zh" : "en";
    // Convert relative paths to absolute URLs
    let baseUrl = app.entry_url;
    if (baseUrl.startsWith("/")) {
      baseUrl = `${MINIAPP_BASE_URL}${baseUrl}`;
    }
    return buildMiniAppEntryUrl(baseUrl, {
      lang: supportedLocale,
      theme,
      embedded: "1",
    });
  }, [app.entry_url, locale, theme]);

  // Handle messages from WebView
  const handleMessage = useCallback(
    async (event: WebViewMessageEvent) => {
      try {
        const data: BridgeMessage = JSON.parse(event.nativeEvent.data);

        if (data.type === "neo_miniapp_ready") {
          setIsLoaded(true);
          onReady?.();
          return;
        }

        if (data.type !== "neo_miniapp_sdk_request" || !data.id) return;

        const method = data.method || "";
        const params = data.params || [];

        try {
          const result = await dispatchBridgeCall(bridgeConfig, method, params);
          sendResponse(data.id, true, result);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Request failed";
          sendResponse(data.id, false, undefined, message);
        }
      } catch {
        // Ignore parse errors
      }
    },
    [bridgeConfig, onReady],
  );

  // Send response back to WebView
  const sendResponse = useCallback((id: string, ok: boolean, result?: unknown, error?: string) => {
    const response = JSON.stringify({
      type: "neo_miniapp_sdk_response",
      id,
      ok,
      result,
      error,
    });
    webViewRef.current?.injectJavaScript(`
        window.postMessage(${response}, '*');
        true;
      `);
  }, []);

  return (
    <View style={styles.container}>
      {!isLoaded && <MiniAppLoader app={app} />}
      <WebView
        ref={webViewRef}
        source={{ uri: entryUrl }}
        style={[styles.webview, !isLoaded && styles.hidden]}
        injectedJavaScript={INJECTED_JS}
        onMessage={handleMessage}
        onError={(e) => onError?.(new Error(e.nativeEvent.description))}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        originWhitelist={["*"]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  webview: {
    flex: 1,
    backgroundColor: "transparent",
  },
  hidden: {
    opacity: 0,
  },
});
