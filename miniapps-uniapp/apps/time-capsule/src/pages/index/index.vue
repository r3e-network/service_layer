<template>
  <AppLayout :title="t('title')" show-top-nav :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
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

    <view v-if="activeTab === 'capsules' || activeTab === 'create'" class="app-container">
      <NeoCard v-if="status" :variant="status.type === 'success' ? 'success' : status.type === 'loading' ? 'accent' : 'danger'" class="mb-4 text-center">
        <text class="status-text font-bold uppercase tracking-wider">{{ status.msg }}</text>
      </NeoCard>

      <!-- Capsules Tab -->
      <view v-if="activeTab === 'capsules'" class="tab-content">
        <CapsuleList :capsules="capsules" :current-time="currentTime" :t="t as any" @open="open" />
      </view>

      <!-- Create Tab -->
      <view v-if="activeTab === 'create'" class="tab-content">
        <CreateCapsuleForm
          v-model:name="newCapsule.name"
          v-model:content="newCapsule.content"
          v-model:days="newCapsule.days"
          :is-loading="isLoading"
          :can-create="canCreate"
          :t="t as any"
          @create="create"
        />
      </view>
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
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useWallet, usePayments } from "@neo/uniapp-sdk";
import { createT } from "@/shared/utils/i18n";
import { AppLayout, NeoDoc, NeoCard, NeoButton } from "@/shared/components";
import type { NavTab } from "@/shared/components/NavBar.vue";

import CapsuleList, { type Capsule } from "./components/CapsuleList.vue";
import CreateCapsuleForm from "./components/CreateCapsuleForm.vue";

const translations = {
  title: { en: "Time Capsule", zh: "时间胶囊" },
  subtitle: { en: "Lock content until future date", zh: "锁定内容直到未来日期" },
  yourCapsules: { en: "Your Capsules", zh: "你的胶囊" },
  noCapsules: { en: "No capsules yet. Create your first one!", zh: "还没有胶囊。创建你的第一个吧！" },
  timeRemaining: { en: "Time Remaining", zh: "剩余时间" },
  unlocks: { en: "Unlocks:", zh: "解锁时间：" },
  unlocked: { en: "Ready to Open", zh: "可以打开" },
  open: { en: "Open Capsule", zh: "打开胶囊" },
  createCapsule: { en: "Create New Capsule", zh: "创建新胶囊" },
  capsuleName: { en: "Capsule Name", zh: "胶囊名称" },
  capsuleNamePlaceholder: { en: "Enter capsule name", zh: "输入胶囊名称" },
  secretMessage: { en: "Secret Message", zh: "秘密消息" },
  secretMessagePlaceholder: { en: "Enter your secret message", zh: "输入你的秘密消息" },
  unlockIn: { en: "Lock Duration", zh: "锁定时长" },
  daysPlaceholder: { en: "30", zh: "30" },
  days: { en: "days", zh: "天" },
  daysShort: { en: "D", zh: "天" },
  hoursShort: { en: "H", zh: "时" },
  minShort: { en: "M", zh: "分" },
  unlockDateHelper: { en: "Your capsule will unlock after this many days", zh: "你的胶囊将在这么多天后解锁" },
  createCapsuleButton: { en: "Create Capsule (3 GAS)", zh: "创建胶囊 (3 GAS)" },
  creating: { en: "Creating...", zh: "创建中..." },
  creatingCapsule: { en: "Creating capsule...", zh: "创建胶囊中..." },
  capsuleCreated: { en: "Capsule created successfully!", zh: "胶囊创建成功！" },
  error: { en: "Error", zh: "错误" },
  message: { en: "Message:", zh: "消息：" },
  tabCapsules: { en: "Capsules", zh: "胶囊" },
  tabCreate: { en: "Create", zh: "创建" },
  docs: { en: "Docs", zh: "文档" },
  docSubtitle: {
    en: "Lock messages and assets until a future date",
    zh: "锁定消息和资产直到未来日期",
  },
  docDescription: {
    en: "Time Capsule lets you create digital time capsules that lock messages or assets until a specified future date. Perfect for future gifts, scheduled reveals, or personal time-locked notes.",
    zh: "时间胶囊让您创建数字时间胶囊，锁定消息或资产直到指定的未来日期。非常适合未来礼物、定时揭晓或个人时间锁定笔记。",
  },
  step1: {
    en: "Connect your Neo wallet and create a new time capsule",
    zh: "连接您的 Neo 钱包并创建新的时间胶囊",
  },
  step2: {
    en: "Enter your secret message and set the lock duration in days",
    zh: "输入您的秘密消息并设置锁定天数",
  },
  step3: {
    en: "Pay the creation fee to seal your capsule on-chain",
    zh: "支付创建费用将您的胶囊封存在链上",
  },
  step4: {
    en: "Open your capsule when the unlock date arrives",
    zh: "当解锁日期到达时打开您的胶囊",
  },
  feature1Name: { en: "Time-Locked", zh: "时间锁定" },
  feature1Desc: {
    en: "Content is cryptographically sealed until the unlock date - no early access.",
    zh: "内容在解锁日期前加密封存 - 无法提前访问。",
  },
  feature2Name: { en: "Permanent Storage", zh: "永久存储" },
  feature2Desc: {
    en: "Your capsules are stored on Neo blockchain forever.",
    zh: "您的胶囊永久存储在 Neo 区块链上。",
  },
  wrongChain: { en: "Wrong Chain", zh: "链错误" },
  wrongChainMessage: {
    en: "This app requires Neo N3. Please switch networks.",
    zh: "此应用需要 Neo N3 网络，请切换网络。",
  },
  switchToNeo: { en: "Switch to Neo N3", zh: "切换到 Neo N3" },
};

const t = createT(translations);

const docSteps = computed(() => [t("step1"), t("step2"), t("step3"), t("step4")]);
const docFeatures = computed(() => [
  { name: t("feature1Name"), desc: t("feature1Desc") },
  { name: t("feature2Name"), desc: t("feature2Desc") },
]);

const APP_ID = "miniapp-time-capsule";
const { address, connect, invokeContract, chainType, switchChain, getContractAddress } = useWallet() as any;
const { payGAS, isLoading } = usePayments(APP_ID);
const contractAddress = ref<string | null>(null);

const ensureContractAddress = async () => {
  if (!contractAddress.value) {
    contractAddress.value = await getContractAddress();
  }
  if (!contractAddress.value) throw new Error(t("error"));
  return contractAddress.value;
};

const activeTab = ref("capsules");
const navTabs: NavTab[] = [
  { id: "capsules", icon: "lock", label: t("tabCapsules") },
  { id: "create", icon: "plus", label: t("tabCreate") },
  { id: "docs", icon: "book", label: t("docs") },
];

const capsules = ref<Capsule[]>([]);
const isLoadingData = ref(false);

const newCapsule = ref({ name: "", content: "", days: "30" });
const status = ref<{ msg: string; type: string } | null>(null);
const currentTime = ref(Date.now());

// Countdown timer
let countdownInterval: number | null = null;

onMounted(() => {
  fetchData();
  countdownInterval = setInterval(() => {
    currentTime.value = Date.now();
  }, 1000) as unknown as number;
});

onUnmounted(() => {
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }
});

const canCreate = computed(() => {
  return (
    newCapsule.value.name.trim() !== "" && newCapsule.value.content.trim() !== "" && parseInt(newCapsule.value.days) > 0
  );
});

// Fetch capsules from smart contract
const fetchData = async () => {
  if (!address.value) return;

  isLoadingData.value = true;
  try {
    const contract = await ensureContractAddress();
    const sdk = await import("@neo/uniapp-sdk").then((m) => m.waitForSDK?.() || null);
    if (!sdk?.invoke) {
      console.warn("[TimeCapsule] SDK not available");
      return;
    }

    // Get total capsules count from contract
    const totalResult = await sdk.invoke("invokeRead", {
      contract,
      method: "TotalCapsules",
      args: [],
    }) as any;

    const totalCapsules = parseInt(totalResult?.stack?.[0]?.value || "0");
    const userCapsules: Capsule[] = [];

    // Iterate through all capsules and find ones owned by current user
    for (let i = 1; i <= totalCapsules; i++) {
      const capsuleResult = await sdk.invoke("invokeRead", {
        contract,
        method: "GetCapsule",
        args: [{ type: "Integer", value: i.toString() }],
      }) as any;

      if (capsuleResult?.stack?.[0]) {
        const capsuleData = capsuleResult.stack[0].value;
        const owner = capsuleData?.owner;

        // Check if this capsule belongs to current user
        if (owner === address.value) {
          const unlockTime = parseInt(capsuleData?.unlockTime || "0");
          const unlockDate = new Date(unlockTime).toISOString().split("T")[0];
          const isRevealed = capsuleData?.isRevealed === true;

          userCapsules.push({
            id: i.toString(),
            name: `Capsule #${i}`,
            content: isRevealed ? capsuleData?.contentHash || "" : "Hidden",
            unlockDate,
            locked: !isRevealed && Date.now() < unlockTime,
          });
        }
      }
    }

    capsules.value = userCapsules;
  } catch (e) {
    console.warn("[TimeCapsule] Failed to fetch data:", e);
  } finally {
    isLoadingData.value = false;
  }
};

// Register capsule for auto-unlock via Edge Function automation
const registerAutoUnlock = async (capsuleId: string, unlockDate: string) => {
  try {
    await fetch("/api/automation/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        appId: APP_ID,
        taskName: `unlock-${capsuleId}`,
        taskType: "scheduled",
        payload: {
          action: "custom",
          handler: "timeCapsule:unlock",
          data: { capsuleId, unlockDate },
        },
      }),
    });
  } catch (e) {
    console.warn("[TimeCapsule] Failed to register auto-unlock:", e);
  }
};

const create = async () => {
  if (isLoading.value || !canCreate.value) return;

  try {
    status.value = { msg: t("creatingCapsule"), type: "loading" };

    // Ensure wallet is connected
    if (!address.value) {
      await connect();
    }
    if (!address.value) {
      throw new Error("Please connect wallet");
    }

    const contract = await ensureContractAddress();

    // Pay the creation fee
    const payment = await payGAS("3", `create:${Date.now()}`);
    const receiptId = payment.receipt_id;
    if (!receiptId) {
      throw new Error("Payment receipt missing");
    }

    // Calculate unlock timestamp
    const unlockDate = new Date();
    unlockDate.setDate(unlockDate.getDate() + parseInt(newCapsule.value.days));
    const unlockTimestamp = Math.floor(unlockDate.getTime() / 1000);
    const unlockDateStr = unlockDate.toISOString().split("T")[0];

    // Create capsule on-chain
    const tx = await invokeContract({
      scriptHash: contract,
      operation: "CreateCapsule",
      args: [
        { type: "Hash160", value: address.value },
        { type: "String", value: newCapsule.value.name },
        { type: "String", value: newCapsule.value.content },
        { type: "Integer", value: String(unlockTimestamp) },
        { type: "Integer", value: String(receiptId) },
      ],
    });

    const txid = String((tx as any)?.txid || (tx as any)?.txHash || "");
    const capsuleId = txid || Date.now().toString();

    // Add to local list
    capsules.value.push({
      id: capsuleId,
      name: newCapsule.value.name,
      content: newCapsule.value.content,
      unlockDate: unlockDateStr,
      locked: true,
    });

    // Register for auto-unlock via automation service
    await registerAutoUnlock(capsuleId, unlockDateStr);

    status.value = { msg: t("capsuleCreated"), type: "success" };
    newCapsule.value = { name: "", content: "", days: "30" };
    activeTab.value = "capsules";
  } catch (e: any) {
    status.value = { msg: e.message || t("error"), type: "error" };
  }
};

const open = (cap: Capsule) => {
  status.value = { msg: `${t("message")} ${cap.content}`, type: "success" };
};
</script>

<style lang="scss" scoped>
@use "@/shared/styles/tokens.scss" as *;
@use "@/shared/styles/variables.scss";

.app-container {
  padding: $space-4;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: $space-4;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.tab-content {
  flex: 1;
}



@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.scrollable {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>
