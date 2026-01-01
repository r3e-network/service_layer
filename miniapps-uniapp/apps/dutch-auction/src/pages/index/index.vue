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
      <text class="card-title">{{ t("activeAuction") }}</text>
      <view class="row"
        ><text>{{ t("currentPrice") }}</text
        ><text class="v">{{ fmt(auction.currentPrice, 3) }} GAS</text></view
      >
      <view class="row"
        ><text>{{ t("startPrice") }}</text
        ><text class="v">{{ fmt(auction.startPrice, 3) }} GAS</text></view
      >
      <view class="row"
        ><text>{{ t("timeLeft") }}</text
        ><text class="v">{{ auction.timeLeft }}</text></view
      >
    </view>

    <view class="card">
      <text class="card-title">{{ t("auctionDetails") }}</text>
      <view class="row"
        ><text>{{ t("item") }}</text
        ><text class="v">{{ auction.item }}</text></view
      >
      <view class="row"
        ><text>{{ t("quantity") }}</text
        ><text class="v">{{ auction.quantity }}</text></view
      >
      <view class="row"
        ><text>{{ t("priceDrop") }}</text
        ><text class="v">{{ auction.dropRate }}/min</text></view
      >
    </view>

    <view class="card">
      <text class="card-title">{{ t("bidNow") }}</text>
      <uni-easyinput v-model="bidQuantity" type="number" :placeholder="t('quantityToBuy')" />
      <view class="price-display">
        <text>{{ t("total") }}: {{ fmt(parseFloat(bidQuantity || "0") * auction.currentPrice, 3) }} GAS</text>
      </view>
      <view class="action-btn" @click="placeBid"
        ><text>{{ isLoading ? t("processing") : t("acceptCurrentPrice") }}</text></view
      >
      <text class="note">{{ t("mockAuctionFee") }}: {{ auctionFee }} GAS</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useWallet, usePayments } from "@neo/uniapp-sdk";
import { formatNumber } from "@/shared/utils/format";
import { createT } from "@/shared/utils/i18n";

const translations = {
  title: { en: "Dutch Auction", zh: "荷兰式拍卖" },
  subtitle: { en: "Descending price discovery", zh: "递减价格发现" },
  activeAuction: { en: "Active Auction", zh: "进行中的拍卖" },
  currentPrice: { en: "Current price", zh: "当前价格" },
  startPrice: { en: "Start price", zh: "起始价格" },
  timeLeft: { en: "Time left", zh: "剩余时间" },
  auctionDetails: { en: "Auction Details", zh: "拍卖详情" },
  item: { en: "Item", zh: "物品" },
  quantity: { en: "Quantity", zh: "数量" },
  priceDrop: { en: "Price drop", zh: "价格下降" },
  bidNow: { en: "Bid Now", zh: "立即出价" },
  quantityToBuy: { en: "Quantity to buy", zh: "购买数量" },
  total: { en: "Total", zh: "总计" },
  processing: { en: "Processing...", zh: "处理中..." },
  acceptCurrentPrice: { en: "Accept Current Price", zh: "接受当前价格" },
  mockAuctionFee: { en: "Mock auction fee", zh: "模拟拍卖费用" },
  enterQuantity: { en: "Enter 1-", zh: "请输入 1-" },
  bidAccepted: { en: "Bid accepted", zh: "出价已接受" },
  paymentFailed: { en: "Payment failed", zh: "支付失败" },
  neoTokens: { en: "NEO Tokens", zh: "NEO 代币" },
};

const t = createT(translations);

type StatusType = "success" | "error";
type Status = { msg: string; type: StatusType };
type Auction = {
  currentPrice: number;
  startPrice: number;
  timeLeft: string;
  item: string;
  quantity: number;
  dropRate: string;
};

const APP_ID = "miniapp-dutch-auction";
const { address, connect } = useWallet();
const { payGAS, isLoading } = usePayments(APP_ID);

const auction = ref<Auction>({
  currentPrice: 8.5,
  startPrice: 12.0,
  timeLeft: "18m 42s",
  item: t("neoTokens"),
  quantity: 100,
  dropRate: "0.1 GAS",
});
const bidQuantity = ref<string>("");
const auctionFee = "0.008";
const status = ref<Status | null>(null);
const fmt = (n: number, d = 2) => formatNumber(n, d);

const placeBid = async (): Promise<void> => {
  if (isLoading.value) return;
  const qty = parseInt(bidQuantity.value, 10);
  if (!(qty > 0 && qty <= auction.value.quantity))
    return void (status.value = { msg: `${t("enterQuantity")}${auction.value.quantity}`, type: "error" });
  const total = (qty * auction.value.currentPrice + parseFloat(auctionFee)).toFixed(3);
  try {
    await payGAS(total, `auction:${auction.value.item}:${qty}:${auction.value.currentPrice}`);
    status.value = { msg: `${t("bidAccepted")}: ${qty} @ ${fmt(auction.value.currentPrice, 3)} GAS`, type: "success" };
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
.price-display {
  text-align: center;
  padding: 12px;
  background: rgba($color-defi, 0.15);
  border-radius: 10px;
  margin: 12px 0;
  font-size: 1.1em;
  font-weight: 800;
  color: $color-defi;
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
