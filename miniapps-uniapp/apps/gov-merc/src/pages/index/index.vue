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
import { createT } from "@/shared/utils/i18n";
import { formatNumber } from "@/shared/utils/format";
import { addressToScriptHash, normalizeScriptHash, parseInvokeResult, parseStackItem } from "@/shared/utils/neo";
import { AppLayout, NeoDoc, NeoButton, NeoInput, NeoCard, NeoStats } from "@/shared/components";
import type { StatItem } from "@/shared/components/NeoStats.vue";

const translations = {
  title: { en: "Gov Merc", zh: "治理雇佣兵" },
  subtitle: { en: "Bid for governance influence", zh: "竞价治理影响力" },
  rent: { en: "Pool", zh: "池子" },
  market: { en: "Bids", zh: "竞价" },
  poolStats: { en: "Pool Stats", zh: "池子统计" },
  totalPool: { en: "Total Pool", zh: "总池子" },
  currentEpoch: { en: "Current Epoch", zh: "当前周期" },
  yourDeposits: { en: "Your Deposits", zh: "你的存入" },
  depositNeo: { en: "Deposit NEO", zh: "存入 NEO" },
  withdrawNeo: { en: "Withdraw NEO", zh: "提取 NEO" },
  depositAmount: { en: "Deposit amount", zh: "存入金额" },
  withdrawAmount: { en: "Withdraw amount", zh: "提取金额" },
  placeBid: { en: "Place Bid", zh: "提交竞价" },
  bidAmount: { en: "Bid amount", zh: "竞价金额" },
  bidLeaderboard: { en: "Bid Leaderboard", zh: "竞价榜" },
  noBids: { en: "No bids yet", zh: "暂无竞价" },
  tabStats: { en: "Stats", zh: "统计" },
  depositSuccess: { en: "Deposit submitted", zh: "存入已提交" },
  withdrawSuccess: { en: "Withdrawal submitted", zh: "提取已提交" },
  bidSuccess: { en: "Bid submitted", zh: "竞价已提交" },
  enterAmount: { en: "Enter an amount", zh: "请输入金额" },
  error: { en: "Error", zh: "错误" },
  wrongChain: { en: "Wrong Network", zh: "网络错误" },
  wrongChainMessage: { en: "This app requires Neo N3 network.", zh: "此应用需 Neo N3 网络。" },
  switchToNeo: { en: "Switch to Neo N3", zh: "切换到 Neo N3" },

  docs: { en: "Docs", zh: "文档" },
  docSubtitle: {
    en: "Governance mercenary pool with competitive bidding",
    zh: "基于竞价的治理雇佣池",
  },
  docDescription: {
    en: "Gov Merc lets you deposit NEO into a shared pool and place GAS bids to win governance influence for each epoch.",
    zh: "Gov Merc 允许您将 NEO 存入共享池，并通过 GAS 竞价赢得每个周期的治理影响力。",
  },
  step1: {
    en: "Connect your Neo wallet",
    zh: "连接您的 Neo 钱包",
  },
  step2: {
    en: "Deposit NEO to participate in the pool",
    zh: "存入 NEO 参与资金池",
  },
  step3: {
    en: "Place a GAS bid for the current epoch",
    zh: "为当前周期提交 GAS 竞价",
  },
  step4: {
    en: "Track bids and epoch outcomes on-chain",
    zh: "链上跟踪竞价与周期结果",
  },
  feature1Name: { en: "Epoch Bidding", zh: "周期竞价" },
  feature1Desc: {
    en: "Bid with GAS to win the epoch.",
    zh: "用 GAS 竞价赢得周期。",
  },
  feature2Name: { en: "Shared Pool", zh: "共享池" },
  feature2Desc: {
    en: "Deposited NEO powers the system.",
    zh: "存入的 NEO 为系统提供支持。",
  },
};

const t = createT(translations);

const navTabs = [
  { id: "rent", icon: "wallet", label: t("rent") },
  { id: "market", icon: "cart", label: t("market") },
  { id: "stats", icon: "chart", label: t("tabStats") },
  { id: "docs", icon: "book", label: t("docs") },
];

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
    invokeRead({ contractAddress: contract, operation: "currentEpoch" }),
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
  } catch (e) {
    console.warn("[GovMerc] Failed to fetch data:", e);
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
    if (!receiptId) throw new Error("Missing payment receipt");
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

.tab-content {
  padding: $space-4;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: $space-4;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.form-group-neo {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}
.duration-row-neo {
  display: flex;
  gap: $space-3;
}

.section-title-neo {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  margin-bottom: 8px;
  color: #a78bfa;
  padding: 2px 10px;
  display: inline-block;
  letter-spacing: 0.1em;
}

.delegate-avatar-neo {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.1);
  color: white;
  &.elite {
    background: rgba(255, 222, 10, 0.2);
    border-color: rgba(255, 222, 10, 0.4);
    color: #ffde59;
    text-shadow: 0 0 10px #ffde59;
  }
}

.delegate-name-neo {
  font-weight: 800;
  font-size: 20px;
  color: white;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.4);
}
.delegate-address-neo {
  font-family: $font-mono;
  font-size: 10px;
  opacity: 0.7;
  font-weight: 500;
  margin-top: 4px;
  color: rgba(255, 255, 255, 0.8);
}

.elite-badge-neo {
  background: rgba(255, 222, 10, 0.1);
  color: #ffde59;
  font-size: 9px;
  font-weight: 700;
  padding: 4px 10px;
  border: 1px solid rgba(255, 222, 10, 0.4);
  box-shadow: 0 0 10px rgba(255, 222, 10, 0.2);
  border-radius: 99px;
}

.delegate-metrics-neo {
  background: rgba(0, 0, 0, 0.2);
  padding: $space-4;
  border: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  gap: $space-4;
  border-radius: 12px;
  color: white;
}
.metric-label-neo {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.6);
  letter-spacing: 0.05em;
}
.metric-value-neo {
  font-family: $font-mono;
  font-weight: 700;
  font-size: 14px;
  color: white;
}

.empty-neo {
  font-family: $font-mono;
  font-size: 14px;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.05);
  border: 1px dashed rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.5);
  border-radius: 12px;
}

.bid-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $space-3 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
.bid-address {
  font-family: $font-mono;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.7);
}
.bid-amount {
  font-family: $font-mono;
  font-weight: 700;
  color: #00e599;
}
.status-text {
  font-family: $font-mono;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
}

.scrollable {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>
