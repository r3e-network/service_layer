<template>
  <AppLayout :title="t('title')" show-top-nav :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <view class="app-container">
      <view v-if="status" :class="['status-msg', status.type]">
        <text>{{ status.msg }}</text>
      </view>

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
import AppLayout from "@/shared/components/AppLayout.vue";
import { NeoButton, NeoCard, NeoInput, NeoDoc } from "@/shared/components";

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
const APP_ID = "miniapp-gov-booster";
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
  display: flex;
  flex-direction: column;
  padding: $space-4;
  min-flex: 1;
  min-height: 0;
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.status-msg {
  text-align: center;
  padding: $space-3;
  margin-bottom: $space-4;
  border: $border-width-md solid var(--border-color);
  font-weight: $font-weight-bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  &.success {
    background: var(--status-success);
    color: $neo-black;
    border-color: darken($status-success, 10%);
    box-shadow: 4px 4px 0 darken($status-success, 20%);
  }
  &.error {
    background: var(--status-error);
    color: $neo-white;
    border-color: darken($status-error, 10%);
    box-shadow: 4px 4px 0 darken($status-error, 20%);
  }
  &.loading {
    background: var(--neo-green);
    color: $neo-black;
    border-color: darken($neo-green, 10%);
    box-shadow: 4px 4px 0 darken($neo-green, 20%);
  }
}

// Power Meter Container
.power-meter-container {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.power-header {
  text-align: center;
  padding: $space-4 0;
  border-bottom: $border-width-md solid var(--border-color);
}

.power-title {
  display: block;
  color: var(--text-secondary);
  font-size: $font-size-sm;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: $space-2;
  font-weight: $font-weight-semibold;
}

.power-value {
  display: block;
  color: var(--neo-purple);
  font-size: $font-size-3xl;
  font-weight: $font-weight-black;
  text-shadow: 2px 2px 0 var(--shadow-color);
}

// Boost Gauge
.boost-gauge {
  padding: 0 $space-2;
}

.gauge-track {
  height: 24px;
  background: var(--bg-secondary);
  border: $border-width-md solid var(--border-color);
  position: relative;
  overflow: hidden;
  box-shadow: inset 2px 2px 4px var(--shadow-color);
}

.gauge-fill {
  flex: 1;
  min-height: 0;
  background: linear-gradient(90deg, var(--neo-green) 0%, var(--brutal-yellow) 50%, var(--neo-purple) 100%);
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 0 12px var(--neo-green);
  animation: pulse-glow 2s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.85;
  }
}

.gauge-labels {
  display: flex;
  justify-content: space-between;
  margin-top: $space-2;
  padding: 0 $space-1;
}

.gauge-label {
  color: var(--text-muted);
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
}

// Stats Grid
.stats-grid {
  display: flex;
  gap: $space-3;
}

.stat-box {
  flex: 1;
  text-align: center;
  background: var(--bg-secondary);
  border: $border-width-md solid var(--border-color);
  padding: $space-4 $space-3;
  box-shadow: $shadow-md;
  transition: all $transition-fast;

  &:hover {
    transform: translate(-2px, -2px);
    box-shadow: 6px 6px 0 var(--shadow-color);
  }
}

.stat-icon {
  display: block;
  font-size: $font-size-2xl;
  margin-bottom: $space-2;
}

.stat-value {
  color: var(--neo-green);
  font-size: $font-size-xl;
  font-weight: $font-weight-black;
  display: block;
  margin-bottom: $space-1;
}

.stat-label {
  color: var(--text-secondary);
  font-size: $font-size-xs;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: $font-weight-semibold;
}

// Calculator Section
.calculator-section {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.input-section {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.input-label,
.section-label {
  color: var(--text-primary);
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.duration-section {
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.duration-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: $space-2;
}

.duration-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $space-3;
  background: var(--bg-secondary);
  border: $border-width-md solid var(--border-color);
  cursor: pointer;
  transition: all $transition-fast;
  box-shadow: $shadow-sm;

  &:hover {
    transform: translate(-2px, -2px);
    box-shadow: 4px 4px 0 var(--shadow-color);
  }

  &:active {
    transform: translate(1px, 1px);
    box-shadow: 2px 2px 0 var(--shadow-color);
  }

  &.active {
    background: var(--neo-purple);
    border-color: var(--neo-purple);
    box-shadow: 4px 4px 0 var(--shadow-color);

    .duration-period,
    .duration-boost-label {
      color: var(--neo-white);
    }

    .duration-multiplier {
      color: var(--brutal-yellow);
    }
  }
}

.duration-period {
  font-size: $font-size-base;
  font-weight: $font-weight-bold;
  color: var(--text-primary);
  margin-bottom: $space-1;
}

.duration-multiplier {
  font-size: $font-size-xl;
  font-weight: $font-weight-black;
  color: var(--neo-green);
  margin-bottom: $space-1;
}

.duration-boost-label {
  font-size: $font-size-xs;
  color: var(--text-secondary);
  text-transform: uppercase;
}

// Projection Box
.projection-box {
  background: var(--bg-secondary);
  border: $border-width-md solid var(--border-color);
  padding: $space-4;
  box-shadow: inset 2px 2px 4px var(--shadow-color);
}

.projection-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $space-2 0;

  &:not(:last-child) {
    border-bottom: $border-width-sm solid var(--border-color);
  }
}

.projection-label {
  color: var(--text-secondary);
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  text-transform: uppercase;
}

.projection-value {
  color: var(--neo-purple);
  font-size: $font-size-xl;
  font-weight: $font-weight-black;
}

.projection-increase {
  color: var(--neo-green);
  font-size: $font-size-xl;
  font-weight: $font-weight-black;
}

// Boost Button
.boost-button {
  margin-top: $space-2;
  animation: pulse-button 2s ease-in-out infinite;
}

@keyframes pulse-button {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.02);
  }
}

// Boosts List
.boosts-list {
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.boost-item {
  background: var(--bg-secondary);
  border: $border-width-md solid var(--border-color);
  padding: $space-4;
  box-shadow: $shadow-md;
  transition: all $transition-fast;

  &:hover {
    transform: translate(-1px, -1px);
    box-shadow: 5px 5px 0 var(--shadow-color);
  }
}

.boost-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $space-3;
}

.boost-amount {
  color: var(--text-primary);
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
}

.boost-multiplier {
  color: var(--brutal-yellow);
  font-size: $font-size-xl;
  font-weight: $font-weight-black;
  background: var(--neo-purple);
  padding: $space-1 $space-3;
  border: $border-width-sm solid var(--border-color);
}

.boost-footer {
  display: flex;
  justify-content: space-between;
  margin-bottom: $space-2;
  font-size: $font-size-sm;
}

.boost-date {
  color: var(--text-secondary);
  font-weight: $font-weight-medium;
}

.boost-expires {
  color: var(--neo-green);
  font-weight: $font-weight-semibold;
}

.boost-progress {
  height: 8px;
  background: var(--bg-tertiary);
  border: $border-width-sm solid var(--border-color);
  overflow: hidden;
}

.boost-progress-bar {
  flex: 1;
  min-height: 0;
  background: linear-gradient(90deg, var(--neo-green), var(--brutal-yellow));
  transition: width 0.3s ease;
}

.proposals-list {
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.empty {
  color: var(--text-muted);
  text-align: center;
  padding: $space-6;
  font-weight: $font-weight-medium;
}

.proposal-item {
  padding: $space-4;
  background: var(--bg-secondary);
  border: $border-width-sm solid var(--border-color);
  box-shadow: $shadow-sm;
  cursor: pointer;
  transition: all $transition-fast;

  &:hover {
    transform: translate(-2px, -2px);
    box-shadow: $shadow-md;
  }

  &:active {
    transform: translate(1px, 1px);
    box-shadow: $shadow-sm;
  }
}

.proposal-title {
  color: var(--text-primary);
  font-weight: $font-weight-bold;
  display: block;
  margin-bottom: $space-2;
  font-size: $font-size-base;
}

.proposal-meta {
  display: flex;
  justify-content: space-between;
  font-size: $font-size-sm;
}

.proposal-votes {
  color: var(--neo-green);
  font-weight: $font-weight-semibold;
}

.proposal-ends {
  color: var(--text-secondary);
}
</style>
