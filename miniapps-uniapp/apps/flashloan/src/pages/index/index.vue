<template>
  <AppLayout  :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <!-- Main Tab -->
    <view v-if="activeTab === 'main'" class="tab-content">
      <view v-if="chainType === 'evm'" class="mb-4">
        <NeoCard variant="danger">
          <view class="flex flex-col items-center gap-2 py-1">
            <text class="text-center font-bold text-red-400">{{ t("wrongChain") }}</text>
            <text class="text-xs text-center opacity-80 text-white">{{ t("wrongChainMessage") }}</text>
            <NeoButton size="sm" variant="secondary" class="mt-2" @click="() => switchChain('neo-n3-mainnet')">{{ t("switchToNeo") }}</NeoButton>
          </view>
        </NeoCard>
      </view>

      <!-- Instruction Mode Banner -->
      <NeoCard variant="warning" class="mb-4 text-center">
        <text class="font-bold block text-glass-glow">{{ t("instructionMode") }}</text>
        <text class="text-xs opacity-80 text-glass">{{ t("instructionNote") }}</text>
      </NeoCard>

      <NeoCard v-if="status" :variant="status.type === 'error' ? 'danger' : 'erobo-neo'" class="mb-4 text-center">
        <text class="font-bold text-glass">{{ status.msg }}</text>
      </NeoCard>

      <LoanRequestForm
        v-model:loanId="loanIdInput"
        :loan-details="loanDetails"
        :is-loading="isLoading"
        :t="t as any"
        @lookup="lookupLoan"
      />
    </view>

    <!-- Stats Tab -->
    <view v-if="activeTab === 'stats'" class="tab-content scrollable">
      <NeoCard class="mb-4" variant="erobo">
        <FlowVisualization :t="t as any" />
      </NeoCard>

      <LiquidityPoolCard :pool-balance="poolBalance" :t="t as any" class="mb-4" />

      <SimulationStats :stats="stats" :t="t as any" />

      <RecentLoansTable :recent-loans="recentLoans" :t="t as any" />
    </view>

    <!-- Docs Tab -->
    <view v-if="activeTab === 'docs'" class="tab-content scrollable">
      <FlashloanDocs :t="t as any" :contract-address="contractAddress" />
    </view>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useWallet, useEvents } from "@neo/uniapp-sdk";
import { formatNumber, formatAddress } from "@/shared/utils/format";
import { parseInvokeResult, parseStackItem } from "@/shared/utils/neo";
import { createT } from "@/shared/utils/i18n";
import { AppLayout, NeoCard, NeoButton } from "@/shared/components";
import type { NavTab } from "@/shared/components/NavBar.vue";

import FlowVisualization from "./components/FlowVisualization.vue";
import LiquidityPoolCard from "./components/LiquidityPoolCard.vue";
import LoanRequestForm from "./components/LoanRequestForm.vue";
import SimulationStats from "./components/SimulationStats.vue";
import RecentLoansTable from "./components/RecentLoansTable.vue";
import FlashloanDocs from "./components/FlashloanDocs.vue";

const translations = {
  title: { en: "Flash Loan", zh: "闪电贷" },
  instructionMode: { en: "INSTRUCTIONAL MODE", zh: "教学模式" },
  instructionNote: {
    en: "Flash loans must be executed programmatically. Use this miniapp to monitor pool status and loan history.",
    zh: "闪电贷必须以程序方式执行。本应用仅用于监控池子状态与历史记录。",
  },
  flashLoanFlow: { en: "Flash Loan Flow", zh: "闪电贷流程" },
  borrow: { en: "Borrow", zh: "借款" },
  execute: { en: "Execute", zh: "执行" },
  repay: { en: "Repay", zh: "还款" },
  flowNote: { en: "All operations execute atomically in a single transaction", zh: "所有操作在单笔交易中原子化执行" },
  statusLookup: { en: "Loan Status Lookup", zh: "贷款状态查询" },
  loanId: { en: "Loan ID", zh: "贷款 ID" },
  loanIdPlaceholder: { en: "Enter loan ID", zh: "输入贷款 ID" },
  checkStatus: { en: "Check Status", zh: "查询状态" },
  checking: { en: "Checking...", zh: "查询中..." },
  statusLabel: { en: "Status", zh: "状态" },
  statusHint: { en: "Enter a loan ID to fetch its on-chain status.", zh: "输入贷款 ID 以查询链上状态。" },
  statusPending: { en: "Pending", zh: "待处理" },
  statusSuccess: { en: "Executed", zh: "已执行" },
  statusFailed: { en: "Failed", zh: "失败" },
  borrower: { en: "Borrower", zh: "借款人" },
  callbackContract: { en: "Callback Contract", zh: "回调合约" },
  callbackMethod: { en: "Callback Method", zh: "回调方法" },
  timestamp: { en: "Timestamp", zh: "时间" },
  amount: { en: "Amount", zh: "金额" },
  feeShort: { en: "Fee", zh: "手续费" },
  poolBalance: { en: "Pool Balance", zh: "池子余额" },
  poolBalanceNote: { en: "Available liquidity for flash loans", zh: "可用于闪电贷的流动性" },
  statistics: { en: "Loan Activity", zh: "贷款活动" },
  totalLoans: { en: "Loans Executed", zh: "已执行贷款" },
  totalVolume: { en: "Total Volume (GAS)", zh: "总交易量 (GAS)" },
  totalFees: { en: "Total Fees (GAS)", zh: "总手续费 (GAS)" },
  avgLoanSize: { en: "Avg Loan Size (GAS)", zh: "平均额度 (GAS)" },
  recentLoans: { en: "Recent Executions", zh: "最近执行" },
  noHistory: { en: "No executions yet", zh: "暂无执行记录" },
  loanStatusLoaded: { en: "Loan status loaded", zh: "贷款状态已加载" },
  loanNotFound: { en: "Loan not found", zh: "未找到该贷款" },
  invalidLoanId: { en: "Invalid loan ID", zh: "无效贷款 ID" },
  error: { en: "Error", zh: "错误" },
  main: { en: "Status", zh: "状态" },
  stats: { en: "Activity", zh: "活动" },
  docs: { en: "Learn", zh: "学习" },
  docSubtitle: { en: "Understanding Flash Loans", zh: "理解闪电贷" },
  docDescription: {
    en: "Flash loans enable uncollateralized borrowing with instant repayment in a single transaction. This miniapp is instructional only; real flash loans must be executed programmatically.",
    zh: "闪电贷支持无抵押借款，在单笔交易中即时还款。本应用仅用于教学，真实闪电贷需以程序方式执行。",
  },
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
  notAvailable: { en: "Unavailable", zh: "不可用" },
  wrongChain: { en: "Wrong Network", zh: "网络错误" },
  wrongChainMessage: { en: "This app requires Neo N3 network.", zh: "此应用需 Neo N3 网络。" },
  switchToNeo: { en: "Switch to Neo N3", zh: "切换到 Neo N3" },
};

const t = createT(translations);

const navTabs: NavTab[] = [
  { id: "main", icon: "wallet", label: t("main") },
  { id: "stats", icon: "chart", label: t("stats") },
  { id: "docs", icon: "book", label: t("docs") },
];

const activeTab = ref("main");

type LoanStatus = "pending" | "success" | "failed";

type LoanDetails = {
  id: string;
  borrower: string;
  amount: string;
  fee: string;
  callbackContract: string;
  callbackMethod: string;
  timestamp: string;
  status: LoanStatus;
};

type ExecutedLoan = {
  id: number;
  amount: number;
  fee: number;
  status: "success" | "failed";
  timestamp: string;
};

const APP_ID = "miniapp-flashloan";
const { chainType, switchChain, invokeRead, getContractAddress } = useWallet() as any;
const { list: listEvents } = useEvents();

const contractAddress = ref<string | null>(null);
const poolBalance = ref(0);
const loanIdInput = ref("");
const loanDetails = ref<LoanDetails | null>(null);
const stats = ref({ totalLoans: 0, totalVolume: 0, totalFees: 0 });
const recentLoans = ref<ExecutedLoan[]>([]);
const status = ref<{ msg: string; type: "success" | "error" } | null>(null);
const isLoading = ref(false);

const ensureContractAddress = async () => {
  if (!contractAddress.value) {
    contractAddress.value = await getContractAddress();
  }
  if (!contractAddress.value) throw new Error(t("error"));
  return contractAddress.value;
};

const toNumber = (value: unknown) => {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
};

const toGas = (value: unknown) => toNumber(value) / 1e8;

const formatGas = (value: number, decimals = 4) => formatNumber(value, decimals);

const formatTimestamp = (value: unknown) => {
  const ts = toNumber(value);
  if (!ts) return "N/A";
  return new Date(ts * 1000).toLocaleString();
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

const buildLoanDetails = (parsed: unknown, loanId: number): LoanDetails | null => {
  if (!Array.isArray(parsed) || parsed.length < 8) return null;
  const [borrower, amount, fee, callbackContract, callbackMethod, timestamp, executed, success] = parsed;
  const amountRaw = toNumber(amount);
  const feeRaw = toNumber(fee);
  const callbackMethodText = String(callbackMethod || "");
  const isEmpty = amountRaw === 0 && feeRaw === 0 && !callbackMethodText && !toNumber(timestamp);
  if (isEmpty) return null;

  const amountGas = toGas(amount);
  const feeGas = toGas(fee);
  const executedFlag = Boolean(executed);
  const statusValue: LoanStatus = executedFlag ? (Boolean(success) ? "success" : "failed") : "pending";

  return {
    id: String(loanId),
    borrower: formatAddress(String(borrower || "")),
    amount: formatGas(amountGas),
    fee: formatGas(feeGas),
    callbackContract: formatAddress(String(callbackContract || "")),
    callbackMethod: callbackMethodText || "--",
    timestamp: formatTimestamp(timestamp),
    status: statusValue,
  };
};

const lookupLoan = async () => {
  const loanId = Number(loanIdInput.value);
  if (!Number.isFinite(loanId) || loanId <= 0) {
    status.value = { msg: t("invalidLoanId"), type: "error" };
    return;
  }

  try {
    isLoading.value = true;
    const contract = await ensureContractAddress();
    const res = await invokeRead({
      contractAddress: contract,
      operation: "getLoan",
      args: [{ type: "Integer", value: String(loanId) }],
    });

    const parsed = parseInvokeResult(res);
    const details = buildLoanDetails(parsed, loanId);
    if (!details) {
      loanDetails.value = null;
      status.value = { msg: t("loanNotFound"), type: "error" };
      return;
    }

    loanDetails.value = details;
    status.value = { msg: t("loanStatusLoaded"), type: "success" };
  } catch (e: any) {
    status.value = { msg: e.message || t("error"), type: "error" };
  } finally {
    isLoading.value = false;
  }
};

const fetchPoolBalance = async () => {
  const contract = await ensureContractAddress();
  const res = await invokeRead({ contractAddress: contract, operation: "getPoolBalance" });
  poolBalance.value = toGas(parseInvokeResult(res));
};

const fetchLoanStats = async () => {
  const executedEvents = await listAllEvents("LoanExecuted");
  const loans: ExecutedLoan[] = executedEvents
    .map((evt) => {
      const values = Array.isArray(evt?.state) ? evt.state.map(parseStackItem) : [];
      const id = Number(values[0] || 0);
      const amount = toGas(values[2]);
      const fee = toGas(values[3]);
      const success = Boolean(values[4]);
      const timestamp = String(evt.created_at || "");
      if (!id) return null;
      return {
        id,
        amount,
        fee,
        status: success ? "success" : "failed",
        timestamp,
      } as ExecutedLoan;
    })
    .filter(Boolean) as ExecutedLoan[];

  const totalVolume = loans.reduce((sum, loan) => sum + loan.amount, 0);
  const totalFees = loans.reduce((sum, loan) => sum + loan.fee, 0);

  stats.value = {
    totalLoans: loans.length,
    totalVolume,
    totalFees,
  };

  recentLoans.value = loans
    .slice()
    .sort((a, b) => {
      const aTime = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const bTime = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return bTime - aTime;
    })
    .slice(0, 10);
};

const fetchData = async () => {
  try {
    await Promise.all([fetchPoolBalance(), fetchLoanStats()]);
  } catch (e) {
    console.warn("[Flashloan] Failed to fetch:", e);
  }
};

onMounted(() => fetchData());
watch(chainType, () => fetchData());
</script>

<style lang="scss" scoped>
@use "@/shared/styles/tokens.scss" as *;
@use "@/shared/styles/variables.scss";

.tab-content {
  padding: $space-4;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: $space-4;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.scrollable {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>
