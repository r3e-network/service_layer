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

      <NeoCard v-if="status" :variant="status.type === 'error' ? 'danger' : 'success'" class="mb-4 text-center">
        <text class="font-bold">{{ status.msg }}</text>
      </NeoCard>

      <!-- Create New Policy -->
      <CreatePolicyForm
        v-model:assetType="assetType"
        v-model:coverage="coverage"
        v-model:threshold="threshold"
        v-model:startPrice="startPrice"
        :premium="premiumDisplay"
        :is-fetching-price="isFetchingPrice"
        :t="t as any"
        @fetchPrice="fetchPrice"
        @create="createPolicy"
      />

      <!-- Policy Rules -->
      <PoliciesList :policies="policies" :t="t as any" @claim="requestClaim" />
    </view>

    <!-- Stats Tab -->
    <view v-if="activeTab === 'stats'" class="tab-content scrollable">
      <StatsCard :stats="stats" :t="t as any" />

      <!-- Action History -->
      <ActionHistory :action-history="actionHistory" :t="t as any" />
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
import { useWallet, useEvents, useDatafeed } from "@neo/uniapp-sdk";
import { createT } from "@/shared/utils/i18n";
import { AppLayout, NeoCard, NeoDoc, NeoButton } from "@/shared/components";
import type { NavTab } from "@/shared/components/NavBar.vue";
import { addressToScriptHash, normalizeScriptHash, parseInvokeResult, parseStackItem } from "@/shared/utils/neo";

import PoliciesList, { type Policy, type Level } from "./components/PoliciesList.vue";
import CreatePolicyForm from "./components/CreatePolicyForm.vue";
import StatsCard from "./components/StatsCard.vue";
import ActionHistory, { type ActionHistoryItem } from "./components/ActionHistory.vue";

const translations = {
  title: { en: "Guardian Policy", zh: "守护策略" },
  activePolicies: { en: "Active Policies", zh: "活跃保单" },
  createPolicy: { en: "Create Policy", zh: "创建保单" },
  assetType: { en: "Asset pair (e.g., NEO-USD)", zh: "资产对 (例如 NEO-USD)" },
  coverageAmount: { en: "Coverage amount", zh: "保障金额" },
  thresholdPercent: { en: "Claim threshold (% drop)", zh: "触发阈值 (跌幅%)" },
  startPrice: { en: "Start price (USD)", zh: "起始价格 (USD)" },
  fetchPrice: { en: "Fetch", zh: "获取价格" },
  premiumNote: { en: "Premium: {premium} GAS (5%)", zh: "保费：{premium} GAS (5%)" },
  fillAllFields: { en: "Please fill all fields", zh: "请填写所有字段" },
  creatingPolicy: { en: "Creating policy...", zh: "创建保单中..." },
  policyCreated: { en: "Policy created successfully", zh: "保单创建成功" },
  requestClaim: { en: "Request Claim", zh: "申请理赔" },
  claimRequested: { en: "Claim requested", zh: "已提交理赔" },
  claimProcessed: { en: "Claim processed", zh: "理赔已处理" },
  priceFetched: { en: "Price updated", zh: "价格已更新" },
  error: { en: "Error", zh: "错误" },
  claimed: { en: "Claimed", zh: "已理赔" },
  expired: { en: "Expired", zh: "已过期" },
  active: { en: "Active", zh: "活跃" },
  main: { en: "Main", zh: "主页" },
  stats: { en: "Stats", zh: "统计" },
  statistics: { en: "Statistics", zh: "统计数据" },
  totalPolicies: { en: "Total Policies", zh: "总保单数" },
  activePoliciesCount: { en: "Active Policies", zh: "活跃保单" },
  claimedPolicies: { en: "Claimed Policies", zh: "已理赔保单" },
  totalCoverage: { en: "Total Coverage", zh: "总保障额" },
  actionHistory: { en: "Action History", zh: "操作历史" },
  levelLow: { en: "Low", zh: "低" },
  levelMedium: { en: "Medium", zh: "中" },
  levelHigh: { en: "High", zh: "高" },
  levelCritical: { en: "Critical", zh: "严重" },
  wrongChain: { en: "Wrong Network", zh: "网络错误" },
  wrongChainMessage: { en: "This app requires Neo N3 network.", zh: "此应用需 Neo N3 网络。" },
  switchToNeo: { en: "Switch to Neo N3", zh: "切换到 Neo N3" },

  docs: { en: "Docs", zh: "文档" },
  docSubtitle: {
    en: "On-chain insurance for price drops",
    zh: "面向价格下跌的链上保险",
  },
  docDescription: {
    en: "Guardian Policy lets you create coverage policies for supported assets. Choose a coverage amount and a price-drop threshold, then request claims when conditions are met.",
    zh: "Guardian Policy 允许您为支持的资产创建保障保单。设置保障金额与价格跌幅阈值，在满足条件时申请理赔。",
  },
  step1: {
    en: "Connect your Neo wallet",
    zh: "连接你的 Neo 钱包",
  },
  step2: {
    en: "Create a policy with coverage and threshold settings",
    zh: "创建保单并设置保障金额和阈值",
  },
  step3: {
    en: "Track policy status and request claims when eligible",
    zh: "跟踪保单状态并在条件满足时申请理赔",
  },
  step4: {
    en: "Claims are processed by oracle price verification",
    zh: "理赔由预言机价格验证处理",
  },
  feature1Name: { en: "Oracle Verification", zh: "预言机验证" },
  feature1Desc: {
    en: "Claims are evaluated using verified price feeds.",
    zh: "理赔通过可信价格数据进行验证。",
  },
  feature2Name: { en: "Transparent Coverage", zh: "透明保障" },
  feature2Desc: {
    en: "All policies and claims are recorded on-chain.",
    zh: "所有保单与理赔记录均在链上。",
  },
};

const t = createT(translations);
const { address, connect, invokeContract, invokeRead, chainType, switchChain, getContractAddress } = useWallet() as any;
const { list: listEvents } = useEvents();
const { getPrice, isLoading: isFetchingPrice } = useDatafeed();
const APP_ID = "miniapp-guardianpolicy";
const contractAddress = ref<string | null>(null);

const navTabs: NavTab[] = [
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

const policies = ref<Policy[]>([]);
const actionHistory = ref<ActionHistoryItem[]>([]);
const assetType = ref("");
const coverage = ref("");
const threshold = ref("");
const startPrice = ref("");
const priceDecimals = ref(8);
const status = ref<{ msg: string; type: string } | null>(null);

const premiumDisplay = computed(() => {
  const amount = parseFloat(coverage.value);
  if (!Number.isFinite(amount) || amount <= 0) return "0";
  return (amount * 0.05).toFixed(2);
});

const stats = computed(() => ({
  totalPolicies: policies.value.length,
  activePolicies: policies.value.filter((p) => p.active && !p.claimed).length,
  claimedPolicies: policies.value.filter((p) => p.claimed).length,
  totalCoverage: policies.value.reduce((sum, p) => sum + (p.coverageValue || 0), 0),
}));

const ownerMatches = (value: unknown) => {
  if (!address.value) return false;
  const val = String(value || "");
  if (val === address.value) return true;
  const normalized = normalizeScriptHash(val);
  const addrHash = addressToScriptHash(address.value);
  return Boolean(normalized && addrHash && normalized === addrHash);
};

const ensureContractAddress = async () => {
  if (!contractAddress.value) {
    contractAddress.value = await getContractAddress();
  }
  if (!contractAddress.value) {
    throw new Error("Contract unavailable");
  }
  return contractAddress.value;
};

const formatWithDecimals = (value: string, decimals: number) => {
  const cleaned = String(value || "").replace(/[^\d]/g, "");
  if (!cleaned) return "0";
  const padded = cleaned.padStart(decimals + 1, "0");
  const whole = padded.slice(0, -decimals);
  const frac = padded.slice(-decimals).replace(/0+$/, "");
  return frac ? `${whole}.${frac}` : whole;
};

const toInteger = (value: string, decimals: number) => {
  const normalized = String(value || "").trim();
  const [wholeRaw, fracRaw = ""] = normalized.split(".");
  const whole = wholeRaw.replace(/[^\d]/g, "") || "0";
  const frac = fracRaw.replace(/[^\d]/g, "");
  const padded = (frac + "0".repeat(decimals)).slice(0, decimals);
  const combined = `${whole}${padded}`.replace(/^0+/, "");
  return combined || "0";
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

const levelFromThreshold = (thresholdPercent: number): Level => {
  if (thresholdPercent <= 10) return "critical";
  if (thresholdPercent <= 20) return "high";
  if (thresholdPercent <= 30) return "medium";
  return "low";
};

const parsePolicyStruct = (raw: unknown) => {
  const data = Array.isArray(raw) ? raw : [];
  return {
    holder: data[0],
    assetType: String(data[1] || ""),
    coverage: Number(data[2] || 0),
    premium: Number(data[3] || 0),
    startPrice: String(data[4] || "0"),
    threshold: Number(data[5] || 0),
    startTime: Number(data[6] || 0),
    endTime: Number(data[7] || 0),
    active: Boolean(data[8]),
    claimed: Boolean(data[9]),
  };
};

const fetchPolicies = async () => {
  if (!address.value) return;
  const createdEvents = await listAllEvents("PolicyCreated");
  const policyIds = createdEvents
    .map((evt) => {
      const values = Array.isArray(evt?.state) ? evt.state.map(parseStackItem) : [];
      return {
        id: String(values[0] || ""),
        holder: values[1],
      };
    })
    .filter((entry) => entry.id && ownerMatches(entry.holder))
    .map((entry) => entry.id);

  const uniqueIds = Array.from(new Set(policyIds));
  const contract = await ensureContractAddress();
  const policyList: Policy[] = [];

  for (const id of uniqueIds) {
    const res = await invokeRead({
      contractAddress: contract,
      operation: "getPolicy",
      args: [{ type: "Integer", value: id }],
    });
    const parsed = parseInvokeResult(res);
    const data = parsePolicyStruct(parsed);
    if (!data.assetType) continue;

    const coverageGas = data.coverage / 1e8;
    const endTimeMs = data.endTime > 1e12 ? data.endTime : data.endTime * 1000;
    const endDate = endTimeMs ? new Date(endTimeMs).toISOString().split("T")[0] : "N/A";
    const description = `Coverage ${coverageGas.toFixed(2)} GAS · Trigger ${data.threshold}% · Ends ${endDate}`;

    policyList.push({
      id,
      name: data.assetType,
      description,
      active: data.active,
      claimed: data.claimed,
      level: levelFromThreshold(data.threshold),
      coverageValue: coverageGas,
    });
  }

  policies.value = policyList;
};

const fetchHistory = async () => {
  const [createdEvents, claimEvents, processedEvents] = await Promise.all([
    listAllEvents("PolicyCreated"),
    listAllEvents("ClaimRequested"),
    listAllEvents("ClaimProcessed"),
  ]);

  const history: ActionHistoryItem[] = [];
  const userPolicyIds = new Set<string>();

  createdEvents.forEach((evt) => {
    const values = Array.isArray(evt?.state) ? evt.state.map(parseStackItem) : [];
    const policyId = String(values[0] || "");
    const holder = values[1];
    if (!policyId || !ownerMatches(holder)) return;
    userPolicyIds.add(policyId);
    history.push({
      id: evt.id,
      action: `${t("policyCreated")} #${policyId}`,
      time: new Date(evt.created_at || Date.now()).toLocaleString(),
      type: "create",
    });
  });

  claimEvents.forEach((evt) => {
    const values = Array.isArray(evt?.state) ? evt.state.map(parseStackItem) : [];
    const policyId = String(values[0] || "");
    if (!policyId || !userPolicyIds.has(policyId)) return;
    history.push({
      id: evt.id,
      action: `${t("requestClaim")} #${policyId}`,
      time: new Date(evt.created_at || Date.now()).toLocaleString(),
      type: "claim",
    });
  });

  processedEvents.forEach((evt) => {
    const values = Array.isArray(evt?.state) ? evt.state.map(parseStackItem) : [];
    const policyId = String(values[0] || "");
    const approved = Boolean(values[2]);
    const payout = Number(values[3] || 0) / 1e8;
    if (!policyId || !userPolicyIds.has(policyId)) return;
    history.push({
      id: evt.id,
      action: `${t("claimProcessed")} #${policyId} · ${approved ? "Approved" : "Denied"} · ${payout.toFixed(2)} GAS`,
      time: new Date(evt.created_at || Date.now()).toLocaleString(),
      type: "processed",
    });
  });

  actionHistory.value = history.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 20);
};

const refreshData = async () => {
  try {
    if (!address.value) {
      await connect();
    }
    if (!address.value) return;
    await fetchPolicies();
    await fetchHistory();
  } catch (e) {
    console.warn("[GuardianPolicy] Failed to fetch data:", e);
  }
};

const fetchPrice = async () => {
  if (!assetType.value) {
    status.value = { msg: t("fillAllFields"), type: "error" };
    return;
  }
  try {
    const symbol = assetType.value.trim().replace("/", "-");
    const price = await getPrice(symbol);
    if (price?.price) {
      priceDecimals.value = price.decimals ?? 8;
      startPrice.value = formatWithDecimals(price.price, priceDecimals.value);
      status.value = { msg: t("priceFetched"), type: "success" };
    }
  } catch (e: any) {
    status.value = { msg: e.message || t("error"), type: "error" };
  }
};

const createPolicy = async () => {
  if (!assetType.value || !coverage.value || !threshold.value || !startPrice.value) {
    status.value = { msg: t("fillAllFields"), type: "error" };
    return;
  }

  const coverageInt = toInteger(coverage.value, 8);
  const startPriceInt = toInteger(startPrice.value, priceDecimals.value);
  const thresholdPercent = Math.floor(Number(threshold.value));

  if (Number(coverageInt) <= 0 || Number(startPriceInt) <= 0 || thresholdPercent <= 0 || thresholdPercent > 50) {
    status.value = { msg: t("fillAllFields"), type: "error" };
    return;
  }

  try {
    status.value = { msg: t("creatingPolicy"), type: "loading" };
    if (!address.value) {
      await connect();
    }
    if (!address.value) throw new Error(t("error"));

    const contract = await ensureContractAddress();
    await invokeContract({
      scriptHash: contract,
      operation: "createPolicy",
      args: [
        { type: "Hash160", value: address.value },
        { type: "String", value: assetType.value.trim() },
        { type: "Integer", value: coverageInt },
        { type: "Integer", value: startPriceInt },
        { type: "Integer", value: String(thresholdPercent) },
      ],
    });
    status.value = { msg: t("policyCreated"), type: "success" };
    assetType.value = "";
    coverage.value = "";
    threshold.value = "";
    startPrice.value = "";
    await refreshData();
  } catch (e: any) {
    status.value = { msg: e.message || t("error"), type: "error" };
  }
};

const requestClaim = async (policyId: string) => {
  if (!policyId) return;
  try {
    status.value = { msg: t("claimRequested"), type: "loading" };
    if (!address.value) {
      await connect();
    }
    if (!address.value) throw new Error(t("error"));
    const contract = await ensureContractAddress();
    await invokeContract({
      scriptHash: contract,
      operation: "requestClaim",
      args: [{ type: "Integer", value: policyId }],
    });
    status.value = { msg: t("claimRequested"), type: "success" };
    await refreshData();
  } catch (e: any) {
    status.value = { msg: e.message || t("error"), type: "error" };
  }
};

onMounted(() => {
  refreshData();
});

watch(address, () => {
  refreshData();
});
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

.scrollable { overflow-y: auto; -webkit-overflow-scrolling: touch; }
</style>
