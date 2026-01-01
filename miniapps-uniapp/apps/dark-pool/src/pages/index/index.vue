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
      <text class="card-title">{{ t("poolStats") }}</text>
      <view class="row"
        ><text>{{ t("volume24h") }}</text
        ><text class="v">{{ fmt(pool.volume24h, 0) }} GAS</text></view
      >
      <view class="row"
        ><text>{{ t("avgBlockSize") }}</text
        ><text class="v">{{ fmt(pool.avgBlockSize, 0) }} GAS</text></view
      >
      <view class="row"
        ><text>{{ t("privacyLevel") }}</text
        ><text class="v">{{ pool.privacyLevel }}</text></view
      >
    </view>

    <view class="card">
      <text class="card-title">{{ t("yourOrder") }}</text>
      <view class="row"
        ><text>{{ t("type") }}</text
        ><text class="v">{{ orderType || t("buy") }}</text></view
      >
      <view class="row"
        ><text>{{ t("amount") }}</text
        ><text class="v">{{ amount || "0" }} GAS</text></view
      >
      <view class="row"
        ><text>{{ t("slippage") }}</text
        ><text class="v">{{ slippage || "0.5" }}%</text></view
      >
    </view>

    <view class="card">
      <text class="card-title">{{ t("placeOrder") }}</text>
      <uni-easyinput v-model="orderType" :placeholder="t('typePlaceholder')" />
      <uni-easyinput v-model="amount" type="number" :placeholder="t('amountPlaceholder')" />
      <uni-easyinput v-model="slippage" type="number" :placeholder="t('slippagePlaceholder')" />
      <view class="action-btn" @click="placeOrder"
        ><text>{{ isLoading ? t("processing") : t("placeDarkOrder") }}</text></view
      >
      <text class="note">{{ t("mockPrivacyFee") }} {{ privacyFee }} GAS</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useWallet, usePayments } from "@neo/uniapp-sdk";
import { formatNumber } from "@/shared/utils/format";
import { createT } from "@/shared/utils/i18n";

const translations = {
  title: { en: "Dark Pool", zh: "暗池" },
  subtitle: { en: "Anonymous large-block trading", zh: "匿名大宗交易" },
  poolStats: { en: "Pool Stats", zh: "池统计" },
  volume24h: { en: "24h volume", zh: "24小时交易量" },
  avgBlockSize: { en: "Avg. block size", zh: "平均区块大小" },
  privacyLevel: { en: "Privacy level", zh: "隐私级别" },
  yourOrder: { en: "Your Order", zh: "你的订单" },
  type: { en: "Type", zh: "类型" },
  amount: { en: "Amount", zh: "数量" },
  slippage: { en: "Slippage", zh: "滑点" },
  placeOrder: { en: "Place Order", zh: "下单" },
  typePlaceholder: { en: "Type (Buy/Sell)", zh: "类型（买/卖）" },
  amountPlaceholder: { en: "Amount (min 1000 GAS)", zh: "数量（最少1000 GAS）" },
  slippagePlaceholder: { en: "Max slippage %", zh: "最大滑点 %" },
  processing: { en: "Processing...", zh: "处理中..." },
  placeDarkOrder: { en: "Place Dark Order", zh: "下暗池订单" },
  mockPrivacyFee: { en: "Mock privacy fee:", zh: "模拟隐私费：" },
  minAmountError: { en: "Min 1000 GAS, slippage 0-5%", zh: "最少1000 GAS，滑点0-5%" },
  orderPlaced: { en: "Dark order placed:", zh: "暗池订单已下：" },
  paymentFailed: { en: "Payment failed", zh: "支付失败" },
  buy: { en: "Buy", zh: "买入" },
  sell: { en: "Sell", zh: "卖出" },
};

const t = createT(translations);

type StatusType = "success" | "error";
type Status = { msg: string; type: StatusType };
type Pool = { volume24h: number; avgBlockSize: number; privacyLevel: string };

const APP_ID = "miniapp-dark-pool";
const { address, connect } = useWallet();
const { payGAS, isLoading } = usePayments(APP_ID);

const pool = ref<Pool>({ volume24h: 850000, avgBlockSize: 5000, privacyLevel: "High (ZK)" });
const orderType = ref<string>("Buy");
const amount = ref<string>("");
const slippage = ref<string>("0.5");
const privacyFee = "0.050";
const status = ref<Status | null>(null);
const fmt = (n: number, d = 2) => formatNumber(n, d);

const placeOrder = async (): Promise<void> => {
  if (isLoading.value) return;
  const amt = parseFloat(amount.value),
    slip = parseFloat(slippage.value);
  if (!(amt >= 1000 && slip > 0 && slip <= 5)) return void (status.value = { msg: t("minAmountError"), type: "error" });
  try {
    await payGAS(privacyFee, `darkpool:${orderType.value}:${amt}:${slip}`);
    status.value = { msg: `${t("orderPlaced")} ${orderType.value} ${amt} GAS`, type: "success" };
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
