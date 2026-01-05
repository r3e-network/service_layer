<template>
  <AppLayout :title="t('title')" show-top-nav :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <!-- Canvas Tab -->
    <view v-if="activeTab === 'canvas'" class="tab-content">
      <view v-if="status" :class="['status-msg', status.type]">
        <text>{{ status.msg }}</text>
      </view>

      <!-- Main Canvas Card -->
      <view class="canvas-card">
        <view class="canvas-header">
          <text class="canvas-title">{{ t("workspace") }}</text>
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
              <text class="tool-label">{{ t(tool.label) }}</text>
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
      </view>
    </view>

    <!-- Gallery Tab -->
    <view v-if="activeTab === 'gallery'" class="tab-content scrollable">
      <view class="card">
        <text class="card-title">{{ t("recentArtworks") }}</text>
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
      </view>
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
import AppLayout from "@/shared/components/AppLayout.vue";
import NeoButton from "@/shared/components/NeoButton.vue";
import NeoDoc from "@/shared/components/NeoDoc.vue";

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
  docSubtitle: { en: "Learn more about this MiniApp.", zh: "了解更多关于此小程序的信息。" },
  docDescription: {
    en: "Professional documentation for this application is coming soon.",
    zh: "此应用程序的专业文档即将推出。",
  },
  step1: { en: "Open the application.", zh: "打开应用程序。" },
  step2: { en: "Follow the on-screen instructions.", zh: "按照屏幕上的指示操作。" },
  step3: { en: "Enjoy the secure experience!", zh: "享受安全体验！" },
  feature1Name: { en: "TEE Secured", zh: "TEE 安全保护" },
  feature1Desc: { en: "Hardware-level isolation.", zh: "硬件级隔离。" },
  feature2Name: { en: "On-Chain Fairness", zh: "链上公正" },
  feature2Desc: { en: "Provably fair execution.", zh: "可证明公平的执行。" },
};

const t = createT(translations);

const navTabs = [
  { id: "canvas", icon: "brush", label: t("canvas") },
  { id: "gallery", icon: "images", label: t("gallery") },
  { id: "docs", icon: "book", label: t("docs") },
];

const activeTab = ref("canvas");

const docSteps = computed(() => [t("step1"), t("step2"), t("step3")]);
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
  padding: $space-3;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
}

.status-msg {
  text-align: center;
  padding: $space-3;
  border-radius: $radius-sm;
  margin-bottom: $space-4;
  border: $border-width-md solid var(--neo-black);
  font-weight: $font-weight-bold;

  &.success {
    background: var(--status-success);
    color: var(--neo-black);
    box-shadow: $shadow-sm;
  }
  &.error {
    background: var(--status-error);
    color: var(--neo-white);
    box-shadow: $shadow-sm;
  }
  &.loading {
    background: var(--brutal-yellow);
    color: var(--neo-black);
    box-shadow: $shadow-sm;
  }
}

// Main Canvas Card
.canvas-card {
  background: var(--bg-card);
  border: $border-width-md solid var(--neo-black);
  border-radius: $radius-sm;
  padding: $space-4;
  box-shadow: $shadow-lg;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  max-height: calc(100vh - 180px);
}

.canvas-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $space-4;
  padding-bottom: $space-3;
  border-bottom: $border-width-sm solid var(--neo-purple);
}

.canvas-title {
  color: var(--neo-purple);
  font-size: $font-size-xl;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.layer-indicator {
  background: var(--bg-elevated);
  border: $border-width-sm solid var(--neo-black);
  border-radius: $radius-sm;
  padding: $space-2 $space-3;
  box-shadow: $shadow-sm;
}

.layer-text {
  color: var(--text-secondary);
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
}

// Canvas Container
.canvas-container {
  background: var(--bg-elevated);
  border: $border-width-lg solid var(--neo-black);
  border-radius: $radius-sm;
  padding: $space-3;
  margin-bottom: $space-4;
  box-shadow: $shadow-neo;
}

.canvas-grid {
  display: grid;
  grid-template-columns: repeat(16, 1fr);
  gap: 1px;
  aspect-ratio: 1;
  background: var(--neo-black);
  border: 2px solid var(--neo-black);
}

.pixel {
  aspect-ratio: 1;
  border-radius: $radius-none;
  transition: all $transition-fast;
  cursor: pointer;
  position: relative;

  &:hover {
    opacity: 0.8;
  }

  &.pixel-hover {
    box-shadow: inset 0 0 0 2px var(--neo-purple);
  }

  &:active {
    transform: scale(0.9);
  }
}

// Tools Section
.tools-section,
.brush-section,
.palette-section {
  margin-bottom: $space-4;
}

.section-label {
  color: var(--text-secondary);
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: $space-2;
  display: block;
}

.tools-bar {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $space-2;
}

.tool-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $space-3;
  background: var(--bg-elevated);
  border: $border-width-md solid var(--neo-black);
  border-radius: $radius-sm;
  box-shadow: $shadow-sm;
  transition: all $transition-fast;
  cursor: pointer;

  &.active {
    background: var(--neo-purple);
    border-color: var(--neo-purple);
    box-shadow: $shadow-neo;
    transform: translate(-2px, -2px);

    .tool-icon {
      transform: scale(1.2);
    }

    .tool-label {
      color: var(--neo-white);
    }
  }

  &:active {
    transform: translate(2px, 2px);
    box-shadow: none;
  }
}

.tool-icon {
  font-size: 1.5em;
  margin-bottom: $space-1;
  transition: transform $transition-fast;
}

.tool-label {
  color: var(--text-primary);
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  text-transform: uppercase;
}

// Brush Size Section
.brush-sizes {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $space-2;
}

.brush-size-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $space-3;
  background: var(--bg-elevated);
  border: $border-width-md solid var(--neo-black);
  border-radius: $radius-sm;
  box-shadow: $shadow-sm;
  transition: all $transition-fast;
  cursor: pointer;
  min-height: 60px;

  &.active {
    border-color: var(--neo-green);
    box-shadow: $shadow-neo;
    transform: translate(-2px, -2px);

    .brush-preview {
      background: var(--neo-green);
    }
  }

  &:active {
    transform: translate(2px, 2px);
    box-shadow: none;
  }
}

.brush-preview {
  background: var(--neo-black);
  border-radius: 50%;
  margin-bottom: $space-2;
  transition: all $transition-fast;
}

.brush-size-label {
  color: var(--text-primary);
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
}

// Color Palette
.color-palette {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: $space-2;
}

.color-btn {
  aspect-ratio: 1;
  border-radius: $radius-sm;
  border: $border-width-md solid var(--neo-black);
  box-shadow: $shadow-sm;
  transition: all $transition-fast;
  cursor: pointer;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;

  &.active {
    border-width: $border-width-lg;
    box-shadow: $shadow-neo;
    transform: translate(-2px, -2px);
  }

  &:active {
    transform: translate(2px, 2px);
    box-shadow: none;
  }
}

.color-check {
  color: var(--neo-white);
  font-size: $font-size-lg;
  font-weight: $font-weight-black;
  text-shadow: 0 0 4px rgba(0, 0, 0, 0.8);
}

// Action Section
.action-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $space-3;
  margin-top: $space-4;
  padding-top: $space-4;
  border-top: $border-width-sm solid var(--neo-black);
}

// Gallery Styles
.card {
  background: var(--bg-card);
  border: $border-width-md solid var(--neo-black);
  border-radius: $radius-sm;
  padding: $space-6;
  margin-bottom: $space-4;
  box-shadow: $shadow-md;
}

.card-title {
  color: var(--neo-green);
  font-size: $font-size-lg;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: block;
  margin-bottom: $space-4;
}

.artworks-list {
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.artwork-item {
  display: flex;
  align-items: center;
  padding: $space-3;
  background: var(--bg-elevated);
  border: $border-width-sm solid var(--neo-black);
  border-radius: $radius-sm;
  box-shadow: $shadow-sm;
  transition: all $transition-fast;

  &:active {
    transform: translate(2px, 2px);
    box-shadow: none;
  }
}

.artwork-icon {
  font-size: 1.8em;
  margin-right: $space-3;
}

.artwork-info {
  flex: 1;
}

.artwork-name {
  display: block;
  font-weight: $font-weight-bold;
  color: var(--text-primary);
  margin-bottom: $space-1;
}

.artwork-author {
  color: var(--text-secondary);
  font-size: $font-size-sm;
}

.artwork-price {
  color: var(--neo-green);
  font-weight: $font-weight-bold;
  font-size: $font-size-base;
}

// Animations
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes scaleIn {
  from {
    transform: scale(0.95);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(10px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
