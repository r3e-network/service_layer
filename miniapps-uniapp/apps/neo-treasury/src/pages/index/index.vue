<template>
  <AppLayout :title="t('title')" show-top-nav :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <view v-if="activeTab !== 'docs'" class="app-container">
      <!-- Status Message -->
      <NeoCard v-if="status" :variant="status.type === 'error' ? 'danger' : 'success'" class="mb-4 text-center">
        <text class="status-text">{{ status.msg }}</text>
      </NeoCard>

      <!-- Main Content -->
      <view v-if="data" class="fade-in">
        <!-- Background Refresh Indicator -->
        <view v-if="loading" class="soft-loading">
          <AppIcon name="loader" :size="16" class="animate-spin" />
          <text class="soft-loading-text">REFRESHING...</text>
        </view>

        <!-- Overview Tab -->
        <view v-if="activeTab === 'total'" class="tab-content">
          <TotalSummaryCard
            :total-usd="data.totalUsd"
            :total-neo="data.totalNeo"
            :total-gas="data.totalGas"
            :last-updated="data.lastUpdated"
            :t="t as any"
          />

          <PriceGrid :prices="data.prices" />

          <FoundersList :categories="data.categories" :t="t as any" @select="goToFounder" />
        </view>

        <!-- Founder Tabs -->
        <view v-if="activeTab === 'da'" class="tab-content">
          <FounderDetail :category="daCategory!" :prices="data.prices" :t="t as any" />
        </view>

        <view v-if="activeTab === 'erik'" class="tab-content">
          <FounderDetail :category="erikCategory!" :prices="data.prices" :t="t as any" />
        </view>
      </view>

      <!-- Initial Loading State (Only if no data) -->
      <view v-else-if="loading" class="loading-container">
        <view class="skeleton-card mb-4"></view>
        <view class="skeleton-grid mb-4"></view>
        <view class="skeleton-list"></view>
        <view class="loading-overlay">
          <AppIcon name="loader" :size="48" class="animate-spin mb-4" />
          <text class="loading-label">{{ t("loading") }}</text>
        </view>
      </view>

      <!-- Error State -->
      <view v-else-if="error" class="error-container">
        <AppIcon name="alert-circle" :size="48" class="mb-4 text-danger" />
        <text class="error-label">{{ error }}</text>
        <NeoButton variant="primary" class="mt-4" @click="loadData">
          {{ t("retry") }}
        </NeoButton>
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
import { ref, computed, onMounted } from "vue";
import { AppLayout, NeoCard, NeoButton, NeoDoc, AppIcon } from "@/shared/components";
import type { NavTab } from "@/shared/components/NavBar.vue";
import { createT } from "@/shared/utils/i18n";
import { fetchTreasuryData, type TreasuryData, type CategoryBalance } from "@/utils/treasury";

import TotalSummaryCard from "./components/TotalSummaryCard.vue";
import PriceGrid from "./components/PriceGrid.vue";
import FoundersList from "./components/FoundersList.vue";
import FounderDetail from "./components/FounderDetail.vue";

const translations = {
  title: { en: "Neo Treasury", zh: "Neo 国库" },
  loading: { en: "Loading stats...", zh: "加载统计中..." },
  retry: { en: "Retry Load", zh: "重试加载" },
  totalTreasury: { en: "Foundation Assets", zh: "基金会资产" },
  lastUpdated: { en: "Updated", zh: "已更新" },
  founders: { en: "Core Founders", zh: "核心创始人" },
  wallets: { en: "wallets", zh: "个钱包" },
  tabTotal: { en: "Overview", zh: "总览" },
  tabDa: { en: "Da Hongfei", zh: "达鸿飞" },
  tabErik: { en: "Erik Zhang", zh: "张铮文" },
  docs: { en: "Docs", zh: "文档" },
  walletList: { en: "Asset Breakdown", zh: "资产明细" },
  addresses: { en: "addresses", zh: "个地址" },
  fullAddress: { en: "Full Address", zh: "完整地址" },
  breakdown: { en: "Current Balance", zh: "当前余额" },
  docSubtitle: {
    en: "Transparent view of Neo's core network assets",
    zh: "Neo 核心网络资产的透明化视图",
  },
  docDescription: {
    en: "The Neo Treasury MiniApp provides real-time transparency into the assets held by Neo's core founders and foundation. This tool is essential for monitoring network decentralization and governance health.",
    zh: "Neo Treasury MiniApp 为 Neo 核心创始人及基金会所持资产提供实时透明度。该工具对于监控网络去中心化和治理健康至关重要。",
  },
  step1: { en: "View the total USD value of core treasury assets", zh: "查看核心国库资产的总美元价值" },
  step2: { en: "Monitor real-time prices for NEO and GAS tokens", zh: "监控 NEO 和 GAS 代币的实时价格" },
  step3: { en: "Drill down into individual founder holdings and wallets", zh: "深入查看个人创始人的持有量和钱包" },
  step4: { en: "Track historical balances and network distribution", zh: "追踪历史余额和网络分布" },
  feature1Name: { en: "Real-time Prices", zh: "实时价格" },
  feature1Desc: { en: "Integrated price feed for accurate valuation.", zh: "集成价格反馈，实现准确估值。" },
  feature2Name: { en: "Direct RPC", zh: "直接 RPC" },
  feature2Desc: { en: "Fetch live balances directly from the N3 blockchain.", zh: "直接从 N3 区块链获取实时余额。" },
  feature3Name: { en: "Full Disclosure", zh: "充分披露" },
  feature3Desc: { en: "Transparent list of all known founder addresses.", zh: "所有已知创始人地址的透明列表。" },
};

const t = createT(translations);

const navTabs: NavTab[] = [
  { id: "total", icon: "chart", label: t("tabTotal") },
  { id: "da", icon: "user", label: t("tabDa") },
  { id: "erik", icon: "user", label: t("tabErik") },
  { id: "docs", icon: "book", label: t("docs") },
];

const activeTab = ref("total");
const loading = ref(true);
const error = ref("");
const status = ref<{ msg: string; type: string } | null>(null);
const data = ref<TreasuryData | null>(null);

const docSteps = computed(() => [t("step1"), t("step2"), t("step3"), t("step4")]);
const docFeatures = computed(() => [
  { name: t("feature1Name"), desc: t("feature1Desc") },
  { name: t("feature2Name"), desc: t("feature2Desc") },
  { name: t("feature3Name"), desc: t("feature3Desc") },
]);

const daCategory = computed<CategoryBalance | null>(() => {
  return data.value?.categories.find((c: CategoryBalance) => c.name === "Da Hongfei") || null;
});

const erikCategory = computed<CategoryBalance | null>(() => {
  return data.value?.categories.find((c: CategoryBalance) => c.name === "Erik Zhang") || null;
});

function goToFounder(name: string) {
  if (name === "Da Hongfei") activeTab.value = "da";
  else if (name === "Erik Zhang") activeTab.value = "erik";
}

const CACHE_KEY = "neo_treasury_cache";

async function loadData() {
  loading.value = true;
  error.value = "";

  // 1. Try to load from cache first
  try {
    const cached = uni.getStorageSync(CACHE_KEY);
    if (cached) {
      data.value = JSON.parse(cached);
      // If we have cache, we can stop "hard" loading but keep "soft" loading in background
    }
  } catch (e) {
    console.warn("Failed to load treasury cache", e);
  }

  try {
    const freshData = await fetchTreasuryData();
    data.value = freshData;
    // 2. Save to cache
    uni.setStorageSync(CACHE_KEY, JSON.stringify(freshData));
  } catch (e) {
    if (!data.value) {
      error.value = e instanceof Error ? e.message : "Failed to load treasury data";
    } else {
      console.error("Background refresh failed", e);
    }
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadData();
});
</script>

<style lang="scss" scoped>
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.app-container {
  padding: 20px;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  gap: 16px;
}

.tab-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.loading-container {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 16px;
  overflow: hidden;
}

.loading-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.soft-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(0, 229, 153, 0.1);
  color: #00E599;
  margin-bottom: 16px;
  border: 1px solid rgba(0, 229, 153, 0.2);
  border-radius: 99px;
  backdrop-filter: blur(10px);
  margin-left: auto;
  margin-right: auto;
  width: fit-content;
  box-shadow: 0 0 15px rgba(0, 229, 153, 0.1);
}

.soft-loading-text {
  font-family: 'Inter', monospace;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
}

.skeleton-card {
  height: 120px;
  background: var(--bg-card, rgba(255, 255, 255, 0.03));
  border: 1px solid var(--border-color, rgba(255, 255, 255, 0.05));
  border-radius: 20px;
  animation: pulse 2s infinite;
}

.skeleton-grid {
  height: 80px;
  background: var(--bg-card, rgba(255, 255, 255, 0.03));
  border: 1px solid var(--border-color, rgba(255, 255, 255, 0.05));
  border-radius: 20px;
  animation: pulse 2s infinite;
  animation-delay: 0.2s;
}

.skeleton-list {
  flex: 1;
  background: var(--bg-card, rgba(255, 255, 255, 0.02));
  border: 1px solid var(--border-color, rgba(255, 255, 255, 0.05));
  border-radius: 20px;
  animation: pulse 2s infinite;
  animation-delay: 0.4s;
}

@keyframes pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 0.3; }
}

.error-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 0;
}

.loading-label,
.error-label {
  font-family: 'Inter', monospace;
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--text-secondary, rgba(255, 255, 255, 0.5));
  letter-spacing: 0.05em;
}

.status-text {
  font-family: 'Inter', monospace;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  color: white;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.fade-in {
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}


.text-danger {
  color: #ef4444;
}

.scrollable {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>
