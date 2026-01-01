<template>
  <view class="app-container">
    <view class="header">
      <text class="title">{{ t("title") }}</text>
      <text class="subtitle">{{ t("subtitle") }}</text>
    </view>

    <view v-if="status" :class="['status-msg', status.type]">
      <text>{{ status.msg }}</text>
    </view>

    <view class="card">
      <text class="card-title">{{ t("destructionStats") }}</text>
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
    </view>

    <view class="card">
      <text class="card-title">{{ t("destroyAsset") }}</text>
      <uni-easyinput v-model="assetHash" :placeholder="t('assetHashPlaceholder')" class="input" />
      <view class="warning-box">
        <text class="warning-title">{{ t("warning") }}</text>
        <text class="warning-text">{{ t("warningText") }}</text>
      </view>
      <view class="action-btn danger" @click="destroyAsset">
        <text>{{ t("destroyForever") }}</text>
      </view>
    </view>

    <view class="card">
      <text class="card-title">{{ t("recentDestructions") }}</text>
      <view class="history-list">
        <view v-for="item in history" :key="item.id" class="history-item">
          <text class="history-hash">{{ item.hash.slice(0, 12) }}...</text>
          <text class="history-time">{{ item.time }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { formatNumber } from "@/shared/utils/format";
import { createT } from "@/shared/utils/i18n";

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
};

const t = createT(translations);

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

<style lang="scss">
@import "@/shared/styles/theme.scss";
.app-container {
  min-height: 100vh;
  background: linear-gradient(135deg, $color-bg-primary 0%, $color-bg-secondary 100%);
  color: $color-text-primary;
  padding: 20px;
}
.header {
  text-align: center;
  margin-bottom: 24px;
}
.title {
  font-size: 1.8em;
  font-weight: bold;
  color: $color-utility;
}
.subtitle {
  color: $color-text-secondary;
  font-size: 0.9em;
  margin-top: 8px;
}
.status-msg {
  text-align: center;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
  &.success {
    background: rgba($color-success, 0.15);
    color: $color-success;
  }
  &.error {
    background: rgba($color-error, 0.15);
    color: $color-error;
  }
}
.card {
  background: $color-bg-card;
  border: 1px solid $color-border;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
}
.card-title {
  color: $color-utility;
  font-size: 1.1em;
  font-weight: bold;
  display: block;
  margin-bottom: 12px;
}
.stats-grid {
  display: flex;
  gap: 12px;
}
.stat-box {
  flex: 1;
  text-align: center;
  background: rgba($color-utility, 0.1);
  border-radius: 8px;
  padding: 16px;
}
.stat-value {
  color: $color-utility;
  font-size: 1.5em;
  font-weight: bold;
  display: block;
}
.stat-label {
  color: $color-text-secondary;
  font-size: 0.8em;
}
.input {
  margin-bottom: 12px;
}
.warning-box {
  background: rgba($color-error, 0.1);
  border: 1px solid rgba($color-error, 0.3);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
}
.warning-title {
  color: $color-error;
  font-weight: bold;
  display: block;
  margin-bottom: 4px;
}
.warning-text {
  color: $color-text-secondary;
  font-size: 0.85em;
}
.action-btn {
  background: linear-gradient(135deg, $color-utility 0%, darken($color-utility, 10%) 100%);
  color: #fff;
  padding: 14px;
  border-radius: 12px;
  text-align: center;
  font-weight: bold;
  &.danger {
    background: linear-gradient(135deg, $color-error 0%, darken($color-error, 10%) 100%);
  }
}
.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.history-item {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  background: rgba($color-utility, 0.1);
  border-radius: 8px;
}
.history-hash {
  color: $color-text-primary;
  font-family: monospace;
}
.history-time {
  color: $color-text-secondary;
  font-size: 0.85em;
}
</style>
