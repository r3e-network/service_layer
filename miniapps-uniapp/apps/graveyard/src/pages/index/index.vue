<template>
  <AppLayout :title="t('title')" show-top-nav :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <!-- Destroy Tab -->
    <view v-if="activeTab === 'destroy'" class="tab-content">
      <view v-if="status" :class="['status-msg', status.type]">
        <text>{{ status.msg }}</text>
      </view>

      <!-- Animated Graveyard Hero -->
      <view class="graveyard-hero">
        <view class="tombstone-scene">
          <view class="moon"></view>
          <view class="fog fog-1"></view>
          <view class="fog fog-2"></view>
          <view v-for="i in 3" :key="i" :class="['tombstone', `tombstone-${i}`]">
            <view class="tombstone-top"></view>
            <view class="tombstone-body">
              <text class="rip">R.I.P</text>
            </view>
          </view>
          <view class="ground"></view>
        </view>
        <view class="hero-stats">
          <view class="hero-stat">
            <text class="hero-stat-icon">💀</text>
            <text class="hero-stat-value">{{ totalDestroyed }}</text>
            <text class="hero-stat-label">{{ t("itemsDestroyed") }}</text>
          </view>
          <view class="hero-stat">
            <text class="hero-stat-icon">⛽</text>
            <text class="hero-stat-value">{{ formatNum(gasReclaimed) }}</text>
            <text class="hero-stat-label">{{ t("gasReclaimed") }}</text>
          </view>
        </view>
      </view>

      <!-- Destruction Chamber -->
      <view class="destruction-chamber">
        <view class="chamber-header">
          <text class="chamber-icon">🔥</text>
          <text class="chamber-title">{{ t("destroyAsset") }}</text>
        </view>

        <view class="input-container">
          <NeoInput v-model="assetHash" :placeholder="t('assetHashPlaceholder')" type="text" />
        </view>

        <!-- Animated Warning -->
        <view class="warning-box" :class="{ shake: showWarningShake }">
          <view class="warning-icon-container">
            <text class="warning-icon">⚠️</text>
          </view>
          <view class="warning-content">
            <text class="warning-title">{{ t("warning") }}</text>
            <text class="warning-text">{{ t("warningText") }}</text>
          </view>
        </view>

        <!-- Destruction Button with Fire Effect -->
        <view class="destroy-btn-container">
          <view class="fire-particles" v-if="isDestroying">
            <view v-for="i in 12" :key="i" :class="['particle', `particle-${i}`]"></view>
          </view>
          <NeoButton variant="danger" size="lg" block @click="initiateDestroy" :class="{ destroying: isDestroying }">
            <text class="btn-icon">{{ isDestroying ? "🔥" : "💀" }}</text>
            <text>{{ isDestroying ? t("destroying") : t("destroyForever") }}</text>
          </NeoButton>
        </view>

        <!-- Confirmation Modal -->
        <view v-if="showConfirm" class="confirm-overlay" @click="showConfirm = false">
          <view class="confirm-modal" @click.stop>
            <view class="confirm-skull">💀</view>
            <text class="confirm-title">{{ t("confirmTitle") }}</text>
            <text class="confirm-text">{{ t("confirmText") }}</text>
            <view class="confirm-hash">{{ assetHash }}</view>
            <view class="confirm-actions">
              <NeoButton variant="secondary" @click="showConfirm = false">
                {{ t("cancel") }}
              </NeoButton>
              <NeoButton variant="danger" @click="executeDestroy">
                {{ t("confirmDestroy") }}
              </NeoButton>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- History Tab -->
    <view v-if="activeTab === 'history'" class="tab-content scrollable">
      <view class="history-header">
        <text class="history-title">🪦 {{ t("recentDestructions") }}</text>
        <text class="history-count">{{ history.length }} {{ t("records") }}</text>
      </view>

      <view v-if="history.length === 0" class="empty-state">
        <text class="empty-icon">🕊️</text>
        <text class="empty-text">{{ t("noDestructions") }}</text>
      </view>

      <view v-else class="history-list">
        <view
          v-for="(item, index) in history"
          :key="item.id"
          class="history-item"
          :style="{ animationDelay: `${index * 0.1}s` }"
        >
          <view class="history-icon">
            <text>{{ getDestructionIcon(index) }}</text>
          </view>
          <view class="history-info">
            <text class="history-hash">{{ item.hash.slice(0, 16) }}...</text>
            <text class="history-time">{{ item.time }}</text>
          </view>
          <view class="history-badge">
            <text class="badge-text">{{ t("destroyed") }}</text>
          </view>
        </view>
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
import { ref, computed, onMounted, watch } from "vue";
import { useWallet, usePayments, useEvents } from "@neo/uniapp-sdk";
import { formatNumber } from "@/shared/utils/format";
import { createT } from "@/shared/utils/i18n";
import { parseInvokeResult, parseStackItem } from "@/shared/utils/neo";
import AppLayout from "@/shared/components/AppLayout.vue";
import NeoDoc from "@/shared/components/NeoDoc.vue";
import NeoButton from "@/shared/components/NeoButton.vue";
import NeoInput from "@/shared/components/NeoInput.vue";

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
const { address, connect, invokeContract, invokeRead, getContractHash } = useWallet();
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
const contractHash = ref<string | null>(null);

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

const ensureContractHash = async () => {
  if (!contractHash.value) {
    contractHash.value = (await getContractHash()) as string;
  }
  if (!contractHash.value) throw new Error(t("contractUnavailable"));
  return contractHash.value as string;
};

const getDestructionIcon = (index: number) => {
  const icons = ["💀", "⚰️", "🪦", "☠️", "🔥"];
  return icons[index % icons.length];
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
    const contract = await ensureContractHash();

    const payment = await payGAS("0.1", `graveyard:bury:${assetHash.value.slice(0, 10)}`);
    const receiptId = payment.receipt_id;
    if (!receiptId) throw new Error(t("receiptMissing"));

    const tx = await invokeContract({
      scriptHash: contract,
      operation: "BuryMemory",
      args: [
        { type: "Hash160", value: address.value as string },
        { type: "String", value: assetHash.value },
        { type: "Integer", value: Number(receiptId) },
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
  if (!contractHash.value) {
    contractHash.value = (await getContractHash()) as string;
  }
  if (!contractHash.value) return;
  try {
    const totalRes = await invokeRead({ contractHash: contractHash.value, operation: "TotalMemories" });
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
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.tab-content {
  padding: $space-6;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: $space-6;
}

.status-msg {
  text-align: center;
  padding: $space-4;
  border: 4px solid black;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  font-size: 12px;
  box-shadow: 6px 6px 0 black;
  font-style: italic;
  &.success {
    background: var(--neo-green);
    color: black;
  }
  &.error {
    background: var(--brutal-red);
    color: white;
  }
}

// Graveyard Hero Section
.graveyard-hero {
  background: white;
  border: 4px solid black;
  padding: $space-8;
  position: relative;
  overflow: hidden;
  box-shadow: 12px 12px 0 black;
}

.tombstone-scene {
  height: 140px;
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  margin-bottom: $space-8;
  position: relative;
  border-bottom: 6px solid black;
  background: #f0f0f0;
  padding: 0 20px;
}

.moon {
  position: absolute;
  top: 15px;
  right: 30px;
  width: 50px;
  height: 50px;
  background: #ffde59;
  border: 4px solid black;
}

.tombstone {
  width: 60px;
  height: 90px;
  background: white;
  border: 4px solid black;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 2;
  box-shadow: 4px -4px 0 black;
  &.tombstone-1 {
    transform: rotate(-5deg);
  }
  &.tombstone-3 {
    transform: rotate(5deg);
  }
}

.rip {
  font-size: 14px;
  color: black;
  font-weight: $font-weight-black;
  letter-spacing: 2px;
  font-style: italic;
}

// Hero Stats
.hero-stats {
  display: flex;
  gap: $space-4;
}
.hero-stat {
  flex: 1;
  text-align: center;
  background: #ffde59;
  padding: $space-4;
  border: 4px solid black;
  box-shadow: 6px 6px 0 black;
  transition: transform 0.2s;
  &:hover {
    transform: translate(-2px, -2px);
    box-shadow: 8px 8px 0 black;
  }
}
.hero-stat-icon {
  font-size: 32px;
  display: block;
  margin-bottom: 8px;
}
.hero-stat-value {
  font-size: 24px;
  font-weight: $font-weight-black;
  color: black;
  font-family: $font-mono;
  display: block;
  font-style: italic;
}
.hero-stat-label {
  font-size: 10px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  color: black;
  letter-spacing: 1px;
}

// Destruction Chamber
.destruction-chamber {
  padding: $space-8;
  background: white;
  border: 4px solid black;
  box-shadow: 12px 12px 0 black;
}
.chamber-header {
  display: flex;
  align-items: center;
  gap: $space-4;
  margin-bottom: $space-8;
  border-bottom: 6px solid black;
  padding-bottom: $space-3;
}
.chamber-title {
  font-size: 24px;
  font-weight: $font-weight-black;
  color: black;
  text-transform: uppercase;
  font-style: italic;
}

// Warning Box
.warning-box {
  display: flex;
  gap: $space-5;
  background: #ff7e7e;
  color: black;
  padding: $space-6;
  border: 4px solid black;
  margin-bottom: $space-8;
  box-shadow: 8px 8px 0 black;
  &.shake {
    animation: shake 0.5s ease-in-out;
  }
}

.warning-icon {
  font-size: 40px;
}
.warning-title {
  font-weight: $font-weight-black;
  font-size: 16px;
  text-transform: uppercase;
  border-bottom: 3px solid black;
  margin-bottom: 8px;
  display: inline-block;
  font-style: italic;
}
.warning-text {
  font-size: 12px;
  font-weight: $font-weight-black;
  line-height: 1.2;
  text-transform: uppercase;
}

// Destroy Button
.destroy-btn-container {
  position: relative;
}

// Confirmation Modal
.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: $space-4;
}
.confirm-modal {
  background: white;
  border: 6px solid black;
  padding: $space-10;
  width: 100%;
  max-width: 400px;
  text-align: center;
  box-shadow: 20px 20px 0 black;
}
.confirm-skull {
  font-size: 80px;
  display: block;
  margin-bottom: $space-6;
}
.confirm-title {
  font-size: 28px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  margin-bottom: $space-4;
  color: black;
  font-style: italic;
}
.confirm-text {
  font-size: 14px;
  font-weight: $font-weight-black;
  margin-bottom: $space-6;
  text-transform: uppercase;
}
.confirm-hash {
  font-family: $font-mono;
  font-size: 12px;
  background: #f0f0f0;
  padding: $space-4;
  border: 3px solid black;
  word-break: break-all;
  margin-bottom: $space-8;
  font-weight: $font-weight-bold;
}

.confirm-actions {
  display: flex;
  gap: $space-6;
}

// History Tab
.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $space-8;
  border-bottom: 6px solid black;
  padding-bottom: $space-3;
}

.history-title {
  font-size: 24px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  font-style: italic;
}
.history-count {
  font-size: 14px;
  font-weight: $font-weight-black;
  background: black;
  color: var(--neo-green);
  padding: 4px 12px;
  border: 2px solid black;
  transform: rotate(3deg);
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: $space-6;
}

.history-item {
  display: flex;
  align-items: center;
  gap: $space-5;
  padding: $space-6;
  background: white;
  border: 4px solid black;
  box-shadow: 8px 8px 0 black;
  transition: transform 0.2s;
  &:hover {
    transform: translate(-3px, -3px);
    box-shadow: 11px 11px 0 black;
  }
}

.history-icon {
  font-size: 40px;
  width: 60px;
  text-align: center;
  border-right: 4px solid black;
  margin-right: $space-3;
}
.history-hash {
  font-family: $font-mono;
  font-size: 14px;
  font-weight: $font-weight-black;
  display: block;
  margin-bottom: 6px;
  text-transform: uppercase;
}
.history-time {
  font-size: 11px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  color: #666;
}
.history-badge {
  background: black;
  color: white;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: $font-weight-black;
  border: 2px solid black;
  transform: skew(-10deg);
}

.scrollable {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

@keyframes shake {
  0%, 100% { transform: translateX(0) rotate(0); }
  25% { transform: translateX(-8px) rotate(-1deg); }
  75% { transform: translateX(8px) rotate(1deg); }
}
</style>
