<template>
  <AppLayout :title="t('title')" show-top-nav :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <!-- Garden Tab -->
    <view v-if="activeTab === 'garden'" class="tab-content scrollable">
      <view v-if="status" :class="['status-msg', status.type]">
        <text>{{ status.msg }}</text>
      </view>
      <view class="card garden-card">
        <text class="card-title">{{ t("yourGarden") }}</text>
        <view class="garden-container">
          <view class="garden-grid">
            <view
              v-for="plot in plots"
              :key="plot.id"
              class="plot"
              :class="[
                { empty: !plot.plant },
                { watering: plot.isWatering },
                plot.plant ? getGrowthStage(plot.plant.growth) : '',
              ]"
              @click="selectPlot(plot)"
            >
              <view class="plot-soil">
                <view class="soil-texture"></view>
              </view>
              <view v-if="plot.plant" class="plant-container">
                <text class="plant-icon" :class="{ ready: plot.plant.growth >= 100 }">
                  {{ plot.plant.icon }}
                </text>
                <view v-if="plot.plant.growth >= 100" class="sparkle-effect">✨</view>
              </view>
              <text v-else class="empty-icon">🌱</text>

              <view v-if="plot.plant" class="growth-info">
                <view class="growth-bar">
                  <view class="growth-fill" :style="{ width: plot.plant.growth + '%' }"></view>
                </view>
                <text class="growth-percent">{{ Math.floor(plot.plant.growth) }}%</text>
              </view>

              <view v-if="plot.isWatering" class="water-drops">
                <text class="drop">💧</text>
                <text class="drop">💧</text>
                <text class="drop">💧</text>
              </view>
            </view>
          </view>
        </view>
      </view>
      <view class="card seeds-card">
        <text class="card-title">{{ t("availableSeeds") }}</text>
        <view class="seeds-list">
          <view v-for="seed in seeds" :key="seed.id" class="seed-item" @click="plantSeed(seed)">
            <view class="seed-icon-wrapper">
              <text class="seed-icon">{{ seed.icon }}</text>
              <view class="seed-packet"></view>
            </view>
            <view class="seed-info">
              <text class="seed-name">{{ seed.name }}</text>
              <view class="seed-details">
                <text class="seed-time">⏱ {{ seed.growTime }}{{ t("hoursToGrow") }}</text>
              </view>
            </view>
            <view class="seed-price-tag">
              <text class="seed-price">{{ seed.price }}</text>
              <text class="seed-currency">GAS</text>
            </view>
          </view>
        </view>
      </view>
      <view class="card actions-card">
        <text class="card-title">{{ t("actions") }}</text>
        <view class="action-btns">
          <NeoButton variant="primary" size="md" block :loading="isLoading" @click="waterGarden">
            <text>💧 {{ isLoading ? t("watering") : t("waterAll") }}</text>
          </NeoButton>
          <NeoButton variant="secondary" size="md" block @click="harvestAll">
            <text>🌾 {{ t("harvestReady") }}</text>
          </NeoButton>
        </view>
      </view>
    </view>

    <!-- Stats Tab -->
    <view v-if="activeTab === 'stats'" class="tab-content scrollable">
      <view class="card stats-card">
        <text class="card-title">{{ t("gardenStats") }}</text>
        <view class="stats-grid">
          <view class="stat-item stat-plants">
            <text class="stat-icon">🌿</text>
            <text class="stat-value">{{ totalPlants }}</text>
            <text class="stat-label">{{ t("plants") }}</text>
          </view>
          <view class="stat-item stat-ready">
            <text class="stat-icon">✨</text>
            <text class="stat-value">{{ readyToHarvest }}</text>
            <text class="stat-label">{{ t("ready") }}</text>
          </view>
          <view class="stat-item stat-harvested">
            <text class="stat-icon">🌾</text>
            <text class="stat-value">{{ totalHarvested }}</text>
            <text class="stat-label">{{ t("harvested") }}</text>
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

const translations = {
  title: { en: "Garden of Neo", zh: "Neo花园" },
  subtitle: { en: "Grow and trade virtual garden NFTs", zh: "种植和交易虚拟花园NFT" },
  garden: { en: "Garden", zh: "花园" },
  stats: { en: "Stats", zh: "统计" },
  yourGarden: { en: "Your Garden", zh: "你的花园" },
  availableSeeds: { en: "Available Seeds", zh: "可用种子" },
  hoursToGrow: { en: "h to grow", zh: "小时生长" },
  actions: { en: "Actions", zh: "操作" },
  watering: { en: "Watering...", zh: "浇水中..." },
  waterAll: { en: "Water All (2 GAS)", zh: "全部浇水 (2 GAS)" },
  harvestReady: { en: "Harvest Ready Plants", zh: "收获成熟植物" },
  gardenStats: { en: "Garden Stats", zh: "花园统计" },
  plants: { en: "Plants", zh: "植物" },
  ready: { en: "Ready", zh: "成熟" },
  harvested: { en: "Harvested", zh: "已收获" },
  noEmptyPlots: { en: "No empty plots available", zh: "没有空闲地块" },
  plantingSeed: { en: "Planting seed...", zh: "种植中..." },
  planted: { en: "planted!", zh: "已种植！" },
  wateringGarden: { en: "Watering garden...", zh: "浇水中..." },
  gardenWatered: { en: "Garden watered!", zh: "花园已浇水！" },
  harvested2: { en: "Harvested", zh: "已收获" },
  harvestedPlants: { en: "plants!", zh: "株植物！" },
  noReady: { en: "No plants ready to harvest", zh: "没有可收获的植物" },
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
  { id: "garden", icon: "leaf", label: t("garden") },
  { id: "stats", icon: "chart", label: t("stats") },
  { id: "docs", icon: "book", label: t("docs") },
];

const activeTab = ref("garden");

const docSteps = computed(() => [t("step1"), t("step2"), t("step3")]);
const docFeatures = computed(() => [
  { name: t("feature1Name"), desc: t("feature1Desc") },
  { name: t("feature2Name"), desc: t("feature2Desc") },
]);
const APP_ID = "miniapp-gardenofneo";
const { address, connect } = useWallet();
const { payGAS, isLoading } = usePayments(APP_ID);

interface Plant {
  icon: string;
  name: string;
  growth: number;
}

interface Plot {
  id: string;
  plant: Plant | null;
  isWatering?: boolean;
}

const plots = ref<Plot[]>([
  { id: "1", plant: { icon: "🌻", name: "Sunflower", growth: 80 } },
  { id: "2", plant: { icon: "🌹", name: "Rose", growth: 60 } },
  { id: "3", plant: null },
  { id: "4", plant: null },
  { id: "5", plant: { icon: "🌷", name: "Tulip", growth: 100 } },
  { id: "6", plant: null },
]);

const seeds = ref([
  { id: "1", name: "Sunflower", icon: "🌻", price: "3", growTime: 24 },
  { id: "2", name: "Rose", icon: "🌹", price: "5", growTime: 48 },
  { id: "3", name: "Tulip", icon: "🌷", price: "4", growTime: 36 },
  { id: "4", name: "Orchid", icon: "🌺", price: "8", growTime: 72 },
]);

const status = ref<{ msg: string; type: string } | null>(null);
const totalHarvested = ref(12);
const selectedPlot = ref<Plot | null>(null);

const totalPlants = computed(() => plots.value.filter((p) => p.plant).length);
const readyToHarvest = computed(() => plots.value.filter((p) => p.plant && p.plant.growth >= 100).length);

const getGrowthStage = (growth: number): string => {
  if (growth >= 100) return "stage-mature";
  if (growth >= 75) return "stage-blooming";
  if (growth >= 50) return "stage-growing";
  if (growth >= 25) return "stage-sprouting";
  return "stage-seedling";
};

const selectPlot = (plot: Plot) => {
  selectedPlot.value = plot;
  if (plot.plant && plot.plant.growth >= 100) {
    harvest(plot);
  }
};

const plantSeed = async (seed: any) => {
  const emptyPlot = plots.value.find((p) => !p.plant);
  if (!emptyPlot) {
    status.value = { msg: t("noEmptyPlots"), type: "error" };
    return;
  }
  if (isLoading.value) return;
  try {
    status.value = { msg: t("plantingSeed"), type: "loading" };
    await payGAS(seed.price, `plant:${seed.id}`);
    emptyPlot.plant = { icon: seed.icon, name: seed.name, growth: 0 };
    status.value = { msg: `${seed.name} ${t("planted")}`, type: "success" };
  } catch (e: any) {
    status.value = { msg: e.message || t("error"), type: "error" };
  }
};

const waterGarden = async () => {
  if (isLoading.value) return;
  try {
    status.value = { msg: t("wateringGarden"), type: "loading" };

    // Show watering animation
    plots.value.forEach((plot) => {
      if (plot.plant && plot.plant.growth < 100) {
        plot.isWatering = true;
      }
    });

    await payGAS("2", `water:${Date.now()}`);

    // Update growth after payment
    plots.value.forEach((plot) => {
      if (plot.plant && plot.plant.growth < 100) {
        plot.plant.growth = Math.min(100, plot.plant.growth + 20);
      }
    });

    // Remove watering animation after delay
    setTimeout(() => {
      plots.value.forEach((plot) => {
        plot.isWatering = false;
      });
    }, 1500);

    status.value = { msg: t("gardenWatered"), type: "success" };
  } catch (e: any) {
    plots.value.forEach((plot) => {
      plot.isWatering = false;
    });
    status.value = { msg: e.message || t("error"), type: "error" };
  }
};

const harvest = (plot: Plot) => {
  if (!plot.plant || plot.plant.growth < 100) return;
  status.value = { msg: `${t("harvested2")} ${plot.plant.name}!`, type: "success" };
  plot.plant = null;
  totalHarvested.value++;
};

const harvestAll = () => {
  let count = 0;
  plots.value.forEach((plot) => {
    if (plot.plant && plot.plant.growth >= 100) {
      plot.plant = null;
      count++;
    }
  });
  if (count > 0) {
    totalHarvested.value += count;
    status.value = { msg: `${t("harvested2")} ${count} ${t("harvestedPlants")}`, type: "success" };
  } else {
    status.value = { msg: t("noReady"), type: "error" };
  }
};
</script>

<style lang="scss" scoped>
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.tab-content {
  padding: 12px;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &.scrollable {
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }
}
.status-msg {
  text-align: center;
  padding: $space-3;
  border: $border-width-md solid $neo-black;
  border-radius: $radius-sm;
  margin-bottom: $space-4;
  font-weight: $font-weight-bold;

  &.success {
    background: $status-success;
    color: $neo-black;
    box-shadow: $shadow-sm;
  }
  &.error {
    background: $status-error;
    color: $neo-white;
    box-shadow: $shadow-sm;
  }
  &.loading {
    background: $brutal-yellow;
    color: $neo-black;
    box-shadow: $shadow-sm;
  }
}
.card {
  background: var(--bg-card);
  border: $border-width-lg solid var(--neo-black);
  border-radius: $radius-sm;
  padding: $space-5;
  margin-bottom: $space-4;
  box-shadow: $shadow-md;
}

.garden-card {
  background: linear-gradient(135deg, var(--brutal-lime) 0%, var(--neo-green) 100%);
}

.garden-container {
  position: relative;
}
.card-title {
  color: $neo-green;
  font-size: $font-size-xl;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: block;
  margin-bottom: $space-4;
}
.garden-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $space-3;
  margin-bottom: $space-4;
}
.plot {
  position: relative;
  aspect-ratio: 1;
  background: var(--brutal-lime);
  border: $border-width-lg solid var(--neo-black);
  border-radius: $radius-sm;
  box-shadow: $shadow-sm;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  transition: all $transition-fast;

  &:active {
    transform: translate(3px, 3px);
    box-shadow: none;
  }

  &.empty {
    background: var(--bg-secondary);
    border-style: dashed;
    opacity: 0.6;
  }

  // Growth stages with different visual effects
  &.stage-seedling {
    background: linear-gradient(180deg, var(--brutal-lime) 0%, rgba(var(--text-muted-rgb, 139, 115, 85), 1) 100%);
  }

  &.stage-sprouting {
    background: linear-gradient(
      180deg,
      var(--brutal-lime) 0%,
      color-mix(in srgb, var(--neo-green) 40%, transparent) 100%
    );
  }

  &.stage-growing {
    background: linear-gradient(
      180deg,
      var(--neo-green) 0%,
      color-mix(in srgb, var(--neo-green) 50%, transparent) 100%
    );
  }

  &.stage-blooming {
    background: linear-gradient(180deg, var(--neo-green) 0%, var(--brutal-yellow) 100%);
  }

  &.stage-mature {
    background: linear-gradient(180deg, var(--brutal-yellow) 0%, var(--neo-green) 100%);
    animation: glow 2s ease-in-out infinite;
  }

  &.watering {
    animation: shake 0.5s ease-in-out;
  }
}
.plot-soil {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 30%;
  background: rgba(var(--text-muted-rgb, 139, 115, 85), 1);
  border-top: 2px solid var(--neo-black);
  z-index: 0;
}

.soil-texture {
  width: 100%;
  flex: 1;
  min-height: 0;
  background: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.1) 2px,
    rgba(0, 0, 0, 0.1) 4px
  );
}

.plant-container {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.plant-icon {
  font-size: 2.5em;
  transition: transform $transition-normal;
  filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.3));

  &.ready {
    animation: bounce 1s ease-in-out infinite;
  }
}
.empty-icon {
  font-size: 2em;
  opacity: 0.4;
  z-index: 1;
}

.sparkle-effect {
  position: absolute;
  top: -10px;
  right: -10px;
  font-size: 1.2em;
  animation: sparkle 1.5s ease-in-out infinite;
}

.growth-info {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  width: 85%;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.growth-bar {
  width: 100%;
  height: 8px;
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid var(--neo-black);
  border-radius: $radius-sm;
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
}

.growth-fill {
  flex: 1;
  min-height: 0;
  background: linear-gradient(90deg, var(--neo-green) 0%, var(--brutal-yellow) 100%);
  transition: width $transition-normal;
  box-shadow: 0 0 8px color-mix(in srgb, var(--neo-green) 50%, transparent);
}

.growth-percent {
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  color: var(--neo-black);
  background: rgba(255, 255, 255, 0.9);
  padding: 2px 6px;
  border-radius: $radius-sm;
  border: 1px solid var(--neo-black);
}
.water-drops {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: space-around;
  align-items: flex-start;
  padding-top: 10px;
  pointer-events: none;
  z-index: 3;

  .drop {
    font-size: 1.2em;
    animation: fall 1s ease-in infinite;
    opacity: 0.8;

    &:nth-child(1) {
      animation-delay: 0s;
    }
    &:nth-child(2) {
      animation-delay: 0.3s;
    }
    &:nth-child(3) {
      animation-delay: 0.6s;
    }
  }
}

.seeds-list {
  display: flex;
  flex-direction: column;
  gap: $space-3;
}
.seed-item {
  display: flex;
  align-items: center;
  padding: $space-3;
  background: linear-gradient(135deg, var(--brutal-yellow) 0%, var(--brutal-yellow) 100%);
  border: $border-width-md solid var(--neo-black);
  border-radius: $radius-sm;
  box-shadow: $shadow-sm;
  cursor: pointer;
  transition: all $transition-fast;

  &:active {
    transform: translate(3px, 3px);
    box-shadow: none;
  }

  &:hover {
    box-shadow: $shadow-md;
  }
}

.seed-icon-wrapper {
  position: relative;
  margin-right: $space-3;
}

.seed-icon {
  font-size: 2em;
  filter: drop-shadow(2px 2px 3px rgba(0, 0, 0, 0.2));
}

.seed-packet {
  position: absolute;
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 8px;
  background: var(--neo-black);
  border-radius: 2px;
  opacity: 0.3;
}
.seed-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: $space-1;
}

.seed-name {
  display: block;
  font-weight: $font-weight-bold;
  color: var(--neo-black);
  font-size: $font-size-lg;
}

.seed-details {
  display: flex;
  align-items: center;
  gap: $space-2;
}

.seed-time {
  color: var(--text-secondary);
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;
}

.seed-price-tag {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $space-2 $space-3;
  background: var(--neo-black);
  border-radius: $radius-sm;
  min-width: 60px;
}

.seed-price {
  color: var(--brutal-yellow);
  font-weight: $font-weight-black;
  font-size: $font-size-xl;
  line-height: 1;
}

.seed-currency {
  color: var(--brutal-yellow);
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  margin-top: 2px;
}
.action-btns {
  display: flex;
  gap: $space-3;
}
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $space-3;
}

.stat-item {
  text-align: center;
  padding: $space-4;
  border: $border-width-md solid var(--neo-black);
  border-radius: $radius-sm;
  box-shadow: $shadow-sm;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-2;
  transition: transform $transition-fast;

  &:active {
    transform: scale(0.95);
  }
}

.stat-plants {
  background: linear-gradient(135deg, var(--neo-green) 0%, var(--brutal-lime) 100%);
}

.stat-ready {
  background: linear-gradient(135deg, var(--brutal-yellow) 0%, var(--brutal-yellow) 100%);
}

.stat-harvested {
  background: linear-gradient(135deg, var(--brutal-pink) 0%, var(--brutal-pink) 100%);
}

.stat-icon {
  font-size: $font-size-3xl;
  filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.2));
}

.stat-value {
  display: block;
  font-size: $font-size-3xl;
  font-weight: $font-weight-black;
  color: var(--neo-black);
  line-height: 1;
}

.stat-label {
  color: var(--neo-black);
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

// Animations
@keyframes glow {
  0%,
  100% {
    box-shadow:
      $shadow-sm,
      0 0 10px color-mix(in srgb, var(--brutal-yellow) 30%, transparent);
  }
  50% {
    box-shadow:
      $shadow-md,
      0 0 20px color-mix(in srgb, var(--brutal-yellow) 60%, transparent);
  }
}

@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

@keyframes sparkle {
  0%,
  100% {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.2) rotate(180deg);
  }
}

@keyframes fall {
  0% {
    transform: translateY(0);
    opacity: 0.8;
  }
  100% {
    transform: translateY(60px);
    opacity: 0;
  }
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-3px);
  }
  75% {
    transform: translateX(3px);
  }
}
</style>
