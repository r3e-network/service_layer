<template>
  <AppLayout :title="t('title')" show-top-nav :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <view class="app-container">
      <!-- Loading State -->
      <view v-if="loading" class="loading-state-neo">
        <text class="animate-pulse">{{ t("loading") }}</text>
      </view>
 
      <!-- Error State -->
      <NeoCard v-else-if="error" variant="danger" class="mb-4">
        <view class="error-msg flex flex-col items-center gap-4">
          <text class="text-center font-bold uppercase">{{ error }}</text>
          <NeoButton variant="primary" @click="loadData">{{ t("retry") }}</NeoButton>
        </view>
      </NeoCard>
 
      <!-- Tab Content -->
      <view v-else-if="data" class="content">
        <!-- Total Overview Tab -->
        <view v-if="activeTab === 'total'" class="tab-content">
          <!-- Total Summary Card -->
          <NeoCard :title="t('totalTreasury')" variant="success" class="mb-6">
            <template #header-extra>
               <text class="text-xs font-mono opacity-60">{{ formatTime(data.lastUpdated) }}</text>
            </template>
            <view class="summary-content-neo text-center py-4">
              <text class="summary-value text-4xl font-black block mb-4">${{ formatNum(data.totalUsd) }}</text>
              <view class="summary-tokens flex justify-center gap-8">
                <view class="token-item">
                  <text class="token-label text-xs uppercase opacity-60 font-black block">NEO</text>
                  <text class="token-value font-bold text-lg">{{ formatNum(data.totalNeo) }}</text>
                </view>
                <view class="token-item">
                  <text class="token-label text-xs uppercase opacity-60 font-black block">GAS</text>
                  <text class="token-value font-bold text-lg">{{ formatNum(data.totalGas, 2) }}</text>
                </view>
              </view>
            </view>
          </NeoCard>
 
          <!-- Price Cards -->
          <view class="price-grid grid grid-cols-2 gap-4 mb-6">
            <NeoCard title="NEO" variant="default" class="price-card-neo">
              <view class="price-info flex flex-col items-center">
                <text class="price-value text-xl font-black">${{ data.prices.neo.usd.toFixed(2) }}</text>
                <text :class="['price-change text-xs font-bold uppercase', data.prices.neo.usd_24h_change >= 0 ? 'text-success' : 'text-danger']">
                  {{ data.prices.neo.usd_24h_change >= 0 ? "+" : "" }}{{ data.prices.neo.usd_24h_change.toFixed(2) }}%
                </text>
              </view>
            </NeoCard>
            <NeoCard title="GAS" variant="default" class="price-card-gas">
              <view class="price-info flex flex-col items-center">
                <text class="price-value text-xl font-black">${{ data.prices.gas.usd.toFixed(2) }}</text>
                <text :class="['price-change text-xs font-bold uppercase', data.prices.gas.usd_24h_change >= 0 ? 'text-success' : 'text-danger']">
                  {{ data.prices.gas.usd_24h_change >= 0 ? "+" : "" }}{{ data.prices.gas.usd_24h_change.toFixed(2) }}%
                </text>
              </view>
            </NeoCard>
          </view>
 
          <!-- Founders Summary -->
          <text class="section-title-neo text-xs font-black uppercase opacity-60 mb-4 block">{{ t("founders") }}</text>
          <NeoCard v-for="cat in data.categories" :key="cat.name" class="mb-4" @click="goToFounder(cat.name)">
            <view class="founder-card-content flex justify-between items-center">
              <view class="founder-info">
                <text class="founder-name font-black uppercase">{{ cat.name }}</text>
                <text class="founder-wallets text-xs opacity-60 block">{{ cat.wallets.length }} {{ t("wallets") }}</text>
              </view>
              <view class="founder-stats text-right">
                <text class="founder-usd text-lg font-black block text-success">${{ formatNum(cat.totalUsd) }}</text>
                <view class="founder-tokens flex gap-3 text-[10px] font-bold opacity-60 mt-1">
                  <text>{{ formatNum(cat.totalNeo) }} NEO</text>
                  <text>{{ formatNum(cat.totalGas, 2) }} GAS</text>
                </view>
              </view>
            </view>
          </NeoCard>
        </view>
 
        <!-- Da Hongfei Detail Tab -->
        <view v-if="activeTab === 'da'" class="tab-content">
          <FounderDetail :category="daCategory" :prices="data.prices" />
        </view>
 
        <!-- Erik Zhang Detail Tab -->
        <view v-if="activeTab === 'erik'" class="tab-content">
          <FounderDetail :category="erikCategory" :prices="data.prices" />
        </view>
 
        <!-- Docs Tab -->
        <view v-if="activeTab === 'docs'" class="tab-content scrollable">
          <NeoDoc
            :title="t('title')"
            subtitle="Explore Neo's core treasury."
            description="The Neo Treasury MiniApp provides a transparent view of the assets held by the Neo core founders and the foundation, essential for network governance and decentralization monitoring."
            :steps="[
              'Browse the overview for total treasury balances.',
              'Check real-time price changes for NEO and GAS.',
              'Drill down into individual founder wallet addresses.'
            ]"
            :features="[
              { name: 'Transparency', desc: 'Full visibility into core network assets.' },
              { name: 'Real-time Stats', desc: 'Up-to-the-minute price and balance tracking.' },
              { name: 'Detailed Breakdown', desc: 'Explore down to the individual wallet level.' }
            ]"
          />
        </view>
      </view>
    </view>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { AppLayout, NeoCard, AppIcon, NeoButton, NeoDoc } from "@/shared/components";
import FounderDetail from "@/components/FounderDetail.vue";
import { createT } from "@/shared/utils/i18n";
import { fetchTreasuryData, type TreasuryData, type CategoryBalance } from "@/utils/treasury";

const translations = {
  title: { en: "Neo Treasury", zh: "Neo 国库" },
  loading: { en: "Loading treasury data...", zh: "加载国库数据中..." },
  retry: { en: "Retry", zh: "重试" },
  totalTreasury: { en: "Total Treasury Value", zh: "国库总价值" },
  lastUpdated: { en: "Last updated", zh: "最后更新" },
  founders: { en: "Co-Founders", zh: "联合创始人" },
  wallets: { en: "wallets", zh: "个钱包" },
  tabTotal: { en: "Overview", zh: "总览" },
  tabDa: { en: "Da Hongfei", zh: "达鸿飞" },
  tabErik: { en: "Erik Zhang", zh: "张铮文" },
  docs: { en: "Docs", zh: "文档" },
};

const t = createT(translations);

// Tab configuration
const navTabs = [
  { id: "total", icon: "pie-chart", label: t("tabTotal") },
  { id: "da", icon: "user", label: t("tabDa") },
  { id: "erik", icon: "user", label: t("tabErik") },
  { id: "docs", icon: "book", label: t("docs") },
];
const activeTab = ref("total");

const loading = ref(true);
const error = ref("");
const data = ref<TreasuryData | null>(null);

// Computed properties for founder data
const daCategory = computed<CategoryBalance | null>(() => {
  return data.value?.categories.find((c: CategoryBalance) => c.name === "Da Hongfei") || null;
});

const erikCategory = computed<CategoryBalance | null>(() => {
  return data.value?.categories.find((c: CategoryBalance) => c.name === "Erik Zhang") || null;
});

function formatNum(n: number, decimals = 0): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: decimals });
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString();
}

function goToFounder(name: string) {
  if (name === "Da Hongfei") activeTab.value = "da";
  else if (name === "Erik Zhang") activeTab.value = "erik";
}

async function loadData() {
  loading.value = true;
  error.value = "";
  try {
    data.value = await fetchTreasuryData();
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Failed to load data";
  } finally {
    loading.value = false;
  }
}

onMounted(loadData);
</script>

<style lang="scss" scoped>
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.app-container {
  padding: $space-4;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.tab-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.loading-state-neo {
  display: flex; justify-content: center; padding: $space-12 0;
  font-size: 14px; font-weight: $font-weight-black; text-transform: uppercase; opacity: 0.6;
}

.summary-value {
  font-family: $font-mono;
}

.price-card-neo, .price-card-gas {
  border: 2px solid black; box-shadow: 4px 4px 0 black;
}

.founder-usd { font-family: $font-mono; }

.scrollable { overflow-y: auto; -webkit-overflow-scrolling: touch; }
</style>
