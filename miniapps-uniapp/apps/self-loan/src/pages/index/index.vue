<template>
  <AppLayout :title="t('title')" show-top-nav :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <!-- Main Tab -->
    <view v-if="activeTab === 'main'" class="tab-content">
      <NeoCard v-if="status" :variant="status.type === 'error' ? 'danger' : 'success'" class="mb-4 text-center">
        <text class="font-bold">{{ status.msg }}</text>
      </NeoCard>

      <PositionSummary
        :loan="loan"
        :terms="terms"
        :health-factor="healthFactor"
        :current-l-t-v="currentLTV"
        :t="t as any"
      />

      <CollateralStatus :loan="loan" :terms="terms" :collateral-utilization="collateralUtilization" :t="t as any" />

      <BorrowForm v-model="loanAmount" :terms="terms" :is-loading="isLoading" :t="t as any" @takeLoan="takeLoan" />
    </view>

    <!-- Stats Tab -->
    <StatsTab v-if="activeTab === 'stats'" :stats="stats" :loan-history="loanHistory" :t="t as any" />

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
import { AppLayout, NeoDoc, NeoCard } from "@/shared/components";
import PositionSummary from "./components/PositionSummary.vue";
import CollateralStatus from "./components/CollateralStatus.vue";
import BorrowForm from "./components/BorrowForm.vue";
import StatsTab from "./components/StatsTab.vue";

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
  docSubtitle: {
    en: "Borrow against your own collateral with zero liquidation risk",
    zh: "用自己的抵押品借款，零清算风险",
  },
  docDescription: {
    en: "Self Loan lets you borrow GAS against your own collateral with no liquidation risk. Lock your assets as collateral, borrow up to 66% of their value, and repay on your own schedule.",
    zh: "Self Loan 让您用自己的抵押品借入 GAS，无清算风险。锁定您的资产作为抵押品，借入最高 66% 的价值，按自己的时间表还款。",
  },
  step1: {
    en: "Connect your Neo wallet and check your available collateral",
    zh: "连接您的 Neo 钱包并查看可用抵押品",
  },
  step2: {
    en: "Enter the amount you want to borrow (up to 66% of collateral value)",
    zh: "输入您想借入的金额（最高为抵押品价值的 66%）",
  },
  step3: {
    en: "Lock your collateral and receive borrowed GAS instantly",
    zh: "锁定您的抵押品并立即收到借入的 GAS",
  },
  step4: {
    en: "Repay the loan anytime to unlock your collateral",
    zh: "随时还款以解锁您的抵押品",
  },
  feature1Name: { en: "Zero Liquidation", zh: "零清算" },
  feature1Desc: {
    en: "Your collateral is never at risk - no forced liquidations regardless of market conditions.",
    zh: "您的抵押品永远不会有风险 - 无论市场条件如何都不会强制清算。",
  },
  feature2Name: { en: "Flexible Repayment", zh: "灵活还款" },
  feature2Desc: {
    en: "Repay on your own schedule with low fixed interest rates.",
    zh: "按自己的时间表还款，享受低固定利率。",
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
type Terms = { maxBorrow: number; interestRate: number; repaymentSchedule: string };
type Loan = { borrowed: number; collateralLocked: number; nextPayment: number; nextPaymentDue: string };

const docSteps = computed(() => [t("step1"), t("step2"), t("step3"), t("step4")]);
const docFeatures = computed(() => [
  { name: t("feature1Name"), desc: t("feature1Desc") },
  { name: t("feature2Name"), desc: t("feature2Desc") },
]);
const APP_ID = "miniapp-self-loan";
const CONTRACT_HASH = "0x1234567890abcdef1234567890abcdef12345678"; // TODO: Update with deployed contract hash
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

const collateralUtilization = computed(() => {
  const maxCollateral = terms.value.maxBorrow * 1.5;
  return Math.round((loan.value.collateralLocked / maxCollateral) * 100);
});

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
    const result = await payGAS(collateral.toString(), `self-loan:collateral:${amount}`);
    if (!result) {
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
    loanAmount.value = "";
  } catch (e) {
    status.value = { msg: t("paymentFailed"), type: "error" };
  }
};

// Fetch user's loan data from smart contract
const fetchData = async () => {
  if (!address.value) return;

  try {
    const sdk = await import("@neo/uniapp-sdk").then((m) => m.waitForSDK?.() || null);
    if (!sdk?.invoke) {
      console.warn("[SelfLoan] SDK not available");
      return;
    }

    // Get total loans count from contract
    const totalResult = await sdk.invoke("invokeRead", {
      contract: CONTRACT_HASH,
      method: "TotalLoans",
      args: [],
    });

    const totalLoans = parseInt(totalResult?.stack?.[0]?.value || "0");

    // Find user's active loan
    for (let i = 1; i <= totalLoans; i++) {
      const loanResult = await sdk.invoke("invokeRead", {
        contract: CONTRACT_HASH,
        method: "GetLoan",
        args: [{ type: "Integer", value: i.toString() }],
      });

      if (loanResult?.stack?.[0]) {
        const loanData = loanResult.stack[0].value;
        const borrower = loanData?.borrower;
        const isActive = loanData?.active === true;

        if (borrower === address.value && isActive) {
          const collateral = parseInt(loanData?.collateral || "0");
          const debt = parseInt(loanData?.debt || "0") / 1e8;

          loan.value = {
            borrowed: debt,
            collateralLocked: collateral,
            nextPayment: debt * 0.1,
            nextPaymentDue: "Monthly",
          };
          break;
        }
      }
    }
  } catch (e) {
    console.warn("[SelfLoan] Failed to fetch data:", e);
  }
};

onMounted(() => {
  fetchData();
});
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

.scrollable {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>
