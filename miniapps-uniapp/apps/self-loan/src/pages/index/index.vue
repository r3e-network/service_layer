<template>
  <AppLayout :title="t('title')" show-top-nav :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <!-- Main Tab -->
    <view v-if="activeTab === 'main'" class="tab-content">
      <view v-if="status" :class="['status-msg', status.type]">
        <text>{{ status.msg }}</text>
      </view>

      <!-- Health Factor & Position Summary -->
      <view class="position-summary">
        <view class="health-section">
          <text class="section-label">{{ t("healthFactor") }}</text>
          <view class="health-gauge">
            <view class="gauge-circle" :style="{ background: getHealthGradient() }">
              <view class="gauge-inner">
                <text class="gauge-value">{{ healthFactor.toFixed(2) }}</text>
                <text class="gauge-label">{{ getHealthStatus() }}</text>
              </view>
            </view>
          </view>
          <view class="health-legend">
            <view class="legend-item">
              <view class="legend-dot safe"></view>
              <text class="legend-text">{{ t("safe") }} (&gt;2.0)</text>
            </view>
            <view class="legend-item">
              <view class="legend-dot warning"></view>
              <text class="legend-text">{{ t("warning") }} (1.2-2.0)</text>
            </view>
            <view class="legend-item">
              <view class="legend-dot danger"></view>
              <text class="legend-text">{{ t("danger") }} (&lt;1.2)</text>
            </view>
          </view>
        </view>

        <view class="metrics-grid">
          <view class="metric-card">
            <text class="metric-label">{{ t("totalBorrowed") }}</text>
            <text class="metric-value borrowed">{{ fmt(loan.borrowed, 2) }}</text>
            <text class="metric-unit">GAS</text>
          </view>
          <view class="metric-card">
            <text class="metric-label">{{ t("collateralLocked") }}</text>
            <text class="metric-value collateral">{{ fmt(loan.collateralLocked, 2) }}</text>
            <text class="metric-unit">GAS</text>
          </view>
          <view class="metric-card">
            <text class="metric-label">{{ t("currentLTV") }}</text>
            <text class="metric-value ltv">{{ currentLTV }}%</text>
            <text class="metric-unit">{{ t("maxLTV") }}: 66.7%</text>
          </view>
          <view class="metric-card">
            <text class="metric-label">{{ t("interestRate") }}</text>
            <text class="metric-value rate">{{ terms.interestRate }}%</text>
            <text class="metric-unit">APR</text>
          </view>
        </view>
      </view>

      <!-- Collateral Visualization -->
      <view class="card collateral-card">
        <text class="card-title">{{ t("collateralStatus") }}</text>
        <view class="collateral-visual">
          <view class="collateral-bar">
            <view class="collateral-fill" :style="{ width: collateralUtilization + '%' }">
              <text class="collateral-percent">{{ collateralUtilization }}%</text>
            </view>
          </view>
          <view class="collateral-info">
            <view class="info-row">
              <text class="info-label">{{ t("locked") }}:</text>
              <text class="info-value locked">{{ fmt(loan.collateralLocked, 2) }} GAS</text>
            </view>
            <view class="info-row">
              <text class="info-label">{{ t("available") }}:</text>
              <text class="info-value available">{{ fmt(terms.maxBorrow * 1.5 - loan.collateralLocked, 2) }} GAS</text>
            </view>
          </view>
        </view>
      </view>

      <!-- Borrow Section with LTV Slider -->
      <view class="card borrow-card">
        <text class="card-title">{{ t("takeSelfLoan") }}</text>

        <view class="input-section">
          <text class="input-label">{{ t("borrowAmount") }}</text>
          <uni-easyinput v-model="loanAmount" type="number" :placeholder="t('amountToBorrow')" />
        </view>

        <view class="ltv-section">
          <view class="ltv-header">
            <text class="ltv-label">{{ t("loanToValue") }}</text>
            <text :class="['ltv-value', getLTVClass()]">{{ calculatedLTV }}%</text>
          </view>
          <view class="ltv-bar">
            <view class="ltv-fill" :style="{ width: calculatedLTV + '%', background: getLTVColor() }"></view>
            <view class="ltv-marker safe" style="left: 50%"></view>
            <view class="ltv-marker warning" style="left: 66.7%"></view>
          </view>
          <view class="ltv-labels">
            <text class="ltv-min">0%</text>
            <text class="ltv-mid">50%</text>
            <text class="ltv-max">100%</text>
          </view>
        </view>

        <view class="calculation-grid">
          <view class="calc-row">
            <text class="calc-label">{{ t("collateralRequired") }}</text>
            <text class="calc-value collateral-req">{{ fmt(parseFloat(loanAmount || "0") * 1.5, 2) }} GAS</text>
          </view>
          <view class="calc-row">
            <text class="calc-label">{{ t("monthlyPayment") }}</text>
            <text class="calc-value payment">{{ fmt(parseFloat(loanAmount || "0") * 0.085, 3) }} GAS</text>
          </view>
          <view class="calc-row">
            <text class="calc-label">{{ t("totalRepayment") }}</text>
            <text class="calc-value total">{{ fmt(parseFloat(loanAmount || "0") * 1.02, 2) }} GAS</text>
          </view>
        </view>

        <view class="action-btn" @click="takeLoan">
          <text>{{ isLoading ? t("processing") : t("borrowNow") }}</text>
        </view>
        <text class="note">{{ t("note") }}</text>
      </view>
    </view>

    <!-- Stats Tab -->
    <view v-if="activeTab === 'stats'" class="tab-content scrollable">
      <view class="stats-card">
        <text class="stats-title">{{ t("statistics") }}</text>
        <view class="stat-row">
          <text class="stat-label">{{ t("totalLoans") }}</text>
          <text class="stat-value">{{ stats.totalLoans }}</text>
        </view>
        <view class="stat-row">
          <text class="stat-label">{{ t("totalBorrowed") }}</text>
          <text class="stat-value">{{ fmt(stats.totalBorrowed, 2) }} GAS</text>
        </view>
        <view class="stat-row">
          <text class="stat-label">{{ t("totalRepaid") }}</text>
          <text class="stat-value">{{ fmt(stats.totalRepaid, 2) }} GAS</text>
        </view>
        <view class="stat-row">
          <text class="stat-label">{{ t("avgLoanSize") }}</text>
          <text class="stat-value"
            >{{ stats.totalLoans > 0 ? fmt(stats.totalBorrowed / stats.totalLoans, 2) : 0 }} GAS</text
          >
        </view>
      </view>
      <view class="stats-card">
        <text class="stats-title">{{ t("loanHistory") }}</text>
        <view v-for="(item, idx) in loanHistory" :key="idx" class="history-item">
          <text>{{ item.icon }} {{ fmt(item.amount, 2) }} GAS - {{ item.timestamp }}</text>
        </view>
        <text v-if="loanHistory.length === 0" class="empty-text">{{ t("noHistory") }}</text>
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
import { formatNumber } from "@/shared/utils/format";
import { createT } from "@/shared/utils/i18n";
import AppLayout from "@/shared/components/AppLayout.vue";
import NeoDoc from "@/shared/components/NeoDoc.vue";

const translations = {
  title: { en: "Self Loan", zh: "自我贷款" },
  loanTerms: { en: "Loan Terms", zh: "贷款条款" },
  maxBorrow: { en: "Max borrow", zh: "最大借款" },
  interestRate: { en: "Interest rate", zh: "利率" },
  repayment: { en: "Repayment", zh: "还款" },
  yourLoan: { en: "Your Loan", zh: "你的贷款" },
  borrowed: { en: "Borrowed", zh: "已借款" },
  collateralLocked: { en: "Collateral locked", zh: "锁定抵押品" },
  nextPayment: { en: "Next payment", zh: "下次还款" },
  takeSelfLoan: { en: "Take Self-Loan", zh: "申请自我贷款" },
  amountToBorrow: { en: "Amount to borrow", zh: "借款金额" },
  collateralRequired: { en: "Collateral required (150%)", zh: "所需抵押品 (150%)" },
  monthlyPayment: { en: "Monthly payment", zh: "月供" },
  borrowNow: { en: "Borrow Now", zh: "立即借款" },
  processing: { en: "Processing...", zh: "处理中..." },
  note: { en: "Collateral locked for 12-month term. 0% liquidation risk.", zh: "抵押品锁定12个月。0%清算风险。" },
  enterAmount: { en: "Enter 1-{max}", zh: "请输入 1-{max}" },
  loanApproved: { en: "Loan approved: {amount} GAS borrowed", zh: "贷款批准：已借 {amount} GAS" },
  paymentFailed: { en: "Transaction failed", zh: "交易失败" },
  main: { en: "Borrow", zh: "借款" },
  stats: { en: "Stats", zh: "统计" },
  statistics: { en: "Statistics", zh: "统计数据" },
  totalLoans: { en: "Total Loans", zh: "总贷款数" },
  totalBorrowed: { en: "Total Borrowed", zh: "总借款额" },
  totalRepaid: { en: "Total Repaid", zh: "总还款额" },
  avgLoanSize: { en: "Avg Loan Size", zh: "平均贷款额" },
  loanHistory: { en: "Loan History", zh: "贷款历史" },
  noHistory: { en: "No history yet", zh: "暂无记录" },
  healthFactor: { en: "Health Factor", zh: "健康因子" },
  safe: { en: "Safe", zh: "安全" },
  warning: { en: "Warning", zh: "警告" },
  danger: { en: "Danger", zh: "危险" },
  currentLTV: { en: "Current LTV", zh: "当前 LTV" },
  maxLTV: { en: "Max LTV", zh: "最大 LTV" },
  collateralStatus: { en: "Collateral Status", zh: "抵押品状态" },
  locked: { en: "Locked", zh: "已锁定" },
  available: { en: "Available", zh: "可用" },
  borrowAmount: { en: "Borrow Amount", zh: "借款金额" },
  loanToValue: { en: "Loan-to-Value (LTV)", zh: "贷款价值比 (LTV)" },
  totalRepayment: { en: "Total Repayment", zh: "总还款" },
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
type Terms = { maxBorrow: number; interestRate: number; repaymentSchedule: string };
type Loan = { borrowed: number; collateralLocked: number; nextPayment: number; nextPaymentDue: string };

const docSteps = computed(() => [t("step1"), t("step2"), t("step3")]);
const docFeatures = computed(() => [
  { name: t("feature1Name"), desc: t("feature1Desc") },
  { name: t("feature2Name"), desc: t("feature2Desc") },
]);
const APP_ID = "miniapp-selfloan";
const { address, connect } = useWallet();
const { payGAS, isLoading } = usePayments(APP_ID);

const terms = ref<Terms>({ maxBorrow: 5000, interestRate: 8.5, repaymentSchedule: "Monthly" });
const loan = ref<Loan>({ borrowed: 0, collateralLocked: 0, nextPayment: 0, nextPaymentDue: "N/A" });
const loanAmount = ref<string>("");
const status = ref<Status | null>(null);

const stats = ref({ totalLoans: 0, totalBorrowed: 0, totalRepaid: 0 });
const loanHistory = ref<{ icon: string; amount: number; timestamp: string }[]>([]);

const fmt = (n: number, d = 2) => formatNumber(n, d);

// Computed properties for DeFi metrics
const healthFactor = computed(() => {
  if (loan.value.borrowed === 0) return 999;
  return (loan.value.collateralLocked / loan.value.borrowed) * 0.667;
});

const currentLTV = computed(() => {
  if (loan.value.collateralLocked === 0) return 0;
  return Math.round((loan.value.borrowed / loan.value.collateralLocked) * 100);
});

const calculatedLTV = computed(() => {
  const amount = parseFloat(loanAmount.value || "0");
  const collateral = amount * 1.5;
  if (collateral === 0) return 0;
  return Math.min(Math.round((amount / collateral) * 100), 100);
});

const collateralUtilization = computed(() => {
  const maxCollateral = terms.value.maxBorrow * 1.5;
  return Math.round((loan.value.collateralLocked / maxCollateral) * 100);
});

// Health factor methods
const getHealthStatus = () => {
  const hf = healthFactor.value;
  if (hf >= 2.0) return t("safe");
  if (hf >= 1.2) return t("warning");
  return t("danger");
};

const getHealthGradient = () => {
  const hf = healthFactor.value;
  if (hf >= 2.0) return "conic-gradient(var(--neo-green) 0% 75%, var(--bg-secondary) 75% 100%)";
  if (hf >= 1.5) return "conic-gradient(var(--brutal-yellow) 0% 50%, var(--bg-secondary) 50% 100%)";
  return "conic-gradient(var(--brutal-red) 0% 25%, var(--bg-secondary) 25% 100%)";
};

const getLTVClass = () => {
  const ltv = calculatedLTV.value;
  if (ltv <= 50) return "safe";
  if (ltv <= 66.7) return "warning";
  return "danger";
};

const getLTVColor = () => {
  const ltv = calculatedLTV.value;
  if (ltv <= 50) return "var(--neo-green)";
  if (ltv <= 66.7) return "var(--brutal-yellow)";
  return "var(--brutal-red)";
};

const takeLoan = async (): Promise<void> => {
  if (isLoading.value) return;
  const amount = parseFloat(loanAmount.value);
  if (!(amount > 0 && amount <= terms.value.maxBorrow)) {
    return void (status.value = {
      msg: t("enterAmount").replace("{max}", String(terms.value.maxBorrow)),
      type: "error",
    });
  }

  const collateral = amount * 1.5;

  try {
    // Lock collateral via smart contract
    const result = await payGAS(collateral, `self-loan:collateral:${amount}`);
    if (!result.success) {
      status.value = { msg: t("paymentFailed"), type: "error" };
      return;
    }

    // Update loan state
    loan.value.borrowed += amount;
    loan.value.collateralLocked += collateral;

    stats.value.totalLoans++;
    stats.value.totalBorrowed += amount;
    loanHistory.value.unshift({
      icon: "💰",
      amount,
      timestamp: new Date().toLocaleTimeString(),
    });
    if (loanHistory.value.length > 10) loanHistory.value.pop();

    status.value = { msg: t("loanApproved").replace("{amount}", fmt(amount, 2)), type: "success" };
  } catch (e) {
    status.value = { msg: t("paymentFailed"), type: "error" };
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
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
}

.status-msg {
  text-align: center;
  padding: $space-3;
  border: $border-width-md solid var(--border-color);
  box-shadow: $shadow-md;
  margin-bottom: $space-3;
  flex-shrink: 0;
  font-weight: $font-weight-bold;
  text-transform: uppercase;

  &.success {
    background: var(--status-success);
    color: $neo-black;
    border-color: $neo-black;
  }

  &.error {
    background: var(--status-error);
    color: $neo-white;
    border-color: $neo-black;
  }
}

// Position Summary Section
.position-summary {
  background: var(--bg-card);
  border: $border-width-md solid var(--border-color);
  box-shadow: $shadow-lg;
  padding: $space-4;
  margin-bottom: $space-3;
}

.health-section {
  margin-bottom: $space-4;
}

.section-label {
  display: block;
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
  color: var(--text-primary);
  margin-bottom: $space-3;
  text-transform: uppercase;
}

.health-gauge {
  display: flex;
  justify-content: center;
  margin-bottom: $space-3;
}

.gauge-circle {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: $border-width-md solid var(--border-color);
  box-shadow: $shadow-md;
}

.gauge-inner {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  background: var(--bg-secondary);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: $border-width-sm solid var(--border-color);
}

.gauge-value {
  font-size: $font-size-2xl;
  font-weight: $font-weight-black;
  color: var(--text-primary);
  line-height: 1;
}

.gauge-label {
  font-size: $font-size-xs;
  color: var(--text-secondary);
  margin-top: $space-1;
  text-transform: uppercase;
}

.health-legend {
  display: flex;
  justify-content: space-around;
  gap: $space-2;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: $space-1;
}

.legend-dot {
  width: 12px;
  height: 12px;
  border: $border-width-sm solid var(--border-color);

  &.safe {
    background: var(--neo-green);
  }

  &.warning {
    background: var(--brutal-yellow);
  }

  &.danger {
    background: var(--brutal-red);
  }
}

.legend-text {
  font-size: $font-size-xs;
  color: var(--text-secondary);
}

// Metrics Grid
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $space-3;
}

.metric-card {
  background: var(--bg-secondary);
  border: $border-width-sm solid var(--border-color);
  padding: $space-3;
  display: flex;
  flex-direction: column;
  gap: $space-1;
}

.metric-label {
  font-size: $font-size-xs;
  color: var(--text-secondary);
  text-transform: uppercase;
}

.metric-value {
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  line-height: 1;

  &.borrowed {
    color: var(--brutal-yellow);
  }

  &.collateral {
    color: var(--neo-green);
  }

  &.ltv {
    color: var(--brutal-blue);
  }

  &.rate {
    color: var(--text-primary);
  }
}

.metric-unit {
  font-size: $font-size-xs;
  color: var(--text-muted);
}

// Card Styles
.card {
  background: var(--bg-card);
  border: $border-width-md solid var(--border-color);
  box-shadow: $shadow-md;
  padding: $space-4;
  margin-bottom: $space-3;
}

.card-title {
  color: var(--neo-green);
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
  display: block;
  margin-bottom: $space-3;
  text-transform: uppercase;
}

// Collateral Card
.collateral-card {
  background: var(--bg-card);
}

.collateral-visual {
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.collateral-bar {
  height: 40px;
  background: var(--bg-secondary);
  border: $border-width-sm solid var(--border-color);
  position: relative;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
}

.collateral-fill {
  flex: 1;
  min-height: 0;
  background: var(--neo-green);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: width $transition-normal;
  border-right: $border-width-sm solid var(--border-color);
}

.collateral-percent {
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: $neo-black;
}

.collateral-info {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: $space-2;
  background: var(--bg-secondary);
  border: $border-width-sm solid var(--border-color);
}

.info-label {
  color: var(--text-secondary);
  font-size: $font-size-sm;
}

.info-value {
  font-weight: $font-weight-bold;
  font-size: $font-size-sm;

  &.locked {
    color: var(--brutal-yellow);
  }

  &.available {
    color: var(--neo-green);
  }
}

// Borrow Card
.borrow-card {
  background: var(--bg-card);
}

.input-section {
  margin-bottom: $space-4;
}

.input-label {
  display: block;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  color: var(--text-primary);
  margin-bottom: $space-2;
  text-transform: uppercase;
}

// LTV Section
.ltv-section {
  margin-bottom: $space-4;
  padding: $space-3;
  background: var(--bg-secondary);
  border: $border-width-sm solid var(--border-color);
}

.ltv-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $space-3;
}

.ltv-label {
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  color: var(--text-secondary);
  text-transform: uppercase;
}

.ltv-value {
  font-size: $font-size-xl;
  font-weight: $font-weight-black;

  &.safe {
    color: var(--neo-green);
  }

  &.warning {
    color: var(--brutal-yellow);
  }

  &.danger {
    color: var(--brutal-red);
  }
}

.ltv-bar {
  height: 24px;
  background: var(--bg-primary);
  border: $border-width-sm solid var(--border-color);
  position: relative;
  margin-bottom: $space-2;
  overflow: hidden;
}

.ltv-fill {
  flex: 1;
  min-height: 0;
  transition:
    width $transition-normal,
    background $transition-normal;
}

.ltv-marker {
  position: absolute;
  top: 0;
  width: 2px;
  flex: 1;
  min-height: 0;
  background: var(--border-color);
  z-index: 1;

  &.safe {
    background: var(--neo-green);
  }

  &.warning {
    background: var(--brutal-yellow);
  }
}

.ltv-labels {
  display: flex;
  justify-content: space-between;
  font-size: $font-size-xs;
  color: var(--text-muted);
}

.ltv-min,
.ltv-mid,
.ltv-max {
  font-weight: $font-weight-medium;
}

// Calculation Grid
.calculation-grid {
  display: flex;
  flex-direction: column;
  gap: $space-2;
  margin-bottom: $space-4;
}

.calc-row {
  display: flex;
  justify-content: space-between;
  padding: $space-3;
  background: var(--bg-secondary);
  border: $border-width-sm solid var(--border-color);
}

.calc-label {
  font-size: $font-size-sm;
  color: var(--text-secondary);
}

.calc-value {
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;

  &.collateral-req {
    color: var(--brutal-yellow);
  }

  &.payment {
    color: var(--neo-green);
  }

  &.total {
    color: var(--brutal-blue);
  }
}

.action-btn {
  background: var(--neo-green);
  color: $neo-black;
  padding: $space-4;
  border: $border-width-md solid $neo-black;
  box-shadow: $shadow-md;
  text-align: center;
  font-weight: $font-weight-bold;
  cursor: pointer;
  transition: transform $transition-fast;
  text-transform: uppercase;

  &:active {
    transform: translate(3px, 3px);
    box-shadow: none;
  }
}

.note {
  display: block;
  margin-top: $space-3;
  font-size: $font-size-sm;
  color: var(--text-secondary);
  text-align: center;
}

.stats-card {
  background: var(--bg-card);
  border: $border-width-md solid var(--border-color);
  box-shadow: $shadow-md;
  padding: $space-4;
  margin-bottom: $space-3;
}

.stats-title {
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
  color: var(--neo-green);
  margin-bottom: $space-3;
  display: block;
  text-transform: uppercase;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  padding: $space-2 0;
  border-bottom: $border-width-sm solid var(--border-color);
}

.stat-label {
  color: var(--text-secondary);
}

.stat-value {
  font-weight: $font-weight-bold;
  color: var(--text-primary);
}

.history-item {
  padding: $space-2 0;
  border-bottom: $border-width-sm solid var(--border-color);
}

.empty-text {
  color: var(--text-muted);
  text-align: center;
  padding: $space-4;
  font-weight: $font-weight-medium;
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
