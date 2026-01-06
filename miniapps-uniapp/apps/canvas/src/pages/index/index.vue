<template>
  <AppLayout :title="t('title')" show-top-nav :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <!-- Canvas Tab -->
    <view v-if="activeTab === 'canvas'" class="tab-content">
      <NeoCard
        v-if="status"
        :variant="status.type === 'error' ? 'danger' : status.type === 'loading' ? 'warning' : 'success'"
        class="mb-4 text-center"
      >
        <text class="font-bold">{{ status.msg }}</text>
      </NeoCard>

      <NeoCard :title="t('workspace')" variant="default" class="canvas-card-neo">
        <view class="canvas-header-sub">
          <view class="layer-indicator">
            <text class="layer-text">{{ t("layer") }} 1</text>
          </view>
        </view>

        <!-- Drawing Canvas -->
        <view class="canvas-container">
          <view class="canvas-grid">
            <view
              v-for="(pixel, idx) in pixels"
              :key="idx"
              class="pixel"
              :class="{ 'pixel-hover': hoveredPixel === idx }"
              :style="{ background: pixel }"
              @click="paintPixel(idx)"
              @mouseenter="hoveredPixel = idx"
              @mouseleave="hoveredPixel = null"
            ></view>
          </view>
        </view>

        <!-- Tools Section -->
        <view class="tools-section">
          <view class="section-label">
            <text>{{ t("tools") }}</text>
          </view>
          <view class="tools-bar">
            <view
              v-for="tool in tools"
              :key="tool.id"
              class="tool-btn"
              :class="{ active: selectedTool === tool.id }"
              @click="selectedTool = tool.id"
            >
              <text class="tool-icon">{{ tool.icon }}</text>
              <text class="tool-label">{{ t(tool.label as any) }}</text>
            </view>
          </view>
        </view>

        <!-- Brush Size Section -->
        <view class="brush-section">
          <view class="section-label">
            <text>{{ t("brushSize") }}</text>
          </view>
          <view class="brush-sizes">
            <view
              v-for="size in brushSizes"
              :key="size.value"
              class="brush-size-btn"
              :class="{ active: selectedBrushSize === size.value }"
              @click="selectedBrushSize = size.value"
            >
              <view class="brush-preview" :style="{ width: size.preview + 'px', height: size.preview + 'px' }"></view>
              <text class="brush-size-label">{{ size.label }}</text>
            </view>
          </view>
        </view>

        <!-- Color Palette Section -->
        <view class="palette-section">
          <view class="section-label">
            <text>{{ t("colorPalette") }}</text>
          </view>
          <view class="color-palette">
            <view
              v-for="c in colors"
              :key="c"
              class="color-btn"
              :class="{ active: selectedColor === c }"
              :style="{ background: c }"
              @click="selectedColor = c"
            >
              <view v-if="selectedColor === c" class="color-check">✓</view>
            </view>
          </view>
        </view>

        <!-- Action Buttons -->
        <view class="action-section">
          <NeoButton variant="secondary" size="lg" block @click="clearCanvas" class="clear-btn">
            {{ t("clearCanvas") }}
          </NeoButton>
          <NeoButton variant="primary" size="lg" block :loading="isLoading" @click="mintCanvas" class="mint-btn">
            {{ isLoading ? t("minting") : t("mintAsNFT") }}
          </NeoButton>
        </view>
      </NeoCard>
    </view>

    <view v-if="activeTab === 'gallery'" class="tab-content scrollable">
      <NeoCard :title="t('recentArtworks')" variant="success">
        <view class="artworks-list">
          <view v-for="art in artworks" :key="art.id" class="artwork-item">
            <text class="artwork-icon">🎨</text>
            <view class="artwork-info">
              <text class="artwork-name">{{ art.name }}</text>
              <text class="artwork-author">{{ t("by") }} {{ art.author }}</text>
            </view>
            <text class="artwork-price">{{ art.price }} GAS</text>
          </view>
        </view>
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
import { createT } from "@/shared/utils/i18n";
import { AppLayout, NeoButton, NeoCard, NeoDoc } from "@/shared/components";

const translations = {
  title: { en: "Pixel Canvas", zh: "像素画布" },
  subtitle: { en: "Collaborative pixel art creation", zh: "协作像素艺术创作" },
  canvas: { en: "Canvas", zh: "画布" },
  gallery: { en: "Gallery", zh: "画廊" },
  workspace: { en: "Workspace", zh: "工作区" },
  layer: { en: "Layer", zh: "图层" },
  tools: { en: "Tools", zh: "工具" },
  brush: { en: "Brush", zh: "画笔" },
  eraser: { en: "Eraser", zh: "橡皮擦" },
  fill: { en: "Fill", zh: "填充" },
  brushSize: { en: "Brush Size", zh: "笔刷大小" },
  small: { en: "S", zh: "小" },
  medium: { en: "M", zh: "中" },
  large: { en: "L", zh: "大" },
  colorPalette: { en: "Color Palette", zh: "调色板" },
  actions: { en: "Actions", zh: "操作" },
  minting: { en: "Minting...", zh: "铸造中..." },
  mintAsNFT: { en: "Mint as NFT (10 GAS)", zh: "铸造为 NFT (10 GAS)" },
  clearCanvas: { en: "Clear Canvas", zh: "清空画布" },
  recentArtworks: { en: "Recent Artworks", zh: "最近作品" },
  by: { en: "by", zh: "作者" },
  canvasCleared: { en: "Canvas cleared", zh: "画布已清空" },
  mintingNFT: { en: "Minting NFT...", zh: "正在铸造 NFT..." },
  canvasMinted: { en: "Canvas minted as NFT!", zh: "画布已铸造为 NFT！" },
  error: { en: "Error", zh: "错误" },
  docs: { en: "Docs", zh: "文档" },
  docSubtitle: {
    en: "Collaborative pixel art on the blockchain",
    zh: "区块链上的协作像素艺术",
  },
  docDescription: {
    en: "Canvas is a collaborative pixel art platform where users can create and own pixels on a shared canvas. Each pixel placement is recorded on-chain, creating permanent digital art.",
    zh: "Canvas 是一个协作像素艺术平台，用户可以在共享画布上创建和拥有像素。每次像素放置都记录在链上，创建永久的数字艺术。",
  },
  step1: {
    en: "Connect your Neo wallet to start creating",
    zh: "连接您的 Neo 钱包开始创作",
  },
  step2: {
    en: "Select a color from the palette",
    zh: "从调色板中选择颜色",
  },
  step3: {
    en: "Click on the canvas to place your pixel (costs GAS)",
    zh: "点击画布放置像素（消耗 GAS）",
  },
  step4: {
    en: "Watch the community artwork evolve in real-time",
    zh: "实时观看社区艺术作品的演变",
  },
  feature1Name: { en: "Permanent Storage", zh: "永久存储" },
  feature1Desc: {
    en: "All pixel art is stored permanently on Neo N3 blockchain.",
    zh: "所有像素艺术永久存储在 Neo N3 区块链上。",
  },
  feature2Name: { en: "Real-Time Updates", zh: "实时更新" },
  feature2Desc: {
    en: "See other artists' contributions appear instantly on the canvas.",
    zh: "即时看到其他艺术家的贡献出现在画布上。",
  },
};

const t = createT(translations);

const navTabs = [
  { id: "canvas", icon: "brush", label: t("canvas") },
  { id: "gallery", icon: "images", label: t("gallery") },
  { id: "docs", icon: "book", label: t("docs") },
];

const activeTab = ref("canvas");

const docSteps = computed(() => [t("step1"), t("step2"), t("step3"), t("step4")]);
const docFeatures = computed(() => [
  { name: t("feature1Name"), desc: t("feature1Desc") },
  { name: t("feature2Name"), desc: t("feature2Desc") },
]);

const APP_ID = "miniapp-canvas";
const { address, connect } = useWallet();
const { payGAS, isLoading } = usePayments(APP_ID);

const GRID_SIZE = 16;
const pixels = ref<string[]>(Array(GRID_SIZE * GRID_SIZE).fill("#1a1a2e"));
const selectedColor = ref("#a855f7");
const selectedTool = ref("brush");
const selectedBrushSize = ref(1);
const hoveredPixel = ref<number | null>(null);

const colors = [
  "#a855f7", // purple
  "#00ff88", // neo-green
  "#ff0055", // red
  "#ffaa00", // orange
  "#00aaff", // blue
  "#ff00ff", // magenta
  "#00ffff", // cyan
  "#ffff00", // yellow
  "#ffffff", // white
  "#000000", // black
  "#808080", // gray
  "#1a1a2e", // dark
];

const tools = [
  { id: "brush", icon: "🖌️", label: "brush" },
  { id: "eraser", icon: "🧹", label: "eraser" },
  { id: "fill", icon: "🪣", label: "fill" },
];

const brushSizes = [
  { value: 1, label: t("small"), preview: 8 },
  { value: 2, label: t("medium"), preview: 16 },
  { value: 3, label: t("large"), preview: 24 },
];

const status = ref<{ msg: string; type: string } | null>(null);
const artworks = ref([
  { id: "1", name: "Sunset", author: "Alice", price: "15" },
  { id: "2", name: "Ocean", author: "Bob", price: "20" },
  { id: "3", name: "Forest", author: "Carol", price: "12" },
]);

const paintPixel = (idx: number) => {
  if (selectedTool.value === "brush") {
    pixels.value[idx] = selectedColor.value;
  } else if (selectedTool.value === "eraser") {
    pixels.value[idx] = "#1a1a2e";
  } else if (selectedTool.value === "fill") {
    // Simple fill - fill all pixels with same color
    const targetColor = pixels.value[idx];
    pixels.value = pixels.value.map((p) => (p === targetColor ? selectedColor.value : p));
  }
};

const clearCanvas = () => {
  pixels.value = Array(GRID_SIZE * GRID_SIZE).fill("#1a1a2e");
  status.value = { msg: t("canvasCleared"), type: "success" };
};

const mintCanvas = async () => {
  if (isLoading.value) return;
  try {
    status.value = { msg: t("mintingNFT"), type: "loading" };
    await payGAS("10", `mint:${Date.now()}`);
    status.value = { msg: t("canvasMinted"), type: "success" };
  } catch (e: any) {
    status.value = { msg: e.message || t("error"), type: "error" };
  }
};
</script>

<style lang="scss" scoped>
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.tab-content {
  padding: $space-4;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.canvas-card-neo { margin-bottom: $space-4; border: 4px solid black; box-shadow: 10px 10px 0 black; }
.canvas-header-sub { display: flex; justify-content: flex-end; margin-bottom: $space-2; }
.layer-text { font-size: 8px; font-weight: $font-weight-black; text-transform: uppercase; opacity: 0.6; }

.canvas-container {
  padding: $space-1; background: black; border: 2px solid black; margin-bottom: $space-4; box-shadow: 8px 8px 0 black;
}

.canvas-grid {
  display: grid; grid-template-columns: repeat(16, 1fr); gap: 1px; aspect-ratio: 1; background: #333;
}

.pixel {
  aspect-ratio: 1; transition: transform $transition-fast;
  &.pixel-hover { transform: scale(1.1); z-index: 10; border: 1px solid white; box-shadow: 0 0 10px rgba(255,255,255,0.5); }
}

.section-label { font-size: 8px; font-weight: $font-weight-black; text-transform: uppercase; opacity: 0.6; margin-bottom: 4px; }

.tools-bar { display: grid; grid-template-columns: repeat(3, 1fr); gap: $space-2; margin-bottom: $space-4; }
.tool-btn {
  padding: $space-2; background: white; border: 2px solid black; text-align: center; cursor: pointer;
  &.active { background: var(--brutal-yellow); box-shadow: 4px 4px 0 black; transform: translate(-2px, -2px); }
  transition: all $transition-fast;
}

.tool-icon { display: block; font-size: 20px; }
.tool-label { font-size: 8px; font-weight: $font-weight-black; text-transform: uppercase; }

.brush-sizes { display: grid; grid-template-columns: repeat(3, 1fr); gap: $space-2; margin-bottom: $space-4; }
.brush-size-btn {
  padding: $space-2; background: white; border: 2px solid black; text-align: center; cursor: pointer;
  &.active { background: var(--neo-green); box-shadow: 4px 4px 0 black; transform: translate(-2px, -2px); }
}

.brush-preview { background: black; border-radius: 50%; margin: 0 auto 4px; border: 1px solid black; }
.brush-size-label { font-size: 8px; font-weight: $font-weight-black; }

.color-palette { display: grid; grid-template-columns: repeat(6, 1fr); gap: $space-2; margin-bottom: $space-4; }
.color-btn {
  aspect-ratio: 1; border: 2px solid black; display: flex; align-items: center; justify-content: center; cursor: pointer;
  &.active { border-color: black; transform: scale(1.1); box-shadow: 4px 4px 0 black; z-index: 2; border-width: 4px; }
}

.color-check { font-size: 10px; color: white; -webkit-text-stroke: 1px black; font-weight: $font-weight-black; }

.action-section { display: grid; grid-template-columns: 1fr 1fr; gap: $space-2; }

.artworks-list { display: flex; flex-direction: column; gap: $space-3; }
.artwork-item {
  display: flex; align-items: center; padding: $space-3; background: white; border: 2px solid black; box-shadow: 4px 4px 0 black;
}

.artwork-icon { font-size: 24px; margin-right: $space-3; }
.artwork-info { flex: 1; }
.artwork-name { font-weight: $font-weight-black; text-transform: uppercase; font-size: 14px; display: block; }
.artwork-author { font-size: 10px; font-weight: $font-weight-bold; opacity: 0.6; }
.artwork-price { font-family: $font-mono; font-weight: $font-weight-black; color: var(--neo-purple); font-size: 14px; }

.scrollable { overflow-y: auto; -webkit-overflow-scrolling: touch; }
</style>
