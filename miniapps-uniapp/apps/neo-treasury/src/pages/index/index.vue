<template>
  <AppLayout  :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
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
          <text class="soft-loading-text">{{ t("refreshing") }}</text>
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
import { useI18n } from "@/composables/useI18n";
import { fetchTreasuryData, type TreasuryData, type CategoryBalance } from "@/utils/treasury";

import TotalSummaryCard from "./components/TotalSummaryCard.vue";
import PriceGrid from "./components/PriceGrid.vue";
import FoundersList from "./components/FoundersList.vue";
import FounderDetail from "./components/FounderDetail.vue";


const { t } = useI18n();

const navTabs = computed<NavTab[]>(() => [
  { id: "total", icon: "chart", label: t("tabTotal") },
  { id: "da", icon: "user", label: t("tabDa") },
  { id: "erik", icon: "user", label: t("tabErik") },
  { id: "docs", icon: "book", label: t("docs") },
]);

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
  } catch {
  }

  try {
    const freshData = await fetchTreasuryData();
    data.value = freshData;
    // 2. Save to cache
    uni.setStorageSync(CACHE_KEY, JSON.stringify(freshData));
  } catch (e) {
    if (!data.value) {
      error.value = t("loadFailed");
    } else {
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
@use "@/shared/styles/tokens.scss" as *;
@use "@/shared/styles/variables.scss";

$treasury-bg: #1a1a00;
$treasury-gold: #fbbf24;
$treasury-dark-gold: #b45309;
$treasury-text: #fffbeb;

:global(page) {
  background: $treasury-bg;
}

.app-container {
  padding: 20px;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 100vh;
  gap: 16px;
  background-color: $treasury-bg;
  /* Gold Flakes */
  background-image: 
    radial-gradient(ellipse at 50% 50%, rgba(251, 191, 36, 0.15) 0%, transparent 60%),
    url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8Y2lyY2xlIGN4PSI0IiBjeT0iNCIgcj0iMSIgZmlsbD0icmdiYSgyNTEsIDE5MSwgMzYsIDAuMSkiLz4KPC9zdmc+');
}

.tab-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* Treasury Component Overrides */
:deep(.neo-card) {
  background: linear-gradient(135deg, rgba(30, 25, 10, 0.95), rgba(40, 35, 15, 0.9)) !important;
  border: 1px solid rgba(251, 191, 36, 0.3) !important;
  border-radius: 12px !important;
  box-shadow: 0 4px 20px rgba(0,0,0,0.5), inset 0 0 20px rgba(251, 191, 36, 0.05) !important;
  color: $treasury-text !important;
  
  /* Reflective Edge */
  &::after {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, $treasury-gold, transparent);
    opacity: 0.5;
  }
}

:deep(.neo-button) {
  border-radius: 6px !important;
  font-family: 'Cinzel', serif !important;
  text-transform: uppercase;
  font-weight: 700 !important;
  
  &.variant-primary {
    background: linear-gradient(to bottom, #fcd34d, #d97706) !important;
    color: #451a03 !important;
    border: 1px solid #b45309 !important;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3) !important;
    text-shadow: 0 1px 0 rgba(255,255,255,0.4);
    
    &:active {
      background: linear-gradient(to top, #fcd34d, #d97706) !important;
    }
  }
}

.loading-container {
  display: flex;
  flex-direction: column;
  padding: 16px;
}

.loading-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
}

.soft-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(251, 191, 36, 0.1);
  color: $treasury-gold;
  border: 1px solid rgba(251, 191, 36, 0.3);
  border-radius: 99px;
  box-shadow: 0 0 15px rgba(251, 191, 36, 0.2);
}

.soft-loading-text {
  font-family: 'Cinzel', serif;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
}

.skeleton-card {
  height: 120px;
  background: rgba(251, 191, 36, 0.05);
  border: 1px solid rgba(251, 191, 36, 0.1);
  border-radius: 20px;
  animation: pulse 2s infinite;
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
  font-family: 'Cinzel', serif;
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
  color: $treasury-gold;
  letter-spacing: 0.05em;
}

.status-text {
  font-family: 'Cinzel', serif;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  color: $treasury-text;
}

.animate-spin { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

.fade-in { animation: fadeIn 0.4s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.text-danger { color: #ef4444; }

.scrollable { overflow-y: auto; -webkit-overflow-scrolling: touch; }
</style>
