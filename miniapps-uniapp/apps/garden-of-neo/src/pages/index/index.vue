<template>
  <AppLayout :title="t('title')" show-top-nav :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
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
import { createT } from "@/shared/utils/i18n";
import { AppLayout, NeoDoc, NeoCard, NeoButton } from "@/shared/components";
import GardenTab from "./components/GardenTab.vue";
import StatsTab from "./components/StatsTab.vue";

const translations = {
  title: { en: "Garden of Neo", zh: "Neo花园" },
  subtitle: { en: "Grow and trade virtual garden NFTs", zh: "种植和交易虚拟花园NFT" },
  garden: { en: "Garden", zh: "花园" },
  stats: { en: "Stats", zh: "统计" },
  yourGarden: { en: "Your Garden", zh: "你的花园" },
  availableSeeds: { en: "Available Seeds", zh: "可用种子" },
  hoursToGrow: { en: "blocks to mature", zh: "区块成熟" },
  actions: { en: "Actions", zh: "操作" },
  refreshStatus: { en: "Refresh Status", zh: "刷新状态" },
  refreshing: { en: "Refreshing...", zh: "刷新中..." },
  harvesting: { en: "Harvesting...", zh: "收获中..." },
  plantFee: { en: "Plant fee: 0.1 GAS", zh: "种植费用：0.1 GAS" },
  harvestReady: { en: "Harvest Ready Plants", zh: "收获成熟植物" },
  gardenStats: { en: "Garden Stats", zh: "花园统计" },
  plants: { en: "Plants", zh: "植物" },
  ready: { en: "Ready", zh: "成熟" },
  harvested: { en: "Harvested", zh: "已收获" },
  noEmptyPlots: { en: "No empty plots available", zh: "没有空闲地块" },
  plantingSeed: { en: "Planting seed...", zh: "种植中..." },
  plantSuccess: { en: "Seed planted", zh: "种子已种植" },
  harvested2: { en: "Harvested", zh: "已收获" }, // cleanup dupes if needed but keeping safe
  harvestedPlants: { en: "plants!", zh: "株植物！" },
  noReady: { en: "No plants ready to harvest", zh: "没有可收获的植物" },
  error: { en: "Error", zh: "错误" },
  connectWallet: { en: "Connect wallet", zh: "连接钱包" },
  missingContract: { en: "Contract not configured", zh: "合约未配置" },
  failedToLoad: { en: "Failed to load garden", zh: "加载花园失败" },
  harvestSuccess: { en: "Plant harvested", zh: "植物已收获" },
  seedFire: { en: "Fire Seed", zh: "火种" },
  seedIce: { en: "Ice Seed", zh: "冰种" },
  seedEarth: { en: "Earth Seed", zh: "土种" },
  seedWind: { en: "Wind Seed", zh: "风种" },
  seedLight: { en: "Light Seed", zh: "光种" },
  wrongChain: { en: "Wrong Network", zh: "网络错误" },
  wrongChainMessage: { en: "This app requires Neo N3 network.", zh: "此应用需 Neo N3 网络。" },
  switchToNeo: { en: "Switch to Neo N3", zh: "切换到 Neo N3" },

  docs: { en: "Docs", zh: "文档" },
  docSubtitle: {
    en: "Virtual garden where plants grow with blockchain activity",
    zh: "植物随区块链活动生长的虚拟花园",
  },
  docDescription: {
    en: "Garden of Neo is a blockchain-powered virtual garden. Plant elemental seeds, watch them grow as blocks are mined, and harvest mature plants for rewards.",
    zh: "Neo 花园是一个区块链驱动的虚拟花园。种植元素种子，随着区块挖掘观察它们生长，收获成熟植物获得奖励。",
  },
  step1: { en: "Connect your wallet.", zh: "连接钱包。" },
  step2: { en: "Plant seeds and wait for maturity.", zh: "种植并等待成熟。" },
  step3: { en: "Harvest mature plants.", zh: "收获成熟植物。" },
  step4: { en: "Collect rewards and replant for more.", zh: "收集奖励并重新种植获取更多。" },
  feature1Name: { en: "Block-Based Growth", zh: "基于区块的生长" },
  feature1Desc: {
    en: "Plant growth is tied to Neo blockchain activity.",
    zh: "植物生长与 Neo 区块链活动相关联。",
  },
  feature2Name: { en: "Elemental Seeds", zh: "元素种子" },
  feature2Desc: {
    en: "Choose from Fire, Ice, Earth, Wind, and Light seeds.",
    zh: "从火、冰、土、风、光种子中选择。",
  },
};

const t = createT(translations);

const navTabs = [
  { id: "garden", icon: "leaf", label: t("garden") },
  { id: "stats", icon: "chart", label: t("stats") },
  { id: "docs", icon: "book", label: t("docs") },
];

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
const { chainType, switchChain } = useWallet() as any;
const contractAddress = ref<string>("0xa07521e6be12b9d2a138848f08080f084ba1cf39"); // Placeholder address from Ex Files

const ensureContractAddress = async () => {
  return;
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

.tab-content {
  padding: $space-6;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: $space-6;
  background-color: transparent;
}
.scrollable {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>
