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

    <!-- Destroy Tab -->
    <view v-if="activeTab === 'destroy'" class="tab-content">
      <StatusMessage :status="status" />



      <DestructionChamber
        v-model:assetHash="assetHash"
        :is-destroying="isDestroying"
        :show-warning-shake="showWarningShake"
        :t="t as any"
        @initiate="initiateDestroy"
      />

      <ConfirmDestroyModal
        :show="showConfirm"
        :asset-hash="assetHash"
        :t="t as any"
        @cancel="showConfirm = false"
        @confirm="executeDestroy"
      />
    </view>

    <!-- Stats Tab -->
    <view v-if="activeTab === 'stats'" class="tab-content">
      <GraveyardHero :total-destroyed="totalDestroyed" :gas-reclaimed="gasReclaimed" :t="t as any" />
    </view>

    <!-- History Tab -->
    <HistoryTab v-if="activeTab === 'history'" :history="history" :t="t as any" />

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
    <Fireworks :active="status?.type === 'success'" :duration="3000" />
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useWallet, usePayments, useEvents } from "@neo/uniapp-sdk";
import { useI18n } from "@/composables/useI18n";
import { parseInvokeResult, parseStackItem } from "@/shared/utils/neo";
import AppLayout from "@/shared/components/AppLayout.vue";
import NeoDoc from "@/shared/components/NeoDoc.vue";
import NeoCard from "@/shared/components/NeoCard.vue";
import NeoButton from "@/shared/components/NeoButton.vue";
import Fireworks from "../../../../../shared/components/Fireworks.vue";
import GraveyardHero from "./components/GraveyardHero.vue";
import DestructionChamber from "./components/DestructionChamber.vue";
import ConfirmDestroyModal from "./components/ConfirmDestroyModal.vue";
import HistoryTab from "./components/HistoryTab.vue";
import StatusMessage from "./components/StatusMessage.vue";


const { t } = useI18n();

const navTabs = computed(() => [
  { id: "destroy", icon: "trash", label: t("destroy") },
  { id: "stats", icon: "chart", label: t("tabStats") },
  { id: "history", icon: "time", label: t("history") },
  { id: "docs", icon: "book", label: t("docs") },
]);

const activeTab = ref("destroy");

const docSteps = computed(() => [t("step1"), t("step2"), t("step3"), t("step4")]);
const docFeatures = computed(() => [
  { name: t("feature1Name"), desc: t("feature1Desc") },
  { name: t("feature2Name"), desc: t("feature2Desc") },
]);

const APP_ID = "miniapp-graveyard";
const { address, connect, invokeContract, invokeRead, chainType, switchChain, getContractAddress } = useWallet() as any;
const { payGAS, isLoading } = usePayments(APP_ID);
const { list: listEvents } = useEvents();

interface HistoryItem {
  id: string;
  hash: string;
  time: string;
}

const totalDestroyed = ref(0);
const gasReclaimed = ref(0);
const assetHash = ref("");
const status = ref<{ msg: string; type: string } | null>(null);
const history = ref<HistoryItem[]>([]);
const showConfirm = ref(false);
const isDestroying = ref(false);
const showWarningShake = ref(false);
const contractAddress = ref<string | null>(null);

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

const ensureContractAddress = async () => {
  if (!contractAddress.value) {
    contractAddress.value = await getContractAddress();
  }
  return contractAddress.value;
};

const initiateDestroy = () => {
  if (!assetHash.value) {
    status.value = { msg: t("enterAssetHash"), type: "error" };
    showWarningShake.value = true;
    setTimeout(() => (showWarningShake.value = false), 500);
    return;
  }
  showConfirm.value = true;
};

const executeDestroy = async () => {
  showConfirm.value = false;
  if (isLoading.value || isDestroying.value) return;
  isDestroying.value = true;

  try {
    if (!address.value) await connect();
    if (!address.value) throw new Error(t("connectWallet"));
    const contract = await ensureContractAddress();

    const payment = await payGAS("0.1", `graveyard:bury:${assetHash.value.slice(0, 10)}`);
    const receiptId = payment.receipt_id;
    if (!receiptId) throw new Error(t("receiptMissing"));

    const tx = await invokeContract({
      contractAddress: contract,
      operation: "buryMemory",
      args: [
        { type: "Hash160", value: address.value as string },
        { type: "String", value: assetHash.value },
        { type: "Integer", value: "0" }, // memoryType: 0 = default
        { type: "Integer", value: String(receiptId) },
      ],
    });

    const txid = String((tx as any)?.txid || (tx as any)?.txHash || "");
    const evt = txid ? await waitForEvent(txid, "MemoryBuried") : null;
    if (!evt) throw new Error(t("buryPending"));

    const values = Array.isArray((evt as any)?.state) ? (evt as any).state.map(parseStackItem) : [];
    const memoryId = String(values[0] ?? "");
    const contentHash = String(values[2] ?? assetHash.value);
    history.value.unshift({
      id: memoryId || String(Date.now()),
      hash: contentHash,
      time: new Date(evt.created_at || Date.now()).toLocaleString(),
    });

    totalDestroyed.value += 1;
    gasReclaimed.value = Number((totalDestroyed.value * 0.1).toFixed(2));
    status.value = { msg: t("assetDestroyed"), type: "success" };
    assetHash.value = "";
  } catch (e: any) {
    status.value = { msg: e?.message || t("error"), type: "error" };
  } finally {
    isDestroying.value = false;
  }
};

const loadStats = async () => {
  if (!contractAddress.value) {
    contractAddress.value = (await ensureContractAddress()) as string;
  }
  if (!contractAddress.value) return;
  try {
    const totalRes = await invokeRead({ contractAddress: contractAddress.value, operation: "totalMemories" });
    totalDestroyed.value = Number(parseInvokeResult(totalRes) || 0);
    gasReclaimed.value = Number((totalDestroyed.value * 0.1).toFixed(2));
  } catch {
  }
};

const loadHistory = async () => {
  try {
    const res = await listEvents({ app_id: APP_ID, event_name: "MemoryBuried", limit: 20 });
    history.value = res.events.map((evt) => {
      const values = Array.isArray((evt as any)?.state) ? (evt as any).state.map(parseStackItem) : [];
      return {
        id: String(values[0] ?? evt.id),
        hash: String(values[2] ?? ""),
        time: new Date(evt.created_at || Date.now()).toLocaleString(),
      };
    });
  } catch {
  }
};

onMounted(async () => {
  await loadStats();
  await loadHistory();
});

watch(activeTab, async (tab) => {
  if (tab === "history") {
    await loadHistory();
  }
});
</script>

<style lang="scss" scoped>
@use "@/shared/styles/tokens.scss" as *;
@use "@/shared/styles/variables.scss";

@import url('https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&display=swap');

$grave-bg: #000000;
$grave-accent: #33ff00; /* Glitch Green */
$grave-danger: #ff003c;
$grave-text: #e0e0e0;
$grave-grid: #1a1a1a;
$grave-font: 'Courier Prime', monospace;

:global(page) {
  background: $grave-bg;
  font-family: $grave-font;
}

.tab-content {
  padding: 24px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
  background-color: $grave-bg;
  min-height: 100vh;
  position: relative;
  
  /* Matrix/Grid background */
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background-image: 
      linear-gradient($grave-grid 1px, transparent 1px),
      linear-gradient(90deg, $grave-grid 1px, transparent 1px);
    background-size: 20px 20px;
    pointer-events: none;
    z-index: 0;
  }
}

.scrollable {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* Digital Afterlife Component Overrides */
:deep(.neo-card) {
  background: rgba(10, 10, 10, 0.9) !important;
  border: 1px solid $grave-grid !important;
  border-left: 4px solid $grave-accent !important;
  border-radius: 0 !important;
  box-shadow: 5px 5px 0 $grave-grid !important;
  color: $grave-text !important;
  font-family: $grave-font !important;
  position: relative;
  z-index: 1;
  
  &.variant-danger {
    background: rgba(20, 0, 0, 0.9) !important;
    border-color: $grave-danger !important;
    color: $grave-danger !important;
    text-shadow: 0 0 5px $grave-danger;
  }
}

:deep(.neo-button) {
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-family: $grave-font !important;
  font-weight: 700 !important;
  border-radius: 0 !important;
  transition: all 0.1s steps(2);
  
  &.variant-primary {
    background: $grave-accent !important;
    color: #000 !important;
    border: none !important;
    box-shadow: 3px 3px 0 $grave-grid !important;
    
    &:hover {
      transform: translate(-2px, -2px);
      box-shadow: 5px 5px 0 $grave-grid !important;
    }
    
    &:active {
      transform: translate(0, 0);
      box-shadow: 0 0 0 !important;
    }
  }
  
  &.variant-secondary {
    background: transparent !important;
    border: 1px solid $grave-accent !important;
    color: $grave-accent !important;
    
    &:hover {
      background: rgba($grave-accent, 0.1) !important;
    }
  }
  
  &.variant-danger {
    background: $grave-danger !important;
    color: #000 !important;
    box-shadow: 3px 3px 0 rgba(255,0,0,0.3) !important;
  }
}

:deep(input), :deep(.neo-input) {
  background: #000 !important;
  border: 1px solid $grave-text !important;
  color: $grave-accent !important;
  font-family: $grave-font !important;
  border-radius: 0 !important;
  caret-color: $grave-accent;
  
  &:focus {
    border-color: $grave-accent !important;
    box-shadow: 0 0 10px rgba($grave-accent, 0.3) !important;
  }
}
</style>
