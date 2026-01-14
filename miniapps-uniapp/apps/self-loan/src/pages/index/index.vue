<template>
  <AppLayout  :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <view v-if="chainType === 'evm'" class="px-4 mb-4">
      <NeoCard variant="danger">
        <view class="flex flex-col items-center gap-2 py-1">
          <text class="text-center font-bold text-red-400">{{ t("wrongChain") }}</text>
          <text class="text-xs text-center opacity-80 text-white">{{ t("wrongChainMessage") }}</text>
          <NeoButton size="sm" variant="secondary" class="mt-2" @click="() => switchChain('neo-n3-mainnet')">{{
            t("switchToNeo")
          }}</NeoButton>
        </view>
      </NeoCard>
    </view>

    <!-- Main Tab -->
    <view v-if="activeTab === 'main'" class="tab-content">
      <NeoCard v-if="status" :variant="status.type === 'error' ? 'danger' : 'success'" class="mb-4 text-center">
        <text class="font-bold">{{ status.msg }}</text>
      </NeoCard>

      <BorrowForm
        v-model="collateralAmount"
        :terms="terms"
        :is-loading="isLoading"
        :t="t as any"
        @takeLoan="takeLoan"
      />

      <CollateralStatus
        :loan="loan"
        :available-collateral="neoBalance"
        :collateral-utilization="collateralUtilization"
        :t="t as any"
      />

      <PositionSummary
        :loan="loan"
        :terms="terms"
        :health-factor="healthFactor"
        :current-l-t-v="currentLTV"
        :t="t as any"
      />
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
import { useWallet, useEvents } from "@neo/uniapp-sdk";
import { formatNumber } from "@/shared/utils/format";
import { addressToScriptHash, normalizeScriptHash, parseInvokeResult, parseStackItem } from "@/shared/utils/neo";
import { createT } from "@/shared/utils/i18n";
import { AppLayout, NeoDoc, NeoCard, NeoButton } from "@/shared/components";
import PositionSummary from "./components/PositionSummary.vue";
import CollateralStatus from "./components/CollateralStatus.vue";
import BorrowForm from "./components/BorrowForm.vue";
import StatsTab from "./components/StatsTab.vue";

const translations = {
  title: { en: "Self Loan", zh: "自我贷款" },
  loanTerms: { en: "Loan Terms", zh: "贷款条款" },
  maxBorrow: { en: "Borrow limit", zh: "借款上限" },
  yourLoan: { en: "Your Loan", zh: "你的贷款" },
  borrowed: { en: "Borrowed", zh: "已借款" },
  collateralLocked: { en: "Collateral locked", zh: "锁定抵押品" },
  takeSelfLoan: { en: "Take Self-Loan", zh: "申请自我贷款" },
  collateralAmount: { en: "Collateral Amount", zh: "抵押金额" },
  amountToLock: { en: "NEO to lock", zh: "锁定 NEO" },
  estimatedBorrow: { en: "Estimated Borrow", zh: "预计借款" },
  collateralRatio: { en: "Collateral ratio", zh: "抵押率" },
  minDuration: { en: "Minimum duration", zh: "最短期限" },
  hours: { en: "hours", zh: "小时" },
  borrowNow: { en: "Borrow Now", zh: "立即借款" },
  processing: { en: "Processing...", zh: "处理中..." },
  note: {
    en: "Collateral locks until repaid (min 24h). Fixed 20% LTV with no liquidation.",
    zh: "抵押品需还清后解锁（最短 24 小时）。固定 20% LTV，无清算。",
  },
  enterAmount: { en: "Enter 1-{max} NEO", zh: "请输入 1-{max} NEO" },
  loanApproved: { en: "Loan created: {amount} GAS borrowed", zh: "贷款已创建：已借 {amount} GAS" },
  paymentFailed: { en: "Transaction failed", zh: "交易失败" },
  contractUnavailable: { en: "Contract unavailable", zh: "合约不可用" },
  main: { en: "Borrow", zh: "借款" },
  stats: { en: "Stats", zh: "统计" },
  statistics: { en: "Statistics", zh: "统计数据" },
  totalLoans: { en: "Total Loans", zh: "总贷款数" },
  totalBorrowed: { en: "Total Borrowed", zh: "总借款额" },
  totalRepaid: { en: "Total Repaid", zh: "总还款额" },
  avgLoanSize: { en: "Avg Loan Size", zh: "平均贷款额" },
  loanHistory: { en: "Loan History", zh: "贷款历史" },
  noHistory: { en: "No history yet", zh: "暂无记录" },
  borrowedLabel: { en: "Borrowed", zh: "借款" },
  repaidLabel: { en: "Repaid", zh: "还款" },
  closedLabel: { en: "Closed", zh: "结清" },
  healthFactor: { en: "Health Factor", zh: "健康因子" },
  safe: { en: "Safe", zh: "安全" },
  warning: { en: "Warning", zh: "警告" },
  danger: { en: "Danger", zh: "危险" },
  currentLTV: { en: "Current LTV", zh: "当前 LTV" },
  maxLTV: { en: "Max LTV", zh: "最大 LTV" },
  collateralStatus: { en: "Collateral Status", zh: "抵押品状态" },
  locked: { en: "Locked", zh: "已锁定" },
  available: { en: "Available", zh: "可用" },
  loanToValue: { en: "Loan-to-Value (LTV)", zh: "贷款价值比 (LTV)" },
  docs: { en: "Docs", zh: "文档" },
  docSubtitle: {
    en: "Borrow against your own collateral with zero liquidation risk",
    zh: "用自己的抵押品借款，零清算风险",
  },
  docDescription: {
    en: "Self Loan lets you lock NEO collateral and borrow GAS at a fixed 20% LTV. Loans have a 24h minimum duration and can be repaid to unlock collateral.",
    zh: "Self Loan 让您锁定 NEO 抵押品并以固定 20% LTV 借入 GAS。贷款最短 24 小时，可还款解锁抵押品。",
  },
  step1: {
    en: "Connect your Neo wallet and check your available collateral",
    zh: "连接您的 Neo 钱包并查看可用抵押品",
  },
  step2: {
    en: "Enter the NEO collateral amount (borrow 20% of its value in GAS)",
    zh: "输入 NEO 抵押金额（可借出 20% 的 GAS）",
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
    en: "Repay anytime after 24 hours to unlock your collateral.",
    zh: "24 小时后可随时还款解锁抵押品。",
  },
  wrongChain: { en: "Wrong Chain", zh: "链错误" },
  wrongChainMessage: {
    en: "This app requires Neo N3. Please switch networks.",
    zh: "此应用需要 Neo N3 网络，请切换网络。",
  },
  switchToNeo: { en: "Switch to Neo N3", zh: "切换到 Neo N3" },
  insufficientNeo: { en: "Insufficient NEO balance", zh: "NEO 余额不足" },
  connectWallet: { en: "Please connect wallet", zh: "请连接钱包" },
  repayLoan: { en: "Repay Loan", zh: "还款" },
  repaying: { en: "Repaying...", zh: "还款中..." },
  repaySuccess: { en: "Loan repaid successfully", zh: "还款成功" },
  neoCollateral: { en: "NEO Collateral", zh: "NEO 抵押品" },
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
type Terms = { ltvPercent: number; minDurationHours: number };
type Loan = { borrowed: number; collateralLocked: number; active: boolean; id?: number | null };

const docSteps = computed(() => [t("step1"), t("step2"), t("step3"), t("step4")]);
const docFeatures = computed(() => [
  { name: t("feature1Name"), desc: t("feature1Desc") },
  { name: t("feature2Name"), desc: t("feature2Desc") },
]);
const APP_ID = "miniapp-self-loan";
const LTV_PERCENT = 20;
const MIN_DURATION_HOURS = 24;

const { address, connect, invokeContract, invokeRead, getBalance, chainType, switchChain, getContractAddress } =
  useWallet() as any;
const { list: listEvents } = useEvents();
const isLoading = ref(false);
const neoBalance = ref(0);
const contractAddress = ref<string | null>(null);

const ensureContractAddress = async () => {
  if (!contractAddress.value) {
    contractAddress.value = await getContractAddress();
  }
  if (!contractAddress.value) {
    throw new Error(t("contractUnavailable"));
  }
  return contractAddress.value;
};

const terms = computed<Terms>(() => ({ ltvPercent: LTV_PERCENT, minDurationHours: MIN_DURATION_HOURS }));
const loan = ref<Loan>({ borrowed: 0, collateralLocked: 0, active: false });
const collateralAmount = ref<string>("");
const status = ref<Status | null>(null);

const stats = ref({ totalLoans: 0, totalBorrowed: 0, totalRepaid: 0 });
const loanHistory = ref<{ icon: string; label: string; amount: number; timestamp: string }[]>([]);

const fmt = (n: number, d = 2) => formatNumber(n, d);
const toNumber = (value: unknown) => {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
};
const toGas = (value: unknown) => toNumber(value) / 1e8;

// Computed properties for DeFi metrics
const healthFactor = computed(() => {
  if (loan.value.borrowed === 0) return 999;
  return (loan.value.collateralLocked * (LTV_PERCENT / 100)) / loan.value.borrowed;
});

const currentLTV = computed(() => {
  if (loan.value.collateralLocked === 0) return 0;
  return Math.round((loan.value.borrowed / loan.value.collateralLocked) * 100);
});

const collateralUtilization = computed(() => {
  const total = loan.value.collateralLocked + neoBalance.value;
  if (total === 0) return 0;
  return Math.round((loan.value.collateralLocked / total) * 100);
});

const takeLoan = async (): Promise<void> => {
  if (isLoading.value) return;
  const collateral = Math.floor(parseFloat(collateralAmount.value));

  if (!(collateral > 0 && collateral <= neoBalance.value)) {
    return void (status.value = {
      msg: t("enterAmount").replace("{max}", String(Math.floor(neoBalance.value))),
      type: "error",
    });
  }

  // Check if user has enough NEO
  if (collateral > neoBalance.value) {
    status.value = { msg: t("insufficientNeo"), type: "error" };
    return;
  }

  isLoading.value = true;
  try {
    if (!address.value) {
      await connect();
    }
    if (!address.value) {
      throw new Error(t("connectWallet"));
    }

    const selfLoanAddress = await ensureContractAddress();
    await invokeContract({
      scriptHash: selfLoanAddress,
      operation: "createLoan",
      args: [
        { type: "Hash160", value: address.value },
        { type: "Integer", value: collateral }, // NEO is indivisible
      ],
    });

    const estimatedBorrow = (collateral * LTV_PERCENT) / 100;
    status.value = { msg: t("loanApproved").replace("{amount}", fmt(estimatedBorrow, 2)), type: "success" };
    collateralAmount.value = "";
    await fetchData();
  } catch (e: any) {
    status.value = { msg: e?.message || t("paymentFailed"), type: "error" };
  } finally {
    isLoading.value = false;
  }
};

const ownerMatches = (value: unknown) => {
  if (!address.value) return false;
  const val = String(value || "");
  if (val === address.value) return true;
  const normalized = normalizeScriptHash(val);
  const addrHash = addressToScriptHash(address.value);
  return Boolean(normalized && addrHash && normalized === addrHash);
};

const listAllEvents = async (eventName: string) => {
  const events: any[] = [];
  let afterId: string | undefined;
  let hasMore = true;
  while (hasMore) {
    const res = await listEvents({ app_id: APP_ID, event_name: eventName, limit: 50, after_id: afterId });
    events.push(...res.events);
    hasMore = Boolean(res.has_more && res.last_id);
    afterId = res.last_id || undefined;
  }
  return events;
};

const loadLoanPosition = async (loanId: number) => {
  const contract = await ensureContractAddress();
  const res = await invokeRead({
    contractAddress: contract,
    operation: "getLoan",
    args: [{ type: "Integer", value: String(loanId) }],
  });
  const parsed = parseInvokeResult(res);
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    const data = parsed as Record<string, unknown>;
    const collateral = toNumber(data.collateral);
    const debt = toGas(data.debt);
    const active = Boolean(data.active);
    loan.value = { borrowed: active ? debt : 0, collateralLocked: active ? collateral : 0, active, id: loanId };
    return;
  }
  loan.value = { borrowed: 0, collateralLocked: 0, active: false };
};

const loadHistory = async () => {
  if (!address.value) return;
  const [createdEvents, repaidEvents, closedEvents] = await Promise.all([
    listAllEvents("LoanCreated"),
    listAllEvents("LoanRepaid"),
    listAllEvents("LoanClosed"),
  ]);

  const created = createdEvents
    .map((evt) => {
      const values = Array.isArray(evt?.state) ? evt.state.map(parseStackItem) : [];
      return {
        id: Number(values[0] || 0),
        borrower: values[1],
        collateral: toNumber(values[2]),
        borrowed: toGas(values[3]),
        timestamp: evt.created_at,
        tx: evt.tx_hash,
      };
    })
    .filter((entry) => entry.id > 0 && ownerMatches(entry.borrower));

  const loanIds = new Set(created.map((entry) => entry.id));

  const repaid = repaidEvents
    .map((evt) => {
      const values = Array.isArray(evt?.state) ? evt.state.map(parseStackItem) : [];
      return {
        id: Number(values[0] || 0),
        repaid: toGas(values[1]),
        timestamp: evt.created_at,
        tx: evt.tx_hash,
      };
    })
    .filter((entry) => loanIds.has(entry.id));

  const closed = closedEvents
    .map((evt) => {
      const values = Array.isArray(evt?.state) ? evt.state.map(parseStackItem) : [];
      return {
        id: Number(values[0] || 0),
        borrower: values[1],
        timestamp: evt.created_at,
        tx: evt.tx_hash,
      };
    })
    .filter((entry) => loanIds.has(entry.id) || ownerMatches(entry.borrower));

  stats.value = {
    totalLoans: created.length,
    totalBorrowed: created.reduce((sum, entry) => sum + entry.borrowed, 0),
    totalRepaid: repaid.reduce((sum, entry) => sum + entry.repaid, 0),
  };

  const history = [
    ...created.map((entry) => ({
      icon: "💰",
      label: t("borrowedLabel"),
      amount: entry.borrowed,
      timestampRaw: entry.timestamp,
    })),
    ...repaid.map((entry) => ({
      icon: "↩️",
      label: t("repaidLabel"),
      amount: entry.repaid,
      timestampRaw: entry.timestamp,
    })),
    ...closed.map((entry) => ({
      icon: "✅",
      label: t("closedLabel"),
      amount: 0,
      timestampRaw: entry.timestamp,
    })),
  ].sort((a, b) => new Date(b.timestampRaw || 0).getTime() - new Date(a.timestampRaw || 0).getTime());

  loanHistory.value = history.slice(0, 20).map((item) => ({
    icon: item.icon,
    label: item.label,
    amount: item.amount,
    timestamp: new Date(item.timestampRaw || Date.now()).toLocaleString(),
  }));

  if (created.length > 0) {
    const latest = created.reduce((max, entry) => (entry.id > max ? entry.id : max), 0);
    await loadLoanPosition(latest);
  } else {
    loan.value = { borrowed: 0, collateralLocked: 0, active: false };
  }
};

const fetchData = async () => {
  try {
    if (!address.value) {
      await connect();
    }
    if (!address.value) return;

    const neo = await getBalance("NEO");
    neoBalance.value = typeof neo === "string" ? parseFloat(neo) || 0 : typeof neo === "number" ? neo : 0;

    await loadHistory();
  } catch (e) {
    console.warn("[SelfLoan] Failed to fetch data:", e);
  }
};

onMounted(() => {
  fetchData();
});
</script>

<style lang="scss" scoped>
@use "@/shared/styles/tokens.scss" as *;
@use "@/shared/styles/variables.scss";

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
