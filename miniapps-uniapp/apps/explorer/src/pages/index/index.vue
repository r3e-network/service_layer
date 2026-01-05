<template>
  <AppLayout :title="t('title')" show-top-nav :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <view v-if="activeTab === 'search' || activeTab === 'history'" class="app-container">
      <!-- Network Stats Cards -->
      <view class="stats-grid">
        <view class="network-card mainnet">
          <text class="network-label">{{ t("mainnet") }}</text>
          <view class="network-stats">
            <view class="stat-item">
              <text class="stat-value">{{ formatNum(stats.mainnet.height) }}</text>
              <text class="stat-label">{{ t("blockHeight") }}</text>
            </view>
            <view class="stat-item">
              <text class="stat-value">{{ formatNum(stats.mainnet.txCount) }}</text>
              <text class="stat-label">{{ t("transactions") }}</text>
            </view>
          </view>
        </view>
        <view class="network-card testnet">
          <text class="network-label">{{ t("testnet") }}</text>
          <view class="network-stats">
            <view class="stat-item">
              <text class="stat-value">{{ formatNum(stats.testnet.height) }}</text>
              <text class="stat-label">{{ t("blockHeight") }}</text>
            </view>
            <view class="stat-item">
              <text class="stat-value">{{ formatNum(stats.testnet.txCount) }}</text>
              <text class="stat-label">{{ t("transactions") }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- Status Message -->
      <view v-if="status" :class="['status-msg', status.type]">
        <text>{{ status.msg }}</text>
      </view>

      <!-- Search Tab -->
      <view v-if="activeTab === 'search'" class="tab-content">
        <view class="search-section">
          <view class="search-box">
            <input v-model="searchQuery" class="search-input" :placeholder="t('searchPlaceholder')" @confirm="search" />
            <view class="search-btn" @click="search">
              <text>{{ t("search") }}</text>
            </view>
          </view>
          <view class="network-toggle">
            <view
              :class="['toggle-btn', selectedNetwork === 'mainnet' && 'active']"
              @click="selectedNetwork = 'mainnet'"
            >
              <text>{{ t("mainnet") }}</text>
            </view>
            <view
              :class="['toggle-btn', selectedNetwork === 'testnet' && 'active']"
              @click="selectedNetwork = 'testnet'"
            >
              <text>{{ t("testnet") }}</text>
            </view>
          </view>
        </view>

        <view v-if="isLoading" class="loading">
          <text>{{ t("searching") }}</text>
        </view>

        <view v-if="searchResult" class="result-section">
          <text class="section-title">{{ t("searchResult") }}</text>
          <view v-if="searchResult.type === 'transaction'" class="result-card">
            <view class="result-header">
              <text class="result-type">{{ t("transaction") }}</text>
              <text :class="['vm-state', searchResult.data.vmState]">{{ searchResult.data.vmState }}</text>
            </view>
            <view class="result-row">
              <text class="label">{{ t("hash") }}</text>
              <text class="value hash">{{ searchResult.data.hash }}</text>
            </view>
            <view class="result-row">
              <text class="label">{{ t("block") }}</text>
              <text class="value">{{ searchResult.data.blockIndex }}</text>
            </view>
            <view class="result-row">
              <text class="label">{{ t("time") }}</text>
              <text class="value">{{ formatTime(searchResult.data.blockTime) }}</text>
            </view>
            <view class="result-row">
              <text class="label">{{ t("sender") }}</text>
              <text class="value addr">{{ searchResult.data.sender }}</text>
            </view>
            <view class="result-row">
              <text class="label">System Fee:</text>
              <text class="value">{{ searchResult.data.systemFee }} GAS</text>
            </view>
            <view class="result-row">
              <text class="label">Network Fee:</text>
              <text class="value">{{ searchResult.data.networkFee }} GAS</text>
            </view>
          </view>

          <view v-else-if="searchResult.type === 'address'" class="result-card">
            <view class="result-header">
              <text class="result-type">{{ t("address") }}</text>
            </view>
            <view class="result-row">
              <text class="label">Address:</text>
              <text class="value addr">{{ searchResult.data.address }}</text>
            </view>
            <view class="result-row">
              <text class="label">Transactions:</text>
              <text class="value">{{ searchResult.data.txCount }}</text>
            </view>
            <view class="tx-list" v-if="searchResult.data.transactions?.length">
              <text class="list-title">{{ t("recentTransactions") }}</text>
              <view
                v-for="tx in searchResult.data.transactions"
                :key="tx.hash"
                class="tx-item"
                @click="viewTx(tx.hash)"
              >
                <text class="tx-hash">{{ truncateHash(tx.hash) }}</text>
                <text class="tx-time">{{ formatTime(tx.blockTime) }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- History Tab -->
      <view v-if="activeTab === 'history'" class="tab-content">
        <view v-if="recentTxs.length" class="recent-section">
          <text class="section-title">{{ t("recentTransactions") }}</text>
          <view v-for="tx in recentTxs" :key="tx.hash" class="tx-item" @click="viewTx(tx.hash)">
            <view class="tx-info">
              <text class="tx-hash">{{ truncateHash(tx.hash) }}</text>
              <text :class="['vm-state-small', tx.vmState]">{{ tx.vmState }}</text>
            </view>
            <text class="tx-time">{{ formatTime(tx.blockTime) }}</text>
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
import { ref, computed, onMounted } from "vue";
import { formatNumber } from "@/shared/utils/format";
import { createT } from "@/shared/utils/i18n";
import AppLayout from "@/shared/components/AppLayout.vue";
import NeoDoc from "@/shared/components/NeoDoc.vue";
import type { NavTab } from "@/shared/components/NavBar.vue";

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

const docSteps = computed(() => [t("step1"), t("step2"), t("step3")]);
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
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: $space-4;
}

.tab-content {
  flex: 1;
}

.stats-grid {
  display: flex;
  gap: $space-3;
  margin-bottom: $space-5;
}

.network-card {
  flex: 1;
  background: var(--bg-card);
  border: $border-width-md solid var(--border-color);
  border-radius: $radius-lg;
  padding: $space-4;
  position: relative;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  box-shadow: $shadow-sm;
  transition: all 0.3s ease;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    flex: 1;
    min-height: 0;
    background: var(--accent-color);
  }

  &.mainnet {
    --accent-color: var(--neo-green);

    &:hover {
      border-color: var(--accent-color);
      box-shadow: $shadow-md;
    }
  }

  &.testnet {
    --accent-color: var(--brutal-orange);

    &:hover {
      border-color: var(--accent-color);
      box-shadow: $shadow-md;
    }
  }
}

.network-label {
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  text-transform: uppercase;
  margin-bottom: $space-3;
  display: block;
  color: var(--accent-color);
  letter-spacing: 0.5px;
}

.network-stats {
  display: flex;
  gap: $space-2;
}

.stat-item {
  flex: 1;
  text-align: center;
}

.stat-value {
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
  color: var(--text-primary);
  display: block;
}

.stat-label {
  font-size: $font-size-xs;
  color: var(--text-secondary);
}

.search-section {
  margin-bottom: $space-5;
}

.search-box {
  display: flex;
  gap: $space-2;
  margin-bottom: $space-3;
}

.search-input {
  flex: 1;
  background: var(--bg-card);
  border: $border-width-md solid var(--border-color);
  border-radius: $radius-md;
  padding: $space-3 $space-4;
  color: var(--text-primary);
  font-size: $font-size-sm;
  font-family: $font-mono;
  transition: all 0.2s ease;

  &:focus {
    border-color: var(--brutal-orange);
    outline: none;
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--brutal-orange) 10%, transparent);
  }

  &::placeholder {
    color: var(--text-tertiary);
  }
}

.search-btn {
  background: var(--brutal-orange);
  color: var(--neo-white);
  padding: $space-3 $space-5;
  border-radius: $radius-md;
  font-weight: $font-weight-bold;
  border: $border-width-md solid var(--border-color);
  box-shadow: $shadow-sm;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: $shadow-md;
  }

  &:active {
    transform: translateY(0);
    box-shadow: $shadow-sm;
  }
}

.network-toggle {
  display: flex;
  gap: $space-2;
}

.toggle-btn {
  flex: 1;
  text-align: center;
  padding: $space-2 $space-3;
  background: var(--bg-card);
  border: $border-width-md solid var(--border-color);
  border-radius: $radius-md;
  color: var(--text-secondary);
  font-weight: $font-weight-medium;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--text-secondary);
  }

  &.active {
    background: color-mix(in srgb, var(--brutal-orange) 10%, transparent);
    border-color: var(--brutal-orange);
    color: var(--brutal-orange);
    font-weight: $font-weight-bold;
  }
}

.status-msg {
  text-align: center;
  padding: $space-2;
  border-radius: $radius-md;
  margin-bottom: $space-4;

  &.success {
    background: color-mix(in srgb, var(--status-success) 15%, transparent);
    color: var(--status-success);
  }

  &.error {
    background: color-mix(in srgb, var(--status-error) 15%, transparent);
    color: var(--status-error);
  }
}

.loading {
  text-align: center;
  padding: $space-5;
  color: var(--text-secondary);
}

.section-title {
  font-size: $font-size-base;
  font-weight: $font-weight-bold;
  color: var(--brutal-orange);
  margin-bottom: $space-3;
  display: block;
}

.result-section,
.recent-section {
  margin-top: $space-5;
}

.result-card {
  background: var(--bg-card);
  border: $border-width-md solid var(--border-color);
  border-radius: $radius-lg;
  padding: $space-4;
  box-shadow: $shadow-sm;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: $shadow-md;
    border-color: var(--brutal-orange);
  }
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $space-3;
  padding-bottom: $space-3;
  border-bottom: $border-width-sm solid var(--border-color);
}

.result-type {
  font-weight: $font-weight-bold;
  color: var(--brutal-orange);
}

.vm-state {
  padding: $space-1 $space-3;
  border-radius: $radius-sm;
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border: $border-width-sm solid transparent;

  &.HALT {
    background: color-mix(in srgb, var(--neo-green) 15%, transparent);
    color: var(--neo-green);
    border-color: color-mix(in srgb, var(--neo-green) 30%, transparent);
  }

  &.FAULT {
    background: color-mix(in srgb, var(--status-error) 15%, transparent);
    color: var(--status-error);
    border-color: color-mix(in srgb, var(--status-error) 30%, transparent);
  }
}

.result-row {
  display: flex;
  padding: $space-3 0;
  border-bottom: $border-width-sm solid var(--border-color);
  align-items: flex-start;
  gap: $space-3;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: color-mix(in srgb, var(--brutal-orange) 3%, transparent);
    margin: 0 (-$space-2);
    padding-left: $space-2;
    padding-right: $space-2;
    border-radius: $radius-sm;
  }
}

.label {
  min-width: 100px;
  color: var(--text-secondary);
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;
  text-transform: capitalize;
}

.value {
  flex: 1;
  font-size: $font-size-sm;
  word-break: break-all;
  color: var(--text-primary);
  line-height: 1.5;

  &.hash,
  &.addr {
    font-family: $font-mono;
    color: var(--brutal-orange);
    background: color-mix(in srgb, var(--brutal-orange) 5%, transparent);
    padding: $space-1 $space-2;
    border-radius: $radius-sm;
    border: $border-width-sm solid color-mix(in srgb, var(--brutal-orange) 20%, transparent);
  }
}

.tx-list {
  margin-top: $space-4;
  padding-top: $space-4;
  border-top: $border-width-sm solid var(--border-color);
}

.list-title {
  font-size: $font-size-sm;
  color: var(--text-secondary);
  margin-bottom: $space-2;
  display: block;
}

.tx-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $space-3;
  background: var(--bg-card);
  border: $border-width-md solid var(--border-color);
  border-radius: $radius-md;
  margin-bottom: $space-2;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    flex: 1;
    min-height: 0;
    width: 3px;
    background: var(--brutal-orange);
    transform: scaleY(0);
    transition: transform 0.2s ease;
  }

  &:hover {
    border-color: var(--brutal-orange);
    box-shadow: $shadow-sm;
    transform: translateX(2px);

    &::before {
      transform: scaleY(1);
    }
  }

  &:active {
    transform: translateX(0);
  }
}

.tx-info {
  display: flex;
  align-items: center;
  gap: $space-2;
}

.tx-hash {
  font-family: $font-mono;
  font-size: $font-size-sm;
  color: var(--brutal-orange);
  font-weight: $font-weight-medium;
  letter-spacing: -0.5px;
}

.tx-time {
  font-size: $font-size-xs;
  color: var(--text-secondary);
  font-weight: $font-weight-normal;
}

.vm-state-small {
  padding: $space-1 $space-2;
  border-radius: $radius-sm;
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  border: $border-width-sm solid transparent;

  &.HALT {
    background: color-mix(in srgb, var(--neo-green) 15%, transparent);
    color: var(--neo-green);
    border-color: color-mix(in srgb, var(--neo-green) 30%, transparent);
  }

  &.FAULT {
    background: color-mix(in srgb, var(--status-error) 15%, transparent);
    color: var(--status-error);
    border-color: color-mix(in srgb, var(--status-error) 30%, transparent);
  }
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

@keyframes slideIn {
  from {
    transform: translateX(-10px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
</style>
