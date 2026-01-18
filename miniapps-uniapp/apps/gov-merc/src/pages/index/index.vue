<template>
  <AppLayout  :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <!-- Rent Tab -->
    <view v-if="activeTab === 'rent'" class="tab-content">
      <view v-if="chainType === 'evm'" class="mb-4">
        <NeoCard variant="danger">
          <view class="flex flex-col items-center gap-2 py-1">
            <text class="text-center font-bold text-red-400">{{ t("wrongChain") }}</text>
            <text class="text-xs text-center opacity-80 text-white">{{ t("wrongChainMessage") }}</text>
            <NeoButton size="sm" variant="secondary" class="mt-2" @click="() => switchChain('neo-n3-mainnet')">{{ t("switchToNeo") }}</NeoButton>
          </view>
        </NeoCard>
      </view>

      <NeoCard v-if="status" :variant="status.type === 'error' ? 'danger' : 'success'" class="mb-4 text-center">
        <text class="status-text font-bold uppercase tracking-wider">{{ status.msg }}</text>
      </NeoCard>

      <NeoCard class="mb-6" variant="erobo">
        <view class="form-group-neo">
          <NeoInput v-model="depositAmount" type="number" placeholder="0" suffix="NEO" :label="t('depositAmount')" />
          <NeoButton variant="primary" size="lg" block :loading="isBusy" @click="depositNeo">
            {{ isBusy ? t("depositNeo") : t("depositNeo") }}
          </NeoButton>
        </view>
      </NeoCard>

      <NeoCard class="mb-6" variant="erobo">
        <view class="form-group-neo">
          <NeoInput
            v-model="withdrawAmount"
            type="number"
            placeholder="0"
            suffix="NEO"
            :label="t('withdrawAmount')"
          />
          <NeoButton variant="secondary" size="lg" block :loading="isBusy" @click="withdrawNeo">
            {{ isBusy ? t("withdrawNeo") : t("withdrawNeo") }}
          </NeoButton>
        </view>
      </NeoCard>
    </view>

    <!-- Market Tab -->
    <view v-if="activeTab === 'market'" class="tab-content">
      <view v-if="chainType === 'evm'" class="mb-4">
        <NeoCard variant="danger">
          <view class="flex flex-col items-center gap-2 py-1">
            <text class="text-center font-bold text-red-400">{{ t("wrongChain") }}</text>
            <text class="text-xs text-center opacity-80 text-white">{{ t("wrongChainMessage") }}</text>
            <NeoButton size="sm" variant="secondary" class="mt-2" @click="() => switchChain('neo-n3-mainnet')">{{ t("switchToNeo") }}</NeoButton>
          </view>
        </NeoCard>
      </view>
      <NeoCard variant="erobo" class="mb-6">
        <view class="form-group-neo">
          <NeoInput v-model="bidAmount" type="number" placeholder="0" suffix="GAS" :label="t('bidAmount')" />
          <NeoButton variant="primary" size="lg" block :loading="isBusy" @click="placeBid">
            {{ isBusy ? t("placeBid") : t("placeBid") }}
          </NeoButton>
        </view>
      </NeoCard>

      <NeoCard variant="erobo">
        <view v-if="bids.length === 0" class="empty-neo text-center p-8 opacity-60 uppercase font-bold">
          {{ t("noBids") }}
        </view>
        <view v-for="bid in bids" :key="bid.address" class="bid-row">
          <view class="bid-address">{{ bid.address }}</view>
          <view class="bid-amount">{{ formatNum(bid.amount, 2) }} GAS</view>
        </view>
      </NeoCard>
    </view>
    
    <!-- Stats Tab -->
    <view v-if="activeTab === 'stats'" class="tab-content">
      <NeoCard variant="erobo-neo">
        <NeoStats :stats="poolStats" />
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
import { ref, computed, onMounted, watch } from "vue";
import { useWallet, usePayments, useEvents } from "@neo/uniapp-sdk";
import { useI18n } from "@/composables/useI18n";
import { formatNumber } from "@/shared/utils/format";
import { addressToScriptHash, normalizeScriptHash, parseInvokeResult, parseStackItem } from "@/shared/utils/neo";
import { AppLayout, NeoDoc, NeoButton, NeoInput, NeoCard, NeoStats } from "@/shared/components";
import type { StatItem } from "@/shared/components/NeoStats.vue";


const { t } = useI18n();

const navTabs = computed(() => [
  { id: "rent", icon: "wallet", label: t("rent") },
  { id: "market", icon: "cart", label: t("market") },
  { id: "stats", icon: "chart", label: t("tabStats") },
  { id: "docs", icon: "book", label: t("docs") },
]);

const activeTab = ref("rent");

const docSteps = computed(() => [t("step1"), t("step2"), t("step3"), t("step4")]);
const docFeatures = computed(() => [
  { name: t("feature1Name"), desc: t("feature1Desc") },
  { name: t("feature2Name"), desc: t("feature2Desc") },
]);
const APP_ID = "miniapp-gov-merc";
const { address, connect, invokeContract, invokeRead, chainType, switchChain, getContractAddress } = useWallet() as any;
const { list: listEvents } = useEvents();
const { payGAS, isLoading } = usePayments(APP_ID);
const contractAddress = ref<string | null>(null);

const depositAmount = ref("");
const withdrawAmount = ref("");
const bidAmount = ref("");
const totalPool = ref(0);
const currentEpoch = ref(0);
const userDeposits = ref(0);
const bids = ref<{ address: string; amount: number }[]>([]);
const status = ref<{ msg: string; type: string } | null>(null);
const dataLoading = ref(false);

const isBusy = computed(() => isLoading.value || dataLoading.value);

const formatNum = (n: number, d = 2) => formatNumber(n, d);
const toGas = (value: unknown) => {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? num / 1e8 : 0;
};

const ensureContractAddress = async () => {
  if (!contractAddress.value) {
    contractAddress.value = await getContractAddress();
  }
  if (!contractAddress.value) {
    throw new Error(t("error"));
  }
  return contractAddress.value;
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

const poolStats = computed<StatItem[]>(() => [
  { label: t("totalPool"), value: `${formatNum(totalPool.value, 0)} NEO`, variant: "success" },
  { label: t("currentEpoch"), value: currentEpoch.value, variant: "default" },
  { label: t("yourDeposits"), value: `${formatNum(userDeposits.value, 0)} NEO`, variant: "accent" },
]);

const fetchPoolData = async () => {
  const contract = await ensureContractAddress();
  const [poolRes, epochRes] = await Promise.all([
    invokeRead({ contractAddress: contract, operation: "totalPool" }),
    invokeRead({ contractAddress: contract, operation: "getCurrentEpochId" }),
  ]);
  totalPool.value = Number(parseInvokeResult(poolRes) || 0);
  currentEpoch.value = Number(parseInvokeResult(epochRes) || 0);
};

const fetchUserDeposits = async () => {
  if (!address.value) return;
  const deposits = await listAllEvents("MercDeposit");
  const total = deposits.reduce((sum, evt) => {
    const values = Array.isArray(evt?.state) ? evt.state.map(parseStackItem) : [];
    if (!ownerMatches(values[0])) return sum;
    const amount = Number(values[1] || 0);
    return sum + amount;
  }, 0);
  userDeposits.value = total;
};

const fetchBids = async () => {
  const bidEvents = await listAllEvents("BidPlaced");
  const epoch = currentEpoch.value;
  const map = new Map<string, number>();
  bidEvents.forEach((evt) => {
    const values = Array.isArray(evt?.state) ? evt.state.map(parseStackItem) : [];
    const eventEpoch = Number(values[0] || 0);
    const candidate = String(values[1] || "");
    const amount = toGas(values[2]);
    if (eventEpoch !== epoch || !candidate) return;
    map.set(candidate, (map.get(candidate) || 0) + amount);
  });
  bids.value = Array.from(map.entries())
    .map(([addr, amount]) => ({ address: addr, amount }))
    .sort((a, b) => b.amount - a.amount);
};

const fetchData = async () => {
  try {
    dataLoading.value = true;
    await fetchPoolData();
    await fetchUserDeposits();
    await fetchBids();
  } catch {
  } finally {
    dataLoading.value = false;
  }
};

const depositNeo = async () => {
  if (isBusy.value) return;
  const amount = Math.floor(parseFloat(depositAmount.value));
  if (!(amount > 0)) {
    status.value = { msg: t("enterAmount"), type: "error" };
    return;
  }
  try {
    if (!address.value) await connect();
    if (!address.value) throw new Error(t("error"));
    const contract = await ensureContractAddress();
    await invokeContract({
      scriptHash: contract,
      operation: "depositNeo",
      args: [
        { type: "Hash160", value: address.value },
        { type: "Integer", value: amount },
      ],
    });
    status.value = { msg: t("depositSuccess"), type: "success" };
    depositAmount.value = "";
    await fetchData();
  } catch (e: any) {
    status.value = { msg: e.message || t("error"), type: "error" };
  }
};

const withdrawNeo = async () => {
  if (isBusy.value) return;
  const amount = Math.floor(parseFloat(withdrawAmount.value));
  if (!(amount > 0)) {
    status.value = { msg: t("enterAmount"), type: "error" };
    return;
  }
  try {
    if (!address.value) await connect();
    if (!address.value) throw new Error(t("error"));
    const contract = await ensureContractAddress();
    await invokeContract({
      scriptHash: contract,
      operation: "withdrawNeo",
      args: [
        { type: "Hash160", value: address.value },
        { type: "Integer", value: amount },
      ],
    });
    status.value = { msg: t("withdrawSuccess"), type: "success" };
    withdrawAmount.value = "";
    await fetchData();
  } catch (e: any) {
    status.value = { msg: e.message || t("error"), type: "error" };
  }
};

const toFixed8 = (value: string) => {
  const num = Number.parseFloat(value);
  if (!Number.isFinite(num)) return "0";
  return Math.floor(num * 1e8).toString();
};

const placeBid = async () => {
  if (isBusy.value) return;
  const amount = parseFloat(bidAmount.value);
  if (!(amount > 0)) {
    status.value = { msg: t("enterAmount"), type: "error" };
    return;
  }
  try {
    if (!address.value) await connect();
    if (!address.value) throw new Error(t("error"));
    const contract = await ensureContractAddress();
    const payment = await payGAS(bidAmount.value, `bid:${currentEpoch.value}`);
    const receiptId = payment.receipt_id;
    if (!receiptId) throw new Error(t("receiptMissing"));
    await invokeContract({
      scriptHash: contract,
      operation: "placeBid",
      args: [
        { type: "Hash160", value: address.value },
        { type: "Integer", value: toFixed8(bidAmount.value) },
        { type: "Integer", value: receiptId },
      ],
    });
    status.value = { msg: t("bidSuccess"), type: "success" };
    bidAmount.value = "";
    await fetchData();
  } catch (e: any) {
    status.value = { msg: e.message || t("error"), type: "error" };
  }
};

onMounted(() => fetchData());
watch(address, () => fetchData());
</script>

<style lang="scss" scoped>
@use "@/shared/styles/tokens.scss" as *;
@use "@/shared/styles/variables.scss";

$bar-bg: #100010;
$bar-neon-pink: #ff007f;
$bar-neon-blue: #00f3ff;
$bar-dark: #1a1a2e;
$bar-grid: rgba(255, 0, 127, 0.1);

:global(page) {
  background: $bar-bg;
}

.tab-content {
  padding: 24px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
  background-color: $bar-bg;
  /* Cyberpunk Grid Floor + Fog */
  background-image: 
    linear-gradient(to bottom, transparent 80%, rgba(255,0,127,0.2) 100%),
    linear-gradient(rgba(255,0,127,0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,0,127,0.1) 1px, transparent 1px);
  background-size: 100% 100%, 40px 40px, 40px 40px;
  min-height: 100vh;
}

/* Merc Component Overrides */
:deep(.neo-card) {
  background: rgba(10, 5, 20, 0.9) !important;
  border: 1px solid $bar-neon-blue !important;
  border-left: 4px solid $bar-neon-pink !important;
  border-radius: 4px !important;
  box-shadow: 0 0 15px rgba(255, 0, 127, 0.2), inset 0 0 30px rgba(0, 243, 255, 0.05) !important;
  color: #fff !important;
  transform: skewX(-2deg);
  
  &.variant-danger {
    border-color: #ff3333 !important;
    background: rgba(30,0,0,0.9) !important;
  }
}

:deep(.neo-button) {
  transform: skewX(-10deg);
  text-transform: uppercase;
  font-weight: 800 !important;
  letter-spacing: 0.15em;
  font-style: italic;
  
  &.variant-primary {
    background: linear-gradient(90deg, $bar-neon-pink, #9900ff) !important;
    color: #fff !important;
    border: none !important;
    box-shadow: 5px 5px 0 rgba(0, 243, 255, 0.5) !important;
    
    &:active {
      transform: skewX(-10deg) translate(2px, 2px);
      box-shadow: 3px 3px 0 rgba(0, 243, 255, 0.5) !important;
    }
  }
  
  &.variant-secondary {
    background: transparent !important;
    border: 2px solid $bar-neon-blue !important;
    color: $bar-neon-blue !important;
    box-shadow: 0 0 10px rgba(0, 243, 255, 0.3) !important;
  }
  
  /* Un-skew text */
  & > view, & > text {
    transform: skewX(10deg);
    display: inline-block;
  }
}

:deep(.neo-input) {
  background: rgba(0,0,0,0.5) !important;
  border: 1px solid $bar-neon-pink !important;
  border-radius: 0 !important;
  font-family: 'Courier New', monospace !important;
  color: $bar-neon-blue !important;
}

.form-group-neo {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.empty-neo {
  font-family: 'Courier New', monospace;
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  color: $bar-neon-blue;
  text-align: center;
  text-shadow: 0 0 5px $bar-neon-blue;
  padding: 32px;
}

.bid-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px dotted rgba(255, 0, 127, 0.3);
}
.bid-address {
  font-family: 'Courier New', monospace;
  font-size: 10px;
  color: #ccc;
}
.bid-amount {
  font-family: 'Courier New', monospace;
  font-weight: 700;
  color: $bar-neon-pink;
  text-shadow: 0 0 5px $bar-neon-pink;
}

.status-text {
  font-family: 'Courier New', monospace;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: $bar-neon-blue;
}

.scrollable {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>
