import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import type { MiniAppInfo } from "@/types/miniapp";
import { CATEGORY_LABELS } from "@/types/miniapp";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "@/hooks/useTranslation";
import { getLocalizedField } from "@neo/shared/i18n";

interface MiniAppCardProps {
  app: MiniAppInfo;
  onPress: () => void;
}

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48) / 2; // 2 columns with padding

export function MiniAppCard({ app, onPress }: MiniAppCardProps) {
  const { locale } = useTranslation();
  const categoryLabel = CATEGORY_LABELS[app.category] || app.category;
  const isImageIcon = app.icon?.startsWith("/") || app.icon?.startsWith("http");

  // Use localized name/desc if available
  const appName = getLocalizedField(app, "name", locale);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8} delayPressIn={50}>
      {/* Header with Icon and Category Color Strip */}
      <View style={[styles.headerStrip, { backgroundColor: getCategoryColor(app.category) }]} />

      <View style={styles.iconContainer}>
        {isImageIcon ? (
          <Image
            source={{ uri: app.icon }}
            style={styles.iconImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.placeholderIcon, { backgroundColor: getCategoryColor(app.category) }]}>
            <Ionicons name={getCategoryIcon(app.category)} size={28} color="#000" />
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>
          {appName}
        </Text>

        <View style={styles.categoryBadge}>
          <Text style={styles.category}>{categoryLabel}</Text>
        </View>

        {/* Stats Row */}
        {(app.stats?.users !== undefined || app.stats?.transactions !== undefined) && (
          <View style={styles.statsRow}>
            {app.stats?.users !== undefined && (
              <View style={styles.statItem}>
                <Ionicons name="people" size={10} color="#000" />
                <Text style={styles.statText}>{formatNumber(app.stats.users)}</Text>
              </View>
            )}
            {app.stats?.transactions !== undefined && (
              <View style={styles.statItem}>
                <Ionicons name="swap-horizontal" size={10} color="#000" />
                <Text style={styles.statText}>{formatNumber(app.stats.transactions)}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

function getCategoryColor(category: string): string {
  switch (category) {
    case 'gaming': return '#FFDE59'; // Yellow
    case 'defi': return '#00E599'; // Neo Green
    case 'social': return '#FF90E8'; // Brutal Pink
    case 'governance': return '#4ECDC4'; // Brutal Blue
    case 'utility': return '#FFFFFF'; // White
    case 'nft': return '#A8E6CF'; // Lime
    default: return '#FFFFFF';
  }
}

function getCategoryIcon(category: string): keyof typeof Ionicons.glyphMap {
  switch (category) {
    case 'gaming': return 'game-controller';
    case 'defi': return 'trending-up';
    case 'social': return 'heart';
    case 'governance': return 'people';
    case 'utility': return 'construct';
    case 'nft': return 'images';
    default: return 'cube';
  }
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: "#ffffff",
    marginBottom: 24,
    borderWidth: 3,
    borderColor: "#000000",
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  headerStrip: {
    height: 8,
    width: '100%',
    borderBottomWidth: 3,
    borderBottomColor: '#000',
  },
  iconContainer: {
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconImage: {
    width: 56,
    height: 56,
    borderWidth: 3,
    borderColor: '#000',
    backgroundColor: '#eee',
  },
  placeholderIcon: {
    width: 56,
    height: 56,
    borderWidth: 3,
    borderColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 12,
    alignItems: 'center',
  },
  name: {
    color: "#000",
    fontSize: 16,
    fontWeight: "900",
    textAlign: 'center',
    textTransform: 'uppercase',
    marginBottom: 8,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  categoryBadge: {
    backgroundColor: "#fff",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 2,
    borderColor: '#000',
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  category: {
    color: "#000",
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
    borderTopWidth: 2,
    borderTopColor: '#000',
    paddingTop: 8,
    width: '100%',
    justifyContent: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  statText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#000',
  },
});
