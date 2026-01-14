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

    <!-- Destroy Tab -->
    <view v-if="activeTab === 'destroy'" class="tab-content">
      <StatusMessage :status="status" />

      <GraveyardHero :total-destroyed="totalDestroyed" :gas-reclaimed="gasReclaimed" :t="t as any" />

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
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useWallet, usePayments, useEvents } from "@neo/uniapp-sdk";
import { formatNumber } from "@/shared/utils/format";
import { createT } from "@/shared/utils/i18n";
import { parseInvokeResult, parseStackItem } from "@/shared/utils/neo";
import AppLayout from "@/shared/components/AppLayout.vue";
import NeoDoc from "@/shared/components/NeoDoc.vue";
import NeoCard from "@/shared/components/NeoCard.vue";
import NeoButton from "@/shared/components/NeoButton.vue";
import GraveyardHero from "./components/GraveyardHero.vue";
import DestructionChamber from "./components/DestructionChamber.vue";
import ConfirmDestroyModal from "./components/ConfirmDestroyModal.vue";
import HistoryTab from "./components/HistoryTab.vue";
import StatusMessage from "./components/StatusMessage.vue";

const translations = {
  title: { en: "Graveyard", zh: "数字墓地" },
  subtitle: { en: "Permanent data destruction", zh: "永久数据销毁" },
  destructionStats: { en: "Destruction Stats", zh: "销毁统计" },
  itemsDestroyed: { en: "Destroyed", zh: "已销毁" },
  gasReclaimed: { en: "GAS Fees", zh: "GAS 费用" },
  destroyAsset: { en: "Destruction Chamber", zh: "销毁室" },
  assetHashPlaceholder: { en: "Enter asset hash or token ID...", zh: "输入资产哈希或代币ID..." },
  warning: { en: "⚠ DANGER ZONE", zh: "⚠ 危险区域" },
  warningText: {
    en: "This action is IRREVERSIBLE. The asset will be permanently destroyed and cannot be recovered.",
    zh: "此操作不可逆转。资产将被永久销毁，无法恢复。",
  },
  destroyForever: { en: "DESTROY FOREVER", zh: "永久销毁" },
  destroying: { en: "DESTROYING...", zh: "销毁中..." },
  recentDestructions: { en: "Destruction Records", zh: "销毁记录" },
  enterAssetHash: { en: "Please enter asset hash", zh: "请输入资产哈希" },
  assetDestroyed: { en: "Asset has been permanently destroyed", zh: "资产已永久销毁" },
  destroy: { en: "Destroy", zh: "销毁" },
  history: { en: "History", zh: "历史" },
  records: { en: "records", zh: "条记录" },
  destroyed: { en: "DESTROYED", zh: "已销毁" },
  noDestructions: { en: "No destruction records yet", zh: "暂无销毁记录" },
  confirmTitle: { en: "Confirm Destruction", zh: "确认销毁" },
  confirmText: { en: "Are you absolutely sure? This cannot be undone.", zh: "您确定吗？此操作无法撤销。" },
  confirmDestroy: { en: "Yes, Destroy It", zh: "确认销毁" },
  cancel: { en: "Cancel", zh: "取消" },
  connectWallet: { en: "Connect wallet", zh: "请连接钱包" },
  contractUnavailable: { en: "Contract unavailable", zh: "合约不可用" },
  receiptMissing: { en: "Payment receipt missing", zh: "支付凭证缺失" },
  buryPending: { en: "Burial confirmation pending", zh: "销毁确认中" },
  error: { en: "Error", zh: "错误" },
  docs: { en: "Docs", zh: "文档" },
  docSubtitle: { en: "Permanent asset destruction service", zh: "永久资产销毁服务" },
  docDescription: {
    en: "Graveyard provides a secure way to permanently destroy digital assets on the Neo blockchain. Once destroyed, assets cannot be recovered.",
    zh: "数字墓地提供在Neo区块链上永久销毁数字资产的安全方式。一旦销毁，资产将无法恢复。",
  },
  step1: { en: "Enter the asset hash or token ID", zh: "输入资产哈希或代币ID" },
  step2: { en: "Review the warning carefully", zh: "仔细阅读警告信息" },
  step3: { en: "Confirm destruction - this is permanent!", zh: "确认销毁 - 此操作永久生效！" },
  step4: { en: "View destruction records in the History tab.", zh: "在历史标签页查看销毁记录。" },
  feature1Name: { en: "Permanent Deletion", zh: "永久删除" },
  feature1Desc: { en: "Assets are destroyed on-chain forever", zh: "资产在链上永久销毁" },
  feature2Name: { en: "On-Chain Proofs", zh: "链上证明" },
  feature2Desc: { en: "Destruction is recorded on-chain", zh: "销毁记录上链" },
  wrongChain: { en: "Wrong Network", zh: "网络错误" },
  wrongChainMessage: { en: "This app requires Neo N3 network.", zh: "此应用需 Neo N3 网络。" },
  switchToNeo: { en: "Switch to Neo N3", zh: "切换到 Neo N3" },
};

const t = createT(translations);

const navTabs = [
  { id: "destroy", icon: "trash", label: t("destroy") },
  { id: "history", icon: "time", label: t("history") },
  { id: "docs", icon: "book", label: t("docs") },
];

const activeTab = ref("destroy");

const docSteps = computed(() => [t("step1"), t("step2"), t("step3"), t("step4")]);
const docFeatures = computed(() => [
  { name: t("feature1Name"), desc: t("feature1Desc") },
  { name: t("feature2Name"), desc: t("feature2Desc") },
]);

const APP_ID = "miniapp-graveyard";
const { address, connect, invokeContract, invokeRead, chainType, switchChain } = useWallet() as any;
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
const contractAddress = ref<string>("0x50ac1c37690cc2cfc594472833cf57505d5f46de"); // Placeholder/Demo Contract

const formatNum = (n: number) => formatNumber(n, 2);

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
      operation: "BuryMemory",
      args: [
        { type: "Hash160", value: address.value as string },
        { type: "String", value: assetHash.value },
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
    const totalRes = await invokeRead({ contractAddress: contractAddress.value, operation: "TotalMemories" });
    totalDestroyed.value = Number(parseInvokeResult(totalRes) || 0);
    gasReclaimed.value = Number((totalDestroyed.value * 0.1).toFixed(2));
  } catch (e) {
    console.warn("[Graveyard] Failed to load stats:", e);
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
  } catch (e) {
    console.warn("[Graveyard] Failed to load history:", e);
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

.tab-content {
  padding: $space-6;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: $space-6;
}

.scrollable {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>
