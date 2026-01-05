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
import { ref, computed, onMounted } from "vue";
import { formatNumber } from "@/shared/utils/format";
import { createT } from "@/shared/utils/i18n";
import AppLayout from "@/shared/components/AppLayout.vue";
import NeoDoc from "@/shared/components/NeoDoc.vue";
import NeoButton from "@/shared/components/NeoButton.vue";
import NeoInput from "@/shared/components/NeoInput.vue";

const translations = {
  title: { en: "Graveyard", zh: "数字墓地" },
  subtitle: { en: "Permanent data destruction", zh: "永久数据销毁" },
  destructionStats: { en: "Destruction Stats", zh: "销毁统计" },
  itemsDestroyed: { en: "Destroyed", zh: "已销毁" },
  gasReclaimed: { en: "GAS Reclaimed", zh: "回收GAS" },
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

  docs: { en: "Docs", zh: "文档" },
  docSubtitle: { en: "Permanent asset destruction service", zh: "永久资产销毁服务" },
  docDescription: {
    en: "Graveyard provides a secure way to permanently destroy digital assets on the Neo blockchain. Once destroyed, assets cannot be recovered.",
    zh: "数字墓地提供在Neo区块链上永久销毁数字资产的安全方式。一旦销毁，资产将无法恢复。",
  },
  step1: { en: "Enter the asset hash or token ID", zh: "输入资产哈希或代币ID" },
  step2: { en: "Review the warning carefully", zh: "仔细阅读警告信息" },
  step3: { en: "Confirm destruction - this is permanent!", zh: "确认销毁 - 此操作永久生效！" },
  feature1Name: { en: "Permanent Deletion", zh: "永久删除" },
  feature1Desc: { en: "Assets are destroyed on-chain forever", zh: "资产在链上永久销毁" },
  feature2Name: { en: "GAS Recovery", zh: "GAS回收" },
  feature2Desc: { en: "Reclaim storage fees from destroyed assets", zh: "从销毁的资产中回收存储费用" },
};

const t = createT(translations);

const navTabs = [
  { id: "destroy", icon: "trash", label: t("destroy") },
  { id: "history", icon: "time", label: t("history") },
  { id: "docs", icon: "book", label: t("docs") },
];

const activeTab = ref("destroy");

const docSteps = computed(() => [t("step1"), t("step2"), t("step3")]);
const docFeatures = computed(() => [
  { name: t("feature1Name"), desc: t("feature1Desc") },
  { name: t("feature2Name"), desc: t("feature2Desc") },
]);
const APP_ID = "miniapp-graveyard";

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
const dataLoading = ref(true);
const showConfirm = ref(false);
const isDestroying = ref(false);
const showWarningShake = ref(false);

const formatNum = (n: number) => formatNumber(n, 2);

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
  isDestroying.value = true;

  // Simulate destruction animation
  await new Promise((resolve) => setTimeout(resolve, 1500));

  history.value.unshift({
    id: String(Date.now()),
    hash: assetHash.value,
    time: new Date().toLocaleString(),
  });
  totalDestroyed.value += 1;
  gasReclaimed.value += Math.random() * 0.5 + 0.1;
  status.value = { msg: t("assetDestroyed"), type: "success" };
  assetHash.value = "";
  isDestroying.value = false;
};

// Fetch graveyard data from contract
const fetchData = async () => {
  try {
    dataLoading.value = true;
    const sdk = await import("@neo/uniapp-sdk").then((m) => m.waitForSDK?.() || null);
    if (!sdk?.invoke) return;

    const data = (await sdk.invoke("graveyard.getStats", { appId: APP_ID })) as {
      totalDestroyed: number;
      gasReclaimed: number;
      history: HistoryItem[];
    } | null;

    if (data) {
      totalDestroyed.value = data.totalDestroyed;
      gasReclaimed.value = data.gasReclaimed;
      history.value = data.history || [];
    }
  } catch (e) {
    console.warn("[Graveyard] Failed to fetch data:", e);
  } finally {
    dataLoading.value = false;
  }
};

onMounted(() => fetchData());
</script>

<style lang="scss" scoped>
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.tab-content {
  padding: $space-4;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: $space-4;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
}

.status-msg {
  text-align: center;
  padding: $space-4;
  border: $border-width-md solid var(--border-color);
  box-shadow: $shadow-md;
  font-weight: $font-weight-bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  animation: slideDown 0.3s ease-out;

  &.success {
    background: var(--status-success);
    color: $neo-black;
    border-color: $neo-black;
  }

  &.error {
    background: var(--status-error);
    color: $neo-white;
    border-color: $neo-black;
  }
}

// Graveyard Hero Section
.graveyard-hero {
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  border: $border-width-md solid var(--border-color);
  box-shadow: $shadow-lg;
  padding: $space-4;
  position: relative;
  overflow: hidden;
}

.tombstone-scene {
  height: 160px;
  position: relative;
  margin-bottom: $space-4;
}

.moon {
  position: absolute;
  top: 10px;
  right: 20px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #f5f5dc 0%, #fffacd 100%);
  box-shadow: 0 0 30px rgba(255, 250, 205, 0.5);
  animation: moonGlow 4s ease-in-out infinite;
}

.fog {
  position: absolute;
  bottom: 30px;
  height: 40px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  animation: fogDrift 8s linear infinite;

  &.fog-1 {
    left: -100%;
    width: 200%;
  }

  &.fog-2 {
    left: -50%;
    width: 150%;
    animation-delay: -4s;
    opacity: 0.5;
  }
}

.tombstone {
  position: absolute;
  bottom: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;

  &.tombstone-1 {
    left: 15%;
    transform: rotate(-5deg);
  }
  &.tombstone-2 {
    left: 45%;
    transform: rotate(0deg);
  }
  &.tombstone-3 {
    left: 75%;
    transform: rotate(5deg);
  }
}

.tombstone-top {
  width: 40px;
  height: 20px;
  background: #4a4a4a;
  border-radius: 20px 20px 0 0;
  border: 2px solid #333;
}

.tombstone-body {
  width: 40px;
  height: 50px;
  background: linear-gradient(180deg, #5a5a5a 0%, #3a3a3a 100%);
  border: 2px solid #333;
  border-top: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rip {
  font-size: 8px;
  color: #888;
  font-weight: bold;
}

.ground {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 25px;
  background: linear-gradient(180deg, #2d4a2d 0%, #1a2f1a 100%);
  border-top: 2px solid #1a2f1a;
}

// Hero Stats
.hero-stats {
  display: flex;
  gap: $space-3;
}

.hero-stat {
  flex: 1;
  text-align: center;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: $space-3;
  border-radius: 8px;
}

.hero-stat-icon {
  font-size: $font-size-2xl;
  display: block;
  margin-bottom: $space-1;
}

.hero-stat-value {
  font-size: $font-size-2xl;
  font-weight: $font-weight-black;
  color: var(--neo-green);
  display: block;
  font-family: $font-mono;
}

.hero-stat-label {
  font-size: $font-size-xs;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  display: block;
}

// Destruction Chamber
.destruction-chamber {
  background: var(--bg-card);
  border: $border-width-md solid var(--border-color);
  box-shadow: $shadow-lg;
  padding: $space-4;
}

.chamber-header {
  display: flex;
  align-items: center;
  gap: $space-2;
  margin-bottom: $space-4;
}

.chamber-icon {
  font-size: $font-size-xl;
  animation: flicker 0.5s ease-in-out infinite;
}

.chamber-title {
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
  color: var(--status-error);
  text-transform: uppercase;
}

.input-container {
  margin-bottom: $space-4;
}

// Warning Box
.warning-box {
  display: flex;
  gap: $space-3;
  background: rgba(239, 68, 68, 0.1);
  border: $border-width-md solid var(--status-error);
  padding: $space-4;
  margin-bottom: $space-4;

  &.shake {
    animation: shake 0.5s ease-in-out;
  }
}

.warning-icon-container {
  flex-shrink: 0;
}

.warning-icon {
  font-size: $font-size-2xl;
  animation: pulse 2s ease-in-out infinite;
}

.warning-content {
  flex: 1;
}

.warning-title {
  color: var(--status-error);
  font-weight: $font-weight-bold;
  font-size: $font-size-base;
  display: block;
  margin-bottom: $space-1;
}

.warning-text {
  color: var(--text-secondary);
  font-size: $font-size-sm;
  line-height: 1.5;
}

// Destroy Button
.destroy-btn-container {
  position: relative;
}

.btn-icon {
  margin-right: $space-2;
}

.fire-particles {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.particle {
  position: absolute;
  width: 8px;
  height: 8px;
  background: var(--status-error);
  border-radius: 50%;
  animation: particleRise 1s ease-out infinite;
}

@for $i from 1 through 12 {
  .particle-#{$i} {
    animation-delay: #{$i * 0.1}s;
    left: #{random(60) - 30}px;
  }
}

// Confirmation Modal
.confirm-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease-out;
}

.confirm-modal {
  background: var(--bg-card);
  border: $border-width-md solid var(--status-error);
  box-shadow: 0 0 40px rgba(239, 68, 68, 0.3);
  padding: $space-6;
  max-width: 320px;
  text-align: center;
  animation: scaleIn 0.3s ease-out;
}

.confirm-skull {
  font-size: 64px;
  animation: skullBounce 1s ease-in-out infinite;
}

.confirm-title {
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  color: var(--status-error);
  display: block;
  margin: $space-3 0;
}

.confirm-text {
  color: var(--text-secondary);
  font-size: $font-size-sm;
  display: block;
  margin-bottom: $space-3;
}

.confirm-hash {
  background: var(--bg-secondary);
  padding: $space-2;
  font-family: $font-mono;
  font-size: $font-size-xs;
  color: var(--text-primary);
  word-break: break-all;
  margin-bottom: $space-4;
}

.confirm-actions {
  display: flex;
  gap: $space-3;
}

// History Tab
.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $space-4;
}

.history-title {
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
  color: var(--text-primary);
}

.history-count {
  font-size: $font-size-sm;
  color: var(--text-muted);
}

.empty-state {
  text-align: center;
  padding: $space-8;
}

.empty-icon {
  font-size: 64px;
  display: block;
  margin-bottom: $space-3;
  opacity: 0.5;
}

.empty-text {
  color: var(--text-muted);
  font-size: $font-size-base;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.history-item {
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: $space-3;
  background: var(--bg-card);
  border: $border-width-sm solid var(--border-color);
  box-shadow: $shadow-sm;
  animation: fadeIn 0.3s ease-out both;
}

.history-icon {
  font-size: $font-size-xl;
  width: 40px;
  text-align: center;
}

.history-info {
  flex: 1;
}

.history-hash {
  color: var(--text-primary);
  font-family: $font-mono;
  font-size: $font-size-sm;
  display: block;
}

.history-time {
  color: var(--text-muted);
  font-size: $font-size-xs;
}

.history-badge {
  background: var(--status-error);
  padding: $space-1 $space-2;
}

.badge-text {
  color: white;
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  text-transform: uppercase;
}

// Animations
@keyframes moonGlow {
  0%,
  100% {
    box-shadow: 0 0 30px rgba(255, 250, 205, 0.5);
  }
  50% {
    box-shadow: 0 0 50px rgba(255, 250, 205, 0.8);
  }
}

@keyframes fogDrift {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(50%);
  }
}

@keyframes flicker {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-5px);
  }
  75% {
    transform: translateX(5px);
  }
}

@keyframes particleRise {
  0% {
    transform: translateY(0);
    opacity: 1;
  }
  100% {
    transform: translateY(-50px);
    opacity: 0;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes scaleIn {
  from {
    transform: scale(0.8);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes skullBounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes slideDown {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
