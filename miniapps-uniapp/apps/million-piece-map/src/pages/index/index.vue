<template>
  <AppLayout :title="t('title')" show-top-nav :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <view v-if="activeTab === 'map'" class="tab-content">
      <view v-if="status" :class="['status-msg', status.type]">
        <text>{{ status.msg }}</text>
      </view>

      <!-- Pixel Art Territory Map -->
      <NeoCard :title="t('territoryMap')" variant="default">
        <view class="map-container">
          <!-- Coordinate Display -->
          <view class="coordinate-display">
            <text class="coord-label">{{ t("coordinates") }}:</text>
            <text class="coord-value">X: {{ selectedX }} / Y: {{ selectedY }}</text>
          </view>

          <!-- Zoom Controls -->
          <view class="zoom-controls">
            <view class="zoom-btn" @click="zoomOut">
              <text>-</text>
            </view>
            <text class="zoom-level">{{ zoomLevel }}x</text>
            <view class="zoom-btn" @click="zoomIn">
              <text>+</text>
            </view>
          </view>

          <!-- Pixel Grid Map -->
          <view class="pixel-map-wrapper">
            <view class="pixel-map" :style="{ transform: `scale(${zoomLevel})` }">
              <view
                v-for="(tile, i) in tiles"
                :key="i"
                :class="[
                  'pixel',
                  tile.owned && 'pixel-owned',
                  tile.selected && 'pixel-selected',
                  tile.isYours && 'pixel-yours',
                ]"
                :style="{ backgroundColor: getTileColor(tile) }"
                @click="selectTile(i)"
              >
                <view v-if="tile.selected" class="pixel-cursor"></view>
              </view>
            </view>
          </view>

          <!-- Map Legend -->
          <view class="map-legend">
            <view class="legend-item">
              <view class="legend-color legend-available"></view>
              <text class="legend-text">{{ t("available") }}</text>
            </view>
            <view class="legend-item">
              <view class="legend-color legend-yours"></view>
              <text class="legend-text">{{ t("yourTerritory") }}</text>
            </view>
            <view class="legend-item">
              <view class="legend-color legend-others"></view>
              <text class="legend-text">{{ t("othersTerritory") }}</text>
            </view>
          </view>
        </view>
      </NeoCard>

      <!-- Territory Purchase Panel -->
      <NeoCard :title="t('claimTerritory')" variant="accent">
        <view class="territory-info">
          <view class="info-row">
            <text class="info-label">{{ t("position") }}:</text>
            <text class="info-value">{{ t("tile") }} #{{ selectedTile }} ({{ selectedX }}, {{ selectedY }})</text>
          </view>
          <view class="info-row">
            <text class="info-label">{{ t("status") }}:</text>
            <text :class="['info-value', tiles[selectedTile].owned ? 'status-owned' : 'status-free']">
              {{ tiles[selectedTile].owned ? t("occupied") : t("available") }}
            </text>
          </view>
          <view class="info-row price-row">
            <text class="info-label">{{ t("price") }}:</text>
            <text class="info-value price-value">{{ tilePrice }} GAS</text>
          </view>
        </view>
        <NeoButton
          variant="primary"
          size="lg"
          block
          :loading="isPurchasing"
          :disabled="tiles[selectedTile].owned"
          @click="purchaseTile"
        >
          {{ isPurchasing ? t("claiming") : tiles[selectedTile].owned ? t("alreadyClaimed") : t("claimNow") }}
        </NeoButton>
      </NeoCard>

      <!-- Territory Stats -->
      <NeoCard :title="t('territoryStats')" variant="success">
        <view class="stats-grid">
          <view class="stat-card">
            <text class="stat-value">{{ ownedTiles }}</text>
            <text class="stat-label">{{ t("tilesOwned") }}</text>
          </view>
          <view class="stat-card">
            <text class="stat-value">{{ coverage }}%</text>
            <text class="stat-label">{{ t("mapControl") }}</text>
          </view>
          <view class="stat-card">
            <text class="stat-value">{{ formatNum(totalSpent) }}</text>
            <text class="stat-label">{{ t("gasSpent") }}</text>
          </view>
        </view>
      </NeoCard>
    </view>

    <!-- Stats Tab -->
    <view v-if="activeTab === 'stats'" class="tab-content scrollable">
      <NeoCard :title="t('yourStats')" variant="accent">
        <NeoStats :stats="statsData" />
      </NeoCard>
    </view>

    <!-- Docs Tab -->
    <view v-if="activeTab === 'docs'" class="tab-content scrollable">
      <NeoDoc
        :title="t('title')"
        :subtitle="t('docSubtitle')"
        :description="t('docDescription')"
        :steps="docSteps"
        :features="docFeatures"
      />
    </view>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useWallet, usePayments } from "@neo/uniapp-sdk";
import { formatNumber } from "@/shared/utils/format";
import { createT } from "@/shared/utils/i18n";
import AppLayout from "@/shared/components/AppLayout.vue";
import NeoButton from "@/shared/components/NeoButton.vue";
import NeoCard from "@/shared/components/NeoCard.vue";
import NeoStats from "@/shared/components/NeoStats.vue";
import NeoDoc from "@/shared/components/NeoDoc.vue";
import type { StatItem } from "@/shared/components/NeoStats.vue";

const translations = {
  title: { en: "Million Piece Map", zh: "百万像素地图" },
  subtitle: { en: "Pixel territory conquest", zh: "像素领土征服" },
  territoryMap: { en: "Territory Map", zh: "领土地图" },
  claimTerritory: { en: "Claim Territory", zh: "占领领土" },
  territoryStats: { en: "Territory Statistics", zh: "领土统计" },
  coordinates: { en: "Coordinates", zh: "坐标" },
  position: { en: "Position", zh: "位置" },
  status: { en: "Status", zh: "状态" },
  tile: { en: "Tile", zh: "地块" },
  price: { en: "Price", zh: "价格" },
  available: { en: "Available", zh: "可用" },
  occupied: { en: "Occupied", zh: "已占领" },
  yourTerritory: { en: "Your Territory", zh: "你的领土" },
  othersTerritory: { en: "Others' Territory", zh: "他人领土" },
  claiming: { en: "Claiming...", zh: "占领中..." },
  claimNow: { en: "Claim Now", zh: "立即占领" },
  alreadyClaimed: { en: "Already Claimed", zh: "已被占领" },
  tilesOwned: { en: "Tiles Owned", zh: "拥有地块" },
  mapControl: { en: "Map Control", zh: "地图控制" },
  gasSpent: { en: "GAS Spent", zh: "GAS 花费" },
  yourStats: { en: "Your Stats", zh: "您的统计" },
  owned: { en: "Owned", zh: "拥有" },
  spent: { en: "Spent", zh: "花费" },
  coverage: { en: "Coverage", zh: "覆盖率" },
  tileAlreadyOwned: { en: "Territory already claimed!", zh: "领土已被占领！" },
  tilePurchased: { en: "Territory claimed successfully!", zh: "领土占领成功！" },
  error: { en: "Error", zh: "错误" },
  map: { en: "Map", zh: "地图" },
  stats: { en: "Stats", zh: "统计" },
  docs: { en: "Docs", zh: "文档" },
  docSubtitle: { en: "Learn more about this MiniApp.", zh: "了解更多关于此小程序的信息。" },
  docDescription: {
    en: "Claim pixels on the blockchain and build your territory empire.",
    zh: "在区块链上占领像素，建立你的领土帝国。",
  },
  step1: { en: "Select a pixel on the map.", zh: "在地图上选择一个像素。" },
  step2: { en: "Claim it with GAS tokens.", zh: "使用 GAS 代币占领它。" },
  step3: { en: "Build your pixel empire!", zh: "建立你的像素帝国！" },
  feature1Name: { en: "Pixel Ownership", zh: "像素所有权" },
  feature1Desc: { en: "True on-chain ownership.", zh: "真正的链上所有权。" },
  feature2Name: { en: "Territory Control", zh: "领土控制" },
  feature2Desc: { en: "Expand your digital empire.", zh: "扩展你的数字帝国。" },
};

const t = createT(translations);

const navTabs = [
  { id: "map", icon: "grid", label: t("map") },
  { id: "stats", icon: "chart", label: t("stats") },
  { id: "docs", icon: "book", label: t("docs") },
];
const activeTab = ref("map");

const docSteps = computed(() => [t("step1"), t("step2"), t("step3")]);
const docFeatures = computed(() => [
  { name: t("feature1Name"), desc: t("feature1Desc") },
  { name: t("feature2Name"), desc: t("feature2Desc") },
]);

const APP_ID = "miniapp-millionpiecemap";
const { address, connect } = useWallet();
const { payGAS } = usePayments(APP_ID);

const GRID_SIZE = 64;
const GRID_WIDTH = 8;

// Territory color palette
const TERRITORY_COLORS = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E2"];

const tiles = ref(
  Array.from({ length: GRID_SIZE }, (_, i) => ({
    owned: i % 7 === 0,
    owner: i % 7 === 0 ? Math.floor(Math.random() * TERRITORY_COLORS.length) : -1,
    isYours: i % 13 === 0,
    selected: false,
  })),
);

const selectedTile = ref(0);
const tilePrice = ref(0.5);
const ownedTiles = ref(5);
const totalSpent = ref(2.5);
const isPurchasing = ref(false);
const status = ref<{ msg: string; type: string } | null>(null);
const zoomLevel = ref(1);

const selectedX = computed(() => selectedTile.value % GRID_WIDTH);
const selectedY = computed(() => Math.floor(selectedTile.value / GRID_WIDTH));
const coverage = computed(() => Math.round((ownedTiles.value / GRID_SIZE) * 100));
const formatNum = (n: number) => formatNumber(n, 2);

const statsData = computed<StatItem[]>(() => [
  { label: t("owned"), value: ownedTiles.value, variant: "accent" },
  { label: t("spent"), value: `${formatNum(totalSpent.value)} GAS`, variant: "default" },
  { label: t("coverage"), value: `${coverage.value}%`, variant: "success" },
]);

const getTileColor = (tile: any) => {
  if (tile.selected) return "var(--neo-purple)";
  if (tile.isYours) return "var(--neo-green)";
  if (tile.owned) return TERRITORY_COLORS[tile.owner] || "var(--neo-orange)";
  return "var(--bg-card)";
};

const selectTile = (index: number) => {
  tiles.value.forEach((t, i) => (t.selected = i === index));
  selectedTile.value = index;
};

const zoomIn = () => {
  if (zoomLevel.value < 2) zoomLevel.value += 0.25;
};

const zoomOut = () => {
  if (zoomLevel.value > 0.5) zoomLevel.value -= 0.25;
};

const purchaseTile = async () => {
  if (isPurchasing.value) return;
  if (tiles.value[selectedTile.value].owned) {
    status.value = { msg: t("tileAlreadyOwned"), type: "error" };
    return;
  }

  isPurchasing.value = true;
  try {
    await payGAS(tilePrice.value.toString(), `map:tile:${selectedTile.value}`);
    tiles.value[selectedTile.value].owned = true;
    tiles.value[selectedTile.value].isYours = true;
    tiles.value[selectedTile.value].owner = -1;
    ownedTiles.value++;
    totalSpent.value += tilePrice.value;
    status.value = { msg: t("tilePurchased"), type: "success" };
  } catch (e: any) {
    status.value = { msg: e.message || t("error"), type: "error" };
  } finally {
    isPurchasing.value = false;
  }
};
</script>

<style lang="scss" scoped>
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.tab-content {
  padding: $space-3;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: $space-3;
  overflow: hidden;

  &.scrollable {
    overflow-y: auto;
  }
}

.status-msg {
  text-align: center;
  padding: $space-3;
  border: $border-width-md solid var(--border-color);
  font-weight: $font-weight-bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-family: $font-family-mono;

  &.success {
    background: var(--status-success);
    color: var(--text-inverse);
    box-shadow: $shadow-md;
  }

  &.error {
    background: var(--status-error);
    color: var(--text-inverse);
    box-shadow: $shadow-md;
  }
}

// Map Container
.map-container {
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

// Coordinate Display
.coordinate-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $space-3;
  background: var(--bg-secondary);
  border: $border-width-sm solid var(--border-color);
  font-family: $font-family-mono;

  .coord-label {
    color: var(--text-secondary);
    font-size: $font-size-sm;
    font-weight: $font-weight-bold;
  }

  .coord-value {
    color: var(--neo-green);
    font-size: $font-size-base;
    font-weight: $font-weight-bold;
  }
}

// Zoom Controls
.zoom-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: $space-3;
  padding: $space-2;

  .zoom-btn {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-card);
    border: $border-width-md solid var(--border-color);
    font-size: $font-size-xl;
    font-weight: $font-weight-bold;
    color: var(--text-primary);
    cursor: pointer;
    transition: all $transition-fast;

    &:active {
      background: var(--neo-purple);
      color: var(--text-inverse);
      transform: scale(0.95);
    }
  }

  .zoom-level {
    min-width: 48px;
    text-align: center;
    font-family: $font-family-mono;
    font-weight: $font-weight-bold;
    color: var(--text-primary);
    font-size: $font-size-base;
  }
}

// Pixel Map
.pixel-map-wrapper {
  overflow: auto;
  background: var(--bg-secondary);
  border: $border-width-md solid var(--border-color);
  padding: $space-3;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 320px;
}

.pixel-map {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 2px;
  transform-origin: center;
  transition: transform $transition-base;
}

.pixel {
  width: 32px;
  height: 32px;
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: all $transition-fast;
  position: relative;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;

  &:hover {
    filter: brightness(1.2);
    border-color: var(--neo-purple);
  }

  &.pixel-owned {
    box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.2);
  }

  &.pixel-yours {
    box-shadow:
      inset 0 0 0 2px var(--neo-green),
      0 0 8px color-mix(in srgb, var(--neo-green) 30%, transparent);
  }

  &.pixel-selected {
    border: 2px solid var(--neo-purple);
    box-shadow:
      0 0 0 2px var(--bg-secondary),
      0 0 0 4px var(--neo-purple),
      0 0 12px color-mix(in srgb, var(--neo-purple) 50%, transparent);
    z-index: 10;
    transform: scale(1.1);
  }
}

.pixel-cursor {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 8px;
  height: 8px;
  background: var(--text-inverse);
  border: 1px solid var(--text-primary);
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    opacity: 0.5;
    transform: translate(-50%, -50%) scale(0.8);
  }
}

// Map Legend
.map-legend {
  display: flex;
  justify-content: space-around;
  padding: $space-3;
  background: var(--bg-secondary);
  border: $border-width-sm solid var(--border-color);
  gap: $space-2;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: $space-2;
}

.legend-color {
  width: 20px;
  height: 20px;
  border: $border-width-sm solid var(--border-color);

  &.legend-available {
    background: var(--bg-card);
  }

  &.legend-yours {
    background: var(--neo-green);
  }

  &.legend-others {
    background: linear-gradient(
      135deg,
      var(--brutal-red) 0%,
      var(--neo-cyan) 25%,
      var(--neo-purple) 50%,
      var(--brutal-orange) 75%,
      var(--neo-green) 100%
    );
  }
}

.legend-text {
  font-size: $font-size-xs;
  color: var(--text-secondary);
  font-weight: $font-weight-medium;
}

// Territory Info
.territory-info {
  padding: $space-4;
  background: var(--bg-secondary);
  border: $border-width-sm solid var(--border-color);
  margin-bottom: $space-4;
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;

  &.price-row {
    padding-top: $space-2;
    border-top: $border-width-sm solid var(--border-color);
  }
}

.info-label {
  color: var(--text-secondary);
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;
}

.info-value {
  color: var(--text-primary);
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  font-family: $font-family-mono;

  &.status-owned {
    color: var(--neo-orange);
  }

  &.status-free {
    color: var(--neo-green);
  }

  &.price-value {
    color: var(--neo-purple);
    font-size: $font-size-lg;
  }
}

// Stats Grid
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $space-3;
  padding: $space-2;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $space-3;
  background: var(--bg-secondary);
  border: $border-width-sm solid var(--border-color);

  .stat-value {
    font-size: $font-size-2xl;
    font-weight: $font-weight-bold;
    color: var(--neo-green);
    font-family: $font-family-mono;
    margin-bottom: $space-2;
  }

  .stat-label {
    font-size: $font-size-xs;
    color: var(--text-secondary);
    text-align: center;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
}
</style>
