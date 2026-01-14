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

      <NeoCard
        v-if="status"
        :variant="status.type === 'error' ? 'danger' : status.type === 'loading' ? 'warning' : 'success'"
        class="mb-4 text-center"
      >
        <text class="font-bold">{{ status.msg }}</text>
      </NeoCard>

      <!-- Trust Documents Section -->
      <NeoCard variant="erobo">
        <view v-for="trust in trusts" :key="trust.id">
          <TrustCard
            :trust="trust"
            :t="t as any"
            @heartbeat="heartbeatTrust"
            @claimYield="claimYield"
            @execute="executeTrust"
          />
        </view>
        <view v-if="trusts.length === 0" class="text-center p-4">
          <text>{{ t("noTrusts") || "No trusts found" }}</text>
        </view>
      </NeoCard>

      <!-- Create Trust Form -->
      <CreateTrustForm
        v-model:name="newTrust.name"
        v-model:beneficiary="newTrust.beneficiary"
        v-model:neo-value="newTrust.neoValue"
        :is-loading="isLoading"
        :t="t as any"
        @create="create"
      />
    </view>

    <!-- Stats Tab -->
    <view v-if="activeTab === 'stats'" class="tab-content scrollable">
      <StatsCard :stats="stats" :t="t as any" />
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
import { ref, computed, onMounted } from "vue";
import { useWallet, useEvents } from "@neo/uniapp-sdk";
import { createT } from "@/shared/utils/i18n";
import { AppLayout, NeoDoc, NeoCard } from "@/shared/components";
import type { NavTab } from "@/shared/components/NavBar.vue";
import { addressToScriptHash, normalizeScriptHash, parseInvokeResult, parseStackItem } from "@/shared/utils/neo";

import TrustCard, { type Trust } from "./components/TrustCard.vue";
import CreateTrustForm from "./components/CreateTrustForm.vue";
import StatsCard from "./components/StatsCard.vue";

const translations = {
  title: { en: "Heritage Trust", zh: "遗产信托" },
  yourTrusts: { en: "Your Trusts", zh: "您的信托" },
  to: { en: "To", zh: "受益人" },
  createTrust: { en: "Create Trust", zh: "创建信托" },
  trustName: { en: "Trust name", zh: "信托名称" },
  beneficiaryAddress: { en: "Beneficiary address", zh: "受益人地址" },
  amount: { en: "Amount", zh: "金额" },
  assetHint: { en: "Enter the NEO amount to lock as principal", zh: "输入要锁定的 NEO 本金" },
  infoText: { en: "Trust activates after 30 days of inactivity", zh: "信托在30天不活跃后激活" },
  creating: { en: "Creating...", zh: "创建中..." },
  trustCreated: { en: "Trust created!", zh: "信托已创建！" },
  error: { en: "Error", zh: "错误" },
  main: { en: "Main", zh: "主页" },
  stats: { en: "Stats", zh: "统计" },
  statistics: { en: "Statistics", zh: "统计数据" },
  totalTrusts: { en: "Total Trusts", zh: "总信托数" },
  totalNeoValue: { en: "Total NEO", zh: "总 NEO" },
  activeTrusts: { en: "Active Trusts", zh: "活跃信托" },
  noTrusts: { en: "No trusts yet", zh: "暂无信托" },

  // New translations for enhanced UI
  sealed: { en: "SEALED", zh: "已封存" },
  trustDocument: { en: "Trust Document", zh: "信托文件" },
  totalAssets: { en: "Total Assets", zh: "总资产" },
  beneficiary: { en: "Beneficiary", zh: "受益人" },
  allocation: { en: "Allocation", zh: "分配比例" },
  triggerCondition: { en: "Trigger Condition", zh: "触发条件" },
  now: { en: "Now", zh: "现在" },
  inactivityPeriod: { en: "Inactivity Period", zh: "不活跃期" },
  days: { en: "days", zh: "天" },
  trustActivates: { en: "Trust Activates", zh: "信托激活" },
  automatic: { en: "Automatic", zh: "自动" },
  documentId: { en: "Document ID", zh: "文档编号" },
  digitalSignature: { en: "Digital Signature", zh: "数字签名" },
  trustDetails: { en: "Trust Details", zh: "信托详情" },
  beneficiaryInfo: { en: "Beneficiary Information", zh: "受益人信息" },
  assetAmount: { en: "Asset Amount", zh: "资产金额" },
  importantNotice: { en: "Important Notice", zh: "重要提示" },
  active: { en: "ACTIVE", zh: "活跃" },
  pending: { en: "PENDING", zh: "待定" },
  triggered: { en: "TRIGGERED", zh: "已触发" },
  executed: { en: "EXECUTED", zh: "已执行" },
  ready: { en: "Ready", zh: "可执行" },
  heartbeat: { en: "Heartbeat", zh: "续期" },
  claimYield: { en: "Claim Yield", zh: "领取收益" },
  executeTrust: { en: "Execute Trust", zh: "执行信托" },
  insufficientNeo: { en: "Insufficient NEO balance", zh: "NEO 余额不足" },

  docs: { en: "Docs", zh: "文档" },
  docSubtitle: {
    en: "Automated digital inheritance with inactivity-triggered transfers",
    zh: "基于不活跃触发的自动数字遗产转移",
  },
  docDescription: {
    en: "Heritage Trust enables secure digital asset inheritance on Neo. Create trusts that automatically transfer assets to beneficiaries after a configurable inactivity period, ensuring your digital wealth passes to loved ones.",
    zh: "Heritage Trust 在 Neo 上实现安全的数字资产继承。创建信托，在可配置的不活跃期后自动将资产转移给受益人，确保您的数字财富传承给亲人。",
  },
  step1: {
    en: "Connect your Neo wallet and deposit assets into a new trust",
    zh: "连接您的 Neo 钱包并将资产存入新信托",
  },
  step2: {
    en: "Set the beneficiary address and maintain your heartbeat every 30 days",
    zh: "设置受益人地址并每 30 天续期",
  },
  step3: {
    en: "The smart contract monitors your wallet activity automatically",
    zh: "智能合约自动监控您的钱包活动",
  },
  step4: {
    en: "If inactivity threshold is reached, assets transfer to beneficiary automatically",
    zh: "如果达到不活跃阈值，资产将自动转移给受益人",
  },
  feature1Name: { en: "Inactivity Trigger", zh: "不活跃触发" },
  feature1Desc: {
    en: "Automated monitoring detects wallet inactivity and triggers inheritance transfer.",
    zh: "自动监控检测钱包不活跃状态并触发遗产转移。",
  },
  feature2Name: { en: "Secure Beneficiary", zh: "安全受益人" },
  feature2Desc: {
    en: "Beneficiary addresses are locked on-chain and cannot be changed without owner signature.",
    zh: "受益人地址锁定在链上，未经所有者签名无法更改。",
  },
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

const docSteps = computed(() => [t("step1"), t("step2"), t("step3"), t("step4")]);
const docFeatures = computed(() => [
  { name: t("feature1Name"), desc: t("feature1Desc") },
  { name: t("feature2Name"), desc: t("feature2Desc") },
]);
const APP_ID = "miniapp-heritage-trust";
const { address, connect, invokeContract, invokeRead, getBalance, chainType, switchChain, getContractAddress } =
  useWallet() as any;
const { list: listEvents } = useEvents();
const isLoading = ref(false);
const contractAddress = ref<string | null>(null);

const ensureContractAddress = async () => {
  if (!contractAddress.value) {
    contractAddress.value = await getContractAddress();
  }
  if (!contractAddress.value) {
    throw new Error(t("error"));
  }
  return contractAddress.value;
};

const TRUST_NAME_KEY = "heritage-trust-names";
const loadTrustNames = () => {
  try {
    const raw = uni.getStorageSync(TRUST_NAME_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};
const trustNames = ref<Record<string, string>>(loadTrustNames());
const saveTrustName = (id: string, name: string) => {
  if (!id || !name) return;
  trustNames.value = { ...trustNames.value, [id]: name };
  try {
    uni.setStorageSync(TRUST_NAME_KEY, JSON.stringify(trustNames.value));
  } catch {
    // ignore storage errors
  }
};

const trusts = ref<Trust[]>([]);
const newTrust = ref({ name: "", beneficiary: "", neoValue: "" });
const status = ref<{ msg: string; type: string } | null>(null);
const isLoadingData = ref(false);

const stats = computed(() => ({
  totalTrusts: trusts.value.length,
  totalNeoValue: trusts.value.reduce((sum, t) => sum + (t.neoValue || 0), 0),
  activeTrusts: trusts.value.filter((t) => t.status === "active" || t.status === "triggered").length,
}));

const ownerMatches = (value: unknown) => {
  if (!address.value) return false;
  const val = String(value || "");
  if (val === address.value) return true;
  const normalized = normalizeScriptHash(val);
  const addrHash = addressToScriptHash(address.value);
  return Boolean(normalized && addrHash && normalized === addrHash);
};

const toTimestampMs = (value: unknown) => {
  const num = Number(value ?? 0);
  if (!Number.isFinite(num) || num <= 0) return 0;
  return num > 1e12 ? num : num * 1000;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const waitForEvent = async (txid: string, eventName: string) => {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const res = await listEvents({ app_id: APP_ID, event_name: eventName, limit: 25 });
    const match = res.events.find((evt) => evt.tx_hash === txid);
    if (match) return match;
    await sleep(1500);
  }
  return null;
};

// Fetch trusts data from smart contract
const fetchData = async () => {
  try {
    if (!address.value) {
      await connect();
    }
    if (!address.value) return;

    isLoadingData.value = true;
    const contract = await ensureContractAddress();

    // Get total trusts count from contract
    const totalResult = await invokeRead({
      contractAddress: contract,
      operation: "totalTrusts",
      args: [],
    });
    const totalTrusts = Number(parseInvokeResult(totalResult) || 0);
    const userTrusts: Trust[] = [];
    const now = Date.now();

    // Iterate through all trusts and find ones owned by current user
    for (let i = 1; i <= totalTrusts; i++) {
      const trustResult = await invokeRead({
        contractAddress: contract,
        operation: "getTrust",
        args: [{ type: "Integer", value: i.toString() }],
      });
      const parsed = parseInvokeResult(trustResult);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) continue;
      const trustData = parsed as Record<string, unknown>;
      const owner = trustData.owner;
      if (!ownerMatches(owner)) continue;

      const deadlineMs = toTimestampMs(trustData.deadline);
      const active = Boolean(trustData.active);
      const status = active ? (deadlineMs && deadlineMs <= now ? "triggered" : "active") : "executed";
      const daysRemaining = deadlineMs ? Math.max(0, Math.ceil((deadlineMs - now) / 86400000)) : 0;

      userTrusts.push({
        id: i.toString(),
        name: trustNames.value?.[String(i)] || `Trust #${i}`,
        beneficiary: String(trustData.heir || "Unknown"),
        neoValue: Number(trustData.principal || 0),
        icon: "📜",
        status,
        daysRemaining,
        deadline: deadlineMs ? new Date(deadlineMs).toISOString().split("T")[0] : "N/A",
        canExecute: active && deadlineMs > 0 && deadlineMs <= now,
      });
    }

    trusts.value = userTrusts.sort((a, b) => Number(b.id) - Number(a.id));
  } catch (e) {
    console.warn("[HeritageTrust] Failed to fetch data:", e);
  } finally {
    isLoadingData.value = false;
  }
};

const create = async () => {
  const neoAmount = Math.floor(parseFloat(newTrust.value.neoValue));
  if (isLoading.value || !newTrust.value.name || !newTrust.value.beneficiary || !(neoAmount > 0)) return;

  try {
    status.value = { msg: t("creating"), type: "loading" };

    if (!address.value) {
      await connect();
    }
    if (!address.value) {
      throw new Error(t("error"));
    }

    const neo = await getBalance("NEO");
    const balance = typeof neo === "string" ? parseFloat(neo) || 0 : typeof neo === "number" ? neo : 0;
    if (neoAmount > balance) {
      throw new Error(t("insufficientNeo"));
    }

    const contract = await ensureContractAddress();
    const tx = await invokeContract({
      scriptHash: contract,
      operation: "createTrust",
      args: [
        { type: "Hash160", value: address.value },
        { type: "Hash160", value: newTrust.value.beneficiary },
        { type: "Integer", value: neoAmount },
      ],
    });

    const txid = String((tx as any)?.txid || (tx as any)?.txHash || "");
    if (txid) {
      const event = await waitForEvent(txid, "TrustCreated");
      if (event?.state) {
        const values = Array.isArray(event.state) ? event.state.map(parseStackItem) : [];
        const trustId = String(values[0] || "");
        if (trustId) {
          saveTrustName(trustId, newTrust.value.name);
        }
      }
    }

    status.value = { msg: t("trustCreated"), type: "success" };
    newTrust.value = { name: "", beneficiary: "", neoValue: "" };
    await fetchData();
  } catch (e: any) {
    status.value = { msg: e.message || t("error"), type: "error" };
  }
};

const heartbeatTrust = async (trust: Trust) => {
  if (isLoading.value) return;
  try {
    isLoading.value = true;
    if (!address.value) {
      await connect();
    }
    if (!address.value) throw new Error(t("error"));
    const contract = await ensureContractAddress();
    await invokeContract({
      scriptHash: contract,
      operation: "heartbeat",
      args: [
        { type: "Hash160", value: address.value },
        { type: "Integer", value: trust.id },
      ],
    });
    status.value = { msg: t("heartbeat"), type: "success" };
    await fetchData();
  } catch (e: any) {
    status.value = { msg: e.message || t("error"), type: "error" };
  } finally {
    isLoading.value = false;
  }
};

const claimYield = async (trust: Trust) => {
  if (isLoading.value) return;
  try {
    isLoading.value = true;
    if (!address.value) {
      await connect();
    }
    if (!address.value) throw new Error(t("error"));
    const contract = await ensureContractAddress();
    await invokeContract({
      scriptHash: contract,
      operation: "claimYield",
      args: [
        { type: "Hash160", value: address.value },
        { type: "Integer", value: trust.id },
      ],
    });
    status.value = { msg: t("claimYield"), type: "success" };
    await fetchData();
  } catch (e: any) {
    status.value = { msg: e.message || t("error"), type: "error" };
  } finally {
    isLoading.value = false;
  }
};

const executeTrust = async (trust: Trust) => {
  if (isLoading.value) return;
  try {
    isLoading.value = true;
    const contract = await ensureContractAddress();
    await invokeContract({
      scriptHash: contract,
      operation: "executeTrust",
      args: [{ type: "Integer", value: trust.id }],
    });
    status.value = { msg: t("executeTrust"), type: "success" };
    await fetchData();
  } catch (e: any) {
    status.value = { msg: e.message || t("error"), type: "error" };
  } finally {
    isLoading.value = false;
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
