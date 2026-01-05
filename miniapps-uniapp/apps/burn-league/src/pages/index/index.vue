<template>
  <AppLayout :title="t('title')" show-top-nav :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <view v-if="activeTab === 'game'" class="tab-content">
      <view v-if="status" :class="['status-msg', status.type]">
        <text>{{ status.msg }}</text>
      </view>

      <!-- Total Burned Hero Section with Fire Animation -->
      <NeoCard variant="default" class="hero-card">
        <view class="fire-container">
          <view class="flame flame-1"></view>
          <view class="flame flame-2"></view>
          <view class="flame flame-3"></view>
        </view>
        <view class="hero-content">
          <text class="hero-label">{{ t("totalBurned") }}</text>
          <text class="hero-value">{{ formatNum(totalBurned) }}</text>
          <text class="hero-suffix">GAS</text>
        </view>
      </NeoCard>

      <!-- Stats Grid -->
      <view class="stats-grid">
        <view class="stat-box stat-box-user">
          <text class="stat-icon">🔥</text>
          <text class="stat-value">{{ formatNum(userBurned) }}</text>
          <text class="stat-label">{{ t("youBurned") }}</text>
        </view>
        <view class="stat-box stat-box-rank">
          <text class="stat-icon">{{ getRankIcon(rank) }}</text>
          <text class="stat-value">#{{ rank }}</text>
          <text class="stat-label">{{ t("rank") }}</text>
        </view>
      </view>

      <!-- Burn Action Card -->
      <NeoCard :title="t('burnTokens')" variant="accent" class="burn-card">
        <NeoInput v-model="burnAmount" type="number" :placeholder="t('amountPlaceholder')" suffix="GAS" />
        <view class="reward-info">
          <text class="reward-label">{{ t("estimatedRewards") }}</text>
          <text class="reward-value">+{{ formatNum(estimatedReward) }} {{ t("points") }}</text>
        </view>
        <NeoButton variant="primary" size="lg" block :loading="isLoading" @click="burnTokens" class="burn-button">
          <text class="burn-button-text">🔥 {{ t("burnNow") }}</text>
        </NeoButton>
      </NeoCard>

      <!-- Leaderboard with Medal Icons -->
      <NeoCard :title="t('leaderboard')" variant="default" class="leaderboard-card">
        <view class="leaderboard-list">
          <view
            v-for="(entry, i) in leaderboard"
            :key="i"
            :class="['leader-item', entry.isUser && 'highlight', `rank-${entry.rank}`]"
          >
            <view class="leader-rank-container">
              <text class="leader-medal">{{ getMedalIcon(entry.rank) }}</text>
              <text class="leader-rank">#{{ entry.rank }}</text>
            </view>
            <text class="leader-addr">{{ entry.address }}</text>
            <view class="leader-burned-container">
              <text class="leader-burned">{{ formatNum(entry.burned) }}</text>
              <text class="leader-burned-suffix">GAS</text>
            </view>
          </view>
        </view>
      </NeoCard>
    </view>

    <view v-if="activeTab === 'stats'" class="tab-content scrollable">
      <NeoCard :title="t('statistics')" variant="default">
        <view class="stat-row">
          <text class="stat-label">{{ t("totalGames") }}</text>
          <text class="stat-value">{{ burnCount }}</text>
        </view>
        <view class="stat-row">
          <text class="stat-label">{{ t("youBurned") }}</text>
          <text class="stat-value">{{ formatNum(userBurned) }} GAS</text>
        </view>
        <view class="stat-row">
          <text class="stat-label">{{ t("totalBurned") }}</text>
          <text class="stat-value">{{ formatNum(totalBurned) }} GAS</text>
        </view>
        <view class="stat-row">
          <text class="stat-label">{{ t("rank") }}</text>
          <text class="stat-value">#{{ rank }}</text>
        </view>
        <view class="stat-row">
          <text class="stat-label">{{ t("estimatedRewards") }}</text>
          <text class="stat-value">{{ formatNum(estimatedReward) }} {{ t("points") }}</text>
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
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useWallet, usePayments } from "@neo/uniapp-sdk";
import { formatNumber } from "@/shared/utils/format";
import { createT } from "@/shared/utils/i18n";
import AppLayout from "@/shared/components/AppLayout.vue";
import NeoButton from "@/shared/components/NeoButton.vue";
import NeoCard from "@/shared/components/NeoCard.vue";
import NeoInput from "@/shared/components/NeoInput.vue";
import NeoDoc from "@/shared/components/NeoDoc.vue";

const translations = {
  title: { en: "Burn League", zh: "燃烧联盟" },
  subtitle: { en: "Burn tokens, earn rewards", zh: "燃烧代币，赚取奖励" },
  totalBurned: { en: "Total Burned", zh: "总燃烧量" },
  youBurned: { en: "You Burned", zh: "你的燃烧量" },
  rank: { en: "Rank", zh: "排名" },
  burnTokens: { en: "Burn Tokens", zh: "燃烧代币" },
  amountPlaceholder: { en: "Amount to burn", zh: "燃烧数量" },
  estimatedRewards: { en: "Estimated Rewards", zh: "预估奖励" },
  points: { en: "Points", zh: "积分" },
  burning: { en: "Burning...", zh: "燃烧中..." },
  burnNow: { en: "Burn Now", zh: "立即燃烧" },
  leaderboard: { en: "Leaderboard", zh: "排行榜" },
  burned: { en: "Burned", zh: "已燃烧" },
  success: { en: "successfully!", zh: "成功！" },
  error: { en: "Error", zh: "错误" },
  game: { en: "Game", zh: "游戏" },
  stats: { en: "Stats", zh: "统计" },
  statistics: { en: "Statistics", zh: "统计数据" },
  totalGames: { en: "Total Games", zh: "总游戏数" },
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

const navTabs = [
  { id: "game", icon: "game", label: t("game") },
  { id: "stats", icon: "chart", label: t("stats") },
  { id: "docs", icon: "book", label: t("docs") },
];
const activeTab = ref("game");

const docSteps = computed(() => [t("step1"), t("step2"), t("step3")]);
const docFeatures = computed(() => [
  { name: t("feature1Name"), desc: t("feature1Desc") },
  { name: t("feature2Name"), desc: t("feature2Desc") },
]);

const APP_ID = "miniapp-burn-league";
const { address, connect } = useWallet();

interface LeaderEntry {
  rank: number;
  address: string;
  burned: number;
  isUser: boolean;
}

const { payGAS, isLoading } = usePayments(APP_ID);

const burnAmount = ref("10");
const totalBurned = ref(50000);
const userBurned = ref(250);
const rank = ref(15);
const burnCount = ref(0);
const status = ref<{ msg: string; type: string } | null>(null);

const leaderboard = ref<LeaderEntry[]>([
  { rank: 1, address: "0x1a2b...3c4d", burned: 5000, isUser: false },
  { rank: 2, address: "0x5e6f...7g8h", burned: 3500, isUser: false },
  { rank: 3, address: "0x9i0j...1k2l", burned: 2800, isUser: false },
  { rank: 15, address: "You", burned: 250, isUser: true },
]);

const estimatedReward = computed(() => parseFloat(burnAmount.value || "0") * 10);
const formatNum = (n: number) => formatNumber(n, 0);

const getMedalIcon = (rank: number): string => {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return "";
};

const getRankIcon = (rank: number): string => {
  if (rank <= 3) return "👑";
  if (rank <= 10) return "⭐";
  return "📊";
};

const burnTokens = async () => {
  if (isLoading.value) return;
  const amount = parseFloat(burnAmount.value);
  if (amount < 1) {
    status.value = { msg: `${t("error")}: Min burn: 1 GAS`, type: "error" };
    return;
  }
  try {
    status.value = { msg: t("burning"), type: "loading" };
    await payGAS(burnAmount.value, "burn");
    userBurned.value += amount;
    totalBurned.value += amount;
    burnCount.value++;
    status.value = { msg: `${t("burned")} ${amount} GAS! +${estimatedReward.value} ${t("points")}`, type: "success" };
  } catch (e: any) {
    status.value = { msg: e.message || t("error"), type: "error" };
  }
};
</script>

<style lang="scss" scoped>
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.tab-content {
  padding: $space-3;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: $space-4;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
}

.status-msg {
  text-align: center;
  padding: $space-3;
  border: $border-width-md solid var(--border-color);
  box-shadow: $shadow-md;
  margin-bottom: $space-4;
  font-weight: $font-weight-bold;

  &.success {
    background: var(--status-success);
    color: var(--neo-black);
    border-color: var(--neo-green);
  }

  &.error {
    background: var(--status-error);
    color: var(--neo-white);
    border-color: var(--brutal-red);
  }

  &.loading {
    background: var(--brutal-yellow);
    color: var(--neo-black);
    border-color: var(--brutal-orange);
  }
}

/* Hero Card with Fire Animation */
.hero-card {
  position: relative;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  background: linear-gradient(135deg, var(--brutal-orange) 0%, var(--brutal-red) 100%);
  border: $border-width-lg solid var(--brutal-red);
  box-shadow:
    0 8px 0 var(--brutal-red),
    0 12px 20px rgba(0, 0, 0, 0.3);
}

.fire-container {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  pointer-events: none;
}

.flame {
  width: 30px;
  height: 40px;
  background: linear-gradient(to top, var(--brutal-orange), var(--brutal-yellow));
  border-radius: 50% 50% 0 0;
  animation: flicker 1.5s infinite ease-in-out;
  opacity: 0.8;

  &.flame-1 {
    animation-delay: 0s;
  }

  &.flame-2 {
    animation-delay: 0.3s;
    height: 50px;
  }

  &.flame-3 {
    animation-delay: 0.6s;
    height: 35px;
  }
}

@keyframes flicker {
  0%,
  100% {
    transform: scaleY(1) scaleX(1);
    opacity: 0.8;
  }
  50% {
    transform: scaleY(1.2) scaleX(0.9);
    opacity: 1;
  }
}

.hero-content {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: $space-6 $space-4;
}

.hero-label {
  display: block;
  color: var(--neo-white);
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: $space-2;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

.hero-value {
  display: block;
  color: var(--neo-white);
  font-size: 48px;
  font-weight: $font-weight-black;
  line-height: 1;
  text-shadow: 4px 4px 8px rgba(0, 0, 0, 0.5);
  animation: pulse 2s infinite ease-in-out;
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.hero-suffix {
  display: block;
  color: var(--brutal-yellow);
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
  margin-top: $space-2;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

/* Stats Grid */
.stats-grid {
  display: flex;
  gap: $space-3;
}

.stat-box {
  flex: 1;
  text-align: center;
  background: var(--bg-elevated);
  border: $border-width-md solid var(--neo-green);
  box-shadow: 4px 4px 0 var(--neo-green);
  padding: $space-4;
  transition: all $transition-fast;

  &:active {
    transform: translate(2px, 2px);
    box-shadow: 2px 2px 0 var(--neo-green);
  }
}

.stat-box-user {
  border-color: var(--brutal-orange);
  box-shadow: 4px 4px 0 var(--brutal-orange);

  &:active {
    box-shadow: 2px 2px 0 var(--brutal-orange);
  }
}

.stat-box-rank {
  border-color: var(--brutal-yellow);
  box-shadow: 4px 4px 0 var(--brutal-yellow);

  &:active {
    box-shadow: 2px 2px 0 var(--brutal-yellow);
  }
}

.stat-icon {
  display: block;
  font-size: 32px;
  margin-bottom: $space-2;
}

.stat-value {
  color: var(--text-primary);
  font-size: $font-size-2xl;
  font-weight: $font-weight-black;
  display: block;
  line-height: $line-height-tight;
}

.stat-label {
  color: var(--text-secondary);
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: $space-2;
  display: block;
}

/* Burn Card */
.burn-card {
  background: var(--bg-card);
}

.reward-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $space-4;
  background: var(--bg-elevated);
  border: $border-width-md solid var(--brutal-yellow);
  box-shadow: 4px 4px 0 var(--brutal-yellow);
  margin: $space-4 0;
  border-radius: $radius-sm;
}

.reward-label {
  color: var(--text-secondary);
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  text-transform: uppercase;
}

.reward-value {
  color: var(--brutal-yellow);
  font-size: $font-size-xl;
  font-weight: $font-weight-black;
}

.burn-button {
  background: linear-gradient(135deg, var(--brutal-orange), var(--brutal-red));
  border-color: var(--brutal-red);

  &:active {
    background: var(--brutal-red);
  }
}

.burn-button-text {
  font-size: $font-size-lg;
  font-weight: $font-weight-black;
}

/* Leaderboard */
.leaderboard-card {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.leaderboard-list {
  display: flex;
  flex-direction: column;
  gap: $space-2;
  overflow-y: auto;
    -webkit-overflow-scrolling: touch;
}

.leader-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $space-3;
  background: var(--bg-secondary);
  border: $border-width-md solid var(--border-color);
  box-shadow: 3px 3px 0 var(--neo-black);
  transition: all $transition-fast;

  &.highlight {
    background: var(--bg-elevated);
    border-color: var(--neo-green);
    box-shadow: 5px 5px 0 var(--neo-green);
  }

  &.rank-1 {
    border-color: var(--brutal-yellow);
    box-shadow: 5px 5px 0 var(--brutal-yellow);
    background: linear-gradient(
      135deg,
      rgba(var(--brutal-yellow-rgb, 255, 222, 89), 0.1),
      rgba(var(--brutal-yellow-rgb, 255, 222, 89), 0.05)
    );
  }

  &.rank-2 {
    border-color: var(--text-secondary);
    box-shadow: 5px 5px 0 var(--text-secondary);
    background: linear-gradient(
      135deg,
      rgba(var(--text-secondary-rgb, 192, 192, 192), 0.1),
      rgba(var(--text-secondary-rgb, 192, 192, 192), 0.05)
    );
  }

  &.rank-3 {
    border-color: var(--brutal-orange);
    box-shadow: 5px 5px 0 var(--brutal-orange);
    background: linear-gradient(
      135deg,
      rgba(var(--brutal-orange-rgb, 205, 127, 50), 0.1),
      rgba(var(--brutal-orange-rgb, 205, 127, 50), 0.05)
    );
  }

  &:active {
    transform: translate(2px, 2px);
    box-shadow: 1px 1px 0 var(--neo-black);
  }
}

.leader-rank-container {
  display: flex;
  align-items: center;
  gap: $space-2;
  min-width: 80px;
}

.leader-medal {
  font-size: 24px;
}

.leader-rank {
  color: var(--text-primary);
  font-weight: $font-weight-black;
  font-size: $font-size-lg;
}

.leader-addr {
  color: var(--text-primary);
  font-weight: $font-weight-semibold;
  flex: 1;
  padding: 0 $space-3;
  font-size: $font-size-base;
}

.leader-burned-container {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.leader-burned {
  color: var(--brutal-orange);
  font-weight: $font-weight-black;
  font-size: $font-size-lg;
}

.leader-burned-suffix {
  color: var(--text-secondary);
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
}

/* Stats Tab */
.stat-row {
  display: flex;
  justify-content: space-between;
  padding: $space-3 0;
  border-bottom: $border-width-sm solid var(--border-color);

  &:last-child {
    border-bottom: 0;
  }

  .stat-label {
    color: var(--text-secondary);
    font-weight: $font-weight-semibold;
  }

  .stat-value {
    font-weight: $font-weight-bold;
    color: var(--text-primary);
  }
}
</style>
