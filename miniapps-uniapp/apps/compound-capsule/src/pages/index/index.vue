<template>
  <AppLayout :title="t('title')" show-top-nav :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <!-- Main Tab -->
    <view v-if="activeTab === 'main'" class="tab-content">
      <!-- DEMO Mode Banner -->
      <view class="demo-banner">
        <text class="demo-badge">{{ t("demoMode") }}</text>
        <text class="demo-note">{{ t("demoNote") }}</text>
      </view>

      <NeoCard v-if="status" :variant="status.type === 'error' ? 'danger' : 'success'" class="mb-4 text-center">
        <text class="font-bold">{{ status.msg }}</text>
      </NeoCard>

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
import { ref, computed, onMounted } from "vue";
import { useWallet } from "@neo/uniapp-sdk";
import { formatNumber } from "@/shared/utils/format";
import { createT } from "@/shared/utils/i18n";
import { AppLayout, NeoDoc, NeoButton, NeoInput, NeoCard } from "@/shared/components";

// Simulation mode - no real payments
const isLoading = ref(false);

const translations = {
  title: { en: "Yield Simulator", zh: "收益模拟器" },
  demoMode: { en: "EDUCATIONAL DEMO", zh: "教育演示" },
  demoNote: { en: "Simulated yields - no real funds involved", zh: "模拟收益 - 不涉及真实资金" },
  vaultStats: { en: "Example Vault", zh: "示例金库" },
  apy: { en: "APY", zh: "年化收益率" },
  tvl: { en: "TVL", zh: "总锁仓量" },
  compoundFreq: { en: "Compound freq", zh: "复利频率" },
  yourPosition: { en: "Simulated Position", zh: "模拟仓位" },
  deposited: { en: "Deposited", zh: "已存入" },
  earned: { en: "Earned", zh: "已赚取" },
  est30d: { en: "Est. 30d", zh: "预计30天" },
  manage: { en: "Manage", zh: "管理" },
  createCapsule: { en: "Simulate Deposit", zh: "模拟存款" },
  lockPeriod: { en: "Lock Period", zh: "锁定期限" },
  projectedReturns: { en: "Projected Returns", zh: "预计收益" },
  amountPlaceholder: { en: "Amount (GAS)", zh: "金额 (GAS)" },
  processing: { en: "Simulating...", zh: "模拟中..." },
  deposit: { en: "Run Simulation", zh: "运行模拟" },
  exampleRates: { en: "Example rates for educational purposes", zh: "仅供教育目的的示例利率" },
  enterValidAmount: { en: "Enter a valid amount", zh: "请输入有效金额" },
  depositedAmount: { en: "Simulation: {amount} GAS deposited scenario", zh: "模拟：{amount} GAS 存款场景" },
  mockDepositFee: { en: "Simulation deposit fee: {fee} GAS", zh: "模拟存款费用：{fee} GAS" },
  simulationError: { en: "Simulation error", zh: "模拟错误" },
  contractUnavailable: { en: "Contract unavailable", zh: "合约不可用" },
  main: { en: "Simulate", zh: "模拟" },
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
  docSubtitle: {
    en: "Auto-compounding yield optimizer for Neo assets",
    zh: "Neo 资产自动复利收益优化器",
  },
  docDescription: {
    en: "Compound Capsule automatically reinvests your staking rewards to maximize yield through the power of compound interest. Set it and forget it - your assets grow automatically.",
    zh: "Compound Capsule 自动将您的质押奖励再投资，通过复利的力量最大化收益。设置后即可忘记 - 您的资产自动增长。",
  },
  step1: {
    en: "Connect your Neo wallet and select assets to deposit",
    zh: "连接您的 Neo 钱包并选择要存入的资产",
  },
  step2: {
    en: "Choose your compounding frequency (daily, weekly, etc.)",
    zh: "选择复利频率（每日、每周等）",
  },
  step3: {
    en: "Confirm deposit and let the smart contract handle compounding",
    zh: "确认存款，让智能合约处理复利",
  },
  step4: {
    en: "Withdraw anytime with accumulated compound interest",
    zh: "随时提取累积的复利收益",
  },
  feature1Name: { en: "Auto-Compounding", zh: "自动复利" },
  feature1Desc: {
    en: "Smart contract automatically reinvests rewards at optimal intervals.",
    zh: "智能合约在最佳间隔自动再投资奖励。",
  },
  feature2Name: { en: "Gas Optimized", zh: "Gas 优化" },
  feature2Desc: {
    en: "Batched transactions minimize gas costs for maximum efficiency.",
    zh: "批量交易最小化 gas 成本以获得最大效率。",
  },
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

const docSteps = computed(() => [t("step1"), t("step2"), t("step3"), t("step4")]);
const docFeatures = computed(() => [
  { name: t("feature1Name"), desc: t("feature1Desc") },
  { name: t("feature2Name"), desc: t("feature2Desc") },
]);
const APP_ID = "miniapp-compound-capsule";
const { address, connect, getContractHash } = useWallet();
const contractHash = ref<string | null>(null);

const ensureContractHash = async () => {
  if (!contractHash.value) {
    contractHash.value = await getContractHash();
  }
  if (!contractHash.value) throw new Error(t("contractUnavailable"));
  return contractHash.value;
};

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

// Active capsules - fetched from contract
const activeCapsules = ref<
  {
    amount: number;
    lockDays: number;
    progress: number;
    countdown: string;
    rewards: number;
    status: string;
  }[]
>([]);

const stats = ref({ totalDeposits: 0, totalCompounded: 0, avgAPY: 18.5, nextCompound: "5h 23m" });
const recentActivity = ref<{ icon: string; amount: number; timestamp: string }[]>([]);

const fmt = (n: number, d = 2) => formatNumber(n, d);

// Fetch capsules from smart contract
const fetchData = async () => {
  if (!address.value) return;

  try {
    const contract = await ensureContractHash();
    const sdk = await import("@neo/uniapp-sdk").then((m) => m.waitForSDK?.() || null);
    if (!sdk?.invoke) {
      console.warn("[CompoundCapsule] SDK not available");
      return;
    }

    // Get total capsules count from contract
    const totalResult = await sdk.invoke("invokeRead", {
      contract,
      method: "TotalCapsules",
      args: [],
    });

    const totalCapsules = parseInt(totalResult?.stack?.[0]?.value || "0");
    const userCapsules: typeof activeCapsules.value = [];
    let totalDeposited = 0;
    let totalCompounded = 0;

    // Find user's capsules
    for (let i = 1; i <= totalCapsules; i++) {
      const capsuleResult = await sdk.invoke("invokeRead", {
        contract,
        method: "GetCapsule",
        args: [{ type: "Integer", value: i.toString() }],
      });

      if (capsuleResult?.stack?.[0]) {
        const data = capsuleResult.stack[0].value;
        const owner = data?.owner;

        if (owner === address.value) {
          const principal = parseInt(data?.principal || "0");
          const unlockTime = parseInt(data?.unlockTime || "0");
          const compound = parseInt(data?.compound || "0") / 1e8;
          const now = Date.now();
          const lockDays = Math.ceil((unlockTime - now) / (24 * 60 * 60 * 1000));
          const progress = unlockTime <= now ? 100 : Math.max(0, 100 - (lockDays / 90) * 100);

          userCapsules.push({
            amount: principal,
            lockDays: Math.max(0, lockDays),
            progress: Math.round(progress),
            countdown: lockDays > 0 ? `${lockDays}d` : "Ready",
            rewards: compound,
            status: unlockTime <= now ? "Ready" : "Locked",
          });

          totalDeposited += principal;
          totalCompounded += compound;
        }
      }
    }

    activeCapsules.value = userCapsules;
    position.value.deposited = totalDeposited;
    position.value.earned = totalCompounded;
    stats.value.totalDeposits = userCapsules.length;
    stats.value.totalCompounded = totalCompounded;
  } catch (e) {
    console.warn("[CompoundCapsule] Failed to fetch data:", e);
  }
};

onMounted(() => {
  fetchData();
});

const deposit = async (): Promise<void> => {
  if (isLoading.value) return;
  const amt = parseFloat(amount.value);
  if (!(amt > 0)) return void (status.value = { msg: t("enterValidAmount"), type: "error" });

  // Simulation mode - no real payment
  isLoading.value = true;

  // Simulate processing delay
  await new Promise((resolve) => setTimeout(resolve, 1200));

  position.value.deposited += amt;
  // Simulate earned based on APY
  position.value.earned += amt * (vault.value.apy / 100 / 12);
  position.value.est30d = position.value.deposited * (vault.value.apy / 100 / 12);

  stats.value.totalDeposits++;
  recentActivity.value.unshift({
    icon: "💰",
    amount: amt,
    timestamp: new Date().toLocaleTimeString(),
  });
  if (recentActivity.value.length > 10) recentActivity.value.pop();

  status.value = { msg: t("depositedAmount").replace("{amount}", String(amt)), type: "success" };
  isLoading.value = false;
};
</script>

<style lang="scss" scoped>
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.tab-content {
  padding: 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.demo-banner {
  background: rgba(255, 222, 89, 0.1);
  border: 1px solid rgba(255, 222, 89, 0.3);
  padding: 12px;
  text-align: center;
  border-radius: 12px;
  margin-bottom: 24px;
  backdrop-filter: blur(5px);
}

.demo-badge {
  font-weight: 800;
  text-transform: uppercase;
  font-size: 11px;
  display: block;
  color: #ffde59;
  letter-spacing: 0.1em;
}
.demo-note {
  font-size: 10px;
  font-weight: 600;
  opacity: 0.8;
  color: #ffde59;
}

.capsule-container {
  display: flex;
  align-items: center;
  gap: 24px;
}
.capsule-body {
  width: 60px;
  height: 100px;
  background: var(--bg-card, rgba(255, 255, 255, 0.05));
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 30px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 0 20px rgba(0, 229, 153, 0.2);
}

.capsule-fill {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  background: linear-gradient(to top, #00e599, rgba(0, 229, 153, 0.3));
  border-top: 1px solid rgba(255, 255, 255, 0.5);
  transition: height 0.5s ease;
}
.capsule-label {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  z-index: 2;
}
.capsule-apy {
  font-weight: 800;
  font-size: 14px;
  color: white;
  text-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
}
.capsule-apy-label {
  font-size: 8px;
  font-weight: 700;
  color: white;
  text-transform: uppercase;
}

.vault-stats-grid {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.stat-item {
  padding: 12px;
  background: var(--bg-card, rgba(255, 255, 255, 0.05));
  border: 1px solid var(--border-color, rgba(255, 255, 255, 0.1));
  border-radius: 12px;
}
.stat-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--text-secondary, rgba(255, 255, 255, 0.5));
  letter-spacing: 0.1em;
}
.stat-value {
  font-weight: 800;
  font-family: $font-mono;
  font-size: 16px;
  color: white;
}
.stat-unit {
  font-size: 10px;
  color: var(--text-secondary, rgba(255, 255, 255, 0.5));
  margin-left: 4px;
}

.growth-chart {
  height: 140px;
  display: flex;
  align-items: flex-end;
  gap: 12px;
  margin-bottom: 24px;
  background: rgba(0, 0, 0, 0.2);
  padding: 16px;
  border: 1px solid var(--border-color, rgba(255, 255, 255, 0.05));
  border-radius: 16px;
}
.chart-bars {
  flex: 1;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  height: 100%;
  gap: 8px;
}
.chart-bar {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  height: 100%;
  justify-content: flex-end;
}
.bar-fill {
  width: 100%;
  background: linear-gradient(to top, var(--neo-purple), #a855f7);
  border-radius: 4px 4px 0 0;
  opacity: 0.8;
  min-height: 4px;
}
.bar-label {
  font-size: 10px;
  font-weight: 600;
  color: var(--text-secondary, rgba(255, 255, 255, 0.6));
  margin-top: 4px;
}

.position-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}
.position-row .label {
  font-size: 11px;
  color: var(--text-secondary, rgba(255, 255, 255, 0.5));
}
.position-row .value {
  font-size: 13px;
  font-weight: 700;
  color: white;
  font-family: $font-mono;
}
.position-row.earned .value {
  color: #00e599;
}

.period-options {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin: 16px 0;
}
.period-option {
  padding: 12px 8px;
  background: var(--bg-card, rgba(255, 255, 255, 0.05));
  border: 1px solid var(--border-color, rgba(255, 255, 255, 0.1));
  border-radius: 12px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  &.active {
    background: rgba(0, 229, 153, 0.1);
    border-color: #00e599;
    box-shadow: 0 0 15px rgba(0, 229, 153, 0.2);
  }
}

.period-days {
  font-weight: 700;
  font-size: 13px;
  color: white;
  display: block;
}
.period-bonus {
  font-size: 9px;
  color: #00e599;
  font-weight: 600;
}

.projected-returns {
  background: var(--bg-card, rgba(255, 255, 255, 0.05));
  padding: 12px;
  border-radius: 12px;
  margin-bottom: 16px;
  text-align: center;
}
.returns-label {
  font-size: 10px;
  color: var(--text-secondary, rgba(255, 255, 255, 0.5));
  display: block;
  margin-bottom: 4px;
}
.returns-value {
  font-size: 20px;
  font-weight: 800;
  color: white;
  font-family: $font-mono;
}
.returns-unit {
  font-size: 12px;
  color: var(--text-secondary, rgba(255, 255, 255, 0.5));
  margin-left: 4px;
}
.note {
  font-size: 10px;
  color: var(--text-muted, rgba(255, 255, 255, 0.4));
  text-align: center;
  display: block;
  margin-top: 12px;
}

.capsule-item {
  padding: 16px;
  background: var(--bg-card, rgba(255, 255, 255, 0.03));
  border: 1px solid var(--border-color, rgba(255, 255, 255, 0.05));
  margin-bottom: 16px;
  border-radius: 16px;
}
.capsule-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
.capsule-icon {
  font-size: 24px;
}
.capsule-info {
  flex: 1;
}
.capsule-amount {
  font-size: 16px;
  font-weight: 700;
  color: white;
  display: block;
}
.capsule-period {
  font-size: 11px;
  color: var(--text-secondary, rgba(255, 255, 255, 0.5));
}
.capsule-status {
  margin-left: auto;
}
.status-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  padding: 4px 8px;
  border-radius: 99px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.progress-bar {
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  margin: 8px 0;
  border-radius: 99px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: #00e599;
  border-radius: 99px;
}
.progress-text {
  font-size: 10px;
  color: var(--text-secondary, rgba(255, 255, 255, 0.5));
  font-weight: 600;
  text-align: right;
  display: block;
}

.capsule-footer {
  display: flex;
  justify-content: space-between;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}
.countdown-label,
.rewards-label {
  font-size: 10px;
  color: var(--text-secondary, rgba(255, 255, 255, 0.5));
  display: block;
}
.countdown-value,
.rewards-value {
  font-size: 12px;
  font-weight: 700;
  color: white;
  font-family: $font-mono;
}
.rewards-value {
  color: #00e599;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  &:last-child {
    border-bottom: none;
  }
}
.activity-history {
  font-size: 11px;
  font-weight: 500;
  border-left: 2px solid rgba(255, 255, 255, 0.1);
  padding-left: 12px;
  margin-bottom: 8px;
  color: var(--text-secondary, rgba(255, 255, 255, 0.7));
  font-family: $font-mono;
}
.empty-text {
  font-size: 12px;
  color: var(--text-muted, rgba(255, 255, 255, 0.4));
  text-align: center;
  display: block;
  padding: 20px;
}

.scrollable {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>
