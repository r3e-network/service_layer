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
      <text class="card-title">{{ t("activeBridges") }}</text>
      <view v-for="bridge in bridges" :key="bridge.id" class="bridge-row">
        <view class="bridge-info">
          <text class="bridge-name">{{ bridge.from }} → {{ bridge.to }}</text>
          <text class="bridge-status" :class="bridge.healthy ? 'healthy' : 'warning'">
            {{ bridge.healthy ? t("healthy") : t("warning") }}
          </text>
        </view>
        <view class="bridge-stats">
          <text class="stat">{{ formatNum(bridge.volume) }} GAS</text>
          <text class="stat-label">{{ t("volume24h") }}</text>
        </view>
      </view>
    </view>

    <view class="card">
      <text class="card-title">{{ t("monitorTransfer") }}</text>
      <uni-easyinput v-model="txHash" :placeholder="t('txHashPlaceholder')" class="input" />
      <view class="action-btn" @click="monitorTx" :style="{ opacity: isLoading ? 0.6 : 1 }">
        <text>{{ isLoading ? t("checking") : t("trackBtn") }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useWallet, usePayments } from "@neo/uniapp-sdk";
import { formatNumber } from "@/shared/utils/format";
import { createT } from "@/shared/utils/i18n";

const translations = {
  title: { en: "Bridge Guardian", zh: "跨链守护者" },
  subtitle: { en: "Cross-chain monitoring", zh: "跨链监控" },
  activeBridges: { en: "Active Bridges", zh: "活跃桥接" },
  healthy: { en: "✓ Healthy", zh: "✓ 健康" },
  warning: { en: "⚠ Warning", zh: "⚠ 警告" },
  volume24h: { en: "24h Volume", zh: "24小时交易量" },
  monitorTransfer: { en: "Monitor Transfer", zh: "监控转账" },
  txHashPlaceholder: { en: "Transaction hash", zh: "交易哈希" },
  checking: { en: "Checking...", zh: "检查中..." },
  trackBtn: { en: "Track Transfer", zh: "追踪转账" },
  monitoring: { en: "Monitoring transaction...", zh: "监控交易中..." },
  confirmed: { en: "Transfer confirmed on destination chain", zh: "目标链已确认转账" },
  error: { en: "Error", zh: "错误" },
};

const t = createT(translations);

const APP_ID = "miniapp-bridge-guardian";
const { address, connect } = useWallet();
const { isLoading } = usePayments(APP_ID);

interface Bridge {
  id: string;
  from: string;
  to: string;
  healthy: boolean;
  volume: number;
}

const bridges = ref<Bridge[]>([
  { id: "1", from: "Neo N3", to: "Ethereum", healthy: true, volume: 125000 },
  { id: "2", from: "Neo N3", to: "BSC", healthy: true, volume: 89000 },
  { id: "3", from: "Neo N3", to: "Polygon", healthy: false, volume: 45000 },
]);

const txHash = ref("");
const status = ref<{ msg: string; type: string } | null>(null);

const formatNum = (n: number) => formatNumber(n, 0);

const monitorTx = async () => {
  if (!txHash.value || isLoading.value) return;
  try {
    status.value = { msg: t("monitoring"), type: "loading" };
    await new Promise((resolve) => setTimeout(resolve, 1500));
    status.value = { msg: t("confirmed"), type: "success" };
    txHash.value = "";
  } catch (e: any) {
    status.value = { msg: e.message || t("error"), type: "error" };
  }
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
  &.loading {
    background: rgba($color-utility, 0.15);
    color: $color-utility;
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
.bridge-row {
  display: flex;
  justify-content: space-between;
  padding: 12px;
  background: rgba($color-utility, 0.1);
  border-radius: 8px;
  margin-bottom: 8px;
}
.bridge-info {
  flex: 1;
}
.bridge-name {
  font-weight: bold;
  font-size: 1em;
  display: block;
  margin-bottom: 4px;
}
.bridge-status {
  font-size: 0.85em;
  &.healthy {
    color: $color-success;
  }
  &.warning {
    color: $color-warning;
  }
}
.bridge-stats {
  text-align: right;
}
.stat {
  color: $color-utility;
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
.action-btn {
  background: linear-gradient(135deg, $color-utility 0%, darken($color-utility, 10%) 100%);
  color: #fff;
  padding: 14px;
  border-radius: 12px;
  text-align: center;
  font-weight: bold;
}
</style>
