<template>
  <AppLayout :title="t('title')" show-top-nav :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <!-- Destroy Tab -->
    <view v-if="activeTab === 'destroy'" class="tab-content">
      <view v-if="status" :class="['status-msg', status.type]">
        <text>{{ status.msg }}</text>
      </view>

      <NeoCard :title="t('destructionStats')" variant="default">
        <view class="stats-grid">
          <view class="stat-box">
            <text class="stat-value">{{ totalDestroyed }}</text>
            <text class="stat-label">{{ t("itemsDestroyed") }}</text>
          </view>
          <view class="stat-box">
            <text class="stat-value">{{ formatNum(gasReclaimed) }}</text>
            <text class="stat-label">{{ t("gasReclaimed") }}</text>
          </view>
        </view>
      </NeoCard>

      <NeoCard :title="t('destroyAsset')" variant="danger">
        <NeoInput v-model="assetHash" :placeholder="t('assetHashPlaceholder')" type="text" />
        <view class="warning-box">
          <text class="warning-title">{{ t("warning") }}</text>
          <text class="warning-text">{{ t("warningText") }}</text>
        </view>
        <NeoButton variant="danger" size="lg" block @click="destroyAsset">
          {{ t("destroyForever") }}
        </NeoButton>
      </NeoCard>
    </view>

    <!-- History Tab -->
    <view v-if="activeTab === 'history'" class="tab-content scrollable">
      <NeoCard :title="t('recentDestructions')" variant="default">
        <view class="history-list">
          <view v-for="item in history" :key="item.id" class="history-item">
            <text class="history-hash">{{ item.hash.slice(0, 12) }}...</text>
            <text class="history-time">{{ item.time }}</text>
          </view>
        </view>
      </NeoCard>
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
import { ref, computed } from "vue";
import { formatNumber } from "@/shared/utils/format";
import { createT } from "@/shared/utils/i18n";
import AppLayout from "@/shared/components/AppLayout.vue";
import NeoButton from "@/shared/components/NeoButton.vue";
import NeoCard from "@/shared/components/NeoCard.vue";
import NeoInput from "@/shared/components/NeoInput.vue";

const translations = {
  title: { en: "Graveyard", zh: "墓地" },
  subtitle: { en: "Permanent data destruction", zh: "永久数据销毁" },
  destructionStats: { en: "Destruction Stats", zh: "销毁统计" },
  itemsDestroyed: { en: "Items Destroyed", zh: "已销毁项目" },
  gasReclaimed: { en: "GAS Reclaimed", zh: "回收的GAS" },
  destroyAsset: { en: "Destroy Asset", zh: "销毁资产" },
  assetHashPlaceholder: { en: "Asset hash or token ID", zh: "资产哈希或代币ID" },
  warning: { en: "⚠ Warning", zh: "⚠ 警告" },
  warningText: {
    en: "This action is irreversible. Asset will be permanently destroyed.",
    zh: "此操作不可逆。资产将被永久销毁。",
  },
  destroyForever: { en: "Destroy Forever", zh: "永久销毁" },
  recentDestructions: { en: "Recent Destructions", zh: "最近销毁" },
  enterAssetHash: { en: "Please enter asset hash", zh: "请输入资产哈希" },
  assetDestroyed: { en: "Asset destroyed permanently", zh: "资产已永久销毁" },
  destroy: { en: "Destroy", zh: "销毁" },
  history: { en: "History", zh: "历史" },

  docs: { en: "Docs", zh: "文档" },
  docSubtitle: { en: "Learn more about this MiniApp.", zh: "了解更多关于此小程序的信息。" },
  docDescription: {
    en: "Professional documentation for this application is coming soon.",
    zh: "此应用程序的专业文档即将推出。",
  },
  step1: { en: "Open the application.", zh: "打开应用程序。" },
  step2: { en: "Follow the on-screen instructions.", zh: "按照屏幕上的指示操作。" },
  step3: { en: "Enjoy the secure experience!", zh: "享受安全体验！" },
  feature1Name: { en: "TEE Secured", zh: "TEE 安全保护" },
  feature1Desc: { en: "Hardware-level isolation.", zh: "硬件级隔离。" },
  feature2Name: { en: "On-Chain Fairness", zh: "链上公正" },
  feature2Desc: { en: "Provably fair execution.", zh: "可证明公平的执行。" },
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

const totalDestroyed = ref(1247);
const gasReclaimed = ref(89.5);
const assetHash = ref("");
const status = ref<{ msg: string; type: string } | null>(null);
const history = ref<HistoryItem[]>([
  { id: "1", hash: "0x7a8f3e2d1c9b4a5e6f7d8c9b0a1e2f3d", time: "2 min ago" },
  { id: "2", hash: "0x9b4a5e6f7d8c9b0a1e2f3d4c5b6a7e8f", time: "15 min ago" },
  { id: "3", hash: "0x1c9b4a5e6f7d8c9b0a1e2f3d4c5b6a7e", time: "1 hour ago" },
]);

const formatNum = (n: number) => formatNumber(n, 1);

const destroyAsset = () => {
  if (!assetHash.value) {
    status.value = { msg: "Please enter asset hash", type: "error" };
    return;
  }
  history.value.unshift({
    id: String(Date.now()),
    hash: assetHash.value,
    time: "Just now",
  });
  totalDestroyed.value += 1;
  gasReclaimed.value += Math.random() * 0.5;
  status.value = { msg: "Asset destroyed permanently", type: "success" };
  assetHash.value = "";
};
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
  overflow: hidden;

  &.scrollable {
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }
}

.status-msg {
  text-align: center;
  padding: $space-4;
  border: $border-width-md solid var(--border-color);
  box-shadow: $shadow-md;
  font-weight: $font-weight-bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;

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

.stats-grid {
  display: flex;
  gap: $space-4;
}

.stat-box {
  flex: 1;
  text-align: center;
  background: var(--bg-secondary);
  border: $border-width-md solid var(--border-color);
  box-shadow: $shadow-sm;
  padding: $space-5;
}

.stat-value {
  color: var(--neo-green);
  font-size: $font-size-3xl;
  font-weight: $font-weight-black;
  display: block;
  line-height: 1.2;
}

.stat-label {
  color: var(--text-secondary);
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: $space-2;
}

.warning-box {
  background: var(--bg-secondary);
  border: $border-width-md solid var(--status-error);
  box-shadow: $shadow-md;
  padding: $space-4;
  margin: $space-4 0;
}

.warning-title {
  color: var(--status-error);
  font-weight: $font-weight-bold;
  font-size: $font-size-base;
  display: block;
  margin-bottom: $space-2;
  text-transform: uppercase;
}

.warning-text {
  color: var(--text-secondary);
  font-size: $font-size-sm;
  line-height: 1.5;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $space-4;
  background: var(--bg-secondary);
  border: $border-width-sm solid var(--border-color);
  box-shadow: $shadow-sm;
  transition: transform $transition-fast;

  &:active {
    transform: translate(2px, 2px);
    box-shadow: none;
  }
}

.history-hash {
  color: var(--text-primary);
  font-family: $font-mono;
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;
}

.history-time {
  color: var(--text-muted);
  font-size: $font-size-xs;
  font-weight: $font-weight-medium;
}
</style>
