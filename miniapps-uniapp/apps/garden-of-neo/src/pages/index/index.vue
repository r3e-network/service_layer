<template>
  <AppLayout  :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <view v-if="activeTab === 'garden'" class="flex flex-col h-full">
      <view v-if="chainType === 'evm'" class="p-6 pb-0">
        <NeoCard variant="danger">
          <view class="flex flex-col items-center gap-2 py-1">
            <text class="text-center font-bold text-red-400">{{ t("wrongChain") }}</text>
            <text class="text-xs text-center opacity-80 text-white">{{ t("wrongChainMessage") }}</text>
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

$garden-bg-light: #f1f8e9;
$garden-bg-dark: #dcedc8;
$garden-accent: #2e7d32;
$garden-soil: #5d4037;
$garden-leaf: #66bb6a;
$garden-font: 'Nunito', sans-serif;

:global(page) {
  background: $garden-bg-light;
  font-family: $garden-font;
}

.tab-content {
  padding: 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: linear-gradient(180deg, $garden-bg-light 0%, #e8f5e9 100%);
  min-height: 100vh;
  position: relative;
  font-family: $garden-font;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  
  /* Leaf Pattern */
  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background-image: 
      url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDIwIDIwIj48cGF0aCBmaWxsPSIjYTVkNmE3IiBkPSJNMTAgMGE5Ljk5IDkuOTkgMCAwIDEgMTAgMTBhoS45OSA5Ljk5IDAgMCAxLTEwIDEwQTkuOTkgOS45OSAwIDAgMSAwIDEwIDkuOTkgOS45OSAwIDAgMSAxMCAwem0wIDJjLTQuNDEgMC04IDMuNTktOCA4czMuNTkgOCA4IDggOC0zLjU5IDgtOC0zLjU5LTgtOC04eiIgb3BhY2l0eT0iMC4xIi8+PC9zdmc+');
    background-size: 40px 40px;
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
  background: rgba(255, 255, 255, 0.7) !important;
  border: 1px solid rgba(139, 195, 74, 0.3) !important;
  border-radius: 20px !important;
  box-shadow: 0 8px 32px rgba(46, 125, 50, 0.1) !important;
  color: $garden-soil !important;
  backdrop-filter: blur(12px);
  position: relative;
  overflow: hidden;

  /* Glass sheen */
  &::after {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; height: 100%;
    background: linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 100%);
    pointer-events: none;
  }
}

:deep(.neo-button) {
  border-radius: 12px !important;
  font-weight: 800 !important;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  transition: all 0.2s ease;
  
  &.variant-primary {
    background: linear-gradient(135deg, $garden-leaf 0%, $garden-accent 100%) !important;
    color: #fff !important;
    border: none !important;
    box-shadow: 0 4px 15px rgba(46, 125, 50, 0.3) !important;
    
    &:active {
      transform: scale(0.96);
      box-shadow: 0 2px 10px rgba(46, 125, 50, 0.2) !important;
    }
  }
  &.variant-secondary {
    background: rgba(255, 255, 255, 0.5) !important;
    border: 2px solid $garden-leaf !important;
    color: $garden-accent !important;
    
    &:hover {
      background: rgba(102, 187, 106, 0.1) !important;
    }
  }
}
</style>
