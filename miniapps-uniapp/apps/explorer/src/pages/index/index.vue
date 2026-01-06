<template>
  <AppLayout :title="t('title')" show-top-nav :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <view v-if="activeTab === 'search' || activeTab === 'history'" class="app-container">
      <!-- Network Stats Cards -->
      <view class="stats-grid mb-6">
        <NeoCard :title="t('mainnet')" variant="success" class="flex-1">
          <NeoStats :stats="mainnetStats" />
        </NeoCard>
        <NeoCard :title="t('testnet')" variant="accent" class="flex-1">
          <NeoStats :stats="testnetStats" />
        </NeoCard>
      </view>

      <!-- Status Message -->
      <NeoCard v-if="status" :variant="status.type === 'error' ? 'danger' : 'success'" class="mb-4 text-center">
        <text class="status-text font-bold uppercase">{{ status.msg }}</text>
      </NeoCard>

      <!-- Search Tab -->
      <view v-if="activeTab === 'search'" class="tab-content">
        <NeoCard :title="t('search')" class="mb-6">
          <view class="search-box-neo mb-4">
            <NeoInput
              v-model="searchQuery"
              :placeholder="t('searchPlaceholder')"
              @confirm="search"
              class="flex-1 mb-2"
            />
            <NeoButton variant="primary" block @click="search" :loading="isLoading">
              {{ t("search") }}
            </NeoButton>
          </view>

          <view class="network-toggle flex gap-2">
            <NeoButton
              :variant="selectedNetwork === 'mainnet' ? 'success' : 'secondary'"
              size="sm"
              class="flex-1"
              @click="selectedNetwork = 'mainnet'"
            >
              {{ t("mainnet") }}
            </NeoButton>
            <NeoButton
              :variant="selectedNetwork === 'testnet' ? 'warning' : 'secondary'"
              size="sm"
              class="flex-1"
              @click="selectedNetwork = 'testnet'"
            >
              {{ t("testnet") }}
            </NeoButton>
          </view>
        </NeoCard>

        <view v-if="isLoading" class="loading">
          <text>{{ t("searching") }}</text>
        </view>

        <view v-if="searchResult" class="result-section">
          <text class="section-title-neo mb-4 font-bold uppercase">{{ t("searchResult") }}</text>

          <NeoCard v-if="searchResult.type === 'transaction'" class="mb-6">
            <template #header-extra>
              <text :class="['vm-state-neo font-black', searchResult.data.vmState]">{{
                searchResult.data.vmState
              }}</text>
            </template>

            <view class="result-rows">
              <view class="result-row-neo">
                <text class="label-neo text-xs opacity-60 uppercase font-black">{{ t("hash") }}</text>
                <text class="value-neo text-sm font-mono word-break">{{ searchResult.data.hash }}</text>
              </view>
              <view class="result-row-neo">
                <text class="label-neo text-xs opacity-60 uppercase font-black">{{ t("block") }}</text>
                <text class="value-neo text-sm font-bold">{{ searchResult.data.blockIndex }}</text>
              </view>
              <view class="result-row-neo">
                <text class="label-neo text-xs opacity-60 uppercase font-black">{{ t("time") }}</text>
                <text class="value-neo text-sm">{{ formatTime(searchResult.data.blockTime) }}</text>
              </view>
              <view class="result-row-neo">
                <text class="label-neo text-xs opacity-60 uppercase font-black">{{ t("sender") }}</text>
                <text class="value-neo text-sm font-mono word-break">{{ searchResult.data.sender }}</text>
              </view>
            </view>
          </NeoCard>

          <NeoCard v-else-if="searchResult.type === 'address'" :title="t('address')" class="mb-6">
            <view class="result-rows mb-4">
              <view class="result-row-neo">
                <text class="label-neo text-xs opacity-60 uppercase font-black">Address:</text>
                <text class="value-neo text-sm font-mono word-break">{{ searchResult.data.address }}</text>
              </view>
              <view class="result-row-neo">
                <text class="label-neo text-xs opacity-60 uppercase font-black">Transactions:</text>
                <text class="value-neo text-sm font-bold">{{ searchResult.data.txCount }}</text>
              </view>
            </view>

            <view class="tx-list-neo" v-if="searchResult.data.transactions?.length">
              <text class="list-title-neo text-xs uppercase opacity-60 font-black mb-2 block">{{
                t("recentTransactions")
              }}</text>
              <view
                v-for="tx in searchResult.data.transactions"
                :key="tx.hash"
                class="tx-item-neo mb-2"
                @click="viewTx(tx.hash)"
              >
                <text class="tx-hash-neo text-sm font-mono">{{ truncateHash(tx.hash) }}</text>
                <text class="tx-time text-xs opacity-60">{{ formatTime(tx.blockTime) }}</text>
              </view>
            </view>
          </NeoCard>
        </view>
      </view>

      <!-- History Tab -->
      <view v-if="activeTab === 'history'" class="tab-content">
        <view v-if="recentTxs.length" class="recent-section">
          <text class="section-title-neo mb-4 font-bold uppercase">{{ t("recentTransactions") }}</text>
          <NeoCard v-for="tx in recentTxs" :key="tx.hash" class="mb-3" @click="viewTx(tx.hash)">
            <view class="tx-item-content-neo flex justify-between items-center w-full">
              <view class="tx-info flex items-center gap-2">
                <text class="tx-hash-neo text-sm font-mono">{{ truncateHash(tx.hash) }}</text>
                <text :class="['vm-state-small-neo text-xs font-black px-2 py-1', tx.vmState]">{{ tx.vmState }}</text>
              </view>
              <text class="tx-time text-xs opacity-60">{{ formatTime(tx.blockTime) }}</text>
            </view>
          </NeoCard>
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
import { ref, computed, onMounted } from "vue";
import { formatNumber } from "@/shared/utils/format";
import { createT } from "@/shared/utils/i18n";
import { AppLayout, NeoDoc, NeoButton, NeoInput, NeoCard, NeoStats } from "@/shared/components";
import type { NavTab } from "@/shared/components/NavBar.vue";
import type { StatItem } from "@/shared/components/NeoStats.vue";

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
    en: "Enter a transaction hash, address, or contract hash",
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
};

const t = createT(translations);

const docSteps = computed(() => [t("step1"), t("step2"), t("step3"), t("step4")]);
const docFeatures = computed(() => [
  { name: t("feature1Name"), desc: t("feature1Desc") },
  { name: t("feature2Name"), desc: t("feature2Desc") },
]);
const APP_ID = "miniapp-explorer";
const API_BASE = "/api/explorer";

const activeTab = ref("search");
const navTabs: NavTab[] = [
  { id: "search", icon: "search", label: t("tabSearch") },
  { id: "history", icon: "clock", label: t("tabHistory") },
  { id: "docs", icon: "book", label: t("docs") },
];

const searchQuery = ref("");
const selectedNetwork = ref<"mainnet" | "testnet">("testnet");
const isLoading = ref(false);
const status = ref<{ msg: string; type: string } | null>(null);
const searchResult = ref<any>(null);
const recentTxs = ref<any[]>([]);

const stats = ref({
  mainnet: { height: 0, txCount: 0 },
  testnet: { height: 0, txCount: 0 },
});

const mainnetStats = computed<StatItem[]>(() => [
  { label: t("blockHeight"), value: formatNum(stats.value.mainnet.height), variant: "default" },
  { label: t("transactions"), value: formatNum(stats.value.mainnet.txCount), variant: "default" },
]);

const testnetStats = computed<StatItem[]>(() => [
  { label: t("blockHeight"), value: formatNum(stats.value.testnet.height), variant: "default" },
  { label: t("transactions"), value: formatNum(stats.value.testnet.txCount), variant: "default" },
]);

const formatNum = (n: number) => formatNumber(n, 0);

const formatTime = (time: string) => {
  const d = new Date(time);
  return d.toLocaleString();
};

const truncateHash = (hash: string) => {
  if (!hash) return "";
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
};

// Fetch stats via SDK datafeed service
const fetchStats = async () => {
  try {
    const sdk = await import("@neo/uniapp-sdk").then((m) => m.waitForSDK?.() || null);
    if (sdk?.invoke) {
      const data = (await sdk.invoke("datafeed.getNetworkStats", { appId: APP_ID })) as typeof stats.value | null;
      if (data) {
        stats.value = data;
        return;
      }
    }
    // Fallback to REST API
    const res = await uni.request({
      url: `${API_BASE}/stats`,
      method: "GET",
    });
    if (res.statusCode === 200 && res.data) {
      stats.value = res.data as any;
    }
  } catch (e) {
    console.error("Failed to fetch stats:", e);
  }
};

// Fetch recent transactions via SDK datafeed service
const fetchRecentTxs = async () => {
  try {
    const sdk = await import("@neo/uniapp-sdk").then((m) => m.waitForSDK?.() || null);
    if (sdk?.invoke) {
      const data = (await sdk.invoke("datafeed.getRecentTransactions", {
        appId: APP_ID,
        network: selectedNetwork.value,
        limit: 10,
      })) as { transactions: any[] } | null;
      if (data?.transactions) {
        recentTxs.value = data.transactions;
        return;
      }
    }
    // Fallback to REST API
    const res = await uni.request({
      url: `${API_BASE}/recent?network=${selectedNetwork.value}&limit=10`,
      method: "GET",
    });
    if (res.statusCode === 200 && res.data) {
      recentTxs.value = (res.data as any).transactions || [];
    }
  } catch (e) {
    console.error("Failed to fetch recent txs:", e);
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
  setInterval(fetchStats, 15000);
});
</script>

<style lang="scss" scoped>
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.app-container {
  padding: $space-4;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: $space-4;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.tab-content { display: flex; flex-direction: column; gap: $space-4; }
.stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: $space-4; }

.section-title-neo { font-size: 10px; font-weight: $font-weight-black; text-transform: uppercase; margin-bottom: 8px; background: black; color: white; padding: 2px 8px; display: inline-block; }

.vm-state-neo, .vm-state-small-neo {
  padding: 4px 10px; font-size: 10px; font-weight: $font-weight-black; text-transform: uppercase; border: 2px solid black; box-shadow: 2px 2px 0 black;
  &.HALT { background: var(--neo-green); color: black; }
  &.FAULT { background: var(--brutal-red); color: white; }
}

.result-rows { display: flex; flex-direction: column; gap: $space-3; }
.result-row-neo { padding: $space-3; background: #f8f8f8; border: 2px solid black; box-shadow: 4px 4px 0 black; margin-bottom: $space-2; }

.label-neo { font-size: 10px; font-weight: $font-weight-black; text-transform: uppercase; color: black; margin-bottom: 4px; display: block; }
.value-neo { font-family: $font-mono; font-size: 12px; word-break: break-all; font-weight: $font-weight-black; color: black; }

.tx-list-neo { margin-top: $space-6; border-top: 4px solid black; padding-top: $space-4; }
.tx-item-neo {
  padding: $space-3; background: white; border: 2px solid black;
  margin-bottom: $space-2; display: flex; justify-content: space-between; align-items: center;
  box-shadow: 4px 4px 0 black;
  &:active { transform: translate(2px, 2px); box-shadow: 2px 2px 0 black; }
}

.tx-hash-neo { font-family: $font-mono; font-size: 12px; font-weight: $font-weight-black; color: black; }
.tx-time { font-size: 10px; opacity: 0.6; font-weight: $font-weight-black; }

.network-toggle { margin-top: $space-4; border-top: 3px solid black; padding-top: $space-4; display: grid; grid-template-columns: 1fr 1fr; gap: $space-2; }

.status-text { font-family: $font-mono; font-size: 12px; font-weight: $font-weight-black; }

.scrollable { overflow-y: auto; -webkit-overflow-scrolling: touch; }
</style>
