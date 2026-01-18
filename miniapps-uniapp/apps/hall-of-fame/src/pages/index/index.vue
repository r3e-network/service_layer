<template>
  <AppLayout  :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
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

    <view class="app-container">
      <!-- Status Message -->
      <NeoCard v-if="statusMessage" :variant="statusType === 'error' ? 'danger' : 'success'" class="mb-4 text-center">
        <text class="font-bold uppercase tracking-wider">{{ statusMessage }}</text>
      </NeoCard>

      <!-- Leaderboard Tab -->
      <view v-if="activeTab === 'leaderboard'" class="tab-content">
        <!-- Category Tabs -->
        <view class="category-tabs-glass">
          <view
            v-for="c in categories"
            :key="c.id"
            class="category-tab-glass"
            :class="{ active: activeCategory === c.id }"
            @click="setCategory(c.id)"
          >
            <text>{{ c.label }}</text>
          </view>
        </view>

        <!-- Period Filter -->
        <view class="period-filter-glass">
          <view
            v-for="p in periods"
            :key="p.id"
            class="period-btn-glass"
            :class="{ active: activePeriod === p.id }"
            @click="setPeriod(p.id)"
          >
            <text>{{ p.label }}</text>
          </view>
        </view>

        <!-- Leaderboard List -->
        <view class="leaderboard-list">
          <NeoCard v-for="(entrant, index) in leaderboard" :key="entrant.id" :variant="index === 0 ? 'erobo-neo' : 'erobo'" class="entrant-card-glass">
            <view class="entrant-inner">
              <!-- Rank -->
              <view class="rank-glass" :class="'rank-' + (index + 1)">
                <text>#{{ index + 1 }}</text>
              </view>

              <!-- Avatar -->
              <view class="avatar-glass">
                <text class="avatar-text-glass">{{ entrant.name.charAt(0) }}</text>
              </view>

              <!-- Info -->
              <view class="entrant-info">
                <text class="entrant-name-glass">{{ entrant.name }}</text>
                <view class="score-row">
                  <text class="fire-glass">🔥</text>
                  <text class="score-glass">{{ formatNumber(entrant.score) }} GAS</text>
                </view>
              </view>

              <!-- Vote Button -->
              <NeoButton
                variant="primary"
                size="sm"
                :disabled="!!votingId"
                :loading="votingId === entrant.id"
                @click="handleVote(entrant)"
              >
                {{ t("boost") }}
              </NeoButton>
            </view>

            <!-- Progress Bar -->
            <view class="progress-track-glass">
              <view
                class="progress-bar-glass"
                :class="{ gold: index === 0 }"
                :style="{ width: getProgressWidth(entrant.score) }"
              >
                <view class="progress-glow" v-if="index === 0"></view>
              </view>
            </view>
          </NeoCard>
        </view>

        <NeoCard v-if="!isLoading && leaderboard.length === 0" variant="erobo" class="empty-state-card">
          <view class="empty-state-content">
            <text class="empty-state-title">{{ fetchError ? t("leaderboardUnavailable") : t("leaderboardEmpty") }}</text>
            <text v-if="fetchError" class="empty-state-subtitle">{{ t("tryAgain") }}</text>
          </view>
        </NeoCard>
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
    </view>
    <Fireworks :active="!!statusMessage && statusType === 'success'" :duration="3000" />
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useWallet, usePayments } from "@neo/uniapp-sdk";
import { useI18n } from "@/composables/useI18n";
import { initTheme, listenForThemeChanges } from "@/shared/utils/theme";
import { AppLayout, NeoButton, NeoCard, NeoDoc } from "@/shared/components";
import Fireworks from "../../../../../shared/components/Fireworks.vue";
import type { NavTab } from "@/shared/components/NavBar.vue";


const { t } = useI18n();

const APP_ID = "miniapp-hall-of-fame";
const { address, connect, chainType, switchChain } = useWallet() as any;
const { payGAS } = usePayments(APP_ID);

type Category = "people" | "community" | "developer";
type Period = "day" | "week" | "month" | "all";

interface Entrant {
  id: string;
  name: string;
  category: Category;
  score: number;
}

const activeTab = ref("leaderboard");
const navTabs = computed<NavTab[]>(() => [
  { id: "leaderboard", icon: "trophy", label: t("tabLeaderboard") },
  { id: "docs", icon: "book", label: t("docs") },
]);

const categories = computed(() => [
  { id: "people", label: t("catPeople") },
  { id: "community", label: t("catCommunity") },
  { id: "developer", label: t("catDeveloper") },
]);

const periods = computed(() => [
  { id: "day", label: t("period24h") },
  { id: "week", label: t("period7d") },
  { id: "month", label: t("period30d") },
  { id: "all", label: t("periodAll") },
]);

const docSteps = computed(() => [t("step1"), t("step2"), t("step3"), t("step4")]);
const docFeatures = computed(() => [
  { name: t("feature1Name"), desc: t("feature1Desc") },
  { name: t("feature2Name"), desc: t("feature2Desc") },
]);

const activeCategory = ref<Category>("people");
const activePeriod = ref<Period>("month");
const entrants = ref<Entrant[]>([]);
const votingId = ref<string | null>(null);
const statusMessage = ref("");
const statusType = ref<"success" | "error">("success");
const isLoading = ref(false);
const fetchError = ref(false);

const buildLeaderboardUrl = () => {
  const params = new URLSearchParams();
  if (activePeriod.value !== "all") {
    params.set("period", activePeriod.value);
  }
  const query = params.toString();
  return query ? `/api/hall-of-fame/leaderboard?${query}` : "/api/hall-of-fame/leaderboard";
};

// Fetch leaderboard data from API
const fetchLeaderboard = async () => {
  isLoading.value = true;
  fetchError.value = false;
  try {
    const response = await fetch(buildLeaderboardUrl());
    if (!response.ok) {
      throw new Error(t("leaderboardUnavailable"));
    }
    const data = await response.json();
    const apiEntries = Array.isArray(data.entrants) ? data.entrants : [];
    entrants.value = apiEntries;
  } catch (e) {
    entrants.value = [];
    fetchError.value = true;
  } finally {
    isLoading.value = false;
  }
};

const leaderboard = computed(() => {
  const base = entrants.value.filter((e) => e.category === activeCategory.value);
  return base.slice().sort((a, b) => b.score - a.score);
});

const topScore = computed(() => (leaderboard.value.length > 0 ? leaderboard.value[0].score || 1 : 1));

function setCategory(id: string) {
  activeCategory.value = id as Category;
}

function setPeriod(id: string) {
  activePeriod.value = id as Period;
  fetchLeaderboard();
}

function formatNumber(num?: number) {
  return (num || 0).toLocaleString();
}

function getProgressWidth(score?: number) {
  if (!score) return "0%";
  return `${(score / topScore.value) * 100}%`;
}

function showStatus(message: string, type: "success" | "error") {
  statusMessage.value = message;
  statusType.value = type;
  setTimeout(() => (statusMessage.value = ""), 5000);
}

async function handleVote(entrant: Entrant) {
  if (votingId.value) return;
  votingId.value = entrant.id;

  try {
    // First, process the GAS payment
    await payGAS("1", `vote:${entrant.id}:${entrant.name}`);

    // Then, persist the vote to the backend
    const response = await fetch("/api/hall-of-fame/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entrantId: entrant.id,
        voter: address.value || undefined,
        amount: 1,
      }),
    });

    if (!response.ok) {
      throw new Error(t("voteRecordFailed"));
    }

    await response.json();
    await fetchLeaderboard();
    showStatus(t("voteSuccess"), "success");
  } catch (e: any) {
    showStatus(e.message || t("voteFailed"), "error");
  } finally {
    votingId.value = null;
  }
}

onMounted(async () => {
  initTheme();
  listenForThemeChanges();

  await connect();
  await fetchLeaderboard();
});
</script>

<style lang="scss" scoped>
@use "@/shared/styles/tokens.scss" as *;
@use "@/shared/styles/variables.scss";

@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&display=swap');

$museum-bg: #f9fafb;
$museum-text: #1f2937;
$museum-gold: #d4af37;
$museum-frame: #4b5563;
$museum-font: 'Cormorant Garamond', serif;

:global(page) {
  background: $museum-bg;
  font-family: $museum-font;
}

.app-container {
  padding: 32px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 32px;
  background-color: $museum-bg;
  /* Subtle Texture */
  background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZjNmNGY2Ii8+CjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNlNWU3ZWIiLz4KPC9zdmc+');
  min-height: 100vh;
}

/* Museum Component Overrides */
:deep(.neo-card) {
  background: white !important;
  border: 4px solid $museum-gold !important;
  border-radius: 2px !important;
  box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important;
  color: $museum-text !important;
  position: relative;
  
  /* Frame Inner Shadow */
  &::after {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    box-shadow: inset 0 0 10px rgba(0,0,0,0.2);
    pointer-events: none;
  }
}

:deep(.neo-button) {
  border-radius: 4px !important;
  font-family: $museum-font !important;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 700 !important;
  
  &.variant-primary {
    background: $museum-gold !important;
    color: white !important;
    border: 1px solid #b4941f !important;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2) !important;
    
    &:active {
      transform: translateY(1px);
      box-shadow: none !important;
    }
  }
  
  &.variant-secondary {
    background: white !important;
    border: 1px solid $museum-frame !important;
    color: $museum-frame !important;
  }
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.category-tabs-glass {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  justify-content: center;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 16px;
}

.category-tab-glass {
  padding: 8px 16px;
  background: transparent;
  font-weight: 700;
  text-transform: uppercase;
  font-size: 14px;
  cursor: pointer;
  color: #6b7280;
  font-family: $museum-font;
  letter-spacing: 0.05em;

  &.active {
    color: $museum-gold;
    border-bottom: 2px solid $museum-gold;
  }
}

.period-filter-glass {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 16px;
}

.period-btn-glass {
  padding: 4px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  font-size: 12px;
  color: #6b7280;
  cursor: pointer;
  
  &.active {
    background: $museum-gold;
    color: white;
    border-color: $museum-gold;
  }
}

.leaderboard-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.entrant-card-glass {
  margin-bottom: 0;
  padding: 24px;
}

.entrant-inner {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.rank-glass {
  font-size: 24px;
  font-weight: 700;
  font-family: $museum-font;
  width: 40px;
  text-align: center;
  color: #9ca3af;

  &.rank-1 { color: $museum-gold; font-size: 32px; }
  &.rank-2 { color: #9ca3af; font-size: 28px; }
  &.rank-3 { color: #d97706; font-size: 28px; }
}

.avatar-glass {
  width: 60px;
  height: 60px;
  background: #f3f4f6;
  border: 2px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.avatar-text-glass {
  font-size: 24px;
  font-weight: 700;
  color: $museum-frame;
  font-family: $museum-font;
}

.entrant-info {
  flex: 1;
}

.entrant-name-glass {
  font-size: 20px;
  font-weight: 700;
  display: block;
  margin-bottom: 4px;
  color: $museum-text;
  font-family: $museum-font;
}

.score-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.score-glass {
  font-size: 14px;
  font-weight: 600;
  color: #6b7280;
}

.progress-track-glass {
  height: 4px;
  background: #f3f4f6;
  border-radius: 2px;
  position: relative;
  overflow: hidden;
  margin-top: 12px;
}

.progress-bar-glass {
  position: absolute;
  left: 0; top: 0; bottom: 0;
  background: #9ca3af;
  border-radius: 2px;

  &.gold {
    background: $museum-gold;
  }
}

.progress-glow {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.empty-state-card {
  text-align: center;
  border: 2px dashed #e5e7eb !important;
  background: transparent !important;
  box-shadow: none !important;
}
.empty-state-content {
  padding: 40px;
}
.empty-state-title {
  font-weight: 700;
  color: #6b7280;
  font-family: $museum-font;
  font-size: 18px;
}
.empty-state-subtitle {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 8px;
  display: block;
}

.scrollable {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>
