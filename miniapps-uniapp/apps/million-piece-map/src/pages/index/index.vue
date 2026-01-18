<template>
  <AppLayout  :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <view v-if="chainType === 'evm'" class="px-4 mb-4">
      <NeoCard variant="danger">
        <view class="flex flex-col items-center gap-2 py-1">
          <text class="text-center font-bold text-red-400">{{ t("wrongChain") }}</text>
          <text class="text-xs text-center opacity-80 text-white">{{ t("wrongChainMessage") }}</text>
          <NeoButton size="sm" variant="secondary" class="mt-2" @click="() => switchChain('neo-n3-mainnet')">{{
            t("switchToNeo")
          }}</NeoButton>
        </view>
      </NeoCard>
    </view>

    <view v-if="activeTab === 'map'" class="tab-content">
      <NeoCard v-if="status" :variant="status.type === 'error' ? 'danger' : 'success'" class="mb-4 text-center">
        <text class="font-bold">{{ status.msg }}</text>
      </NeoCard>

      <!-- Pixel Art Territory Map -->
      <NeoCard variant="erobo" class="map-card">
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
      <NeoCard variant="erobo-neo">
        <NeoCard variant="erobo-neo" flat class="territory-info">
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
        </NeoCard>
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
    </view>

    <!-- Stats Tab -->
    <view v-if="activeTab === 'stats'" class="tab-content scrollable">
      <!-- Territory Stats -->
      <NeoCard variant="erobo" class="mb-4">
        <view class="stats-grid">
          <NeoCard flat variant="erobo-neo" class="flex flex-col items-center p-3 text-center">
            <text class="stat-value">{{ ownedTiles }}</text>
            <text class="stat-label">{{ t("tilesOwned") }}</text>
          </NeoCard>
          <NeoCard flat variant="erobo-neo" class="flex flex-col items-center p-3 text-center">
            <text class="stat-value">{{ coverage }}%</text>
            <text class="stat-label">{{ t("mapControl") }}</text>
          </NeoCard>
          <NeoCard flat variant="erobo-neo" class="flex flex-col items-center p-3 text-center">
            <text class="stat-value">{{ formatNum(totalSpent) }}</text>
            <text class="stat-label">{{ t("gasSpent") }}</text>
          </NeoCard>
        </view>
      </NeoCard>

      <NeoCard variant="erobo">
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
    <Fireworks :active="status?.type === 'success'" :duration="3000" />
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useWallet, usePayments, useEvents } from "@neo/uniapp-sdk";
import { formatNumber } from "@/shared/utils/format";
import { useI18n } from "@/composables/useI18n";
import { addressToScriptHash, normalizeScriptHash, parseInvokeResult } from "@/shared/utils/neo";
import { AppLayout, NeoButton, NeoCard, NeoStats, NeoDoc, Fireworks, type StatItem } from "@/shared/components";


const { t } = useI18n();

const navTabs = computed(() => [
  { id: "map", icon: "grid", label: t("map") },
  { id: "stats", icon: "chart", label: t("stats") },
  { id: "docs", icon: "book", label: t("docs") },
]);
const activeTab = ref("map");

const docSteps = computed(() => [t("step1"), t("step2"), t("step3"), t("step4")]);
const docFeatures = computed(() => [
  { name: t("feature1Name"), desc: t("feature1Desc") },
  { name: t("feature2Name"), desc: t("feature2Desc") },
]);

const APP_ID = "miniapp-millionpiecemap";
const { address, connect, invokeContract, invokeRead, chainType, switchChain, getContractAddress } = useWallet() as any;
const { payGAS } = usePayments(APP_ID);
const { list: listEvents } = useEvents();

const GRID_SIZE = 64;
const GRID_WIDTH = 8;
const TILE_PRICE = 0.1;

// Territory color palette - E-Robo Neon Theme
const TERRITORY_COLORS = [
  "#F472B6", // Pink
  "#00E599", // Neo Green
  "#7000FF", // Electric Purple
  "#22D3EE", // Cyan
  "#FDE047", // Yellow
  "#A78BFA", // Soft Purple
  "#FB923C", // Orange
  "#60A5FA"  // Blue
];

type Tile = {
  owned: boolean;
  owner: string;
  isYours: boolean;
  selected: boolean;
  x: number;
  y: number;
};

const tiles = ref<Tile[]>(
  Array.from({ length: GRID_SIZE }, (_, i) => ({
    owned: false,
    owner: "",
    isYours: false,
    selected: false,
    x: i % GRID_WIDTH,
    y: Math.floor(i / GRID_WIDTH),
  })),
);

const selectedTile = ref(0);
const tilePrice = ref(TILE_PRICE);
const isPurchasing = ref(false);
const status = ref<{ msg: string; type: string } | null>(null);
const zoomLevel = ref(1);
const contractAddress = ref<string | null>(null);

const selectedX = computed(() => selectedTile.value % GRID_WIDTH);
const selectedY = computed(() => Math.floor(selectedTile.value / GRID_WIDTH));
const ownedTiles = computed(() => tiles.value.filter((tile) => tile.isYours).length);
const totalSpent = computed(() => ownedTiles.value * tilePrice.value);
const coverage = computed(() => Math.round((ownedTiles.value / GRID_SIZE) * 100));
const formatNum = (n: number) => formatNumber(n, 2);

const statsData = computed<StatItem[]>(() => [
  { label: t("owned"), value: ownedTiles.value, variant: "accent" },
  { label: t("spent"), value: `${formatNum(totalSpent.value)} GAS`, variant: "default" },
  { label: t("coverage"), value: `${coverage.value}%`, variant: "success" },
]);

const ensureContractAddress = async () => {
  if (!contractAddress.value) {
    contractAddress.value = await getContractAddress();
  }
  if (!contractAddress.value) {
    throw new Error(t("contractUnavailable"));
  }
  return contractAddress.value as string;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForEvent = async (txid: string, eventName: string) => {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const res = await listEvents({ app_id: APP_ID, event_name: eventName, limit: 25 });
    const match = res.events.find((evt) => evt.tx_hash === txid);
    if (match) return match;
    await sleep(1500);
  }
  return null;
};

const parsePiece = (data: any) => {
  if (!data) return null;
  if (Array.isArray(data)) {
    return {
      owner: String(data[0] ?? ""),
      x: Number(data[1] ?? 0),
      y: Number(data[2] ?? 0),
      purchaseTime: Number(data[3] ?? 0),
      price: Number(data[4] ?? 0),
    };
  }
  if (typeof data === "object") {
    return {
      owner: String(data.owner ?? ""),
      x: Number(data.x ?? 0),
      y: Number(data.y ?? 0),
      purchaseTime: Number(data.purchaseTime ?? 0),
      price: Number(data.price ?? 0),
    };
  }
  return null;
};

const getOwnerColorIndex = (owner: string) => {
  if (!owner) return 0;
  let hash = 0;
  for (let i = 0; i < owner.length; i += 1) {
    hash = (hash + owner.charCodeAt(i)) % TERRITORY_COLORS.length;
  }
  return hash;
};

const getTileColor = (tile: any) => {
  if (tile.selected) return "var(--neo-purple)";
  if (tile.isYours) return "var(--neo-green)";
  if (tile.owned) return TERRITORY_COLORS[getOwnerColorIndex(tile.owner)] || "var(--neo-orange)";
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

const loadTiles = async () => {
  try {
    const contract = await ensureContractAddress();
    const userHash = address.value ? normalizeScriptHash(addressToScriptHash(address.value)) : "";
    const updates = await Promise.all(
      tiles.value.map(async (tile) => {
        const res = await invokeRead({
          contractHash: contract,
          operation: "getPiece",
          args: [
            { type: "Integer", value: String(tile.x) },
            { type: "Integer", value: String(tile.y) },
          ],
        });
        const parsed = parsePiece(parseInvokeResult(res));
        const ownerHash = normalizeScriptHash(parsed?.owner || "");
        const owned = Boolean(ownerHash);
        const isYours = Boolean(userHash && ownerHash && ownerHash === userHash);
        return {
          ...tile,
          owned,
          owner: parsed?.owner || "",
          isYours,
        };
      }),
    );
    tiles.value = updates;
  } catch (e: any) {
    status.value = { msg: e?.message || t("error"), type: "error" };
  }
};

const purchaseTile = async () => {
  if (isPurchasing.value) return;
  if (tiles.value[selectedTile.value].owned) {
    status.value = { msg: t("tileAlreadyOwned"), type: "error" };
    return;
  }

  isPurchasing.value = true;
  try {
    if (!address.value) {
      await connect();
    }
    if (!address.value) {
      throw new Error(t("connectWallet"));
    }
    const contract = await ensureContractAddress();
    const tile = tiles.value[selectedTile.value];
    const payment = await payGAS(tilePrice.value.toString(), `map:claim:${tile.x}:${tile.y}`);
    const receiptId = payment.receipt_id;
    if (!receiptId) {
      throw new Error(t("receiptMissing"));
    }
    const tx = await invokeContract({
      scriptHash: contract,
      operation: "claimPiece",
      args: [
        { type: "Hash160", value: address.value as string },
        { type: "Integer", value: String(tile.x) },
        { type: "Integer", value: String(tile.y) },
        { type: "Integer", value: String(receiptId) },
      ],
    });
    const txid = String((tx as any)?.txid || (tx as any)?.txHash || "");
    const evt = txid ? await waitForEvent(txid, "PieceClaimed") : null;
    if (!evt) {
      throw new Error(t("claimPending"));
    }
    await loadTiles();
    status.value = { msg: t("tilePurchased"), type: "success" };
  } catch (e: any) {
    status.value = { msg: e.message || t("error"), type: "error" };
  } finally {
    isPurchasing.value = false;
  }
};

onMounted(async () => {
  await loadTiles();
});

watch(address, async () => {
  await loadTiles();
});
</script>

<style lang="scss" scoped>
@use "@/shared/styles/tokens.scss" as *;
@use "@/shared/styles/variables.scss";

$map-bg: #e6dcc5;
$map-sea: #b4cee6;
$map-ink: #3e332a;
$map-gold: #d4a017;
$map-red: #c0392b;

:global(page) {
  background: $map-sea;
}

.tab-content {
  padding: 24px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
  background-color: $map-sea;
  background-image: 
    repeating-linear-gradient(45deg, transparent 0, transparent 40px, rgba(255,255,255,0.1) 40px, rgba(255,255,255,0.1) 80px),
    radial-gradient(#fff 20%, transparent 20%);
  background-size: 200px 200px, 40px 40px;
  min-height: 100vh;
}

.map-card {
  border: 4px solid $map-ink;
  border-radius: 4px;
  background: $map-bg;
  box-shadow: 10px 10px 0 rgba(62, 51, 42, 0.4);
  position: relative;
  
  &::after {
    content: 'X';
    position: absolute;
    top: 10px; right: 10px;
    font-family: 'Times New Roman', serif;
    font-weight: bold;
    color: $map-red;
    font-size: 24px;
    opacity: 0.5;
    pointer-events: none;
  }
}

.pixel-map-wrapper {
  background: #fdfbf7;
  border: 2px dashed $map-ink;
  border-radius: 4px;
  padding: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: auto;
  box-shadow: inset 0 0 20px rgba(62, 51, 42, 0.1);
}

.pixel-map {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 2px;
}

.pixel {
  width: 32px;
  height: 32px;
  border: 1px solid rgba(62, 51, 42, 0.2);
  cursor: pointer;
  background: #fff;
  transition: all 0.2s;
  
  &.has-selection {
    z-index: 10;
  }
  &.pixel-selected {
    border: 3px solid $map-red;
    transform: scale(1.1);
    z-index: 20;
    position: relative;
    &::after {
      content: 'X';
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      color: $map-red;
      font-weight: bold;
      font-size: 20px;
      line-height: 1;
    }
  }
  &.pixel-yours {
    background-color: $map-gold !important;
    border: 1px solid $map-ink;
  }
}

/* Pirate Component Overrides */
:deep(.neo-card) {
  background: $map-bg !important;
  color: $map-ink !important;
  border: 2px solid $map-ink !important;
  box-shadow: 4px 4px 0 rgba(62, 51, 42, 0.2) !important;
  border-radius: 4px !important;
  
  &.variant-erobo-neo {
    background: #fff !important;
  }
  &.variant-danger {
    background: #ffe6e6 !important;
    border-color: $map-red !important;
    color: $map-red !important;
  }
}

:deep(.neo-button) {
  border-radius: 4px !important;
  font-family: 'Times New Roman', serif !important;
  text-transform: uppercase;
  font-weight: 800 !important;
  letter-spacing: 0.1em;
  
  &.variant-primary {
    background: $map-red !important;
    color: #fff !important;
    border: 2px solid $map-ink !important;
    box-shadow: 4px 4px 0 $map-ink !important;
    
    &:active {
      transform: translate(2px, 2px);
      box-shadow: 2px 2px 0 $map-ink !important;
    }
  }
}

.coordinate-display {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  background: #fff;
  color: $map-ink;
  border: 1px solid $map-ink;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-weight: 700;
  font-size: 14px;
}

.zoom-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  color: $map-ink;
  border: 1px solid $map-ink;
  border-radius: 50%;
  cursor: pointer;
  font-weight: bold;
}

.map-legend {
  display: flex;
  gap: 12px;
  justify-content: center;
  padding: 8px;
  background: #fff;
  border: 1px solid $map-ink;
  border-radius: 4px;
}

.scrollable {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>
