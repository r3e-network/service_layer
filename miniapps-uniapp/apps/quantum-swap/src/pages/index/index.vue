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
      <text class="card-title">{{ t("swapRoute") }}</text>
      <view class="row"
        ><text>{{ t("from") }}</text
        ><text class="v">{{ route.fromChain }} / {{ route.fromToken }}</text></view
      >
      <view class="row"
        ><text>{{ t("to") }}</text
        ><text class="v">{{ route.toChain }} / {{ route.toToken }}</text></view
      >
      <view class="row"
        ><text>{{ t("rate") }}</text
        ><text class="v">1 {{ route.fromToken }} = {{ route.rate }} {{ route.toToken }}</text></view
      >
    </view>

    <view class="card">
      <text class="card-title">{{ t("swapDetails") }}</text>
      <uni-easyinput v-model="swapAmount" type="number" :placeholder="t('amountPlaceholder')" />
      <view class="detail-row">
        <text>{{ t("youReceive") }}</text>
        <text class="receive">{{ fmt(parseFloat(swapAmount || "0") * route.rate, 4) }} {{ route.toToken }}</text>
      </view>
      <view class="detail-row">
        <text>{{ t("bridgeFee") }}</text>
        <text class="fee">{{ (parseFloat(swapAmount || "0") * 0.003).toFixed(4) }} {{ route.fromToken }}</text>
      </view>
      <view class="detail-row">
        <text>{{ t("timeLock") }}</text>
        <text class="lock">{{ swap.timeLock }}</text>
      </view>
    </view>

    <view class="card">
      <text class="card-title">{{ t("initiateSwap") }}</text>
      <view class="action-btn" @click="initiateSwap"
        ><text>{{ isLoading ? t("processing") : t("startAtomicSwap") }}</text></view
      >
      <text class="note">{{ t("note") }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useWallet, usePayments } from "@neo/uniapp-sdk";
import { formatNumber } from "@/shared/utils/format";
import { createT } from "@/shared/utils/i18n";

const translations = {
  title: { en: "Quantum Swap", zh: "量子交换" },
  subtitle: { en: "Atomic cross-chain swaps", zh: "原子跨链交换" },
  swapRoute: { en: "Swap Route", zh: "交换路由" },
  from: { en: "From", zh: "来源" },
  to: { en: "To", zh: "目标" },
  rate: { en: "Rate", zh: "汇率" },
  swapDetails: { en: "Swap Details", zh: "交换详情" },
  amountPlaceholder: { en: "Amount to swap", zh: "交换数量" },
  youReceive: { en: "You receive", zh: "您将收到" },
  bridgeFee: { en: "Bridge fee (0.3%)", zh: "桥接费用 (0.3%)" },
  timeLock: { en: "Time lock", zh: "时间锁定" },
  initiateSwap: { en: "Initiate Swap", zh: "发起交换" },
  processing: { en: "Processing...", zh: "处理中..." },
  startAtomicSwap: { en: "Start Atomic Swap", zh: "开始原子交换" },
  note: { en: "Trustless cross-chain exchange via HTLC", zh: "通过 HTLC 实现无需信任的跨链交换" },
  enterValidAmount: { en: "Enter valid amount", zh: "请输入有效金额" },
  swapInitiated: { en: "Swap initiated: {0} {1} → {2} {3}", zh: "交换已发起：{0} {1} → {2} {3}" },
  paymentFailed: { en: "Payment failed", zh: "支付失败" },
};
const t = createT(translations);

type StatusType = "success" | "error";
type Status = { msg: string; type: StatusType };
type Route = { fromChain: string; fromToken: string; toChain: string; toToken: string; rate: number };
type Swap = { timeLock: string };

const APP_ID = "miniapp-quantum-swap";
const { address, connect } = useWallet();
const { payGAS, isLoading } = usePayments(APP_ID);

const route = ref<Route>({ fromChain: "Neo N3", fromToken: "GAS", toChain: "Ethereum", toToken: "ETH", rate: 0.00042 });
const swap = ref<Swap>({ timeLock: "24 hours" });
const swapAmount = ref<string>("");
const status = ref<Status | null>(null);
const fmt = (n: number, d = 2) => formatNumber(n, d);

const initiateSwap = async (): Promise<void> => {
  if (isLoading.value) return;
  const amount = parseFloat(swapAmount.value);
  if (!(amount > 0)) return void (status.value = { msg: t("enterValidAmount"), type: "error" });
  const fee = (amount * 0.003).toFixed(4);
  try {
    await payGAS(fee, `qswap:${route.value.fromChain}:${route.value.toChain}:${amount}`);
    const received = fmt(amount * route.value.rate, 4);
    status.value = {
      msg: t("swapInitiated")
        .replace("{0}", fmt(amount, 2))
        .replace("{1}", route.value.fromToken)
        .replace("{2}", received)
        .replace("{3}", route.value.toToken),
      type: "success",
    };
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
.detail-row {
  display: flex;
  justify-content: space-between;
  margin: 12px 0;
  color: $color-text-secondary;
}
.receive {
  color: $color-success;
  font-weight: 800;
}
.fee {
  color: $color-defi;
}
.lock {
  color: #f59e0b;
}
.action-btn {
  background: linear-gradient(135deg, $color-defi 0%, darken($color-defi, 10%) 100%);
  padding: 14px;
  border-radius: 12px;
  text-align: center;
  font-weight: 800;
}
.note {
  display: block;
  margin-top: 10px;
  font-size: 0.85em;
  color: $color-text-secondary;
}
</style>
