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
              <text class="op-name">{{ (t as any)(op.id) }}</text>
              <text class="op-desc">{{ (t as any)(op.id + "Desc") }}</text>
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
          <NeoCard variant="default" class="flex-1 text-center">
            <text class="stat-value">{{ stats.totalLoans }}</text>
            <text class="stat-label">{{ t("totalLoans") }}</text>
          </NeoCard>
          <NeoCard variant="default" class="flex-1 text-center">
            <text class="stat-value">{{ formatNum(stats.totalVolume) }}</text>
            <text class="stat-label">{{ t("totalVolume") }}</text>
          </NeoCard>
          <NeoCard variant="default" class="flex-1 text-center">
            <text class="stat-value">{{ stats.totalFees.toFixed(2) }}</text>
            <text class="stat-label">{{ t("totalFees") }}</text>
          </NeoCard>
          <NeoCard variant="default" class="flex-1 text-center">
            <text class="stat-value">{{
              stats.totalLoans > 0 ? formatNum(stats.totalVolume / stats.totalLoans) : 0
            }}</text>
            <text class="stat-label">{{ t("avgLoanSize") }}</text>
          </NeoCard>
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
  step4: { en: "Review results in the Stats tab and refine your strategy.", zh: "在统计标签页查看结果并优化策略。" },
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

const docSteps = computed(() => [t("step1"), t("step2"), t("step3"), t("step4")]);
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
  display: flex;
  flex-direction: column;
  gap: $space-4;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.demo-banner {
  background: var(--brutal-yellow);
  padding: $space-3;
  border: 3px solid black;
  text-align: center;
  margin-bottom: $space-4;
  box-shadow: 6px 6px 0 black;
}
.demo-badge {
  font-weight: $font-weight-black;
  text-transform: uppercase;
  font-size: 14px;
  border-bottom: 2px solid black;
  display: inline-block;
  margin-bottom: 4px;
}
.demo-note {
  font-size: 10px;
  font-weight: $font-weight-black;
  display: block;
  opacity: 1;
}

.flow-card {
  border-left: 8px solid var(--neo-purple) !important;
}
.flow-diagram {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: $space-6 0;
  background: #eee;
  padding: $space-4;
  border: 2px solid black;
  box-shadow: inset 4px 4px 0 rgba(0, 0, 0, 0.1);
}
.flow-step {
  text-align: center;
  flex: 1;
}
.flow-icon {
  font-size: 32px;
  display: block;
  margin-bottom: 4px;
}
.flow-label {
  font-size: 10px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
}
.flow-arrow {
  font-size: 24px;
  font-weight: $font-weight-black;
  color: var(--neo-purple);
}
.flow-note {
  font-size: 10px;
  font-weight: $font-weight-black;
  text-align: center;
  border-top: 3px solid black;
  padding-top: 8px;
  margin-top: 4px;
}

.liquidity-item {
  margin-bottom: $space-4;
}
.token-label {
  font-size: 12px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  border: 1px solid black;
  padding: 2px 6px;
  background: white;
}
.token-amount {
  font-family: $font-mono;
  font-weight: $font-weight-black;
  font-size: 24px;
  color: black;
  display: block;
  margin-top: 4px;
}
.liquidity-bar {
  height: 16px;
  background: white;
  border: 3px solid black;
  margin-top: 8px;
  padding: 2px;
}
.liquidity-fill {
  height: 100%;
  background: var(--neo-green);
  &.neo {
    background: var(--brutal-blue);
  }
}

.operation-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $space-3;
  margin: $space-6 0;
}
.operation-btn {
  padding: $space-4 $space-2;
  background: white;
  border: 3px solid black;
  text-align: center;
  box-shadow: 4px 4px 0 black;
  transition: all $transition-fast;
  &.active {
    background: var(--brutal-yellow);
    transform: translate(2px, 2px);
    box-shadow: 2px 2px 0 black;
  }
}
.op-icon {
  font-size: 24px;
  display: block;
  margin-bottom: 4px;
}
.op-name {
  font-weight: $font-weight-black;
  font-size: 10px;
  text-transform: uppercase;
  display: block;
}

.fee-calculator {
  background: black;
  color: white;
  padding: $space-5;
  border: 3px solid black;
  margin-top: $space-6;
  box-shadow: 8px 8px 0 rgba(0, 0, 0, 0.2);
}
.calc-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  margin-bottom: 8px;
  &.total {
    font-weight: $font-weight-black;
    color: var(--brutal-green);
    border-top: 1px solid #444;
    padding-top: 8px;
  }
  &.profit {
    color: var(--brutal-yellow);
    font-weight: $font-weight-black;
    margin-top: 8px;
    border-top: 1px solid #444;
    padding-top: 8px;
  }
}

.risk-indicator {
  padding: 4px 10px;
  font-size: 10px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  border: 2px solid black;
  box-shadow: 3px 3px 0 black;
  &.low {
    background: var(--neo-green);
  }
  &.medium {
    background: var(--brutal-yellow);
  }
  &.high {
    background: var(--brutal-red);
    color: white;
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $space-4;
}
.stat-value {
  font-weight: $font-weight-black;
  font-family: $font-mono;
  font-size: 18px;
  display: block;
  border-bottom: 3px solid black;
  margin-bottom: 4px;
}
.stat-label {
  font-size: 10px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  opacity: 0.6;
}

.loans-table {
  border: 3px solid black;
  background: white;
}
.table-header {
  display: flex;
  background: black;
  color: white;
}
.th {
  flex: 1;
  padding: $space-3;
  font-size: 10px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
}
.table-row {
  display: flex;
  border-bottom: 2px solid black;
  &:last-child {
    border-bottom: none;
  }
}
.td {
  flex: 1;
  padding: $space-3;
  font-size: 12px;
  font-family: $font-mono;
  font-weight: $font-weight-black;
}

.scrollable {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>
