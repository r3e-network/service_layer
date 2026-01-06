<template>
  <AppLayout :title="t('title')" show-top-nav :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <view class="app-container">
      <NeoCard v-if="status" :variant="status.type === 'error' ? 'danger' : 'success'" class="mb-4">
        <text class="text-center font-bold">{{ status.msg }}</text>
      </NeoCard>

      <view v-if="activeTab === 'boost'" class="tab-content">
        <!-- Power Meter Card -->
        <NeoCard>
          <view class="power-meter-container">
            <view class="power-header">
              <text class="power-title">{{ t("currentPower") }}</text>
              <text class="power-value">{{ formatNum(votingPower) }}</text>
            </view>

            <!-- Boost Gauge -->
            <view class="boost-gauge">
              <view class="gauge-track">
                <view class="gauge-fill" :style="{ width: `${Math.min((boostMultiplier / 5) * 100, 100)}%` }"></view>
              </view>
              <view class="gauge-labels">
                <text class="gauge-label">1x</text>
                <text class="gauge-label">2x</text>
                <text class="gauge-label">3x</text>
                <text class="gauge-label">5x</text>
              </view>
            </view>

            <!-- Stats Grid -->
            <view class="stats-grid">
              <view class="stat-box">
                <text class="stat-icon">⚡</text>
                <text class="stat-value">{{ boostMultiplier }}x</text>
                <text class="stat-label">{{ t("multiplier") }}</text>
              </view>
              <view class="stat-box">
                <text class="stat-icon">📊</text>
                <text class="stat-value">{{ activeProposalsCount }}</text>
                <text class="stat-label">{{ t("active") }}</text>
              </view>
              <view class="stat-box">
                <text class="stat-icon">🔒</text>
                <text class="stat-value">{{ activeBoosts.length }}</text>
                <text class="stat-label">{{ t("boosts") }}</text>
              </view>
            </view>
          </view>
        </NeoCard>

        <!-- Boost Calculator Card -->
        <NeoCard :title="t('boostCalculator')">
          <view class="calculator-section">
            <view class="input-section">
              <text class="input-label">{{ t("amountToLock") }}</text>
              <NeoInput v-model="lockAmount" type="number" :placeholder="t('enterAmount')" suffix="GAS" />
            </view>

            <!-- Duration Selection -->
            <view class="duration-section">
              <text class="section-label">{{ t("lockDuration") }}</text>
              <view class="duration-grid">
                <view
                  v-for="d in durations"
                  :key="d.days"
                  :class="['duration-card', { active: lockDuration === d.days }]"
                  @click="lockDuration = d.days"
                >
                  <text class="duration-period">{{ d.label }}</text>
                  <text class="duration-multiplier">{{ d.boost }}x</text>
                  <text class="duration-boost-label">{{ t("boost") }}</text>
                </view>
              </view>
            </view>

            <!-- Projected Power -->
            <view class="projection-box">
              <view class="projection-row">
                <text class="projection-label">{{ t("projectedPower") }}</text>
                <text class="projection-value">
                  {{ formatNum(votingPower + parseFloat(lockAmount || "0") * selectedBoost) }}
                </text>
              </view>
              <view class="projection-row">
                <text class="projection-label">{{ t("powerIncrease") }}</text>
                <text class="projection-increase">
                  +{{ formatNum(parseFloat(lockAmount || "0") * selectedBoost) }}
                </text>
              </view>
            </view>

            <NeoButton variant="primary" size="lg" block :loading="isLoading" @click="boostVote" class="boost-button">
              {{ isLoading ? t("processing") : t("lockAndBoost") }}
            </NeoButton>
          </view>
        </NeoCard>

        <!-- Active Boosts History -->
        <NeoCard :title="t('activeBoosts')">
          <view class="boosts-list">
            <text v-if="activeBoosts.length === 0" class="empty">{{ t("noActiveBoosts") }}</text>
            <view v-for="(boost, i) in activeBoosts" :key="i" class="boost-item">
              <view class="boost-header">
                <text class="boost-amount">{{ boost.amount }} GAS</text>
                <text class="boost-multiplier">{{ boost.multiplier }}x</text>
              </view>
              <view class="boost-footer">
                <text class="boost-date">{{ boost.date }}</text>
                <text class="boost-expires">{{ t("expires") }}: {{ boost.expiresIn }}</text>
              </view>
              <view class="boost-progress">
                <view class="boost-progress-bar" :style="{ width: `${boost.progress}%` }"></view>
              </view>
            </view>
          </view>
        </NeoCard>
      </view>

      <view v-if="activeTab === 'stats'" class="tab-content">
        <NeoCard :title="t('activeProposals')">
          <view class="proposals-list">
            <text v-if="proposals.length === 0" class="empty">{{ t("noProposals") }}</text>
            <view v-for="(p, i) in proposals" :key="i" class="proposal-item" @click="voteOnProposal(p.id)">
              <text class="proposal-title">{{ p.title }}</text>
              <view class="proposal-meta">
                <text class="proposal-votes">{{ p.votes }} {{ t("votes") }}</text>
                <text class="proposal-ends">{{ p.endsIn }}</text>
              </view>
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
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useWallet, usePayments } from "@neo/uniapp-sdk";
import { createT } from "@/shared/utils/i18n";
import { formatNumber } from "@/shared/utils/format";
import { AppLayout, NeoButton, NeoCard, NeoInput, NeoDoc } from "@/shared/components";

const translations = {
  title: { en: "Gov Booster", zh: "治理助推器" },
  boost: { en: "Boost", zh: "助推" },
  stats: { en: "Stats", zh: "统计" },
  votingPower: { en: "Voting Power", zh: "投票权" },
  active: { en: "Active", zh: "活跃" },
  boosts: { en: "Boosts", zh: "助推" },
  multiplier: { en: "Multiplier", zh: "倍数" },
  currentPower: { en: "Current Voting Power", zh: "当前投票权" },
  boostCalculator: { en: "Boost Calculator", zh: "助推计算器" },
  amountToLock: { en: "Amount to Lock", zh: "锁定数量" },
  enterAmount: { en: "Enter amount", zh: "输入数量" },
  lockDuration: { en: "Lock Duration", zh: "锁定期限" },
  projectedPower: { en: "Projected Power", zh: "预计权力" },
  powerIncrease: { en: "Power Increase", zh: "权力增长" },
  processing: { en: "Processing...", zh: "处理中..." },
  lockAndBoost: { en: "Lock & Boost", zh: "锁定并助推" },
  activeBoosts: { en: "Active Boosts", zh: "活跃助推" },
  noActiveBoosts: { en: "No active boosts yet", zh: "暂无活跃助推" },
  expires: { en: "Expires", zh: "到期" },
  activeProposals: { en: "Active Proposals", zh: "活跃提案" },
  noProposals: { en: "No active proposals", zh: "暂无活跃提案" },
  votes: { en: "votes", zh: "票" },
  error: { en: "Error", zh: "错误" },

  docs: { en: "Docs", zh: "文档" },
  docSubtitle: {
    en: "Amplify your governance voting power",
    zh: "放大您的治理投票权",
  },
  docDescription: {
    en: "Gov Booster lets you enhance your voting power on Neo governance proposals. Delegate votes, track governance activity, and receive proposal notifications.",
    zh: "Gov Booster 让您增强在 Neo 治理提案上的投票权。委托投票、跟踪治理活动并接收提案通知。",
  },
  step1: {
    en: "Connect your Neo wallet with NEO holdings",
    zh: "连接持有 NEO 的钱包",
  },
  step2: {
    en: "View active governance proposals",
    zh: "查看活跃的治理提案",
  },
  step3: {
    en: "Boost your voting power or delegate to others",
    zh: "增强您的投票权或委托给他人",
  },
  step4: {
    en: "Cast your enhanced vote on proposals",
    zh: "对提案投出增强后的票",
  },
  feature1Name: { en: "Vote Amplification", zh: "投票放大" },
  feature1Desc: {
    en: "Boost your voting weight through staking mechanisms.",
    zh: "通过质押机制增强您的投票权重。",
  },
  feature2Name: { en: "Proposal Alerts", zh: "提案提醒" },
  feature2Desc: {
    en: "Get notified when new proposals need your attention.",
    zh: "当新提案需要您关注时获得通知。",
  },
};

const t = createT(translations);

const docSteps = computed(() => [t("step1"), t("step2"), t("step3"), t("step4")]);
const docFeatures = computed(() => [
  { name: t("feature1Name"), desc: t("feature1Desc") },
  { name: t("feature2Name"), desc: t("feature2Desc") },
]);
const APP_ID = "miniapp-govbooster";
const { address, connect } = useWallet();

interface Proposal {
  id: number;
  title: string;
  votes: number;
  endsIn: string;
}

interface ActiveBoost {
  amount: number;
  multiplier: number;
  date: string;
  expiresIn: string;
  progress: number;
}

const { payGAS, isLoading } = usePayments(APP_ID);

const activeTab = ref("boost");
const navTabs = [
  { id: "boost", label: t("boost"), icon: "🚀" },
  { id: "stats", label: t("stats"), icon: "📊" },
  { id: "docs", icon: "book", label: t("docs") },
];

const lockAmount = ref("10");
const lockDuration = ref(30);
const votingPower = ref(100);
const boostMultiplier = ref(1);
const activeProposalsCount = ref(3);
const status = ref<{ msg: string; type: string } | null>(null);
const proposals = ref<Proposal[]>([
  { id: 1, title: "Increase block rewards", votes: 1250, endsIn: "2d" },
  { id: 2, title: "Lower gas fees", votes: 890, endsIn: "5d" },
  { id: 3, title: "Treasury allocation", votes: 650, endsIn: "7d" },
]);

const activeBoosts = ref<ActiveBoost[]>([
  { amount: 50, multiplier: 2, date: "2024-01-15", expiresIn: "25d", progress: 75 },
  { amount: 100, multiplier: 3, date: "2024-01-10", expiresIn: "80d", progress: 45 },
]);

const durations = [
  { days: 7, label: "1w", boost: 1.5 },
  { days: 30, label: "1m", boost: 2 },
  { days: 90, label: "3m", boost: 3 },
  { days: 180, label: "6m", boost: 5 },
];

const formatNum = (n: number) => formatNumber(n, 0);

const selectedBoost = computed(() => {
  return durations.find((d) => d.days === lockDuration.value)?.boost || 1;
});

const boostVote = async () => {
  if (isLoading.value) return;
  const amount = parseFloat(lockAmount.value);
  if (amount < 1) {
    status.value = { msg: "Min lock: 1 GAS", type: "error" };
    return;
  }
  try {
    status.value = { msg: "Locking tokens...", type: "loading" };
    await payGAS(lockAmount.value, `boost:${lockDuration.value}`);
    const boost = durations.find((d) => d.days === lockDuration.value)?.boost || 1;
    boostMultiplier.value = boost;
    votingPower.value += amount * boost;

    // Add to active boosts history
    const now = new Date();
    const expiryDate = new Date(now.getTime() + lockDuration.value * 24 * 60 * 60 * 1000);
    activeBoosts.value.unshift({
      amount,
      multiplier: boost,
      date: now.toISOString().split("T")[0],
      expiresIn: `${lockDuration.value}d`,
      progress: 100,
    });

    status.value = { msg: `Boosted ${boost}x for ${lockDuration.value} days!`, type: "success" };
  } catch (e: any) {
    status.value = { msg: e.message || "Error", type: "error" };
  }
};

const voteOnProposal = async (id: number) => {
  status.value = { msg: `Voting on proposal #${id}...`, type: "loading" };
  setTimeout(() => {
    status.value = { msg: "Vote cast successfully!", type: "success" };
  }, 1000);
};
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

.power-header { text-align: center; padding: $space-6 0; border-bottom: 4px solid black; margin-bottom: $space-6; background: white; border: 3px solid black; box-shadow: 6px 6px 0 black; }
.power-title { font-weight: $font-weight-black; text-transform: uppercase; font-size: 10px; border-bottom: 2px solid black; display: inline-block; margin-bottom: 4px; }
.power-value { font-weight: $font-weight-black; font-size: 40px; color: black; font-family: $font-mono; display: block; }

.boost-gauge { margin-bottom: $space-6; }
.gauge-track { height: 20px; background: white; border: 3px solid black; padding: 2px; }
.gauge-fill { height: 100%; background: var(--neo-green); border-right: 2px solid black; transition: width 0.6s ease; }
.gauge-labels { display: flex; justify-content: space-between; margin-top: 8px; font-size: 10px; font-weight: $font-weight-black; text-transform: uppercase; }

.stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: $space-3; }
.stat-box { padding: $space-3; background: white; border: 2px solid black; text-align: center; box-shadow: 3px 3px 0 black; }
.stat-icon { font-size: 20px; display: block; margin-bottom: 4px; }
.stat-value { font-weight: $font-weight-black; font-family: $font-mono; color: black; font-size: 16px; border-bottom: 2px solid black; display: block; margin-bottom: 4px; }
.stat-label { font-size: 10px; font-weight: $font-weight-black; text-transform: uppercase; opacity: 0.6; }

.duration-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: $space-3; margin: $space-4 0; }
.duration-card {
  padding: $space-3; background: white; border: 3px solid black; text-align: center;
  box-shadow: 4px 4px 0 black; transition: all $transition-fast;
  &.active { background: var(--brutal-yellow); transform: translate(2px, 2px); box-shadow: 2px 2px 0 black; }
}
.duration-period { font-weight: $font-weight-black; display: block; font-size: 14px; }
.duration-multiplier { font-size: 12px; color: black; font-weight: $font-weight-black; background: white; padding: 2px 6px; border: 1px solid black; margin-top: 4px; display: inline-block; }

.projection-box { background: black; color: white; padding: $space-4; border: 3px solid black; margin-bottom: $space-6; box-shadow: 8px 8px 0 rgba(0,0,0,0.2); }
.projection-row { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 8px; font-weight: $font-weight-black; text-transform: uppercase; }
.projection-value { font-weight: $font-weight-black; font-family: $font-mono; color: var(--brutal-green); }
.projection-increase { color: var(--brutal-yellow); font-weight: $font-weight-black; }

.boost-item { padding: $space-4; background: white; border: 3px solid black; margin-bottom: $space-4; box-shadow: 5px 5px 0 black; }
.boost-header { display: flex; justify-content: space-between; font-weight: $font-weight-black; font-size: 14px; text-transform: uppercase; border-bottom: 2px solid black; padding-bottom: 4px; margin-bottom: 8px; }
.boost-multiplier { background: var(--brutal-green); padding: 0 8px; border: 1px solid black; }
.boost-footer { font-size: 10px; font-weight: $font-weight-black; opacity: 1; display: flex; justify-content: space-between; margin: 8px 0; text-transform: uppercase; }
.boost-progress { height: 10px; background: white; border: 2px solid black; }
.boost-progress-bar { height: 100%; background: black; }

.proposal-item { padding: $space-4; background: white; border: 3px solid black; margin-bottom: $space-4; cursor: pointer; transition: all $transition-fast; box-shadow: 4px 4px 0 var(--brutal-yellow); &:active { transform: translate(2px, 2px); box-shadow: 2px 2px 0 var(--brutal-yellow); } }
.proposal-title { font-weight: $font-weight-black; text-transform: uppercase; font-size: 14px; border-bottom: 2px solid black; display: inline-block; margin-bottom: 8px; }
.proposal-meta { display: flex; justify-content: space-between; font-size: 10px; font-weight: $font-weight-black; opacity: 1; margin-top: 8px; text-transform: uppercase; background: #eee; padding: 4px 8px; border: 1px solid black; }

.scrollable { overflow-y: auto; -webkit-overflow-scrolling: touch; }
</style>
