<template>
  <view class="app-container">
    <view class="header">
      <text class="title">{{ t("title") }}</text>
      <text class="subtitle">{{ t("subtitle") }}</text>
    </view>

    <view v-if="status" :class="['status-msg', status.type]"
      ><text>{{ status.msg }}</text></view
    >

    <view class="card">
      <text class="card-title">{{ t("performance") }}</text>
      <view class="row"
        ><text>{{ t("winRate") }}</text
        ><text class="v">{{ perf.winRate }}%</text></view
      >
      <view class="row"
        ><text>{{ t("roi30d") }}</text
        ><text class="v">{{ perf.roi30d }}%</text></view
      >
      <view class="row"
        ><text>{{ t("maxDrawdown") }}</text
        ><text class="v">{{ perf.maxDD }}%</text></view
      >
    </view>

    <view class="card">
      <text class="card-title">{{ t("strategy") }}</text>
      <view class="row"
        ><text>{{ t("selected") }}</text
        ><text class="v">{{ strategy || t("meanReversion") }}</text></view
      >
      <view class="row"
        ><text>{{ t("risk") }}</text
        ><text class="v">{{ risk || t("medium") }}</text></view
      >
      <view class="row"
        ><text>{{ t("signalRefresh") }}</text
        ><text class="v">{{ perf.refreshMins }}m</text></view
      >
    </view>

    <view class="card">
      <text class="card-title">{{ t("deploy") }}</text>
      <uni-easyinput v-model="strategy" :placeholder="t('strategyPlaceholder')" />
      <uni-easyinput v-model="risk" :placeholder="t('riskPlaceholder')" />
      <uni-easyinput v-model="allocation" type="number" :placeholder="t('allocationPlaceholder')" />
      <view class="action-btn" @click="deploy"
        ><text>{{ isLoading ? t("processing") : t("deployBtn") }}</text></view
      >
      <text class="note">{{ t("computeFeeNote") }}: {{ computeFee }} GAS</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useWallet, usePayments } from "@neo/uniapp-sdk";
import { createT } from "@/shared/utils/i18n";

const translations = {
  title: { en: "AI Trader", zh: "AI 交易员" },
  subtitle: { en: "Model-driven execution", zh: "模型驱动执行" },
  performance: { en: "Performance", zh: "性能表现" },
  winRate: { en: "Win rate", zh: "胜率" },
  roi30d: { en: "30d ROI", zh: "30天回报率" },
  maxDrawdown: { en: "Max drawdown", zh: "最大回撤" },
  strategy: { en: "Strategy", zh: "策略" },
  selected: { en: "Selected", zh: "已选择" },
  meanReversion: { en: "Mean Reversion", zh: "均值回归" },
  risk: { en: "Risk", zh: "风险" },
  medium: { en: "Medium", zh: "中等" },
  signalRefresh: { en: "Signal refresh", zh: "信号刷新" },
  deploy: { en: "Deploy", zh: "部署" },
  strategyPlaceholder: { en: "Strategy (e.g., Momentum)", zh: "策略（例如：动量）" },
  riskPlaceholder: { en: "Risk (Low/Medium/High)", zh: "风险（低/中/高）" },
  allocationPlaceholder: { en: "Allocation (GAS)", zh: "分配金额（GAS）" },
  processing: { en: "Processing...", zh: "处理中..." },
  deployBtn: { en: "Deploy AI Trader", zh: "部署 AI 交易员" },
  computeFeeNote: { en: "Mock compute fee", zh: "模拟计算费用" },
  validAllocation: { en: "Enter a valid allocation", zh: "请输入有效的分配金额" },
  deployed: { en: "Deployed", zh: "已部署" },
  paymentFailed: { en: "Payment failed", zh: "支付失败" },
};

const t = createT(translations);

type StatusType = "success" | "error";
type Status = { msg: string; type: StatusType };
type Performance = { winRate: number; roi30d: number; maxDD: number; refreshMins: number };

const APP_ID = "miniapp-ai-trader";
const { address, connect } = useWallet();
const { payGAS, isLoading } = usePayments(APP_ID);

const perf = ref<Performance>({ winRate: 57, roi30d: 12.4, maxDD: 6.8, refreshMins: 5 });
const strategy = ref<string>(t("meanReversion"));
const risk = ref<string>(t("medium"));
const allocation = ref<string>("50");
const computeFee = "0.015";
const status = ref<Status | null>(null);

const deploy = async (): Promise<void> => {
  if (isLoading.value) return;
  const amount = parseFloat(allocation.value);
  if (!(amount > 0)) return void (status.value = { msg: t("validAllocation"), type: "error" });
  try {
    await payGAS(computeFee, `ai:${strategy.value}:${risk.value}:${amount}`);
    status.value = { msg: `${t("deployed")}: ${strategy.value} (${risk.value})`, type: "success" };
  } catch (e: any) {
    status.value = { msg: e?.message || t("paymentFailed"), type: "error" };
  }
};
</script>

<style lang="scss">
@import "@/shared/styles/theme.scss";
.app-container {
  min-height: 100vh;
  background: linear-gradient(135deg, $color-bg-primary 0%, $color-bg-secondary 100%);
  color: #fff;
  padding: 20px;
}
.header {
  text-align: center;
  margin-bottom: 24px;
}
.title {
  font-size: 1.8em;
  font-weight: 800;
  color: $color-defi;
}
.subtitle {
  color: $color-text-secondary;
  font-size: 0.9em;
  margin-top: 8px;
}
.status-msg {
  text-align: center;
  padding: 12px;
  border-radius: 10px;
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
  padding: 18px;
  margin-bottom: 16px;
}
.card-title {
  color: $color-defi;
  font-size: 1.05em;
  font-weight: 800;
  display: block;
  margin-bottom: 10px;
}
.row {
  display: flex;
  justify-content: space-between;
  padding: 12px;
  background: rgba($color-defi, 0.1);
  border-radius: 10px;
  margin-bottom: 8px;
}
.v {
  color: $color-defi;
  font-weight: 800;
}
.action-btn {
  background: linear-gradient(135deg, $color-defi 0%, darken($color-defi, 10%) 100%);
  padding: 14px;
  border-radius: 12px;
  text-align: center;
  font-weight: 800;
  margin-top: 12px;
}
.note {
  display: block;
  margin-top: 10px;
  font-size: 0.85em;
  color: $color-text-secondary;
}
</style>
