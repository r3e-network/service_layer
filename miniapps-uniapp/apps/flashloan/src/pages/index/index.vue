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
      <FlowVisualization :t="t as any" />

      <!-- Liquidity Pool -->
      <LiquidityPoolCard :gas-liquidity="gasLiquidity" :neo-liquidity="neoLiquidity" :t="t as any" />

      <!-- Loan Request Form -->
      <LoanRequestForm
        v-model:loanAmount="loanAmount"
        v-model:selectedOperation="selectedOperation"
        :risk-level="riskLevel"
        :operation-types="operationTypes"
        :estimated-profit="estimatedProfit"
        :gas-liquidity="gasLiquidity"
        :is-loading="isLoading"
        :t="t as any"
        @request="requestLoan"
      />
    </view>

    <!-- Stats Tab -->
    <view v-if="activeTab === 'stats'" class="tab-content scrollable">
      <!-- Statistics Overview -->
      <SimulationStats :stats="stats" :t="t as any" />

      <!-- Recent Loans Table -->
      <RecentLoansTable :recent-loans="recentLoans" :t="t as any" />
    </view>

    <!-- Docs Tab -->
    <view v-if="activeTab === 'docs'" class="tab-content scrollable">
      <FlashloanDocs :t="t as any" />
    </view>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useWallet } from "@neo/uniapp-sdk";
import { formatNumber } from "@/shared/utils/format";
import { createT } from "@/shared/utils/i18n";
import { AppLayout, NeoCard, NeoDoc } from "@/shared/components";
import FlowVisualization from "./components/FlowVisualization.vue";
import LiquidityPoolCard from "./components/LiquidityPoolCard.vue";
import LoanRequestForm from "./components/LoanRequestForm.vue";
import SimulationStats from "./components/SimulationStats.vue";
import RecentLoansTable from "./components/RecentLoansTable.vue";
import FlashloanDocs from "./components/FlashloanDocs.vue";

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
  // Detailed docs translations
  docTitle: { en: "Flash Loan Documentation", zh: "闪电贷文档" },
  contractInfo: { en: "Contract Information", zh: "合约信息" },
  contractName: { en: "Contract Name", zh: "合约名称" },
  version: { en: "Version", zh: "版本" },
  minLoan: { en: "Min Loan", zh: "最小贷款" },
  maxLoan: { en: "Max Loan", zh: "最大贷款" },
  cooldown: { en: "Cooldown", zh: "冷却时间" },
  minutes: { en: "minutes", zh: "分钟" },
  dailyLimit: { en: "Daily Limit", zh: "每日限制" },
  loansPerDay: { en: "loans/day", zh: "笔/天" },
  contractMethods: { en: "Contract Methods", zh: "合约方法" },
  write: { en: "WRITE", zh: "写入" },
  read: { en: "READ", zh: "读取" },
  parameters: { en: "Parameters", zh: "参数" },
  returns: { en: "Returns", zh: "返回" },
  requestLoanDesc: { en: "Request a flash loan with callback verification", zh: "请求带回调验证的闪电贷" },
  borrowerDesc: { en: "Your wallet address", zh: "你的钱包地址" },
  amountDesc: { en: "Loan amount in GAS (8 decimals)", zh: "GAS 贷款金额（8位小数）" },
  callbackContractDesc: { en: "Contract to receive and repay loan", zh: "接收和偿还贷款的合约" },
  callbackMethodDesc: { en: "Method to call on callback contract", zh: "回调合约上调用的方法" },
  getLoanDesc: { en: "Get loan details by ID", zh: "通过 ID 获取贷款详情" },
  getPoolBalanceDesc: { en: "Get current liquidity pool balance", zh: "获取当前流动性池余额" },
  depositDesc: { en: "Deposit liquidity to the flash loan pool", zh: "向闪电贷池存入流动性" },
  events: { en: "Contract Events", zh: "合约事件" },
  howToUse: { en: "How to Use Flash Loans", zh: "如何使用闪电贷" },
  step5: {
    en: "Ensure your callback contract repays loan + 0.09% fee atomically",
    zh: "确保你的回调合约原子化偿还贷款 + 0.09% 手续费",
  },
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

const isLoading = ref(false);
const dataLoading = ref(true);
const gasLiquidity = ref(0);
const neoLiquidity = ref(0);
const loanAmount = ref("");
const status = ref<{ msg: string; type: string } | null>(null);

type OperationType = "arbitrage" | "liquidation" | "collateralSwap";
const selectedOperation = ref<OperationType>("arbitrage");

const operationTypes = computed(() => [
  { id: "arbitrage" as OperationType, icon: "📈", profit: 0.5 },
  { id: "liquidation" as OperationType, icon: "⚡", profit: 5.0 },
  { id: "collateralSwap" as OperationType, icon: "🔄", profit: 0.1 },
]);

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

  isLoading.value = true;
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
  border: 3px solid var(--border-color, black);
  text-align: center;
  margin-bottom: $space-4;
  box-shadow: 6px 6px 0 var(--shadow-color, black);
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

.scrollable {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>
