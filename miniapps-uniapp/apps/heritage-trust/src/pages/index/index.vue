<template>
  <AppLayout :title="t('title')" show-top-nav :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
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
      <NeoCard :title="t('yourTrusts')" variant="erobo">
        <view v-for="trust in trusts" :key="trust.id">
          <TrustCard :trust="trust" :t="t as any" />
        </view>
        <view v-if="trusts.length === 0" class="text-center p-4">
          <text>{{ t("noTrusts") || "No trusts found" }}</text>
        </view>
      </NeoCard>

      <!-- Create Trust Form -->
      <CreateTrustForm
        v-model:name="newTrust.name"
        v-model:beneficiary="newTrust.beneficiary"
        v-model:gas-value="newTrust.gasValue"
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
import { useWallet, usePayments } from "@neo/uniapp-sdk";
import { createT } from "@/shared/utils/i18n";
import { AppLayout, NeoDoc, NeoCard } from "@/shared/components";
import type { NavTab } from "@/shared/components/NavBar.vue";

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
  assetHint: { en: "Enter GAS and/or NEO amount to deposit", zh: "输入要存入的 GAS 和/或 NEO 金额" },
  infoText: { en: "Trust activates after 90 days of inactivity", zh: "信托在90天不活跃后激活" },
  creating: { en: "Creating...", zh: "创建中..." },
  trustCreated: { en: "Trust created!", zh: "信托已创建！" },
  error: { en: "Error", zh: "错误" },
  main: { en: "Main", zh: "主页" },
  stats: { en: "Stats", zh: "统计" },
  statistics: { en: "Statistics", zh: "统计数据" },
  totalTrusts: { en: "Total Trusts", zh: "总信托数" },
  totalGasValue: { en: "Total GAS", zh: "总 GAS" },
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
    en: "Set the beneficiary address and configure the inactivity period (default 90 days)",
    zh: "设置受益人地址并配置不活跃期（默认 90 天）",
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
const { address, connect, chainType, switchChain, getContractAddress } = useWallet() as any;
const { payGAS, isLoading } = usePayments(APP_ID);
const contractAddress = ref<string | null>(null);

const ensureContractAddress = async () => {
  if (!contractAddress.value) {
    contractAddress.value = await getContractAddress();
  }
  return contractAddress.value;
};

const trusts = ref<Trust[]>([]);
const newTrust = ref({ name: "", beneficiary: "", gasValue: "", neoValue: "" });
const status = ref<{ msg: string; type: string } | null>(null);
const isLoadingData = ref(false);

const stats = computed(() => ({
  totalTrusts: trusts.value.length,
  totalGasValue: trusts.value.reduce((sum, t) => sum + (t.gasValue || 0), 0),
  totalNeoValue: trusts.value.reduce((sum, t) => sum + (t.neoValue || 0), 0),
  activeTrusts: trusts.value.length,
}));

// Fetch trusts data from smart contract
const fetchData = async () => {
  if (!address.value) return;

  isLoadingData.value = true;
  try {
    const contract = await ensureContractAddress();
    const sdk = await import("@neo/uniapp-sdk").then((m) => m.waitForSDK?.() || null);
    if (!sdk?.invoke) {
      console.warn("[HeritageTrust] SDK not available");
      return;
    }

    // Get total trusts count from contract
    const totalResult = (await sdk.invoke("invokeRead", {
      contract,
      method: "totalTrusts",
      args: [],
    })) as any;

    const totalTrusts = parseInt(totalResult?.stack?.[0]?.value || "0");
    const userTrusts: Trust[] = [];

    // Iterate through all trusts and find ones owned by current user
    for (let i = 1; i <= totalTrusts; i++) {
      const trustResult = (await sdk.invoke("invokeRead", {
        contract,
        method: "getTrust",
        args: [{ type: "Integer", value: i.toString() }],
      })) as any;

      if (trustResult?.stack?.[0]) {
        const trustData = trustResult.stack[0].value;
        const owner = trustData?.owner;

        // Check if this trust belongs to current user
        if (owner === address.value) {
          userTrusts.push({
            id: i.toString(),
            name: `Trust #${i}`,
            beneficiary: trustData?.heir || "Unknown",
            gasValue: parseInt(trustData?.principal || "0"),
            neoValue: 0,
            icon: "📜",
            status: trustData?.active ? "active" : "executed",
          });
        }
      }
    }

    trusts.value = userTrusts;
  } catch (e) {
    console.warn("[HeritageTrust] Failed to fetch data:", e);
  } finally {
    isLoadingData.value = false;
  }
};

// Register trust for inactivity monitoring via Edge Function automation
const registerInactivityMonitor = async (trustId: string) => {
  try {
    await fetch("/api/automation/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        appId: APP_ID,
        taskName: `monitor-${trustId}`,
        taskType: "conditional",
        payload: {
          action: "custom",
          handler: "heritage:checkInactivity",
          data: { trustId, inactivityDays: 90 },
        },
        schedule: { intervalSeconds: 24 * 60 * 60 }, // Check daily
      }),
    });
  } catch (e) {
    console.warn("[HeritageTrust] Failed to register monitor:", e);
  }
};

const create = async () => {
  const gasAmount = parseFloat(newTrust.value.gasValue) || 0;
  const neoAmount = parseFloat(newTrust.value.neoValue) || 0;

  if (isLoading.value || !newTrust.value.name || !newTrust.value.beneficiary || (gasAmount <= 0 && neoAmount <= 0))
    return;

  try {
    status.value = { msg: t("creating"), type: "loading" };

    // Pay GAS if specified
    if (gasAmount > 0) {
      await payGAS(newTrust.value.gasValue, `trust:gas:${Date.now()}`);
    }

    // Pay NEO if specified (using payGAS for now, would need payNEO in production)
    if (neoAmount > 0) {
      // Note: In production, this would use a separate payNEO function
      await payGAS(newTrust.value.neoValue, `trust:neo:${Date.now()}`);
    }

    const trustId = Date.now().toString();
    trusts.value.push({
      id: trustId,
      name: newTrust.value.name,
      beneficiary: newTrust.value.beneficiary,
      gasValue: gasAmount,
      neoValue: neoAmount,
      icon: "📜",
      status: "active",
    });

    // Register for inactivity monitoring
    await registerInactivityMonitor(trustId);
    status.value = { msg: t("trustCreated"), type: "success" };
    newTrust.value = { name: "", beneficiary: "", gasValue: "", neoValue: "" };
  } catch (e: any) {
    status.value = { msg: e.message || t("error"), type: "error" };
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
