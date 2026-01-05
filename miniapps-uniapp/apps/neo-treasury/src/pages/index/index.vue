<template>
  <AppLayout :title="t('title')" show-top-nav>
    <view class="treasury-container">
      <!-- Loading State -->
      <view v-if="loading" class="loading-state">
        <view class="spinner"></view>
        <text>{{ t("loading") }}</text>
      </view>

      <!-- Error State -->
      <view v-else-if="error" class="error-state">
        <text class="error-icon">⚠️</text>
        <text class="error-msg">{{ error }}</text>
        <view class="retry-btn" @click="loadData">{{ t("retry") }}</view>
      </view>

      <!-- Data Display -->
      <view v-else-if="data" class="content">
        <!-- Total Summary Card -->
        <view class="summary-card">
          <text class="summary-title">{{ t("totalTreasury") }}</text>
          <text class="summary-value">${{ formatNum(data.totalUsd) }}</text>
          <view class="summary-tokens">
            <view class="token-item">
              <text class="token-label">NEO</text>
              <text class="token-value">{{ formatNum(data.totalNeo) }}</text>
            </view>
            <view class="token-item">
              <text class="token-label">GAS</text>
              <text class="token-value">{{ formatNum(data.totalGas, 2) }}</text>
            </view>
          </view>
        </view>

        <!-- Price Cards -->
        <view class="price-grid">
          <view class="price-card">
            <text class="price-label">NEO</text>
            <text class="price-value">${{ data.prices.neo.usd.toFixed(2) }}</text>
            <text :class="['price-change', data.prices.neo.usd_24h_change >= 0 ? 'up' : 'down']">
              {{ data.prices.neo.usd_24h_change >= 0 ? "+" : "" }}{{ data.prices.neo.usd_24h_change.toFixed(2) }}%
            </text>
          </view>
          <view class="price-card">
            <text class="price-label">GAS</text>
            <text class="price-value">${{ data.prices.gas.usd.toFixed(2) }}</text>
            <text :class="['price-change', data.prices.gas.usd_24h_change >= 0 ? 'up' : 'down']">
              {{ data.prices.gas.usd_24h_change >= 0 ? "+" : "" }}{{ data.prices.gas.usd_24h_change.toFixed(2) }}%
            </text>
          </view>
        </view>

        <!-- Category Cards -->
        <view v-for="cat in data.categories" :key="cat.name" class="category-card">
          <view class="category-header" @click="toggleCategory(cat.name)">
            <text class="category-name">{{ cat.name }}</text>
            <view class="category-summary">
              <text class="category-usd">${{ formatNum(cat.totalUsd) }}</text>
              <text class="expand-icon">{{ expanded[cat.name] ? "▼" : "▶" }}</text>
            </view>
          </view>
          <view class="category-tokens">
            <text class="cat-token">{{ formatNum(cat.totalNeo) }} NEO</text>
            <text class="cat-token">{{ formatNum(cat.totalGas, 2) }} GAS</text>
          </view>
          <!-- Expanded Wallet List -->
          <view v-if="expanded[cat.name]" class="wallet-list">
            <view v-for="w in cat.wallets" :key="w.address" class="wallet-item">
              <text class="wallet-label">{{ w.label }}</text>
              <text class="wallet-addr">{{ shortAddr(w.address) }}</text>
              <view class="wallet-balances">
                <text>{{ formatNum(w.neo) }} NEO</text>
                <text>{{ formatNum(w.gas, 2) }} GAS</text>
              </view>
            </view>
          </view>
        </view>

        <!-- Last Updated -->
        <view class="last-updated">
          <text>{{ t("lastUpdated") }}: {{ formatTime(data.lastUpdated) }}</text>
          <view class="refresh-btn" @click="loadData">🔄</view>
        </view>
      </view>
    </view>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import AppLayout from "@/shared/components/AppLayout.vue";
import { createT } from "@/shared/utils/i18n";
import { fetchTreasuryData, type TreasuryData } from "@/utils/treasury";

const translations = {
  title: { en: "Neo Treasury", zh: "Neo 国库" },
  loading: { en: "Loading treasury data...", zh: "加载国库数据中..." },
  retry: { en: "Retry", zh: "重试" },
  totalTreasury: { en: "Total Treasury Value", zh: "国库总价值" },
  lastUpdated: { en: "Last updated", zh: "最后更新" },
};

const t = createT(translations);

const loading = ref(true);
const error = ref("");
const data = ref<TreasuryData | null>(null);
const expanded = reactive<Record<string, boolean>>({});

function formatNum(n: number, decimals = 0): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: decimals });
}

function shortAddr(addr: string): string {
  return addr.slice(0, 8) + "..." + addr.slice(-6);
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString();
}

function toggleCategory(name: string) {
  expanded[name] = !expanded[name];
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
.treasury-container {
  padding: 16px;
  min-height: 100vh;
  background: var(--bg-primary);
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 16px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-color);
  border-top-color: var(--accent-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-icon {
  font-size: 48px;
}

.error-msg {
  color: var(--text-secondary);
  text-align: center;
}

.retry-btn {
  padding: 10px 24px;
  background: var(--accent-primary);
  color: white;
  border-radius: 8px;
  cursor: pointer;
}

.summary-card {
  background: linear-gradient(135deg, #00e599 0%, #00a86b 100%);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 16px;
  color: white;
}

.summary-title {
  font-size: 14px;
  opacity: 0.9;
}

.summary-value {
  font-size: 32px;
  font-weight: 700;
  display: block;
  margin: 8px 0 16px;
}

.summary-tokens {
  display: flex;
  gap: 24px;
}

.token-item {
  display: flex;
  flex-direction: column;
}

.token-label {
  font-size: 12px;
  opacity: 0.8;
}

.token-value {
  font-size: 18px;
  font-weight: 600;
}

.price-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
}

.price-card {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid var(--border-color);
}

.price-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.price-value {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  display: block;
  margin: 4px 0;
}

.price-change {
  font-size: 13px;
  &.up {
    color: #00e599;
  }
  &.down {
    color: #ff6b6b;
  }
}

.category-card {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  border: 1px solid var(--border-color);
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}

.category-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.category-summary {
  display: flex;
  align-items: center;
  gap: 8px;
}

.category-usd {
  font-size: 16px;
  font-weight: 600;
  color: #00e599;
}

.expand-icon {
  font-size: 12px;
  color: var(--text-secondary);
}

.category-tokens {
  display: flex;
  gap: 16px;
  margin-top: 8px;
}

.cat-token {
  font-size: 13px;
  color: var(--text-secondary);
}

.wallet-list {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border-color);
}

.wallet-item {
  padding: 8px 0;
  border-bottom: 1px solid var(--border-color);
  &:last-child {
    border-bottom: none;
  }
}

.wallet-label {
  font-size: 14px;
  color: var(--text-primary);
  display: block;
}

.wallet-addr {
  font-size: 12px;
  color: var(--text-tertiary);
  font-family: monospace;
}

.wallet-balances {
  display: flex;
  gap: 12px;
  margin-top: 4px;
  font-size: 13px;
  color: var(--text-secondary);
}

.last-updated {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  font-size: 12px;
  color: var(--text-tertiary);
}

.refresh-btn {
  cursor: pointer;
  font-size: 18px;
}
</style>
