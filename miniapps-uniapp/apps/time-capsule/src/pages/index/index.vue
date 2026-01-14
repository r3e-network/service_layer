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

    <view v-if="activeTab === 'capsules' || activeTab === 'create'" class="app-container">
      <NeoCard v-if="status" :variant="status.type === 'success' ? 'success' : status.type === 'loading' ? 'accent' : 'danger'" class="mb-4 text-center">
        <text class="status-text font-bold uppercase tracking-wider">{{ status.msg }}</text>
      </NeoCard>

      <!-- Capsules Tab -->
      <view v-if="activeTab === 'capsules'" class="tab-content">
        <NeoCard variant="erobo-neo" class="mb-4">
          <text class="helper-text neutral">{{ t("fishDescription") }}</text>
          <NeoButton
            variant="secondary"
            size="md"
            block
            :loading="isBusy"
            :disabled="isBusy"
            class="mt-3"
            @click="fish"
          >
            {{ t("fishButton") }}
          </NeoButton>
        </NeoCard>
        <CapsuleList :capsules="capsules" :current-time="currentTime" :t="t as any" @open="open" />
      </view>

      <!-- Create Tab -->
      <view v-if="activeTab === 'create'" class="tab-content">
        <CreateCapsuleForm
          v-model:content="newCapsule.content"
          v-model:days="newCapsule.days"
          v-model:is-public="newCapsule.isPublic"
          :is-loading="isBusy"
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
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useWallet, usePayments, useEvents } from "@neo/uniapp-sdk";
import { createT } from "@/shared/utils/i18n";
import { sha256Hex } from "@/shared/utils/hash";
import { addressToScriptHash, normalizeScriptHash, parseInvokeResult, parseStackItem } from "@/shared/utils/neo";
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
  unlocked: { en: "Unlocked", zh: "已解锁" },
  revealed: { en: "Revealed", zh: "已揭示" },
  reveal: { en: "Reveal Capsule", zh: "揭示胶囊" },
  open: { en: "Open Capsule", zh: "打开胶囊" },
  createCapsule: { en: "Create New Capsule", zh: "创建新胶囊" },
  secretMessage: { en: "Secret Message", zh: "秘密消息" },
  secretMessagePlaceholder: { en: "Enter your secret message", zh: "输入你的秘密消息" },
  contentStorageNote: {
    en: "Your full message is stored locally on this device. Keep a backup if you want to reveal it later.",
    zh: "完整消息仅保存在本设备本地。请自行备份以便日后揭示。",
  },
  unlockIn: { en: "Lock Duration", zh: "锁定时长" },
  daysPlaceholder: { en: "30", zh: "30" },
  days: { en: "days", zh: "天" },
  daysShort: { en: "D", zh: "天" },
  hoursShort: { en: "H", zh: "时" },
  minShort: { en: "M", zh: "分" },
  unlockDateHelper: { en: "Your capsule will unlock after this many days", zh: "你的胶囊将在这么多天后解锁" },
  visibility: { en: "Visibility", zh: "可见性" },
  private: { en: "Private", zh: "私密" },
  public: { en: "Public", zh: "公开" },
  privateHint: { en: "Only you can reveal after unlock", zh: "仅您可在解锁后揭示" },
  publicHint: { en: "Anyone can reveal after unlock", zh: "解锁后任何人可揭示" },
  createCapsuleButton: { en: "Create Capsule (0.2 GAS)", zh: "创建胶囊 (0.2 GAS)" },
  creating: { en: "Creating...", zh: "创建中..." },
  creatingCapsule: { en: "Sealing capsule...", zh: "封存胶囊中..." },
  capsuleCreated: { en: "Capsule sealed on-chain!", zh: "胶囊已封存上链！" },
  capsuleRevealed: { en: "Capsule revealed", zh: "胶囊已揭示" },
  revealing: { en: "Revealing capsule...", zh: "揭示胶囊中..." },
  fish: { en: "Fish a capsule", zh: "打捞胶囊" },
  fishing: { en: "Fishing...", zh: "打捞中..." },
  fishButton: { en: "Fish (0.05 GAS)", zh: "打捞 (0.05 GAS)" },
  fishDescription: {
    en: "Try your luck to discover a public capsule. A capsule is returned only if a public, unrevealed one exists.",
    zh: "尝试发现公开胶囊，仅在存在公开且未揭示的胶囊时返回。",
  },
  fishResult: { en: "Fished capsule #{id}", zh: "打捞到胶囊 #{id}" },
  fishNone: { en: "No public capsule found", zh: "未发现公开胶囊" },
  hashStored: { en: "Content hash stored on-chain", zh: "内容哈希已上链" },
  hashLabel: { en: "Hash:", zh: "哈希：" },
  contentUnavailable: {
    en: "No local message found. The on-chain hash is shown below.",
    zh: "未找到本地消息，下面展示链上哈希。",
  },
  notUnlocked: { en: "Capsule is still locked", zh: "胶囊仍处于锁定状态" },
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
    en: "Time Capsule lets you lock a message hash on-chain until a future date. Keep the message safe off-chain and reveal the capsule when the unlock time arrives.",
    zh: "时间胶囊允许您将消息哈希封存上链直到未来日期。请离线保存消息内容，解锁后再揭示。",
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
    en: "Commit the message hash on-chain until the unlock date.",
    zh: "在解锁日期前将消息哈希封存上链。",
  },
  feature2Name: { en: "Permanent Storage", zh: "永久存储" },
  feature2Desc: {
    en: "Capsule metadata is stored on Neo permanently.",
    zh: "胶囊元数据永久存储在 Neo 区块链上。",
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
const { address, connect, invokeContract, invokeRead, chainType, switchChain, getContractAddress } = useWallet() as any;
const { payGAS, isLoading } = usePayments(APP_ID);
const { list: listEvents } = useEvents();
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

const BURY_FEE = "0.2";
const FISH_FEE = "0.05";
const CONTENT_STORE_KEY = "time-capsule-content";

const loadLocalContent = () => {
  try {
    const raw = uni.getStorageSync(CONTENT_STORE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    const normalized: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === "string") {
        normalized[key] = value;
      } else if (value && typeof value === "object") {
        const legacy = value as { hash?: string; content?: string };
        const hashKey = String(legacy.hash || key);
        if (legacy.content) {
          normalized[hashKey] = String(legacy.content);
        }
      }
    }
    return normalized;
  } catch {
    return {};
  }
};

const localContent = ref<Record<string, string>>(loadLocalContent());
const saveLocalContent = (hash: string, content: string) => {
  if (!hash) return;
  localContent.value = { ...localContent.value, [hash]: content };
  try {
    uni.setStorageSync(CONTENT_STORE_KEY, JSON.stringify(localContent.value));
  } catch {
    // ignore storage errors
  }
};

const newCapsule = ref({ content: "", days: "30", isPublic: false });
const status = ref<{ msg: string; type: string } | null>(null);
const currentTime = ref(Date.now());
const isProcessing = ref(false);
const isBusy = computed(() => isLoading.value || isProcessing.value);

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

watch(address, () => {
  fetchData();
});

const canCreate = computed(() => {
  return newCapsule.value.content.trim() !== "" && parseInt(newCapsule.value.days) > 0;
});

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

const toNumber = (value: unknown) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

// Fetch capsules from smart contract
const fetchData = async () => {
  if (!address.value) return;

  isLoadingData.value = true;
  try {
    const contract = await ensureContractAddress();
    const buriedEvents = await listAllEvents("CapsuleBuried");

    const userCapsules = await Promise.all(
      buriedEvents.map(async (evt) => {
        const values = Array.isArray(evt?.state) ? evt.state.map(parseStackItem) : [];
        const owner = values[0];
        const id = String(values[1] || "");
        const unlockTimeEvent = toNumber(values[2] || 0);
        const isPublicEvent = Boolean(values[3]);
        if (!id || !ownerMatches(owner)) return null;

        let contentHash = "";
        let unlockTime = unlockTimeEvent;
        let isPublic = isPublicEvent;
        let revealed = false;

        try {
          const capsuleRes = await invokeRead({
            contractAddress: contract,
            operation: "getCapsule",
            args: [{ type: "Integer", value: id }],
          });
          const parsed = parseInvokeResult(capsuleRes);
          if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
            const data = parsed as Record<string, unknown>;
            contentHash = String(data.contentHash || "");
            unlockTime = toNumber(data.unlockTime ?? unlockTimeEvent);
            isPublic = typeof data.isPublic === "boolean" ? data.isPublic : Boolean(data.isPublic ?? isPublicEvent);
            revealed = Boolean(data.isRevealed);
          }
        } catch {
          // fallback to event values
        }

        const unlockDate = unlockTime ? new Date(unlockTime * 1000).toISOString().split("T")[0] : "N/A";
        const content = contentHash ? localContent.value[contentHash] : "";

        return {
          id,
          contentHash,
          unlockDate,
          unlockTime,
          locked: !revealed && Date.now() < unlockTime * 1000,
          revealed,
          isPublic,
          content,
        } as Capsule;
      })
    );

    capsules.value = (userCapsules.filter(Boolean) as Capsule[]).sort(
      (a, b) => Number(b.id) - Number(a.id)
    );
  } catch (e) {
    console.warn("[TimeCapsule] Failed to fetch data:", e);
  } finally {
    isLoadingData.value = false;
  }
};

const create = async () => {
  if (isBusy.value || !canCreate.value) return;

  try {
    status.value = { msg: t("creatingCapsule"), type: "loading" };
    isProcessing.value = true;

    // Ensure wallet is connected
    if (!address.value) {
      await connect();
    }
    if (!address.value) {
      throw new Error("Please connect wallet");
    }

    const contract = await ensureContractAddress();

    // Pay the creation fee
    const payment = await payGAS(BURY_FEE, `time-capsule:bury:${Date.now()}`);
    const receiptId = payment.receipt_id;
    if (!receiptId) {
      throw new Error("Payment receipt missing");
    }

    // Calculate unlock timestamp
    const unlockDate = new Date();
    unlockDate.setDate(unlockDate.getDate() + parseInt(newCapsule.value.days));
    const unlockTimestamp = Math.floor(unlockDate.getTime() / 1000);
    const content = newCapsule.value.content.trim();
    const contentHash = await sha256Hex(content);

    // Create capsule on-chain
    await invokeContract({
      scriptHash: contract,
      operation: "bury",
      args: [
        { type: "Hash160", value: address.value },
        { type: "String", value: contentHash },
        { type: "Integer", value: String(unlockTimestamp) },
        { type: "Boolean", value: newCapsule.value.isPublic },
        { type: "Integer", value: String(receiptId) },
      ],
    });

    saveLocalContent(contentHash, content);

    status.value = { msg: t("capsuleCreated"), type: "success" };
    newCapsule.value = { content: "", days: "30", isPublic: false };
    activeTab.value = "capsules";
    await fetchData();
  } catch (e: any) {
    status.value = { msg: e.message || t("error"), type: "error" };
  } finally {
    isProcessing.value = false;
  }
};

const open = async (cap: Capsule) => {
  if (cap.locked) {
    status.value = { msg: t("notUnlocked"), type: "error" };
    return;
  }
  if (isBusy.value) return;

  try {
    isProcessing.value = true;
    const contract = await ensureContractAddress();

    if (!address.value) {
      await connect();
    }
    if (!address.value) {
      throw new Error("Please connect wallet");
    }

    if (!cap.revealed) {
      status.value = { msg: t("revealing"), type: "loading" };
      await invokeContract({
        scriptHash: contract,
        operation: "reveal",
        args: [
          { type: "Hash160", value: address.value },
          { type: "Integer", value: cap.id },
        ],
      });
      await fetchData();
    }

    const content = cap.contentHash ? localContent.value[cap.contentHash] : "";
    if (content) {
      status.value = { msg: `${t("message")} ${content}`, type: "success" };
    } else if (cap.contentHash) {
      status.value = { msg: `${t("contentUnavailable")} ${cap.contentHash}`, type: "success" };
    } else {
      status.value = { msg: t("capsuleRevealed"), type: "success" };
    }
  } catch (e: any) {
    status.value = { msg: e.message || t("error"), type: "error" };
  } finally {
    isProcessing.value = false;
  }
};

const fish = async () => {
  if (isBusy.value) return;

  try {
    isProcessing.value = true;
    status.value = { msg: t("fishing"), type: "loading" };
    const requestStartedAt = Date.now();

    if (!address.value) {
      await connect();
    }
    if (!address.value) {
      throw new Error("Please connect wallet");
    }

    const contract = await ensureContractAddress();
    const payment = await payGAS(FISH_FEE, `time-capsule:fish:${Date.now()}`);
    const receiptId = payment.receipt_id;
    if (!receiptId) {
      throw new Error("Payment receipt missing");
    }

    await invokeContract({
      scriptHash: contract,
      operation: "fish",
      args: [
        { type: "Hash160", value: address.value },
        { type: "Integer", value: String(receiptId) },
      ],
    });

    const fishEvents = await listAllEvents("CapsuleFished");
    const match = fishEvents.find((evt) => {
      const values = Array.isArray(evt?.state) ? evt.state.map(parseStackItem) : [];
      const timestamp = evt?.created_at ? new Date(evt.created_at).getTime() : 0;
      return ownerMatches(values[0]) && timestamp >= requestStartedAt - 1000;
    });

    if (match) {
      const values = Array.isArray(match?.state) ? match.state.map(parseStackItem) : [];
      const fishedId = String(values[1] || "");
      status.value = { msg: t("fishResult").replace("{id}", fishedId || "?"), type: "success" };
    } else {
      status.value = { msg: t("fishNone"), type: "success" };
    }
  } catch (e: any) {
    status.value = { msg: e.message || t("error"), type: "error" };
  } finally {
    isProcessing.value = false;
  }
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

.helper-text {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.6);
  opacity: 0.7;
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
