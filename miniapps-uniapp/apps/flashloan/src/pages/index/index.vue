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
import { useI18n } from "@/composables/useI18n";
import { AppLayout, NeoCard, NeoButton } from "@/shared/components";
import type { NavTab } from "@/shared/components/NavBar.vue";

import FlowVisualization from "./components/FlowVisualization.vue";
import LiquidityPoolCard from "./components/LiquidityPoolCard.vue";
import LoanRequestForm from "./components/LoanRequestForm.vue";
import SimulationStats from "./components/SimulationStats.vue";
import RecentLoansTable from "./components/RecentLoansTable.vue";
import FlashloanDocs from "./components/FlashloanDocs.vue";


const { t } = useI18n();

const navTabs = computed<NavTab[]>(() => [
  { id: "main", icon: "wallet", label: t("main") },
  { id: "stats", icon: "chart", label: t("stats") },
  { id: "docs", icon: "book", label: t("docs") },
]);

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
  if (!ts) return t("notAvailable");
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
    callbackMethod: callbackMethodText || t("notAvailable"),
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
  } catch {
  }
};

onMounted(() => fetchData());
watch(chainType, () => fetchData());
</script>

<style lang="scss" scoped>
@use "@/shared/styles/tokens.scss" as *;
@use "@/shared/styles/variables.scss";

$volt-bg: #0a0a0a;
$volt-blue: #2563eb;
$volt-yellow: #facc15;
$volt-cyan: #06b6d4;
$volt-text: #e5e5e5;

:global(page) {
  background: $volt-bg;
}

.tab-content {
  padding: 24px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
  background: radial-gradient(circle at 50% 10%, #1e1e1e 0%, #000 100%);
  min-height: 100vh;
  position: relative;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;

  /* Circuit Line Overlay */
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: 
      linear-gradient(rgba(37, 99, 235, 0.1) 1px, transparent 1px),
      linear-gradient(90deg, rgba(37, 99, 235, 0.1) 1px, transparent 1px);
    background-size: 50px 50px;
    z-index: 10;
    pointer-events: none;
  }
}

/* High Voltage Component Overrides */
:deep(.neo-card) {
  background: rgba(15, 23, 42, 0.8) !important;
  border: 1px solid rgba(6, 182, 212, 0.3) !important;
  box-shadow: 0 0 15px rgba(6, 182, 212, 0.1) !important;
  border-radius: 8px !important;
  color: $volt-text !important;
  backdrop-filter: blur(8px);
  
  &.variant-warning {
    background: rgba(234, 179, 8, 0.1) !important;
    border-color: $volt-yellow !important;
    color: $volt-yellow !important;
    box-shadow: 0 0 20px rgba(250, 204, 21, 0.2) !important;
  }
}

:deep(.neo-button) {
  border-radius: 4px !important;
  font-family: 'Consolas', 'Monaco', monospace !important;
  text-transform: uppercase;
  font-weight: 700 !important;
  letter-spacing: 0.05em;
  
  &.variant-primary {
    background: linear-gradient(90deg, $volt-blue 0%, $volt-cyan 100%) !important;
    color: #fff !important;
    box-shadow: 0 0 15px rgba(37, 99, 235, 0.5) !important;
    
    &:active {
      transform: scale(0.98);
      box-shadow: 0 0 5px rgba(37, 99, 235, 0.5) !important;
    }
  }
}

.text-glass-glow {
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
  color: #fff;
}

.scrollable {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>
