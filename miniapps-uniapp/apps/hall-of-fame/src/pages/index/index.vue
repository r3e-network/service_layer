<template>
  <AppLayout :title="t('title')" show-top-nav :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <view v-if="chainType === 'evm'" class="px-4 mb-4">
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
        <!-- Header Card -->
        <NeoCard variant="accent" class="header-card">
          <view class="header-content">
            <text class="header-icon">🏆</text>
            <text class="header-title">{{ t("title") }}</text>
          </view>
          <text class="header-subtitle">{{ t("subtitle") }}</text>
          <text class="header-tagline">{{ t("tagline") }}</text>
        </NeoCard>

        <!-- Category Tabs -->
        <view class="category-tabs">
          <view
            v-for="c in categories"
            :key="c.id"
            class="category-tab"
            :class="{ active: activeCategory === c.id }"
            @click="setCategory(c.id)"
          >
            <text>{{ c.label }}</text>
          </view>
        </view>

        <!-- Period Filter -->
        <view class="period-filter">
          <view
            v-for="p in periods"
            :key="p.id"
            class="period-btn"
            :class="{ active: activePeriod === p.id }"
            @click="setPeriod(p.id)"
          >
            <text>{{ p.label }}</text>
          </view>
        </view>

        <!-- Leaderboard List -->
        <view class="leaderboard-list">
          <NeoCard v-for="(entrant, index) in leaderboard" :key="entrant.id" class="entrant-card">
            <view class="entrant-inner">
              <!-- Rank -->
              <view class="rank" :class="'rank-' + (index + 1)">
                <text>#{{ index + 1 }}</text>
              </view>

              <!-- Avatar -->
              <view class="avatar">
                <text class="avatar-text">{{ entrant.name.charAt(0) }}</text>
              </view>

              <!-- Info -->
              <view class="entrant-info">
                <text class="entrant-name">{{ entrant.name }}</text>
                <view class="score-row">
                  <text class="fire">🔥</text>
                  <text class="score">{{ formatNumber(entrant.displayScore) }} GAS</text>
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
            <view class="progress-track">
              <view
                class="progress-bar"
                :class="{ gold: index === 0 }"
                :style="{ width: getProgressWidth(entrant.displayScore) }"
              ></view>
            </view>
          </NeoCard>
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
    </view>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useWallet, usePayments } from "@neo/uniapp-sdk";
import { createT } from "@/shared/utils/i18n";
import { initTheme, listenForThemeChanges } from "@/shared/utils/theme";
import { AppLayout, NeoButton, NeoCard, NeoDoc } from "@/shared/components";
import type { NavTab } from "@/shared/components/NavBar.vue";

const translations = {
  title: { en: "Neo Hall of Fame", zh: "Neo 名人堂" },
  subtitle: { en: "Vote with GAS volume. Pay to win.", zh: "用 GAS 投票，付费即胜利。" },
  tagline: { en: "History is written by the highest bidder.", zh: "历史由出价最高者书写。" },
  boost: { en: "BOOST", zh: "助力" },
  tabLeaderboard: { en: "Leaderboard", zh: "排行榜" },
  docs: { en: "Docs", zh: "文档" },
  catPeople: { en: "People", zh: "人物" },
  catCommunity: { en: "Communities", zh: "社区" },
  catDeveloper: { en: "Developers", zh: "开发者" },
  period24h: { en: "24H", zh: "24小时" },
  period7d: { en: "7D", zh: "7天" },
  period30d: { en: "30D", zh: "30天" },
  periodAll: { en: "ALL", zh: "全部" },
  voteSuccess: { en: "Vote successful!", zh: "投票成功！" },
  voteFailed: { en: "Vote failed", zh: "投票失败" },
  docSubtitle: { en: "Community recognition through GAS voting", zh: "通过 GAS 投票进行社区认可" },
  docDescription: {
    en: "Neo Hall of Fame is a community-driven leaderboard where you can boost your favorite people, communities, and developers in the Neo ecosystem by voting with GAS.",
    zh: "Neo 名人堂是一个社区驱动的排行榜，您可以通过 GAS 投票来支持 Neo 生态系统中您喜爱的人物、社区和开发者。",
  },
  step1: { en: "Connect your Neo wallet", zh: "连接您的 Neo 钱包" },
  step2: { en: "Browse categories: People, Communities, Developers", zh: "浏览分类：人物、社区、开发者" },
  step3: { en: "Click BOOST to vote with GAS", zh: "点击助力用 GAS 投票" },
  step4: { en: "Watch your favorites climb the leaderboard", zh: "观看您喜爱的对象攀升排行榜" },
  feature1Name: { en: "GAS Voting", zh: "GAS 投票" },
  feature1Desc: { en: "Vote with real GAS tokens to boost rankings.", zh: "使用真实 GAS 代币投票提升排名。" },
  feature2Name: { en: "Multiple Categories", zh: "多种分类" },
  feature2Desc: { en: "Recognize people, communities, and developers.", zh: "认可人物、社区和开发者。" },
  wrongChain: { en: "Wrong Chain", zh: "链错误" },
  wrongChainMessage: {
    en: "This app requires Neo N3. Please switch networks.",
    zh: "此应用需要 Neo N3 网络，请切换网络。",
  },
  switchToNeo: { en: "Switch to Neo N3", zh: "切换到 Neo N3" },
};

const t = createT(translations);

const APP_ID = "miniapp-hall-of-fame";
const { address, connect, chainType, switchChain } = useWallet() as any;
const { payGAS, isLoading: paymentLoading } = usePayments(APP_ID);

type Category = "people" | "community" | "developer";
type Period = "day" | "week" | "month" | "year";

interface Entrant {
  id: string;
  name: string;
  category: Category;
  score: number;
  displayScore?: number;
}

const activeTab = ref("leaderboard");
const navTabs: NavTab[] = [
  { id: "leaderboard", icon: "trophy", label: t("tabLeaderboard") },
  { id: "docs", icon: "book", label: t("docs") },
];

const categories = computed(() => [
  { id: "people", label: t("catPeople") },
  { id: "community", label: t("catCommunity") },
  { id: "developer", label: t("catDeveloper") },
]);

const periods = computed(() => [
  { id: "day", label: t("period24h") },
  { id: "week", label: t("period7d") },
  { id: "month", label: t("period30d") },
  { id: "year", label: t("periodAll") },
]);

const docSteps = computed(() => [t("step1"), t("step2"), t("step3"), t("step4")]);
const docFeatures = computed(() => [
  { name: t("feature1Name"), desc: t("feature1Desc") },
  { name: t("feature2Name"), desc: t("feature2Desc") },
]);

const mockData: Entrant[] = [
  { id: "p1", name: "Da Hongfei", category: "people", score: 54020 },
  { id: "p2", name: "Erik Zhang", category: "people", score: 48900 },
  { id: "p3", name: "John DeVadoss", category: "people", score: 32150 },
  { id: "c1", name: "Neo News Today", category: "community", score: 89000 },
  { id: "c2", name: "N Zone", category: "community", score: 67500 },
  { id: "d1", name: "AxLabs", category: "developer", score: 92100 },
  { id: "d2", name: "COZ", category: "developer", score: 88500 },
  { id: "d3", name: "Red4Sec", category: "developer", score: 76000 },
];

const activeCategory = ref<Category>("people");
const activePeriod = ref<Period>("month");
const entrants = ref<Entrant[]>([]);
const votingId = ref<string | null>(null);
const statusMessage = ref("");
const statusType = ref<"success" | "error">("success");
const isLoading = ref(false);

// Fetch leaderboard data from API
const fetchLeaderboard = async () => {
  isLoading.value = true;
  try {
    const response = await fetch("/api/hall-of-fame/leaderboard");
    if (response.ok) {
      const data = await response.json();
      const apiEntries = Array.isArray(data.entrants) ? data.entrants : [];
      entrants.value = apiEntries.length > 0 ? apiEntries : mockData;
      return;
    }
    entrants.value = mockData;
  } catch (e) {
    console.warn("[HallOfFame] Failed to fetch leaderboard:", e);
    entrants.value = mockData;
  } finally {
    isLoading.value = false;
  }
};

const leaderboard = computed(() => {
  const base = entrants.value.filter((e) => e.category === activeCategory.value);
  const factor =
    activePeriod.value === "day"
      ? 0.05
      : activePeriod.value === "week"
        ? 0.25
        : activePeriod.value === "month"
          ? 1
          : 12;
  return base
    .map((e) => ({ ...e, displayScore: Math.floor(e.score * factor) }))
    .sort((a, b) => (b.displayScore || 0) - (a.displayScore || 0));
});

const topScore = computed(() => (leaderboard.value.length > 0 ? leaderboard.value[0].displayScore || 1 : 1));

function setCategory(id: string) {
  activeCategory.value = id as Category;
}

function setPeriod(id: string) {
  activePeriod.value = id as Period;
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

    if (response.ok) {
      const result = await response.json();
      // Update local state with server-confirmed score
      const idx = entrants.value.findIndex((e) => e.id === entrant.id);
      if (idx !== -1) {
        if (result.newScore !== undefined) {
          entrants.value[idx].score = result.newScore;
        } else {
          entrants.value[idx].score += 100;
        }
      }
    } else {
      // Payment succeeded but backend failed - still update locally
      const idx = entrants.value.findIndex((e) => e.id === entrant.id);
      if (idx !== -1) {
        entrants.value[idx].score += 100;
      }
      console.warn("[HallOfFame] Vote API failed, updated locally only");
    }

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

.app-container {
  padding: $space-4;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: $space-4;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.header-card {
  text-align: center;
  padding: $space-6;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $space-3;
  margin-bottom: $space-3;
}

.header-icon {
  font-size: 32px;
}

.header-title {
  font-weight: $font-weight-black;
  font-size: 24px;
  text-transform: uppercase;
  letter-spacing: -1px;
}

.header-subtitle {
  font-weight: $font-weight-bold;
  font-size: 14px;
  display: block;
  margin-bottom: $space-2;
}

.header-tagline {
  font-size: 12px;
  opacity: 0.7;
  display: block;
}

.category-tabs {
  display: flex;
  gap: $space-3;
  flex-wrap: wrap;
}

.category-tab {
  padding: $space-2 $space-4;
  background: var(--bg-secondary);
  border: 2px solid var(--border-color);
  font-weight: $font-weight-bold;
  text-transform: uppercase;
  font-size: 12px;
  box-shadow: 2px 2px 0 var(--border-color);
  cursor: pointer;
  transition: all 0.1s;

  &.active {
    background: var(--neo-green);
    color: black;
    transform: translate(2px, 2px);
    box-shadow: none;
  }
}

.period-filter {
  display: flex;
  gap: $space-2;
  justify-content: flex-end;
}

.period-btn {
  padding: $space-1 $space-3;
  border: 2px solid var(--border-color);
  font-size: 11px;
  font-weight: $font-weight-bold;
  cursor: pointer;

  &.active {
    background: var(--neo-green);
    color: black;
    box-shadow: 2px 2px 0 var(--border-color);
  }
}

.leaderboard-list {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.entrant-card {
  padding: $space-4;
}

.entrant-inner {
  display: flex;
  align-items: center;
  gap: $space-3;
}

.rank {
  font-size: 20px;
  font-weight: $font-weight-black;
  font-style: italic;
  width: 36px;
  text-align: center;
  opacity: 0.5;

  &.rank-1 {
    color: #fbbf24;
    opacity: 1;
  }
  &.rank-2 {
    color: #94a3b8;
    opacity: 1;
  }
  &.rank-3 {
    color: #b45309;
    opacity: 1;
  }
}

.avatar {
  width: 44px;
  height: 44px;
  background: var(--bg-tertiary);
  border: 2px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-text {
  font-size: 18px;
  font-weight: $font-weight-black;
}

.entrant-info {
  flex: 1;
  min-width: 0;
}

.entrant-name {
  font-size: 14px;
  font-weight: $font-weight-black;
  display: block;
  margin-bottom: $space-1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.score-row {
  display: flex;
  align-items: center;
  gap: $space-1;
}

.fire {
  font-size: 12px;
}

.score {
  font-size: 11px;
  font-weight: $font-weight-semibold;
  opacity: 0.7;
  font-family: $font-mono;
}

.progress-track {
  margin-top: $space-3;
  height: 6px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  position: relative;
}

.progress-bar {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  background: var(--neo-green);

  &.gold {
    background: #fbbf24;
  }
}

.scrollable {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>
