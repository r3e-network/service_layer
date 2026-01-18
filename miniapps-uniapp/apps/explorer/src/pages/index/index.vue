<template>
  <AppLayout  :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <view class="app-container">
      <!-- Network Tab -->
      <view v-if="activeTab === 'network'" class="tab-content">
        <NetworkStats :mainnet-stats="mainnetStats" :testnet-stats="testnetStats" :t="t as any" />
      </view>

      <view v-if="chainType === 'evm'" class="mb-4">
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

      <!-- Status Message -->
      <NeoCard v-if="status" :variant="status.type === 'error' ? 'danger' : 'success'" class="mb-4 text-center">
        <text class="status-text">{{ status.msg }}</text>
      </NeoCard>

      <!-- Search Tab -->
      <view v-if="activeTab === 'search'" class="tab-content">
        <SearchPanel
          v-model:searchQuery="searchQuery"
          v-model:selectedNetwork="selectedNetwork"
          :is-loading="isLoading"
          :t="t as any"
          @search="search"
        />

        <view v-if="isLoading" class="loading">
          <text>{{ t("searching") }}</text>
        </view>

        <SearchResult :result="searchResult" :t="t as any" @viewTx="viewTx" />
      </view>

      <!-- History Tab -->
      <view v-if="activeTab === 'history'" class="tab-content">
        <RecentTransactions :transactions="recentTxs" :t="t as any" @viewTx="viewTx" />
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
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { formatNumber } from "@/shared/utils/format";
import { useI18n } from "@/composables/useI18n";
import { useWallet } from "@neo/uniapp-sdk";
import { AppLayout, NeoDoc, NeoCard, NeoButton } from "@/shared/components";
import type { NavTab } from "@/shared/components/NavBar.vue";
import type { StatItem } from "@/shared/components/NeoStats.vue";

import NetworkStats from "./components/NetworkStats.vue";
import SearchPanel from "./components/SearchPanel.vue";
import SearchResult from "./components/SearchResult.vue";
import RecentTransactions from "./components/RecentTransactions.vue";


const { t } = useI18n();

// Detect host URL for API calls (miniapp runs in iframe)
const getApiBase = () => {
  try {
    if (window.parent !== window) {
      // Running in iframe, use parent origin
      const parentOrigin = document.referrer ? new URL(document.referrer).origin : "";
      if (parentOrigin) return `${parentOrigin}/api/explorer`;
    }
  } catch {
    // Fallback
  }
  return "/api/explorer";
};
const API_BASE = getApiBase();

const docSteps = computed(() => [t("step1"), t("step2"), t("step3"), t("step4")]);
const docFeatures = computed(() => [
  { name: t("feature1Name"), desc: t("feature1Desc") },
  { name: t("feature2Name"), desc: t("feature2Desc") },
]);

const activeTab = ref("search");
const navTabs = computed<NavTab[]>(() => [
  { id: "search", icon: "search", label: t("tabSearch") },
  { id: "network", icon: "activity", label: t("mainnet") },
  { id: "history", icon: "clock", label: t("tabHistory") },
  { id: "docs", icon: "book", label: t("docs") },
]);

const { chainType, switchChain } = useWallet() as any;

const searchQuery = ref("");
const selectedNetwork = ref<"mainnet" | "testnet">("mainnet");
const isLoading = ref(false);
const status = ref<{ msg: string; type: string } | null>(null);
const searchResult = ref<any>(null);
const recentTxs = ref<any[]>([]);

const stats = ref({
  mainnet: { height: 0, txCount: 0 },
  testnet: { height: 0, txCount: 0 },
});

// Timer tracking for cleanup
let statsInterval: ReturnType<typeof setInterval> | null = null;

const formatNum = (n: number) => formatNumber(n, 0);

const mainnetStats = computed<StatItem[]>(() => [
  { label: t("blockHeight"), value: formatNum(stats.value.mainnet.height), variant: "default" },
  { label: t("transactions"), value: formatNum(stats.value.mainnet.txCount), variant: "default" },
]);

const testnetStats = computed<StatItem[]>(() => [
  { label: t("blockHeight"), value: formatNum(stats.value.testnet.height), variant: "default" },
  { label: t("transactions"), value: formatNum(stats.value.testnet.txCount), variant: "default" },
]);

const STATS_CACHE_KEY = "explorer_stats_cache";
const TXS_CACHE_KEY = "explorer_txs_cache";

// Fetch stats via SDK datafeed service
const fetchStats = async () => {
  // Try cache first
  try {
    const cached = uni.getStorageSync(STATS_CACHE_KEY);
    if (cached) stats.value = JSON.parse(cached);
  } catch {}

  let freshStats = null;

  try {
    const res = await uni.request({
      url: `${API_BASE}/stats`,
      method: "GET",
    });
    if (res.statusCode === 200 && res.data) {
      freshStats = res.data as any;
    }
  } catch {
    // Ignore and fall back to cached stats.
  }

  if (freshStats) {
    stats.value = freshStats;
    uni.setStorageSync(STATS_CACHE_KEY, JSON.stringify(freshStats));
  }
};

// Fetch recent transactions via SDK datafeed service
const fetchRecentTxs = async () => {
  // Try cache first
  try {
    const cached = uni.getStorageSync(TXS_CACHE_KEY);
    if (cached) recentTxs.value = JSON.parse(cached);
  } catch {}

  let freshTxs = null;

  try {
    const res = await uni.request({
      url: `${API_BASE}/recent?network=${selectedNetwork.value}&limit=10`,
      method: "GET",
    });
    if (res.statusCode === 200 && res.data) {
      freshTxs = (res.data as any).transactions || [];
    }
  } catch {
    // Ignore and fall back to cached txs.
  }

  if (freshTxs) {
    recentTxs.value = freshTxs;
    uni.setStorageSync(TXS_CACHE_KEY, JSON.stringify(freshTxs));
  }
};

const search = async () => {
  const query = searchQuery.value.trim();
  if (!query) {
    status.value = { msg: t("pleaseEnterQuery"), type: "error" };
    return;
  }

  isLoading.value = true;
  searchResult.value = null;
  status.value = null;

  try {
    const res = await uni.request({
      url: `${API_BASE}/search?q=${encodeURIComponent(query)}&network=${selectedNetwork.value}`,
      method: "GET",
    });

    if (res.statusCode === 200 && res.data) {
      searchResult.value = res.data;
    } else {
      status.value = { msg: t("noResults"), type: "error" };
    }
  } catch (e: any) {
    status.value = { msg: t("searchFailed"), type: "error" };
  } finally {
    isLoading.value = false;
  }
};

const viewTx = (hash: string) => {
  searchQuery.value = hash;
  activeTab.value = "search";
  search();
};

onMounted(() => {
  fetchStats();
  fetchRecentTxs();
  statsInterval = setInterval(fetchStats, 15000);
});

watch(selectedNetwork, () => {
  fetchRecentTxs();
});

onUnmounted(() => {
  if (statsInterval) {
    clearInterval(statsInterval);
    statsInterval = null;
  }
});
</script>

<style lang="scss" scoped>
@use "@/shared/styles/tokens.scss" as *;
@use "@/shared/styles/variables.scss";

$matrix-bg: #000;
$matrix-green: #00ff00;
$matrix-dim: #003300;
$matrix-font: 'Courier New', monospace;

:global(page) {
  background: $matrix-bg;
  font-family: $matrix-font;
}

.app-container {
  padding: 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background-color: $matrix-bg;
  color: $matrix-green;
  min-height: 100vh;
  /* Scanlines */
  background-image: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
  background-size: 100% 2px, 3px 100%;
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Matrix Component Overrides */
:deep(.neo-card) {
  background: black !important;
  border: 1px solid $matrix-green !important;
  border-radius: 0 !important;
  box-shadow: 0 0 10px $matrix-dim, inset 0 0 20px $matrix-dim !important;
  color: $matrix-green !important;
  
  &.variant-danger {
    border-color: red !important;
    color: red !important;
    box-shadow: 0 0 10px #300 !important;
  }
}

:deep(.neo-button) {
  background: black !important;
  border: 1px solid $matrix-green !important;
  color: $matrix-green !important;
  border-radius: 0 !important;
  text-transform: uppercase;
  font-family: $matrix-font;
  
  &:active {
    background: $matrix-green !important;
    color: black !important;
  }
}

:deep(input), :deep(.neo-input) {
  background: #001100 !important;
  border: 1px solid $matrix-green !important;
  color: $matrix-green !important;
  font-family: $matrix-font !important;
  border-radius: 0 !important;
}

:deep(text), :deep(view) {
  font-family: $matrix-font !important;
}

.status-text {
  font-family: $matrix-font;
  font-size: 14px;
  font-weight: bold;
  color: $matrix-green;
  text-align: center;
  text-shadow: 0 0 5px $matrix-green;
}

.loading {
  text-align: center;
  padding: 20px;
  animation: blink 1s infinite;
}

@keyframes blink {
  0% { opacity: 1; }
  50% { opacity: 0; }
  100% { opacity: 1; }
}

.scrollable {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>
