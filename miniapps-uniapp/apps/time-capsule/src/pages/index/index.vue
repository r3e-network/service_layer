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
          v-model:title="newCapsule.title"
          v-model:content="newCapsule.content"
          v-model:days="newCapsule.days"
          v-model:is-public="newCapsule.isPublic"
          v-model:category="newCapsule.category"
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
import { useI18n } from "@/composables/useI18n";
import { sha256Hex } from "@/shared/utils/hash";
import { addressToScriptHash, normalizeScriptHash, parseInvokeResult, parseStackItem } from "@/shared/utils/neo";
import { AppLayout, NeoDoc, NeoCard, NeoButton } from "@/shared/components";
import type { NavTab } from "@/shared/components/NavBar.vue";

import CapsuleList, { type Capsule } from "./components/CapsuleList.vue";
import CreateCapsuleForm from "./components/CreateCapsuleForm.vue";


const { t } = useI18n();

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
const navTabs = computed<NavTab[]>(() => [
  { id: "capsules", icon: "lock", label: t("tabCapsules") },
  { id: "create", icon: "plus", label: t("tabCreate") },
  { id: "docs", icon: "book", label: t("docs") },
]);

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

const newCapsule = ref({ title: "", content: "", days: "30", isPublic: false, category: 1 });
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
  return (
    newCapsule.value.title.trim() !== "" &&
    newCapsule.value.content.trim() !== "" &&
    parseInt(newCapsule.value.days) > 0
  );
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
        let title = "";

        try {
          const capsuleRes = await invokeRead({
            contractAddress: contract,
            operation: "getCapsuleDetails",
            args: [{ type: "Integer", value: id }],
          });
          const parsed = parseInvokeResult(capsuleRes);
          if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
            const data = parsed as Record<string, unknown>;
            contentHash = String(data.contentHash || "");
            unlockTime = toNumber(data.unlockTime ?? unlockTimeEvent);
            isPublic = typeof data.isPublic === "boolean" ? data.isPublic : Boolean(data.isPublic ?? isPublicEvent);
            revealed = Boolean(data.isRevealed);
            title = String(data.title || "");
          }
        } catch {
          // fallback to event values
        }

        const unlockDate = unlockTime ? new Date(unlockTime * 1000).toISOString().split("T")[0] : "N/A";
        const content = contentHash ? localContent.value[contentHash] : "";

        return {
          id,
          title,
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
  } catch {
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
      throw new Error(t("connectWallet"));
    }

    const contract = await ensureContractAddress();

    // Pay the creation fee
    const payment = await payGAS(BURY_FEE, `time-capsule:bury:${Date.now()}`);
    const receiptId = payment.receipt_id;
    if (!receiptId) {
      throw new Error(t("receiptMissing"));
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
        { type: "String", value: newCapsule.value.title.trim().slice(0, 100) },
        { type: "Integer", value: String(unlockTimestamp) },
        { type: "Boolean", value: newCapsule.value.isPublic },
        { type: "Integer", value: String(newCapsule.value.category) },
        { type: "Integer", value: String(receiptId) },
      ],
    });

    saveLocalContent(contentHash, content);

    status.value = { msg: t("capsuleCreated"), type: "success" };
    newCapsule.value = { title: "", content: "", days: "30", isPublic: false, category: 1 };
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
      throw new Error(t("connectWallet"));
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
      throw new Error(t("connectWallet"));
    }

    const contract = await ensureContractAddress();
    const payment = await payGAS(FISH_FEE, `time-capsule:fish:${Date.now()}`);
    const receiptId = payment.receipt_id;
    if (!receiptId) {
      throw new Error(t("receiptMissing"));
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

$vault-bg: #0f172a;
$vault-panel: #1e293b;
$vault-cyan: #06b6d4;
$vault-text: #e2e8f0;

:global(page) {
  background: $vault-bg;
}

.app-container {
  padding: 24px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  background: radial-gradient(circle at 50% 0%, #334155 0%, #0f172a 100%);
  min-height: 100vh;
  position: relative;
  
  /* Tech Grid Background */
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: 
      linear-gradient(rgba(6, 182, 212, 0.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(6, 182, 212, 0.05) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events: none;
    z-index: 0;
  }
}

.tab-content {
  flex: 1;
  z-index: 1;
}

.helper-text {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  color: $vault-cyan;
  opacity: 0.8;
  letter-spacing: 0.05em;
}

/* Sci-fi UI Overrides */
:deep(.neo-card) {
  background: rgba(30, 41, 59, 0.8) !important;
  border: 1px solid rgba(6, 182, 212, 0.3) !important;
  box-shadow: 0 0 20px rgba(6, 182, 212, 0.1) !important;
  border-radius: 8px !important;
  color: $vault-text !important;
  backdrop-filter: blur(8px);
  position: relative;
  overflow: hidden;
  
  /* Corner accents */
  &::after {
    content: '';
    position: absolute;
    top: 0; left: 0; width: 10px; height: 10px;
    border-top: 2px solid $vault-cyan;
    border-left: 2px solid $vault-cyan;
  }
}

:deep(.neo-button) {
  border-radius: 4px !important;
  font-family: 'JetBrains Mono', monospace !important;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  
  &.variant-primary {
    background: linear-gradient(90deg, $vault-cyan 0%, #0891b2 100%) !important;
    color: #fff !important;
    box-shadow: 0 0 10px rgba(6, 182, 212, 0.4) !important;
  }
  
  &.variant-secondary {
    background: transparent !important;
    border: 1px solid $vault-cyan !important;
    color: $vault-cyan !important;
    
    &:hover {
      background: rgba(6, 182, 212, 0.1) !important;
    }
  }
}

:deep(.neo-input) {
  background: rgba(15, 23, 42, 0.8) !important;
  border: 1px solid #334155 !important;
  color: $vault-cyan !important;
  font-family: monospace !important;
  
  &:focus-within {
    border-color: $vault-cyan !important;
    box-shadow: 0 0 10px rgba(6, 182, 212, 0.2) !important;
  }
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
