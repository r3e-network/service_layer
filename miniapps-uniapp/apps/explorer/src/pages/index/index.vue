<template>
  <AppLayout :title="t('title')" show-top-nav :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <view v-if="activeTab === 'search' || activeTab === 'history'" class="app-container">
      <!-- Network Stats Cards -->
      <NetworkStats :mainnet-stats="mainnetStats" :testnet-stats="testnetStats" :t="t as any" />

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
import { ref, computed, onMounted, onUnmounted } from "vue";
import { formatNumber } from "@/shared/utils/format";
import { createT } from "@/shared/utils/i18n";
import { useWallet } from "@neo/uniapp-sdk";
import { AppLayout, NeoDoc, NeoCard, NeoButton } from "@/shared/components";
import type { NavTab } from "@/shared/components/NavBar.vue";
import type { StatItem } from "@/shared/components/NeoStats.vue";

import NetworkStats from "./components/NetworkStats.vue";
import SearchPanel from "./components/SearchPanel.vue";
import SearchResult from "./components/SearchResult.vue";
import RecentTransactions from "./components/RecentTransactions.vue";

const translations = {
  title: { en: "Neo Explorer", zh: "Neo 浏览器" },
  subtitle: { en: "Search transactions, addresses, contracts", zh: "搜索交易、地址、合约" },
  mainnet: { en: "Mainnet", zh: "主网" },
  testnet: { en: "Testnet", zh: "测试网" },
  blockHeight: { en: "Block Height", zh: "区块高度" },
  transactions: { en: "Transactions", zh: "交易数" },
  searchPlaceholder: { en: "Search tx hash, address, or contract...", zh: "搜索交易哈希、地址或合约..." },
  search: { en: "Search", zh: "搜索" },
  searching: { en: "Searching...", zh: "搜索中..." },
  searchResult: { en: "Search Result", zh: "搜索结果" },
  transaction: { en: "Transaction", zh: "交易" },
  address: { en: "Address", zh: "地址" },
  contract: { en: "Contract", zh: "合约" },
  hash: { en: "Hash:", zh: "哈希:" },
  block: { en: "Block:", zh: "区块:" },
  time: { en: "Time:", zh: "时间:" },
  sender: { en: "Sender:", zh: "发送者:" },
  gasConsumed: { en: "Gas Consumed:", zh: "消耗Gas:" },
  recentTransactions: { en: "Recent Transactions", zh: "最近交易" },
  pleaseEnterQuery: { en: "Please enter a search query", zh: "请输入搜索内容" },
  noResults: { en: "No results found", zh: "未找到结果" },
  searchFailed: { en: "Search failed", zh: "搜索失败" },
  tabSearch: { en: "Search", zh: "搜索" },
  tabHistory: { en: "History", zh: "历史" },
  wrongChain: { en: "Wrong Network", zh: "网络错误" },
  wrongChainMessage: { en: "This app requires Neo N3 network.", zh: "此应用需 Neo N3 网络。" },
  switchToNeo: { en: "Switch to Neo N3", zh: "切换到 Neo N3" },

  docs: { en: "Docs", zh: "文档" },
  docSubtitle: {
    en: "Browse Neo N3 blockchain data in real-time",
    zh: "实时浏览 Neo N3 区块链数据",
  },
  docDescription: {
    en: "Explorer provides a comprehensive view of the Neo N3 blockchain. Search transactions, inspect addresses, and analyze smart contracts.",
    zh: "Explorer 提供 Neo N3 区块链的全面视图。搜索交易、检查地址并分析智能合约。",
  },
  step1: {
    en: "Enter a transaction hash, address, or contract address",
    zh: "输入交易哈希、地址或合约哈希",
  },
  step2: {
    en: "View detailed information about the searched item",
    zh: "查看搜索项目的详细信息",
  },
  step3: {
    en: "Explore related transactions and contract interactions",
    zh: "探索相关交易和合约交互",
  },
  step4: {
    en: "Bookmark addresses you want to monitor",
    zh: "收藏您想监控的地址",
  },
  feature1Name: { en: "Real-Time Data", zh: "实时数据" },
  feature1Desc: {
    en: "Live blockchain data updated as new blocks are confirmed.",
    zh: "实时区块链数据，随新区块确认而更新。",
  },
  feature2Name: { en: "Deep Analysis", zh: "深度分析" },
  feature2Desc: {
    en: "Detailed transaction traces and contract state inspection.",
    zh: "详细的交易追踪和合约状态检查。",
  },
  error: { en: "Error", zh: "错误" },
};

const t = createT(translations);
const APP_ID = "miniapp-explorer";

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
const navTabs: NavTab[] = [
  { id: "search", icon: "search", label: t("tabSearch") },
  { id: "history", icon: "clock", label: t("tabHistory") },
  { id: "docs", icon: "book", label: t("docs") },
];

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

  // Try SDK first
  try {
    const sdk = await import("@neo/uniapp-sdk").then((m) => m.waitForSDK?.() || null);
    if (sdk?.invoke) {
      freshStats = (await sdk.invoke("datafeed.getNetworkStats", { appId: APP_ID })) as typeof stats.value | null;
    }
  } catch (e) {
    console.warn("[Explorer] SDK stats fetch failed, falling back to API:", e);
  }

  // Fallback to REST API if SDK failed or returned null
  if (!freshStats) {
    try {
      const res = await uni.request({
        url: `${API_BASE}/stats`,
        method: "GET",
      });
      if (res.statusCode === 200 && res.data) {
        freshStats = res.data as any;
      }
    } catch (e) {
      console.error("[Explorer] API stats fetch failed:", e);
    }
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

  // Try SDK first
  try {
    const sdk = await import("@neo/uniapp-sdk").then((m) => m.waitForSDK?.() || null);
    if (sdk?.invoke) {
      const data = (await sdk.invoke("datafeed.getRecentTransactions", {
        appId: APP_ID,
        network: selectedNetwork.value,
        limit: 10,
      })) as { transactions: any[] } | null;
      if (data?.transactions) freshTxs = data.transactions;
    }
  } catch (e) {
    console.warn("[Explorer] SDK tx fetch failed, falling back to API:", e);
  }

  // Fallback to REST API
  if (!freshTxs) {
    try {
      const res = await uni.request({
        url: `${API_BASE}/recent?network=${selectedNetwork.value}&limit=10`,
        method: "GET",
      });
      if (res.statusCode === 200 && res.data) {
        freshTxs = (res.data as any).transactions || [];
      }
    } catch (e) {
      console.error("[Explorer] API tx fetch failed:", e);
    }
  }

  if (freshTxs) {
    recentTxs.value = freshTxs;
    uni.setStorageSync(TXS_CACHE_KEY, JSON.stringify(freshTxs));
  }
};

const search = async () => {
  const query = searchQuery.value.trim();
  if (!query) {
    status.value = { msg: "Please enter a search query", type: "error" };
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
      status.value = { msg: "No results found", type: "error" };
    }
  } catch (e: any) {
    status.value = { msg: e.message || "Search failed", type: "error" };
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

.app-container {
  padding: 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.status-text {
  font-family: $font-family;
  font-size: 13px;
  font-weight: 600;
  color: white;
  text-align: center;
}

.scrollable {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>
