import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { useState, useRef, useEffect } from "react";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import { useWalletStore } from "@/stores/wallet";
import { generateInjectedScript, parseWebViewMessage } from "@/lib/dapp/injected";
import { loadFavorites, addFavorite, removeFavorite, isFavorite, DApp } from "@/lib/dapp/favorites";

const DEFAULT_DAPPS: DApp[] = [
  { url: "https://flamingo.finance", name: "Flamingo", addedAt: 0 },
  { url: "https://neoburger.io", name: "NeoBurger", addedAt: 0 },
  { url: "https://ghostmarket.io", name: "GhostMarket", addedAt: 0 },
];

export default function BrowserScreen() {
  const { address, network } = useWalletStore();
  const webViewRef = useRef<WebView>(null);
  const [url, setUrl] = useState("");
  const [currentUrl, setCurrentUrl] = useState("");
  const [canGoBack, setCanGoBack] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFav, setIsFav] = useState(false);
  const [favorites, setFavorites] = useState<DApp[]>([]);
  const [showHome, setShowHome] = useState(true);

  useEffect(() => {
    loadFavorites().then(setFavorites);
  }, []);

  useEffect(() => {
    if (currentUrl) {
      isFavorite(currentUrl).then(setIsFav);
    }
  }, [currentUrl]);

  const navigateTo = (targetUrl: string) => {
    const finalUrl = targetUrl.startsWith("http") ? targetUrl : `https://${targetUrl}`;
    setUrl(finalUrl);
    setCurrentUrl(finalUrl);
    setShowHome(false);
  };

  const handleSubmit = () => {
    if (url.trim()) navigateTo(url.trim());
  };

  const toggleFavorite = async () => {
    if (!currentUrl) return;
    if (isFav) {
      await removeFavorite(currentUrl);
    } else {
      await addFavorite({ url: currentUrl, name: new URL(currentUrl).hostname });
    }
    setIsFav(!isFav);
    setFavorites(await loadFavorites());
  };

  const handleMessage = (event: { nativeEvent: { data: string } }) => {
    const message = parseWebViewMessage(event.nativeEvent.data);
    if (!message) return;

    if (message.type === "INVOKE") {
      Alert.alert("DApp Request", "Transaction request from DApp", [
        { text: "Reject", style: "cancel" },
        { text: "Approve", onPress: () => {} },
      ]);
    }
  };

  const injectedScript = address ? generateInjectedScript(address, network) : "";

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "DApp Browser" }} />

      {/* URL Bar */}
      <View style={styles.urlBar}>
        <TouchableOpacity onPress={() => webViewRef.current?.goBack()} disabled={!canGoBack}>
          <Ionicons name="chevron-back" size={24} color={canGoBack ? "#fff" : "#444"} />
        </TouchableOpacity>
        <TextInput
          style={styles.urlInput}
          value={url}
          onChangeText={setUrl}
          onSubmitEditing={handleSubmit}
          placeholder="Enter DApp URL"
          placeholderTextColor="#666"
          autoCapitalize="none"
          keyboardType="url"
        />
        {currentUrl && (
          <TouchableOpacity onPress={toggleFavorite}>
            <Ionicons name={isFav ? "star" : "star-outline"} size={22} color="#f59e0b" />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={() => {
            setShowHome(true);
            setUrl("");
          }}
        >
          <Ionicons name="home" size={22} color="#00d4aa" />
        </TouchableOpacity>
      </View>

      {showHome ? (
        <HomeView favorites={favorites} defaultDapps={DEFAULT_DAPPS} onSelect={navigateTo} />
      ) : (
        <WebView
          ref={webViewRef}
          source={{ uri: currentUrl }}
          style={styles.webview}
          injectedJavaScript={injectedScript}
          onMessage={handleMessage}
          onNavigationStateChange={(nav) => {
            setCanGoBack(nav.canGoBack);
            setUrl(nav.url);
            setCurrentUrl(nav.url);
          }}
          onLoadStart={() => setIsLoading(true)}
          onLoadEnd={() => setIsLoading(false)}
        />
      )}

      {isLoading && <View style={styles.loadingBar} />}
    </SafeAreaView>
  );
}

function HomeView({
  favorites,
  defaultDapps,
  onSelect,
}: {
  favorites: DApp[];
  defaultDapps: DApp[];
  onSelect: (url: string) => void;
}) {
  return (
    <View style={styles.home}>
      {favorites.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Favorites</Text>
          <View style={styles.dappGrid}>
            {favorites.slice(0, 6).map((d) => (
              <DAppCard key={d.url} dapp={d} onPress={() => onSelect(d.url)} />
            ))}
          </View>
        </>
      )}
      <Text style={styles.sectionTitle}>Popular DApps</Text>
      <View style={styles.dappGrid}>
        {defaultDapps.map((d) => (
          <DAppCard key={d.url} dapp={d} onPress={() => onSelect(d.url)} />
        ))}
      </View>
    </View>
  );
}

function DAppCard({ dapp, onPress }: { dapp: DApp; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.dappCard} onPress={onPress}>
      <View style={styles.dappIcon}>
        <Ionicons name="globe" size={24} color="#00d4aa" />
      </View>
      <Text style={styles.dappName} numberOfLines={1}>
        {dapp.name}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  urlBar: { flexDirection: "row", alignItems: "center", padding: 12, gap: 8, backgroundColor: "#1a1a1a" },
  urlInput: { flex: 1, backgroundColor: "#2a2a2a", padding: 10, borderRadius: 8, color: "#fff", fontSize: 14 },
  webview: { flex: 1 },
  loadingBar: { position: "absolute", top: 100, left: 0, right: 0, height: 2, backgroundColor: "#00d4aa" },
  home: { flex: 1, padding: 16 },
  sectionTitle: { color: "#888", fontSize: 14, marginBottom: 12, marginTop: 8 },
  dappGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  dappCard: { width: 80, alignItems: "center" },
  dappIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: "#1a1a1a",
    justifyContent: "center",
    alignItems: "center",
  },
  dappName: { color: "#fff", fontSize: 12, marginTop: 6, textAlign: "center" },
});
