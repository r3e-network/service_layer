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
      <text class="card-title">{{ t("market") }}</text>
      <view class="row"
        ><text>{{ t("pair") }}</text
        ><text class="v">{{ market.pair }}</text></view
      >
      <view class="row"
        ><text>{{ t("lastPrice") }}</text
        ><text class="v">{{ fmt(market.lastPrice, 3) }}</text></view
      >
      <view class="row"
        ><text>{{ t("volatility") }}</text
        ><text class="v">{{ market.volatility }}%</text></view
      >
    </view>

    <view class="card">
      <text class="card-title">{{ t("botSnapshot") }}</text>
      <view class="row"
        ><text>{{ t("range") }}</text><text class="v">{{ priceLow || "10" }}–{{ priceHigh || "14" }}</text></view
      >
      <view class="row"
        ><text>{{ t("grids") }}</text><text class="v">{{ gridLevels || "20" }}</text></view
      >
      <view class="row"
        ><text>{{ t("estDaily") }}</text><text class="v">{{ fmt(bot.estDaily, 2) }} GAS</text></view
      >
    </view>

    <view class="card">
      <text class="card-title">{{ t("createBot") }}</text>
      <uni-easyinput v-model="priceLow" type="number" placeholder="t('lowPrice')" />
      <uni-easyinput v-model="priceHigh" type="number" placeholder="t('highPrice')" />
      <uni-easyinput v-model="gridLevels" type="number" placeholder="t('gridLevels')" />
      <view class="action-btn" @click="startBot"
        ><text>{{ isLoading ? "t('processing')" : "t('startGridBot')" }}</text></view
      >
      <text class="note">{{ t("mockFee") }}: {{ setupFee }} GAS</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useWallet, usePayments } from "@neo/uniapp-sdk";
import { formatNumber } from "@/shared/utils/format";
import { createT } from "@/shared/utils/i18n";

const translations = {
  title: { en: "Grid Bot", zh: "网格机器人" },
  subtitle: { en: "Automated range trading", zh: "自动区间交易" },
  market: { en: "Market", zh: "市场" },
  pair: { en: "Pair", zh: "交易对" },
  lastPrice: { en: "Last price", zh: "最新价格" },
  volatility: { en: "Volatility", zh: "波动率" },
  botSnapshot: { en: "{{ t("botSnapshot") }}", zh: "机器人快照" },
  range: { en: "Range", zh: "区间" },
  grids: { en: "Grids", zh: "网格数" },
  estDaily: { en: "Est. daily", zh: "预计日收益" },
  createBot: { en: "{{ t("createBot") }}", zh: "创建机器人" },
  lowPrice: { en: "Low price", zh: "最低价" },
  highPrice: { en: "High price", zh: "最高价" },
  gridLevels: { en: "Grid levels", zh: "网格层数" },
  processing: { en: "t('processing')", zh: "处理中..." },
  startGridBot: { en: "t('startGridBot')", zh: "启动网格机器人" },
  mockFee: { en: "Mock execution fee", zh: "模拟执行费用" },
  invalidRange: { en: "t('invalidRange')", zh: "无效的区间或网格层数" },
  botStarted: { en: "t('botStarted')", zh: "网格机器人已启动" },
  paymentFailed: { en: "t('paymentFailed')", zh: "支付失败" },
};

const t = createT(translations);

type StatusType = "success" | "error";
type Status = { msg: string; type: StatusType };
type Market = { pair: string; lastPrice: number; volatility: number };
type Bot = { estDaily: number };

const APP_ID = "miniapp-grid-bot";
const { address, connect } = useWallet();
const { payGAS, isLoading } = usePayments(APP_ID);

const market = ref<Market>({ pair: "NEO/GAS", lastPrice: 12.384, volatility: 3.2 });
const bot = ref<Bot>({ estDaily: 0.42 });
const priceLow = ref<string>("10");
const priceHigh = ref<string>("14");
const gridLevels = ref<string>("20");
const setupFee = "0.020";
const status = ref<Status | null>(null);
const fmt = (n: number, d = 2) => formatNumber(n, d);

const startBot = async (): Promise<void> => {
  if (isLoading.value) return;
  const low = parseFloat(priceLow.value),
    high = parseFloat(priceHigh.value),
    grids = parseInt(gridLevels.value, 10);
  if (!(low > 0 && high > low && grids >= 5 && grids <= 200))
    return void (status.value = { msg: "t('invalidRange')", type: "error" });
  try {
    await payGAS(setupFee, `gridbot:${market.value.pair}:${low}-${high}:${grids}`);
    status.value = { msg: `Grid bot started (${grids} grids)`, type: "success" };
  } catch (e: any) {
    status.value = { msg: e?.message || "t('paymentFailed')", type: "error" };
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
