<template>
  <AppLayout :title="t('title')" show-top-nav :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
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
      <NeoCard :title="t('territoryMap')" variant="erobo" class="map-card">
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
      <NeoCard :title="t('claimTerritory')" variant="erobo-neo">
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

      <!-- Territory Stats -->
      <NeoCard :title="t('territoryStats')" variant="erobo">
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
    </view>

    <!-- Stats Tab -->
    <view v-if="activeTab === 'stats'" class="tab-content scrollable">
      <NeoCard :title="t('yourStats')" variant="erobo">
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
import { ref, computed, onMounted, watch } from "vue";
import { useWallet, usePayments, useEvents } from "@neo/uniapp-sdk";
import { formatNumber } from "@/shared/utils/format";
import { createT } from "@/shared/utils/i18n";
import { addressToScriptHash, normalizeScriptHash, parseInvokeResult } from "@/shared/utils/neo";
import { AppLayout, NeoButton, NeoCard, NeoStats, NeoDoc, type StatItem } from "@/shared/components";

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
  connectWallet: { en: "Connect wallet", zh: "请连接钱包" },
  contractUnavailable: { en: "Contract unavailable", zh: "合约不可用" },
  receiptMissing: { en: "Payment receipt missing", zh: "支付凭证缺失" },
  claimPending: { en: "Claim pending", zh: "占领确认中" },
  error: { en: "Error", zh: "错误" },
  map: { en: "Map", zh: "地图" },
  stats: { en: "Stats", zh: "统计" },
  docs: { en: "Docs", zh: "文档" },
  docSubtitle: {
    en: "Claim and own pixels on a blockchain-powered territory map",
    zh: "在区块链驱动的领土地图上占领和拥有像素",
  },
  docDescription: {
    en: "Million Piece Map lets you claim pixels on an 8x8 grid territory map. Each pixel is a unique on-chain asset. Build your digital empire by purchasing tiles with GAS and watch your territory grow!",
    zh: "百万像素地图让您在 8x8 网格领土地图上占领像素。每个像素都是独特的链上资产。使用 GAS 购买地块建立您的数字帝国，观察您的领土增长！",
  },
  step1: { en: "Connect your Neo wallet and explore the territory map.", zh: "连接 Neo 钱包并探索领土地图。" },
  step2: { en: "Select an available pixel tile on the grid.", zh: "在网格上选择一个可用的像素地块。" },
  step3: { en: "Pay 0.1 GAS to claim ownership of the tile.", zh: "支付 0.1 GAS 占领该地块的所有权。" },
  step4: { en: "Track your territory stats and expand your empire.", zh: "跟踪您的领土统计并扩展您的帝国。" },
  feature1Name: { en: "True Ownership", zh: "真正所有权" },
  feature1Desc: {
    en: "Each pixel is recorded on-chain as your permanent property.",
    zh: "每个像素都作为您的永久财产记录在链上。",
  },
  feature2Name: { en: "Territory Visualization", zh: "领土可视化" },
  feature2Desc: {
    en: "Color-coded map shows your tiles vs others at a glance.",
    zh: "颜色编码的地图一目了然地显示您的地块与他人的地块。",
  },
  wrongChain: { en: "Wrong Chain", zh: "链错误" },
  wrongChainMessage: {
    en: "This app requires Neo N3. Please switch networks.",
    zh: "此应用需要 Neo N3 网络，请切换网络。",
  },
  switchToNeo: { en: "Switch to Neo N3", zh: "切换到 Neo N3" },
};

const t = createT(translations);

const navTabs = [
  { id: "map", icon: "grid", label: t("map") },
  { id: "stats", icon: "chart", label: t("stats") },
  { id: "docs", icon: "book", label: t("docs") },
];
const activeTab = ref("map");

const docSteps = computed(() => [t("step1"), t("step2"), t("step3"), t("step4")]);
const docFeatures = computed(() => [
  { name: t("feature1Name"), desc: t("feature1Desc") },
  { name: t("feature2Name"), desc: t("feature2Desc") },
]);

const APP_ID = "miniapp-millionpiecemap";
const { address, connect, invokeContract, invokeRead, chainType, switchChain } = useWallet() as any;
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
    contractAddress.value = "0xc56f33fc6ec47edbd594472833cf57505d5f99aa";
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
          operation: "GetPiece",
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
      operation: "ClaimPiece",
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

.tab-content {
  padding: $space-4;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.map-container {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.pixel-map-wrapper {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: $space-8;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: auto;
  box-shadow: inset 0 0 40px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
}

.pixel-map {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 2px;
}

.pixel {
  width: 32px;
  height: 32px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  background: rgba(255, 255, 255, 0.05);
  transition: all 0.2s;
  border-radius: 2px;
  
  &.has-selection {
    z-index: 10;
  }
  &.pixel-selected {
    border: 2px solid #00e599;
    box-shadow: 0 0 15px rgba(0, 229, 153, 0.5);
    transform: scale(1.1);
    z-index: 20;
  }
  &.pixel-yours {
    box-shadow: inset 0 0 10px rgba(0, 229, 153, 0.3);
  }
}



.coordinate-display {
  display: flex;
  justify-content: space-between;
  padding: $space-3 $space-4;
  background: rgba(255, 255, 255, 0.05);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  font-family: $font-mono;
  font-size: 12px;
  font-weight: 700;
  backdrop-filter: blur(5px);
}

.zoom-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin: 8px 0;
}
.zoom-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  cursor: pointer;
  font-weight: bold;
  backdrop-filter: blur(4px);
  transition: all 0.2s;
  &:active { background: rgba(255, 255, 255, 0.15); transform: scale(0.95); }
}
.zoom-level {
  font-family: $font-mono;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

.map-legend {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $space-2;
  padding: $space-3;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  color: white;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: $space-2;
}
.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}
.legend-available {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}
.legend-yours {
  background: var(--neo-green);
  box-shadow: 0 0 5px rgba(0, 229, 153, 0.5);
}
.legend-others {
  background: #ff6b6b;
}
.legend-text {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.6);
  letter-spacing: 0.05em;
}

.territory-info {
  display: flex;
  flex-direction: column;
  gap: $space-3;
  margin-bottom: $space-4;
  padding: $space-4;
  color: white;
  background: transparent !important;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-label {
  font-size: 10px;
  font-weight: 700;
  opacity: 0.6;
  text-transform: uppercase;
}
.info-value {
  font-weight: 700;
  font-family: $font-mono;
  font-size: 14px;
}
.status-owned { color: #ff6b6b; }
.status-free { color: #00e599; }

.price-value {
  color: #00e599;
  font-size: 20px;
  text-shadow: 0 0 10px rgba(0, 229, 153, 0.3);
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  font-family: $font-mono;
  color: white;
  line-height: 1;
}
.stat-label {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 4px;
}

.scrollable {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>
