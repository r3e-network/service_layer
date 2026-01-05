<template>
  <AppLayout :title="t('title')" show-top-nav :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <!-- Main Tab -->
    <view v-if="activeTab === 'main'" class="tab-content">
      <!-- DEMO Mode Banner -->
      <view class="demo-banner">
        <text class="demo-badge">{{ t("demoMode") }}</text>
        <text class="demo-note">{{ t("demoNote") }}</text>
      </view>

      <view v-if="status" :class="['status-msg', status.type]">
        <text>{{ status.msg }}</text>
      </view>

      <!-- Flash Loan Flow Visualization -->
      <NeoCard variant="default" class="flow-card">
        <view class="flow-header">
          <text class="flow-title">⚡ {{ t("flashLoanFlow") }}</text>
        </view>
        <view class="flow-diagram">
          <view class="flow-step">
            <view class="flow-icon">💰</view>
            <text class="flow-label">{{ t("borrow") }}</text>
          </view>
          <view class="flow-arrow">→</view>
          <view class="flow-step">
            <view class="flow-icon">🔄</view>
            <text class="flow-label">{{ t("execute") }}</text>
          </view>
          <view class="flow-arrow">→</view>
          <view class="flow-step">
            <view class="flow-icon">✓</view>
            <text class="flow-label">{{ t("repay") }}</text>
          </view>
        </view>
        <view class="flow-note">
          <text class="note-text">{{ t("flowNote") }}</text>
        </view>
      </NeoCard>

      <!-- Liquidity Pool -->
      <NeoCard variant="default" class="liquidity-card">
        <view class="card-header">
          <text class="card-title">{{ t("availableLiquidity") }}</text>
          <view class="lightning-badge">⚡</view>
        </view>
        <view class="liquidity-grid">
          <view class="liquidity-item">
            <text class="token-label">GAS</text>
            <text class="token-amount">{{ formatNum(gasLiquidity) }}</text>
            <view class="liquidity-bar">
              <view class="liquidity-fill" :style="{ width: '75%' }"></view>
            </view>
          </view>
          <view class="liquidity-item">
            <text class="token-label">NEO</text>
            <text class="token-amount">{{ neoLiquidity }}</text>
            <view class="liquidity-bar">
              <view class="liquidity-fill neo" :style="{ width: '60%' }"></view>
            </view>
          </view>
        </view>
      </NeoCard>

      <!-- Loan Request Form -->
      <NeoCard variant="default" class="loan-card">
        <view class="card-header">
          <text class="card-title">{{ t("requestFlashLoan") }}</text>
          <view class="risk-indicator" :class="riskLevel">
            <text class="risk-text">{{ t(riskLevel) }}</text>
          </view>
        </view>

        <!-- Operation Type Selector -->
        <view class="operation-section">
          <text class="section-label">{{ t("selectOperation") }}</text>
          <view class="operation-grid">
            <view
              v-for="op in operationTypes"
              :key="op.id"
              :class="['operation-btn', { active: selectedOperation === op.id }]"
              @click="selectedOperation = op.id"
            >
              <text class="op-icon">{{ op.icon }}</text>
              <text class="op-name">{{ t(op.id) }}</text>
              <text class="op-desc">{{ t(op.id + "Desc") }}</text>
            </view>
          </view>
        </view>

        <view class="input-section">
          <NeoInput v-model="loanAmount" type="number" :placeholder="t('amountPlaceholder')" suffix="GAS" />
          <view class="amount-hints">
            <text
              v-for="hint in [1000, 5000, 10000]"
              :key="hint"
              class="hint-btn"
              @click="loanAmount = hint.toString()"
            >
              {{ formatNum(hint) }}
            </text>
          </view>
        </view>

        <!-- Fee Calculator -->
        <view class="fee-calculator">
          <view class="calc-row">
            <text class="calc-label">{{ t("loanAmount") }}</text>
            <text class="calc-value">{{ formatNum(parseFloat(loanAmount || "0")) }} GAS</text>
          </view>
          <view class="calc-row">
            <text class="calc-label">{{ t("fee") }}</text>
            <text class="calc-value fee-highlight">{{ (parseFloat(loanAmount || "0") * 0.0009).toFixed(4) }} GAS</text>
          </view>
          <view class="calc-divider"></view>
          <view class="calc-row total">
            <text class="calc-label">{{ t("totalRepay") }}</text>
            <text class="calc-value">{{ (parseFloat(loanAmount || "0") * 1.0009).toFixed(4) }} GAS</text>
          </view>
          <view class="calc-divider"></view>
          <view class="calc-row profit">
            <text class="calc-label">{{ t("estimatedProfit") }}</text>
            <text class="calc-value profit-highlight">+{{ estimatedProfit.toFixed(4) }} GAS</text>
          </view>
        </view>

        <!-- Risk Warning -->
        <view v-if="parseFloat(loanAmount || '0') > gasLiquidity * 0.5" class="risk-warning">
          <text class="warning-icon">⚠️</text>
          <text class="warning-text">{{ t("highRiskWarning") }}</text>
        </view>

        <NeoButton variant="primary" size="lg" block :loading="isLoading" @click="requestLoan" class="execute-btn">
          <text v-if="!isLoading">⚡ {{ t("executeLoan") }}</text>
          <text v-else>{{ t("processing") }}</text>
        </NeoButton>
      </NeoCard>
    </view>

    <!-- Stats Tab -->
    <view v-if="activeTab === 'stats'" class="tab-content scrollable">
      <!-- Statistics Overview -->
      <NeoCard variant="default" class="stats-overview">
        <text class="stats-title">📊 {{ t("statistics") }}</text>
        <view class="stats-grid">
          <view class="stat-box">
            <text class="stat-value">{{ stats.totalLoans }}</text>
            <text class="stat-label">{{ t("totalLoans") }}</text>
          </view>
          <view class="stat-box">
            <text class="stat-value">{{ formatNum(stats.totalVolume) }}</text>
            <text class="stat-label">{{ t("totalVolume") }}</text>
          </view>
          <view class="stat-box">
            <text class="stat-value">{{ stats.totalFees.toFixed(2) }}</text>
            <text class="stat-label">{{ t("totalFees") }}</text>
          </view>
          <view class="stat-box">
            <text class="stat-value">{{
              stats.totalLoans > 0 ? formatNum(stats.totalVolume / stats.totalLoans) : 0
            }}</text>
            <text class="stat-label">{{ t("avgLoanSize") }}</text>
          </view>
        </view>
      </NeoCard>

      <!-- Recent Loans Table -->
      <NeoCard variant="default" class="history-card">
        <text class="stats-title">📜 {{ t("recentLoans") }}</text>
        <view v-if="recentLoans.length > 0" class="loans-table">
          <view class="table-header">
            <text class="th th-amount">{{ t("amount") }}</text>
            <text class="th th-fee">{{ t("feeShort") }}</text>
            <text class="th th-time">{{ t("time") }}</text>
          </view>
          <view v-for="(loan, idx) in recentLoans" :key="idx" class="table-row">
            <text class="td td-amount">{{ formatNum(loan.amount) }} GAS</text>
            <text class="td td-fee">{{ (loan.amount * 0.0009).toFixed(4) }}</text>
            <text class="td td-time">{{ loan.timestamp }}</text>
          </view>
        </view>
        <view v-else class="empty-state">
          <text class="empty-icon">📭</text>
          <text class="empty-text">{{ t("noHistory") }}</text>
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
import { ref, computed, onMounted } from "vue";
import { useWallet, usePayments } from "@neo/uniapp-sdk";
import { formatNumber } from "@/shared/utils/format";
import { createT } from "@/shared/utils/i18n";
import { AppLayout, NeoButton, NeoInput, NeoCard, NeoDoc } from "@/shared/components";

const translations = {
  title: { en: "Flash Loan Simulator", zh: "闪电贷模拟器" },
  demoMode: { en: "DEMO MODE", zh: "演示模式" },
  demoNote: { en: "Educational simulation - no real funds involved", zh: "教育模拟 - 不涉及真实资金" },
  flashLoanFlow: { en: "Flash Loan Flow", zh: "闪电贷流程" },
  borrow: { en: "Borrow", zh: "借款" },
  execute: { en: "Execute", zh: "执行" },
  repay: { en: "Repay", zh: "还款" },
  flowNote: { en: "All operations execute atomically in a single transaction", zh: "所有操作在单笔交易中原子化执行" },
  availableLiquidity: { en: "Simulated Liquidity Pool", zh: "模拟流动性池" },
  requestFlashLoan: { en: "Configure Simulation", zh: "配置模拟" },
  selectOperation: { en: "Select Operation Type", zh: "选择操作类型" },
  arbitrage: { en: "Arbitrage", zh: "套利" },
  arbitrageDesc: { en: "Profit from price differences across DEXs", zh: "利用不同 DEX 间的价差获利" },
  liquidation: { en: "Liquidation", zh: "清算" },
  liquidationDesc: { en: "Liquidate undercollateralized positions", zh: "清算抵押不足的仓位" },
  collateralSwap: { en: "Collateral Swap", zh: "抵押品交换" },
  collateralSwapDesc: { en: "Swap collateral without closing position", zh: "无需平仓即可交换抵押品" },
  amountPlaceholder: { en: "Enter amount", zh: "输入金额" },
  loanAmount: { en: "Loan Amount", zh: "贷款金额" },
  fee: { en: "Fee (0.09%)", zh: "手续费 (0.09%)" },
  feeShort: { en: "Fee", zh: "手续费" },
  totalRepay: { en: "Total Repayment", zh: "总还款额" },
  estimatedProfit: { en: "Estimated Profit", zh: "预计利润" },
  processing: { en: "Simulating...", zh: "模拟中..." },
  executeLoan: { en: "Run Simulation", zh: "运行模拟" },
  invalidAmount: { en: "Invalid amount", zh: "无效金额" },
  loanExecuted: { en: "Simulation complete", zh: "模拟完成" },
  simulationSuccess: { en: "Flash loan simulation successful!", zh: "闪电贷模拟成功！" },
  error: { en: "Error", zh: "错误" },
  main: { en: "Simulate", zh: "模拟" },
  stats: { en: "Results", zh: "结果" },
  statistics: { en: "Simulation Results", zh: "模拟结果" },
  totalLoans: { en: "Simulations Run", zh: "模拟次数" },
  totalVolume: { en: "Total Volume (GAS)", zh: "总交易量 (GAS)" },
  totalFees: { en: "Total Fees (GAS)", zh: "总手续费 (GAS)" },
  avgLoanSize: { en: "Avg Size (GAS)", zh: "平均额度 (GAS)" },
  recentLoans: { en: "Recent Simulations", zh: "最近模拟" },
  amount: { en: "Amount", zh: "金额" },
  time: { en: "Time", zh: "时间" },
  operation: { en: "Operation", zh: "操作" },
  profit: { en: "Profit", zh: "利润" },
  noHistory: { en: "No simulations yet", zh: "暂无模拟记录" },
  low: { en: "Low Risk", zh: "低风险" },
  medium: { en: "Medium Risk", zh: "中风险" },
  high: { en: "High Risk", zh: "高风险" },
  highRiskWarning: { en: "Warning: Large loan amount may affect liquidity", zh: "警告：大额贷款可能影响流动性" },
  docs: { en: "Learn", zh: "学习" },
  docSubtitle: { en: "Understanding Flash Loans", zh: "理解闪电贷" },
  docDescription: {
    en: "Flash loans enable uncollateralized borrowing with instant repayment in a single transaction. This simulator helps you understand how they work without risking real funds.",
    zh: "闪电贷支持无抵押借款，在单笔交易中即时还款。此模拟器帮助你在不冒真实资金风险的情况下理解其工作原理。",
  },
  step1: {
    en: "Select an operation type (Arbitrage, Liquidation, or Collateral Swap)",
    zh: "选择操作类型（套利、清算或抵押品交换）",
  },
  step2: { en: "Enter loan amount and review simulated fees", zh: "输入贷款金额并查看模拟手续费" },
  step3: { en: "Run the simulation to see potential outcomes", zh: "运行模拟查看潜在结果" },
  feature1Name: { en: "Risk-Free Learning", zh: "无风险学习" },
  feature1Desc: { en: "Practice flash loan strategies without real funds", zh: "无需真实资金即可练习闪电贷策略" },
  feature2Name: { en: "Real Scenarios", zh: "真实场景" },
  feature2Desc: { en: "Simulate arbitrage, liquidations, and collateral swaps", zh: "模拟套利、清算和抵押品交换" },
};

const t = createT(translations);

const navTabs = [
  { id: "main", icon: "wallet", label: t("main") },
  { id: "stats", icon: "chart", label: t("stats") },
  { id: "docs", icon: "book", label: t("docs") },
];

const activeTab = ref("main");

const docSteps = computed(() => [t("step1"), t("step2"), t("step3")]);
const docFeatures = computed(() => [
  { name: t("feature1Name"), desc: t("feature1Desc") },
  { name: t("feature2Name"), desc: t("feature2Desc") },
]);

const APP_ID = "miniapp-flashloan";
const { address, connect } = useWallet();

// Simulation mode - no real payments
const isLoading = ref(false);
const dataLoading = ref(true);

const gasLiquidity = ref(0);
const neoLiquidity = ref(0);
const loanAmount = ref("");
const status = ref<{ msg: string; type: string } | null>(null);

// Operation type for simulation
type OperationType = "arbitrage" | "liquidation" | "collateralSwap";
const selectedOperation = ref<OperationType>("arbitrage");

const operationTypes = computed(() => [
  { id: "arbitrage" as OperationType, icon: "📈", profit: 0.5 },
  { id: "liquidation" as OperationType, icon: "⚡", profit: 5.0 },
  { id: "collateralSwap" as OperationType, icon: "🔄", profit: 0.1 },
]);

// Calculate estimated profit based on operation type
const estimatedProfit = computed(() => {
  const amount = parseFloat(loanAmount.value || "0");
  const fee = amount * 0.0009;
  const op = operationTypes.value.find((o) => o.id === selectedOperation.value);
  const grossProfit = (amount * (op?.profit || 0)) / 100;
  return Math.max(0, grossProfit - fee);
});

const stats = ref({ totalLoans: 0, totalVolume: 0, totalFees: 0, totalProfit: 0 });
const recentLoans = ref<{ amount: number; timestamp: string; operation: string; profit: number }[]>([]);

const formatNum = (n: number) => formatNumber(n, 0);

const riskLevel = computed(() => {
  const amount = parseFloat(loanAmount.value || "0");
  if (amount === 0) return "low";
  if (amount > gasLiquidity.value * 0.5) return "high";
  if (amount > gasLiquidity.value * 0.25) return "medium";
  return "low";
});

const requestLoan = async () => {
  if (isLoading.value) return;
  const amount = parseFloat(loanAmount.value);
  if (amount <= 0 || amount > gasLiquidity.value) {
    status.value = { msg: t("invalidAmount"), type: "error" };
    return;
  }

  // Simulation mode - no real payment
  isLoading.value = true;

  // Simulate processing delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const fee = amount * 0.0009;
  const profit = estimatedProfit.value;

  stats.value.totalLoans++;
  stats.value.totalVolume += amount;
  stats.value.totalFees += fee;
  stats.value.totalProfit += profit;

  recentLoans.value.unshift({
    amount,
    timestamp: new Date().toLocaleTimeString(),
    operation: selectedOperation.value,
    profit,
  });
  if (recentLoans.value.length > 10) recentLoans.value.pop();

  status.value = {
    msg: `${t("simulationSuccess")} ${t("profit")}: +${profit.toFixed(4)} GAS`,
    type: "success",
  };

  isLoading.value = false;
};

// Fetch liquidity data from contract
const fetchData = async () => {
  try {
    dataLoading.value = true;
    const sdk = await import("@neo/uniapp-sdk").then((m) => m.waitForSDK?.() || null);
    if (!sdk?.invoke) return;

    const data = (await sdk.invoke("flashloan.getLiquidity", { appId: APP_ID })) as {
      gasLiquidity: number;
      neoLiquidity: number;
    } | null;

    if (data) {
      gasLiquidity.value = data.gasLiquidity || 0;
      neoLiquidity.value = data.neoLiquidity || 0;
    }
  } catch (e) {
    console.warn("[Flashloan] Failed to fetch:", e);
  } finally {
    dataLoading.value = false;
  }
};

onMounted(() => fetchData());
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
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
}

// DEMO Banner
.demo-banner {
  background: linear-gradient(135deg, var(--brutal-yellow) 0%, var(--brutal-red) 100%);
  border: $border-width-md solid var(--neo-black);
  padding: $space-3 $space-4;
  text-align: center;
  box-shadow: $shadow-md;
}

.demo-badge {
  display: block;
  font-size: $font-size-lg;
  font-weight: $font-weight-black;
  color: var(--neo-black);
  text-transform: uppercase;
  letter-spacing: 2px;
}

.demo-note {
  display: block;
  font-size: $font-size-sm;
  color: var(--neo-black);
  margin-top: $space-1;
  opacity: 0.8;
}

// Operation Selector
.operation-section {
  margin-bottom: $space-4;
}

.section-label {
  display: block;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: var(--text-secondary);
  text-transform: uppercase;
  margin-bottom: $space-3;
}

.operation-grid {
  display: flex;
  gap: $space-3;
}

.operation-btn {
  flex: 1;
  background: var(--bg-secondary);
  border: $border-width-md solid var(--border-color);
  padding: $space-3;
  text-align: center;
  cursor: pointer;
  transition: all $transition-fast;

  &.active {
    border-color: var(--neo-green);
    background: var(--bg-elevated);
    box-shadow: 0 0 0 2px var(--neo-green);
  }

  &:active {
    transform: scale(0.98);
  }
}

.op-icon {
  display: block;
  font-size: $font-size-2xl;
  margin-bottom: $space-2;
}

.op-name {
  display: block;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: var(--text-primary);
}

.op-desc {
  display: block;
  font-size: $font-size-xs;
  color: var(--text-muted);
  margin-top: $space-1;
}

// Profit highlight
.profit-highlight {
  color: var(--neo-green) !important;
  font-weight: $font-weight-bold;
}

.status-msg {
  text-align: center;
  padding: $space-4;
  border: $border-width-md solid var(--border-color);
  box-shadow: $shadow-md;
  margin-bottom: $space-4;
  font-weight: $font-weight-bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  &.success {
    background: var(--neo-green);
    color: var(--neo-black);
    border-color: var(--neo-black);
  }

  &.error {
    background: var(--brutal-red);
    color: var(--neo-white);
    border-color: var(--neo-black);
  }
}

// Flow Visualization
.flow-card {
  background: var(--bg-card);
  border: $border-width-md solid var(--border-color);
  padding: $space-4;
}

.flow-header {
  margin-bottom: $space-4;
}

.flow-title {
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  color: var(--brutal-yellow);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.flow-diagram {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $space-4 0;
  margin-bottom: $space-3;
}

.flow-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-2;
  flex: 1;
}

.flow-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--brutal-yellow);
  border: $border-width-md solid var(--neo-black);
  border-radius: $radius-md;
  font-size: $font-size-2xl;
  box-shadow: $shadow-md;
}

.flow-label {
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: var(--text-primary);
  text-transform: uppercase;
}

.flow-arrow {
  font-size: $font-size-2xl;
  color: var(--brutal-yellow);
  font-weight: $font-weight-bold;
  padding: 0 $space-2;
}

.flow-note {
  background: color-mix(in srgb, var(--brutal-yellow) 10%, transparent);
  border: $border-width-sm solid var(--brutal-yellow);
  padding: $space-3;
  border-radius: $radius-md;
}

.note-text {
  font-size: $font-size-sm;
  color: var(--text-secondary);
  text-align: center;
  display: block;
}

// Liquidity Card
.liquidity-card {
  background: var(--bg-card);
  border: $border-width-md solid var(--border-color);
  padding: $space-4;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $space-4;
}

.card-title {
  color: var(--neo-green);
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.lightning-badge {
  font-size: $font-size-2xl;
  background: var(--brutal-yellow);
  border: $border-width-md solid var(--neo-black);
  border-radius: $radius-md;
  padding: $space-2;
  box-shadow: $shadow-sm;
}

.liquidity-grid {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.liquidity-item {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.token-label {
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: var(--text-secondary);
  text-transform: uppercase;
}

.token-amount {
  font-size: $font-size-2xl;
  font-weight: $font-weight-bold;
  color: var(--neo-green);
}

.liquidity-bar {
  height: 8px;
  background: var(--bg-secondary);
  border: $border-width-sm solid var(--border-color);
  border-radius: $radius-sm;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
}

.liquidity-fill {
  flex: 1;
  min-height: 0;
  background: var(--neo-green);
  transition: width 0.3s ease;

  &.neo {
    background: var(--brutal-yellow);
  }
}

// Loan Card
.loan-card {
  background: var(--bg-card);
  border: $border-width-md solid var(--border-color);
  padding: $space-4;
}

.risk-indicator {
  padding: $space-2 $space-3;
  border: $border-width-md solid var(--neo-black);
  border-radius: $radius-md;
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  text-transform: uppercase;

  &.low {
    background: var(--neo-green);
    color: var(--neo-black);
  }

  &.medium {
    background: var(--brutal-yellow);
    color: var(--neo-black);
  }

  &.high {
    background: var(--brutal-red);
    color: var(--neo-white);
  }
}

.input-section {
  margin-bottom: $space-4;
}

.amount-hints {
  display: flex;
  gap: $space-2;
  margin-top: $space-2;
}

.hint-btn {
  flex: 1;
  padding: $space-2;
  background: var(--bg-secondary);
  border: $border-width-sm solid var(--border-color);
  border-radius: $radius-md;
  text-align: center;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: var(--text-secondary);
  cursor: pointer;
  box-shadow: $shadow-sm;
  transition: all 0.2s ease;

  &:active {
    background: var(--brutal-yellow);
    color: var(--neo-black);
    transform: translateY(2px);
  }
}

// Fee Calculator
.fee-calculator {
  background: var(--bg-secondary);
  border: $border-width-md solid var(--border-color);
  border-radius: $radius-md;
  padding: $space-4;
  margin-bottom: $space-4;
}

.calc-row {
  display: flex;
  justify-content: space-between;
  padding: $space-2 0;

  &.total {
    padding-top: $space-3;

    .calc-label,
    .calc-value {
      font-size: $font-size-lg;
      font-weight: $font-weight-bold;
      color: var(--neo-green);
    }
  }
}

.calc-label {
  color: var(--text-secondary);
  font-size: $font-size-sm;
}

.calc-value {
  color: var(--text-primary);
  font-weight: $font-weight-bold;
  font-size: $font-size-sm;

  &.fee-highlight {
    color: var(--brutal-yellow);
  }
}

.calc-divider {
  height: $border-width-md;
  background: var(--border-color);
  margin: $space-2 0;
}

// Risk Warning
.risk-warning {
  display: flex;
  align-items: center;
  gap: $space-2;
  padding: $space-3;
  background: color-mix(in srgb, var(--brutal-red) 10%, transparent);
  border: $border-width-md solid var(--brutal-red);
  border-radius: $radius-md;
  margin-bottom: $space-4;
}

.warning-icon {
  font-size: $font-size-xl;
}

.warning-text {
  flex: 1;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: var(--brutal-red);
}

.execute-btn {
  box-shadow: $shadow-md;

  &:active {
    transform: translateY(2px);
    box-shadow: $shadow-sm;
  }
}

// Stats Overview
.stats-overview {
  background: var(--bg-card);
  border: $border-width-md solid var(--border-color);
  padding: $space-4;
  margin-bottom: $space-4;
}

.stats-title {
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  color: var(--neo-green);
  margin-bottom: $space-4;
  display: block;
  text-transform: uppercase;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $space-3;
}

.stat-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $space-4;
  background: var(--bg-secondary);
  border: $border-width-md solid var(--border-color);
  border-radius: $radius-md;
  box-shadow: $shadow-sm;
}

.stat-value {
  font-size: $font-size-2xl;
  font-weight: $font-weight-bold;
  color: var(--neo-green);
  margin-bottom: $space-2;
}

.stat-label {
  font-size: $font-size-xs;
  color: var(--text-secondary);
  text-align: center;
  text-transform: uppercase;
}

// History Table
.history-card {
  background: var(--bg-card);
  border: $border-width-md solid var(--border-color);
  padding: $space-4;
}

.loans-table {
  display: flex;
  flex-direction: column;
}

.table-header {
  display: flex;
  padding: $space-3;
  background: var(--bg-secondary);
  border: $border-width-md solid var(--border-color);
  border-radius: $radius-md $radius-md 0 0;
  font-weight: $font-weight-bold;
  font-size: $font-size-xs;
  color: var(--text-secondary);
  text-transform: uppercase;
}

.table-row {
  display: flex;
  padding: $space-3;
  border-bottom: $border-width-sm solid var(--border-color);

  &:last-child {
    border-bottom: none;
  }

  &:nth-child(even) {
    background: rgba($neo-green, 0.05);
  }
}

.th,
.td {
  flex: 1;
  text-align: left;

  &.th-amount,
  &.td-amount {
    flex: 2;
  }

  &.th-fee,
  &.td-fee {
    flex: 1.5;
  }

  &.th-time,
  &.td-time {
    flex: 1.5;
  }
}

.td {
  font-size: $font-size-sm;
  color: var(--text-primary);

  &.td-amount {
    font-weight: $font-weight-bold;
    color: var(--neo-green);
  }

  &.td-fee {
    color: var(--brutal-yellow);
  }

  &.td-time {
    color: var(--text-secondary);
  }
}

// Empty State
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $space-6 $space-4;
  gap: $space-3;
}

.empty-icon {
  font-size: 48px;
  opacity: 0.5;
}

.empty-text {
  color: var(--text-muted);
  text-align: center;
  font-size: $font-size-sm;
}

// Animations
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.02);
  }
}
</style>
