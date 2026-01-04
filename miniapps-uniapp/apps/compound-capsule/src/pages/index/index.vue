<template>
  <AppLayout :title="t('title')" show-top-nav :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <!-- Main Tab -->
    <view v-if="activeTab === 'main'" class="tab-content">
      <view v-if="status" :class="['status-msg', status.type]">
        <text>{{ status.msg }}</text>
      </view>

      <!-- Capsule Visualization -->
      <NeoCard :title="t('vaultStats')" variant="accent" class="vault-card">
        <view class="capsule-container">
          <view class="capsule-visual">
            <view class="capsule-body">
              <view class="capsule-fill" :style="{ height: fillPercentage + '%' }">
                <view class="capsule-shimmer"></view>
              </view>
              <view class="capsule-label">
                <text class="capsule-apy">{{ vault.apy }}%</text>
                <text class="capsule-apy-label">APY</text>
              </view>
            </view>
          </view>
          <view class="vault-stats-grid">
            <view class="stat-item">
              <text class="stat-label">{{ t("tvl") }}</text>
              <text class="stat-value tvl">{{ fmt(vault.tvl, 0) }}</text>
              <text class="stat-unit">GAS</text>
            </view>
            <view class="stat-item">
              <text class="stat-label">{{ t("compoundFreq") }}</text>
              <text class="stat-value freq">{{ vault.compoundFreq }}</text>
            </view>
          </view>
        </view>
      </NeoCard>

      <!-- Growth Chart & Position -->
      <NeoCard :title="t('yourPosition')" variant="success" class="position-card">
        <view class="growth-chart">
          <view class="chart-bars">
            <view v-for="(bar, idx) in growthBars" :key="idx" class="chart-bar">
              <view class="bar-fill" :style="{ height: bar.height + '%' }"></view>
              <text class="bar-label">{{ bar.label }}</text>
            </view>
          </view>
        </view>
        <view class="position-stats">
          <view class="position-row primary">
            <text class="label">{{ t("deposited") }}</text>
            <text class="value">{{ fmt(position.deposited, 2) }} GAS</text>
          </view>
          <view class="position-row earned">
            <text class="label">{{ t("earned") }}</text>
            <text class="value growth">+{{ fmt(position.earned, 4) }} GAS</text>
          </view>
          <view class="position-row projection">
            <text class="label">{{ t("est30d") }}</text>
            <text class="value">{{ fmt(position.est30d, 2) }} GAS</text>
          </view>
        </view>
      </NeoCard>

      <!-- Lock Period Selector & Deposit -->
      <NeoCard :title="t('createCapsule')" class="deposit-card">
        <view class="lock-period-selector">
          <text class="selector-label">{{ t("lockPeriod") }}</text>
          <view class="period-options">
            <view
              v-for="period in lockPeriods"
              :key="period.days"
              :class="['period-option', { active: selectedPeriod === period.days }]"
              @click="selectedPeriod = period.days"
            >
              <text class="period-days">{{ period.days }}d</text>
              <text class="period-bonus">+{{ period.bonus }}%</text>
            </view>
          </view>
        </view>

        <view class="projected-returns">
          <text class="returns-label">{{ t("projectedReturns") }}</text>
          <view class="returns-display">
            <text class="returns-value">{{ projectedReturns }}</text>
            <text class="returns-unit">GAS</text>
          </view>
        </view>

        <NeoInput v-model="amount" type="number" :placeholder="t('amountPlaceholder')" suffix="GAS" />
        <NeoButton variant="primary" size="lg" block :loading="isLoading" @click="deposit">
          {{ isLoading ? t("processing") : t("deposit") }}
        </NeoButton>
        <text class="note">{{ t("mockDepositFee").replace("{fee}", depositFee) }}</text>
      </NeoCard>
    </view>

    <!-- Stats Tab -->
    <view v-if="activeTab === 'stats'" class="tab-content scrollable">
      <!-- Active Capsules -->
      <NeoCard :title="t('activeCapsules')" variant="accent" class="capsules-card">
        <view v-for="(capsule, idx) in activeCapsules" :key="idx" class="capsule-item">
          <view class="capsule-header">
            <view class="capsule-icon">💊</view>
            <view class="capsule-info">
              <text class="capsule-amount">{{ fmt(capsule.amount, 2) }} GAS</text>
              <text class="capsule-period">{{ capsule.lockDays }}d lock</text>
            </view>
            <view class="capsule-status">
              <text class="status-label">{{ capsule.status }}</text>
            </view>
          </view>
          <view class="capsule-progress">
            <view class="progress-bar">
              <view class="progress-fill" :style="{ width: capsule.progress + '%' }"></view>
            </view>
            <text class="progress-text">{{ capsule.progress }}%</text>
          </view>
          <view class="capsule-footer">
            <view class="countdown">
              <text class="countdown-label">{{ t("maturesIn") }}</text>
              <text class="countdown-value">{{ capsule.countdown }}</text>
            </view>
            <view class="rewards">
              <text class="rewards-label">{{ t("rewards") }}</text>
              <text class="rewards-value">+{{ fmt(capsule.rewards, 4) }} GAS</text>
            </view>
          </view>
        </view>
        <text v-if="activeCapsules.length === 0" class="empty-text">{{ t("noCapsules") }}</text>
      </NeoCard>

      <!-- Statistics -->
      <NeoCard :title="t('statistics')" variant="success">
        <view class="stat-row">
          <text class="stat-label">{{ t("totalDeposits") }}</text>
          <text class="stat-value">{{ stats.totalDeposits }}</text>
        </view>
        <view class="stat-row">
          <text class="stat-label">{{ t("totalCompounded") }}</text>
          <text class="stat-value">{{ fmt(stats.totalCompounded, 4) }} GAS</text>
        </view>
        <view class="stat-row">
          <text class="stat-label">{{ t("avgAPY") }}</text>
          <text class="stat-value">{{ stats.avgAPY }}%</text>
        </view>
        <view class="stat-row">
          <text class="stat-label">{{ t("nextCompound") }}</text>
          <text class="stat-value">{{ stats.nextCompound }}</text>
        </view>
      </NeoCard>

      <!-- Recent Activity -->
      <NeoCard :title="t('recentActivity')">
        <view v-for="(activity, idx) in recentActivity" :key="idx" class="activity-history">
          <text>{{ activity.icon }} {{ fmt(activity.amount, 2) }} GAS - {{ activity.timestamp }}</text>
        </view>
        <text v-if="recentActivity.length === 0" class="empty-text">{{ t("noHistory") }}</text>
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
import NeoInput from "@/shared/components/NeoInput.vue";
import NeoCard from "@/shared/components/NeoCard.vue";

const translations = {
  title: { en: "Compound Capsule", zh: "复利胶囊" },
  vaultStats: { en: "Vault Stats", zh: "金库统计" },
  apy: { en: "APY", zh: "年化收益率" },
  tvl: { en: "TVL", zh: "总锁仓量" },
  compoundFreq: { en: "Compound freq", zh: "复利频率" },
  yourPosition: { en: "Your Position", zh: "你的仓位" },
  deposited: { en: "Deposited", zh: "已存入" },
  earned: { en: "Earned", zh: "已赚取" },
  est30d: { en: "Est. 30d", zh: "预计30天" },
  manage: { en: "Manage", zh: "管理" },
  createCapsule: { en: "Create Capsule", zh: "创建胶囊" },
  lockPeriod: { en: "Lock Period", zh: "锁定期限" },
  projectedReturns: { en: "Projected Returns", zh: "预计收益" },
  amountPlaceholder: { en: "Amount (GAS)", zh: "金额 (GAS)" },
  processing: { en: "Processing...", zh: "处理中..." },
  deposit: { en: "Deposit", zh: "存入" },
  mockDepositFee: { en: "Mock deposit fee: {fee} GAS", zh: "模拟存款费用：{fee} GAS" },
  enterValidAmount: { en: "Enter a valid amount", zh: "请输入有效金额" },
  depositedAmount: { en: "Deposited {amount} GAS", zh: "已存入 {amount} GAS" },
  paymentFailed: { en: "Payment failed", zh: "支付失败" },
  main: { en: "Main", zh: "主页" },
  stats: { en: "Stats", zh: "统计" },
  activeCapsules: { en: "Active Capsules", zh: "活跃胶囊" },
  maturesIn: { en: "Matures in", zh: "到期时间" },
  rewards: { en: "Rewards", zh: "奖励" },
  noCapsules: { en: "No active capsules", zh: "暂无活跃胶囊" },
  statistics: { en: "Statistics", zh: "统计数据" },
  totalDeposits: { en: "Total Deposits", zh: "总存款数" },
  totalCompounded: { en: "Total Compounded", zh: "总复利收益" },
  avgAPY: { en: "Avg APY", zh: "平均年化" },
  nextCompound: { en: "Next Compound", zh: "下次复利" },
  recentActivity: { en: "Recent Activity", zh: "最近活动" },
  noHistory: { en: "No history yet", zh: "暂无记录" },

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
  { id: "main", icon: "wallet", label: t("main") },
  { id: "stats", icon: "chart", label: t("stats") },
  { id: "docs", icon: "book", label: t("docs") },
];

const activeTab = ref("main");

type StatusType = "success" | "error";
type Status = { msg: string; type: StatusType };
type Vault = { apy: number; tvl: number; compoundFreq: string };
type Position = { deposited: number; earned: number; est30d: number };

const docSteps = computed(() => [t("step1"), t("step2"), t("step3")]);
const docFeatures = computed(() => [
  { name: t("feature1Name"), desc: t("feature1Desc") },
  { name: t("feature2Name"), desc: t("feature2Desc") },
]);
const APP_ID = "miniapp-compound-capsule";
const { address, connect } = useWallet();
const { payGAS, isLoading } = usePayments(APP_ID);

const vault = ref<Vault>({ apy: 18.5, tvl: 125000, compoundFreq: "Every 6h" });
const position = ref<Position>({ deposited: 100, earned: 1.2345, est30d: 1.54 });
const amount = ref<string>("");
const depositFee = "0.010";
const status = ref<Status | null>(null);
const selectedPeriod = ref<number>(30);

// Lock period options with bonus APY
const lockPeriods = [
  { days: 7, bonus: 0 },
  { days: 30, bonus: 2 },
  { days: 90, bonus: 5 },
  { days: 180, bonus: 10 },
];

// Capsule fill percentage (visual effect)
const fillPercentage = computed(() => {
  const maxTvl = 200000;
  return Math.min((vault.value.tvl / maxTvl) * 100, 100);
});

// Growth chart data
const growthBars = computed(() => {
  const base = position.value.deposited;
  return [
    { label: "Now", height: 100 },
    { label: "7d", height: 100 + (vault.value.apy / 365) * 7 * 5 },
    { label: "30d", height: 100 + (vault.value.apy / 365) * 30 * 5 },
    { label: "90d", height: 100 + (vault.value.apy / 365) * 90 * 5 },
  ];
});

// Projected returns calculator
const projectedReturns = computed(() => {
  const amt = parseFloat(amount.value) || 0;
  const period = lockPeriods.find((p) => p.days === selectedPeriod.value);
  if (!period || amt <= 0) return "0.00";
  const totalAPY = vault.value.apy + period.bonus;
  const returns = (amt * totalAPY * period.days) / (365 * 100);
  return returns.toFixed(4);
});

// Active capsules with countdown
const activeCapsules = ref([
  {
    amount: 50,
    lockDays: 30,
    progress: 65,
    countdown: "10d 5h",
    rewards: 0.8234,
    status: "Locked",
  },
  {
    amount: 25,
    lockDays: 90,
    progress: 22,
    countdown: "70d 12h",
    rewards: 1.2456,
    status: "Locked",
  },
]);

const stats = ref({ totalDeposits: 0, totalCompounded: 0, avgAPY: 18.5, nextCompound: "5h 23m" });
const recentActivity = ref<{ icon: string; amount: number; timestamp: string }[]>([]);

const fmt = (n: number, d = 2) => formatNumber(n, d);

const deposit = async (): Promise<void> => {
  if (isLoading.value) return;
  const amt = parseFloat(amount.value);
  if (!(amt > 0)) return void (status.value = { msg: t("enterValidAmount"), type: "error" });
  try {
    await payGAS((amt + parseFloat(depositFee)).toFixed(3), `compound:deposit:${amt}`);
    position.value.deposited += amt;

    stats.value.totalDeposits++;
    recentActivity.value.unshift({
      icon: "💰",
      amount: amt,
      timestamp: new Date().toLocaleTimeString(),
    });
    if (recentActivity.value.length > 10) recentActivity.value.pop();

    status.value = { msg: t("depositedAmount").replace("{amount}", String(amt)), type: "success" };
  } catch (e: any) {
    status.value = { msg: e?.message || t("paymentFailed"), type: "error" };
  }
};
</script>

<style lang="scss" scoped>
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.tab-content {
  padding: $space-4;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: $space-4;
  overflow: hidden;

  &.scrollable {
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }
}

.status-msg {
  text-align: center;
  padding: $space-4;
  border: $border-width-md solid var(--border-color);
  margin-bottom: $space-4;
  flex-shrink: 0;
  font-weight: $font-weight-bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  &.success {
    background: var(--status-success);
    color: var(--neo-black);
    box-shadow: $shadow-md;
  }
  &.error {
    background: var(--status-error);
    color: var(--neo-white);
    box-shadow: $shadow-md;
  }
}

/* Capsule Visualization */
.vault-card {
  .capsule-container {
    display: flex;
    gap: $space-4;
    align-items: center;
  }

  .capsule-visual {
    flex-shrink: 0;
    width: 120px;
    height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .capsule-body {
    position: relative;
    width: 80px;
    height: 180px;
    background: var(--bg-secondary);
    border: $border-width-lg solid var(--border-color);
    border-radius: 40px;
    overflow: hidden;
    box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.3);
  }

  .capsule-fill {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(180deg, var(--neo-purple) 0%, var(--neo-green) 100%);
    transition: height 0.6s ease;
    overflow: hidden;
  }

  .capsule-shimmer {
    position: absolute;
    top: -50%;
    left: -50%;
    right: -50%;
    bottom: -50%;
    background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.2) 50%, transparent 70%);
    animation: shimmer 3s infinite;
  }

  @keyframes shimmer {
    0% {
      transform: translateX(-100%) translateY(-100%);
    }
    100% {
      transform: translateX(100%) translateY(100%);
    }
  }

  .capsule-label {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    z-index: 1;
  }

  .capsule-apy {
    display: block;
    font-size: 24px;
    font-weight: $font-weight-black;
    color: var(--brutal-yellow);
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  }

  .capsule-apy-label {
    display: block;
    font-size: $font-size-xs;
    font-weight: $font-weight-bold;
    color: var(--text-primary);
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .vault-stats-grid {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: $space-3;
  }

  .stat-item {
    padding: $space-3;
    background: var(--bg-secondary);
    border: $border-width-sm solid var(--border-color);
    border-left: $border-width-lg solid var(--neo-green);
  }

  .stat-label {
    display: block;
    font-size: $font-size-xs;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: $space-1;
  }

  .stat-value {
    display: block;
    font-size: $font-size-xl;
    font-weight: $font-weight-black;
    color: var(--text-primary);

    &.tvl {
      color: var(--neo-green);
    }

    &.freq {
      font-size: $font-size-lg;
      color: var(--neo-purple);
    }
  }

  .stat-unit {
    display: inline;
    font-size: $font-size-sm;
    color: var(--text-secondary);
    margin-left: $space-1;
  }
}

/* Growth Chart */
.position-card {
  .growth-chart {
    padding: $space-4;
    background: var(--bg-secondary);
    border: $border-width-sm solid var(--border-color);
    margin-bottom: $space-4;
  }

  .chart-bars {
    display: flex;
    align-items: flex-end;
    justify-content: space-around;
    height: 120px;
    gap: $space-2;
  }

  .chart-bar {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $space-2;
  }

  .bar-fill {
    width: 100%;
    background: linear-gradient(180deg, var(--neo-green) 0%, var(--neo-purple) 100%);
    border: $border-width-sm solid var(--border-color);
    transition: height 0.4s ease;
    min-height: 20px;
    box-shadow: 0 -2px 8px color-mix(in srgb, var(--neo-green) 30%, transparent);
  }

  .bar-label {
    font-size: $font-size-xs;
    font-weight: $font-weight-bold;
    color: var(--text-secondary);
    text-transform: uppercase;
  }

  .position-stats {
    display: flex;
    flex-direction: column;
    gap: $space-2;
  }

  .position-row {
    display: flex;
    justify-content: space-between;
    padding: $space-3;
    background: var(--bg-secondary);
    border: $border-width-sm solid var(--border-color);

    &.primary {
      border-left: $border-width-lg solid var(--neo-purple);
    }

    &.earned {
      border-left: $border-width-lg solid var(--neo-green);
    }

    &.projection {
      border-left: $border-width-lg solid var(--brutal-yellow);
    }

    .label {
      font-size: $font-size-sm;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .value {
      font-size: $font-size-lg;
      font-weight: $font-weight-bold;
      color: var(--text-primary);

      &.growth {
        color: var(--neo-green);
      }
    }
  }
}

/* Lock Period Selector & Deposit */
.deposit-card {
  .lock-period-selector {
    margin-bottom: $space-4;
  }

  .selector-label {
    display: block;
    font-size: $font-size-sm;
    font-weight: $font-weight-bold;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: $space-3;
  }

  .period-options {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: $space-2;
  }

  .period-option {
    padding: $space-3;
    background: var(--bg-secondary);
    border: $border-width-md solid var(--border-color);
    text-align: center;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      border-color: var(--neo-purple);
    }

    &.active {
      background: var(--neo-purple);
      border-color: var(--neo-purple);
      box-shadow: 0 0 12px color-mix(in srgb, var(--neo-purple) 50%, transparent);

      .period-days,
      .period-bonus {
        color: var(--neo-white);
      }
    }

    .period-days {
      display: block;
      font-size: $font-size-lg;
      font-weight: $font-weight-black;
      color: var(--text-primary);
      margin-bottom: $space-1;
    }

    .period-bonus {
      display: block;
      font-size: $font-size-xs;
      font-weight: $font-weight-bold;
      color: var(--neo-green);
    }
  }

  .projected-returns {
    padding: $space-4;
    background: var(--bg-secondary);
    border: $border-width-md solid var(--brutal-yellow);
    margin-bottom: $space-4;
    text-align: center;
  }

  .returns-label {
    display: block;
    font-size: $font-size-xs;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: $space-2;
  }

  .returns-display {
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: $space-2;
  }

  .returns-value {
    font-size: 32px;
    font-weight: $font-weight-black;
    color: var(--brutal-yellow);
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  .returns-unit {
    font-size: $font-size-lg;
    font-weight: $font-weight-bold;
    color: var(--text-secondary);
  }
}

.note {
  display: block;
  margin-top: $space-3;
  padding: $space-2;
  font-size: $font-size-sm;
  color: var(--text-secondary);
  border-left: $border-width-md solid var(--neo-green);
  padding-left: $space-3;
}

/* Active Capsules */
.capsules-card {
  .capsule-item {
    padding: $space-4;
    background: var(--bg-secondary);
    border: $border-width-md solid var(--border-color);
    margin-bottom: $space-3;
    transition: all 0.2s ease;

    &:hover {
      border-color: var(--neo-purple);
      box-shadow: 0 4px 12px color-mix(in srgb, var(--neo-purple) 20%, transparent);
    }

    &:last-child {
      margin-bottom: 0;
    }
  }

  .capsule-header {
    display: flex;
    align-items: center;
    gap: $space-3;
    margin-bottom: $space-3;
  }

  .capsule-icon {
    font-size: 32px;
    line-height: 1;
  }

  .capsule-info {
    flex: 1;
  }

  .capsule-amount {
    display: block;
    font-size: $font-size-lg;
    font-weight: $font-weight-black;
    color: var(--text-primary);
    margin-bottom: $space-1;
  }

  .capsule-period {
    display: block;
    font-size: $font-size-xs;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .capsule-status {
    padding: $space-2 $space-3;
    background: var(--neo-purple);
    border: $border-width-sm solid var(--neo-purple);
  }

  .status-label {
    font-size: $font-size-xs;
    font-weight: $font-weight-bold;
    color: var(--neo-white);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .capsule-progress {
    display: flex;
    align-items: center;
    gap: $space-3;
    margin-bottom: $space-3;
  }

  .progress-bar {
    flex: 1;
    height: 12px;
    background: var(--bg-primary);
    border: $border-width-sm solid var(--border-color);
    overflow: hidden;
  }

  .progress-fill {
    flex: 1;
  min-height: 0;
    background: linear-gradient(90deg, var(--neo-purple) 0%, var(--neo-green) 100%);
    transition: width 0.4s ease;
    box-shadow: 0 0 8px color-mix(in srgb, var(--neo-green) 50%, transparent);
  }

  .progress-text {
    font-size: $font-size-sm;
    font-weight: $font-weight-bold;
    color: var(--text-secondary);
    min-width: 40px;
    text-align: right;
  }

  .capsule-footer {
    display: flex;
    justify-content: space-between;
    padding-top: $space-3;
    border-top: $border-width-sm solid var(--border-color);
  }

  .countdown,
  .rewards {
    display: flex;
    flex-direction: column;
    gap: $space-1;
  }

  .countdown-label,
  .rewards-label {
    font-size: $font-size-xs;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .countdown-value {
    font-size: $font-size-lg;
    font-weight: $font-weight-black;
    color: var(--brutal-yellow);
  }

  .rewards-value {
    font-size: $font-size-lg;
    font-weight: $font-weight-black;
    color: var(--neo-green);
  }
}

/* Statistics */
.stat-row {
  display: flex;
  justify-content: space-between;
  padding: $space-3 0;
  border-bottom: $border-width-sm solid var(--border-color);

  &:last-child {
    border-bottom: none;
  }
}

.stat-label {
  color: var(--text-secondary);
  font-weight: $font-weight-medium;
  text-transform: uppercase;
  font-size: $font-size-sm;
  letter-spacing: 0.5px;
}

.stat-value {
  font-weight: $font-weight-bold;
  color: var(--text-primary);
  font-size: $font-size-lg;
}

/* Activity History */
.activity-history {
  padding: $space-3;
  border: $border-width-sm solid var(--border-color);
  background: var(--bg-secondary);
  margin-bottom: $space-2;
  font-weight: $font-weight-medium;

  &:last-child {
    margin-bottom: 0;
  }
}

.empty-text {
  color: var(--text-muted);
  text-align: center;
  padding: $space-6;
  font-style: italic;
}
</style>
