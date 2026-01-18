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
import { useI18n } from "@/composables/useI18n";
import { AppLayout, NeoDoc, NeoCard, NeoButton } from "@/shared/components";
import PositionSummary from "./components/PositionSummary.vue";
import CollateralStatus from "./components/CollateralStatus.vue";
import BorrowForm from "./components/BorrowForm.vue";
import StatsTab from "./components/StatsTab.vue";


const { t } = useI18n();

const navTabs = computed(() => [
  { id: "main", icon: "wallet", label: t("main") },
  { id: "stats", icon: "chart", label: t("stats") },
  { id: "docs", icon: "book", label: t("docs") },
]);

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
const LTV_TIER = 1;
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
        { type: "Integer", value: LTV_TIER },
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
  } catch {
  }
};

onMounted(() => {
  fetchData();
});
</script>

<style lang="scss" scoped>
@use "@/shared/styles/tokens.scss" as *;
@use "@/shared/styles/variables.scss";

$checkbook-bg: #fdfbf7;
$checkbook-line: #b0c4de;
$checkbook-text: #2f4f4f;
$checkbook-acc: #4682b4;

:global(page) {
  background: $checkbook-bg;
  font-family: 'Courier New', Courier, monospace;
}

.tab-content {
  padding: 16px;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  background-color: $checkbook-bg;
  background-image: repeating-linear-gradient(transparent, transparent 19px, $checkbook-line 20px);
  background-attachment: local;
}

/* Checkbook Component Overrides */
:deep(.neo-card) {
  background: white !important;
  border: 1px solid $checkbook-line !important;
  border-radius: 2px !important;
  box-shadow: 2px 2px 5px rgba(0,0,0,0.1) !important;
  color: $checkbook-text !important;
  font-family: 'Courier New', Courier, monospace !important;
  margin-bottom: 20px !important;
  
  &.variant-danger {
    border-color: #ffcccb !important;
    background: #fff5f5 !important;
  }
}

:deep(.neo-button) {
  border-radius: 4px !important;
  font-family: 'Courier New', Courier, monospace !important;
  font-weight: 700 !important;
  text-transform: capitalize !important;
  letter-spacing: 0 !important;
  
  &.variant-primary {
    background: $checkbook-acc !important;
    color: white !important;
    border: none !important;
    
    &:active {
      opacity: 0.8;
    }
  }
}

:deep(input), :deep(.neo-input) {
  font-family: 'Courier New', Courier, monospace !important;
  border: none !important;
  border-bottom: 1px solid $checkbook-line !important;
  background: transparent !important;
  border-radius: 0 !important;
  padding-left: 0 !important;
  color: $checkbook-text !important;
  
  &:focus {
    border-bottom: 2px solid $checkbook-acc !important;
    box-shadow: none !important;
  }
}

:deep(.text-center) {
  text-align: center;
}

:deep(.font-bold) {
  font-weight: bold;
}

.scrollable {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>
