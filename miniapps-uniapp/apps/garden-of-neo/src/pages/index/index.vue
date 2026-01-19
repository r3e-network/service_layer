<template>
  <AppLayout class="theme-garden-of-neo" :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <view v-if="activeTab === 'garden'" class="flex flex-col h-full">
      <view v-if="chainType === 'evm'" class="p-6 pb-0">
        <NeoCard variant="danger">
          <view class="flex flex-col items-center gap-2 py-1">
            <text class="text-center font-bold">{{ t("wrongChain") }}</text>
            <text class="text-xs text-center opacity-80">{{ t("wrongChainMessage") }}</text>
            <NeoButton size="sm" variant="secondary" class="mt-2" @click="() => switchChain('neo-n3-mainnet')">{{ t("switchToNeo") }}</NeoButton>
          </view>
        </NeoCard>
      </view>
      <GardenTab
        :t="t as any"
        :contract-address="contractAddress"
        :ensure-contract-address="ensureContractAddress"
        @update:stats="updateStats"
      />
    </view>

    <StatsTab
      v-if="activeTab === 'stats'"
      :t="t as any"
      :total-plants="stats.totalPlants"
      :ready-to-harvest="stats.readyToHarvest"
      :total-harvested="stats.totalHarvested"
    />

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
import { useWallet } from "@neo/uniapp-sdk";
import { useI18n } from "@/composables/useI18n";
import { AppLayout, NeoDoc, NeoCard, NeoButton } from "@/shared/components";
import GardenTab from "./components/GardenTab.vue";
import StatsTab from "./components/StatsTab.vue";


const { t } = useI18n();

const navTabs = computed(() => [
  { id: "garden", icon: "leaf", label: t("garden") },
  { id: "stats", icon: "chart", label: t("stats") },
  { id: "docs", icon: "book", label: t("docs") },
]);

const activeTab = ref("garden");

// Stats State
const stats = ref({
  totalPlants: 0,
  readyToHarvest: 0,
  totalHarvested: 0,
});

const updateStats = (newStats: any) => {
  stats.value = newStats;
};

// Wallet & Contract
const { chainType, switchChain, getContractAddress } = useWallet() as any;
const contractAddress = ref<string | null>(null);

const ensureContractAddress = async () => {
  if (!contractAddress.value) {
    contractAddress.value = await getContractAddress();
  }
  if (!contractAddress.value) throw new Error(t("missingContract"));
  return contractAddress.value;
};

// Docs
const docSteps = computed(() => [t("step1"), t("step2"), t("step3"), t("step4")]);
const docFeatures = computed(() => [
  { name: t("feature1Name"), desc: t("feature1Desc") },
  { name: t("feature2Name"), desc: t("feature2Desc") },
]);
</script>

<style lang="scss" scoped>
@use "@/shared/styles/tokens.scss" as *;
@use "@/shared/styles/variables.scss";

@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap');

:global(.theme-garden-of-neo) {
  --garden-font: 'Nunito', sans-serif;
  --garden-bg: #0f1a12;
  --garden-bg-secondary: #142416;
  --garden-bg-elevated: #1b2d20;
  --garden-card-bg: rgba(18, 30, 21, 0.78);
  --garden-card-border: rgba(102, 187, 106, 0.2);
  --garden-card-shadow: 0 8px 32px rgba(10, 18, 12, 0.45);
  --garden-text: #eaf5e7;
  --garden-text-secondary: #b7d6c0;
  --garden-text-muted: #8db19a;
  --garden-accent: #2e7d32;
  --garden-leaf: #66bb6a;
  --garden-button-text: #0b0c16;
  --garden-button-secondary-bg: rgba(255, 255, 255, 0.08);
  --garden-button-secondary-border: rgba(102, 187, 106, 0.4);
  --garden-button-secondary-text: #a7d9b1;
  --garden-pattern: rgba(102, 187, 106, 0.18);
  --garden-sheen: rgba(255, 255, 255, 0.18);
  --garden-danger-bg: rgba(127, 29, 29, 0.22);
  --garden-danger-border: rgba(239, 68, 68, 0.5);
  --garden-danger-text: #fecaca;

  --garden-plot-bg: rgba(255, 255, 255, 0.05);
  --garden-plot-border: rgba(255, 255, 255, 0.1);
  --garden-plot-empty-bg: rgba(0, 0, 0, 0.2);
  --garden-plot-empty-border: var(--garden-text-muted);
  --garden-plot-empty-hover-bg: rgba(255, 255, 255, 0.12);
  --garden-plot-shadow: 0 4px 6px rgba(0, 0, 0, 0.25);
  --garden-plant-shadow: 0 4px 4px rgba(0, 0, 0, 0.3);
  --garden-stage-seedling-bg: rgba(16, 185, 129, 0.12);
  --garden-stage-seedling-border: rgba(16, 185, 129, 0.32);
  --garden-stage-sprouting-bg: rgba(16, 185, 129, 0.2);
  --garden-stage-sprouting-border: rgba(16, 185, 129, 0.4);
  --garden-stage-growing-bg: rgba(245, 158, 11, 0.2);
  --garden-stage-growing-border: rgba(245, 158, 11, 0.4);
  --garden-stage-blooming-bg: rgba(236, 72, 153, 0.2);
  --garden-stage-blooming-border: rgba(236, 72, 153, 0.4);
  --garden-stage-mature-bg: rgba(16, 185, 129, 0.3);
  --garden-stage-mature-border: rgba(16, 185, 129, 0.5);
  --garden-stage-mature-shadow: 0 0 15px rgba(16, 185, 129, 0.2);
  --garden-ready-start: #34d399;
  --garden-ready-end: #10b981;
  --garden-ready-text: #0b0c16;
  --garden-ready-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
  --garden-growth-bg: rgba(0, 0, 0, 0.6);
  --garden-seed-item-bg: rgba(255, 255, 255, 0.05);
  --garden-seed-item-border: rgba(255, 255, 255, 0.1);
  --garden-seed-item-active-bg: rgba(255, 255, 255, 0.12);
  --garden-seed-icon-bg: rgba(255, 255, 255, 0.1);
  --garden-seed-icon-border: rgba(255, 255, 255, 0.2);
  --garden-seed-time-bg: rgba(0, 0, 0, 0.3);
  --garden-price-bg: rgba(16, 185, 129, 0.2);
  --garden-price-border: rgba(16, 185, 129, 0.3);
  --garden-price-text: #34d399;

  --bg-primary: var(--garden-bg);
  --bg-secondary: var(--garden-bg-secondary);
  --bg-card: var(--garden-card-bg);
  --bg-elevated: var(--garden-bg-elevated);
  --text-primary: var(--garden-text);
  --text-secondary: var(--garden-text-secondary);
  --text-muted: var(--garden-text-muted);
}

:global(.theme-light .theme-garden-of-neo),
:global([data-theme="light"] .theme-garden-of-neo) {
  --garden-bg: #f1f8e9;
  --garden-bg-secondary: #e8f5e9;
  --garden-bg-elevated: #f6fbf1;
  --garden-card-bg: rgba(255, 255, 255, 0.7);
  --garden-card-border: rgba(139, 195, 74, 0.3);
  --garden-card-shadow: 0 8px 32px rgba(46, 125, 50, 0.1);
  --garden-text: #5d4037;
  --garden-text-secondary: #6b7d6e;
  --garden-text-muted: #8a9a8b;
  --garden-accent: #2e7d32;
  --garden-leaf: #66bb6a;
  --garden-button-text: #ffffff;
  --garden-button-secondary-bg: rgba(255, 255, 255, 0.6);
  --garden-button-secondary-border: rgba(102, 187, 106, 0.5);
  --garden-button-secondary-text: #2e7d32;
  --garden-pattern: rgba(165, 214, 167, 0.3);
  --garden-sheen: rgba(255, 255, 255, 0.4);
  --garden-danger-bg: #ffebee;
  --garden-danger-border: rgba(239, 68, 68, 0.5);
  --garden-danger-text: #b91c1c;

  --garden-plot-bg: rgba(255, 255, 255, 0.6);
  --garden-plot-border: rgba(139, 195, 74, 0.3);
  --garden-plot-empty-bg: rgba(0, 0, 0, 0.08);
  --garden-plot-empty-border: rgba(46, 125, 50, 0.3);
  --garden-plot-empty-hover-bg: rgba(255, 255, 255, 0.7);
  --garden-plot-shadow: 0 4px 6px rgba(46, 125, 50, 0.1);
  --garden-plant-shadow: 0 4px 4px rgba(46, 125, 50, 0.15);
  --garden-stage-seedling-bg: rgba(16, 185, 129, 0.12);
  --garden-stage-seedling-border: rgba(16, 185, 129, 0.28);
  --garden-stage-sprouting-bg: rgba(16, 185, 129, 0.2);
  --garden-stage-sprouting-border: rgba(16, 185, 129, 0.36);
  --garden-stage-growing-bg: rgba(245, 158, 11, 0.22);
  --garden-stage-growing-border: rgba(245, 158, 11, 0.42);
  --garden-stage-blooming-bg: rgba(236, 72, 153, 0.2);
  --garden-stage-blooming-border: rgba(236, 72, 153, 0.4);
  --garden-stage-mature-bg: rgba(16, 185, 129, 0.26);
  --garden-stage-mature-border: rgba(16, 185, 129, 0.4);
  --garden-stage-mature-shadow: 0 0 12px rgba(16, 185, 129, 0.18);
  --garden-ready-start: #34d399;
  --garden-ready-end: #10b981;
  --garden-ready-text: #0b0c16;
  --garden-ready-shadow: 0 2px 5px rgba(46, 125, 50, 0.2);
  --garden-growth-bg: rgba(0, 0, 0, 0.5);
  --garden-seed-item-bg: rgba(255, 255, 255, 0.65);
  --garden-seed-item-border: rgba(139, 195, 74, 0.25);
  --garden-seed-item-active-bg: rgba(255, 255, 255, 0.75);
  --garden-seed-icon-bg: rgba(255, 255, 255, 0.7);
  --garden-seed-icon-border: rgba(139, 195, 74, 0.25);
  --garden-seed-time-bg: rgba(0, 0, 0, 0.2);
  --garden-price-bg: rgba(16, 185, 129, 0.18);
  --garden-price-border: rgba(16, 185, 129, 0.3);
  --garden-price-text: #2e7d32;

  --bg-primary: var(--garden-bg);
  --bg-secondary: var(--garden-bg-secondary);
  --bg-card: var(--garden-card-bg);
  --bg-elevated: var(--garden-bg-elevated);
  --text-primary: var(--garden-text);
  --text-secondary: var(--garden-text-secondary);
  --text-muted: var(--garden-text-muted);
}

:global(page) {
  background: var(--garden-bg);
  font-family: var(--garden-font);
}

.tab-content {
  padding: 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: linear-gradient(180deg, var(--garden-bg) 0%, var(--garden-bg-secondary) 100%);
  min-height: 100vh;
  position: relative;
  font-family: var(--garden-font);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  
  /* Leaf Pattern */
  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background-image:
      radial-gradient(circle at 4px 4px, var(--garden-pattern) 2px, transparent 0);
    background-size: 32px 32px;
    opacity: 0.3;
    pointer-events: none;
    z-index: 0;
  }
}

.scrollable {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* Organic/Ethereal Overrides */
:deep(.neo-card) {
  background: var(--garden-card-bg) !important;
  border: 1px solid var(--garden-card-border) !important;
  border-radius: 20px !important;
  box-shadow: var(--garden-card-shadow) !important;
  color: var(--garden-text) !important;
  backdrop-filter: blur(12px);
  position: relative;
  overflow: hidden;

  /* Glass sheen */
  &::after {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; height: 100%;
    background: linear-gradient(135deg, var(--garden-sheen) 0%, transparent 100%);
    pointer-events: none;
  }

  &.variant-danger {
    border-color: var(--garden-danger-border) !important;
    background: var(--garden-danger-bg) !important;
    color: var(--garden-danger-text) !important;
  }
}

:deep(.neo-button) {
  border-radius: 12px !important;
  font-weight: 800 !important;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  transition: all 0.2s ease;
  
  &.variant-primary {
    background: linear-gradient(135deg, var(--garden-leaf) 0%, var(--garden-accent) 100%) !important;
    color: var(--garden-button-text) !important;
    border: none !important;
    box-shadow: 0 4px 15px rgba(46, 125, 50, 0.3) !important;
    
    &:active {
      transform: scale(0.96);
      box-shadow: 0 2px 10px rgba(46, 125, 50, 0.2) !important;
    }
  }
  &.variant-secondary {
    background: var(--garden-button-secondary-bg) !important;
    border: 2px solid var(--garden-button-secondary-border) !important;
    color: var(--garden-button-secondary-text) !important;
    
    &:hover {
      background: rgba(102, 187, 106, 0.1) !important;
    }
  }
}

:deep(.app-layout) {
  background: var(--bg-primary);
  background-image: none;
}
</style>
