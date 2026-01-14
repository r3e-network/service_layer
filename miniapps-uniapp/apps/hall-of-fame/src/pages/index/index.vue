<template>
  <AppLayout :title="t('title')" show-top-nav :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
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
        <!-- Header Card -->
        <NeoCard variant="erobo" class="header-card-glass">
          <view class="header-content-glass">
            <text class="header-icon-glass">🏆</text>
            <text class="header-title-glass">{{ t("title") }}</text>
          </view>
          <text class="header-subtitle-glass">{{ t("subtitle") }}</text>
          <text class="header-tagline-glass">{{ t("tagline") }}</text>
        </NeoCard>

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
                  <text class="score-glass">{{ formatNumber(entrant.displayScore) }} GAS</text>
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
                :style="{ width: getProgressWidth(entrant.displayScore) }"
              >
                <view class="progress-glow" v-if="index === 0"></view>
              </view>
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

.header-card-glass {
  text-align: center;
}

.header-content-glass {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $space-3;
  margin-bottom: $space-3;
}

.header-icon-glass {
  font-size: 32px;
  filter: drop-shadow(0 0 10px rgba(253, 224, 71, 0.4));
}

.header-title-glass {
  font-weight: 800;
  font-size: 24px;
  text-transform: uppercase;
  color: white;
  text-shadow: 0 0 15px rgba(255, 255, 255, 0.3);
}

.header-subtitle-glass {
  font-weight: 600;
  font-size: 14px;
  display: block;
  margin-bottom: $space-2;
  color: #00E599;
}

.header-tagline-glass {
  font-size: 12px;
  opacity: 0.7;
  display: block;
  color: rgba(255, 255, 255, 0.6);
  font-style: italic;
}

.category-tabs-glass {
  display: flex;
  gap: $space-3;
  flex-wrap: wrap;
  justify-content: center;
}

.category-tab-glass {
  padding: 6px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-weight: 700;
  text-transform: uppercase;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 99px;
  color: rgba(255, 255, 255, 0.6);

  &.active {
    background: rgba(0, 229, 153, 0.15);
    color: #00E599;
    border-color: rgba(0, 229, 153, 0.3);
    box-shadow: 0 0 10px rgba(0, 229, 153, 0.2);
  }
}

.period-filter-glass {
  display: flex;
  gap: $space-2;
  justify-content: flex-end;
  margin-top: -8px;
  margin-bottom: $space-2;
}

.period-btn-glass {
  padding: 4px 10px;
  border: 1px solid transparent;
  font-size: 10px;
  font-weight: 700;
  cursor: pointer;
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.4);
  transition: all 0.2s;

  &.active {
    background: rgba(255, 255, 255, 0.1);
    color: white;
    border-color: rgba(255, 255, 255, 0.1);
  }
}

.leaderboard-list {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.entrant-card-glass {
  margin-bottom: 0;
}

.entrant-inner {
  display: flex;
  align-items: center;
  gap: $space-3;
  margin-bottom: $space-3;
}

.rank-glass {
  font-size: 16px;
  font-weight: 800;
  font-style: italic;
  width: 32px;
  text-align: center;
  opacity: 0.4;
  color: white;

  &.rank-1 { color: #FCD34D; opacity: 1; text-shadow: 0 0 10px rgba(252, 211, 77, 0.5); font-size: 20px; }
  &.rank-2 { color: #E5E7EB; opacity: 0.8; font-size: 18px; }
  &.rank-3 { color: #FDBA74; opacity: 0.7; font-size: 18px; }
}

.avatar-glass {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  box-shadow: inset 0 0 10px rgba(0,0,0,0.2);
}

.avatar-text-glass {
  font-size: 16px;
  font-weight: 800;
  color: white;
}

.entrant-info {
  flex: 1;
  min-width: 0;
}

.entrant-name-glass {
  font-size: 14px;
  font-weight: 700;
  display: block;
  margin-bottom: 2px;
  color: white;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.score-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.fire-glass {
  font-size: 12px;
}

.score-glass {
  font-size: 11px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  font-family: $font-mono;
}

.progress-track-glass {
  height: 6px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
  position: relative;
  overflow: hidden;
}

.progress-bar-glass {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;

  &.gold {
    background: linear-gradient(90deg, #F59E0B, #FCD34D);
  }
}
.progress-glow {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 10px;
  background: white;
  filter: blur(4px);
  opacity: 0.7;
}

.scrollable {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>
