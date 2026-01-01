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
      <text class="card-title">{{ t("poolInfo") }}</text>
      <view class="row"
        ><text>{{ t("pair") }}</text><text class="v">{{ pool.pair }}</text></view
      >
      <view class="row"
        ><text>{{ t("tvl") }}</text><text class="v">{{ fmt(pool.tvl, 0) }} GAS</text></view
      >
      <view class="row"
        ><text>{{ t("ilRisk") }}</text><text class="v risk">{{ pool.ilRisk }}%</text></view
      >
    </view>

    <view class="card">
      <text class="card-title">{{ t("yourPosition") }}</text>
      <view class="row"
        ><text>{{ t("deposited") }}</text><text class="v">{{ fmt(position.deposited, 2) }} GAS</text></view
      >
      <view class="row"
        ><text>{{ t("currentValue") }}</text><text class="v">{{ fmt(position.currentValue, 2) }} GAS</text></view
      >
      <view class="row"
        ><text>{{ t("ilAmount") }}</text><text class="v loss">-{{ fmt(position.ilAmount, 2) }} GAS</text></view
      >
    </view>

    <view class="card">
      <text class="card-title">{{ t("activateProtection") }}</text>
      <uni-easyinput v-model="protectionAmount" type="number" :placeholder="t(\'amountToProtect\')" />
      <view class="fee-row">
        <text>{{ t("protectionFee") }}</text>
        <text class="fee">{{ (parseFloat(protectionAmount || "0") * 0.02).toFixed(3) }} GAS</text>
      </view>
      <view class="action-btn" @click="activateProtection"
        ><text>{{ isLoading ? t("processing") : t("activateILGuard") }}</text></view
      >
      <text class="note">{{ t("coverage") }} {{ protectionAmount || "0" }} GAS</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useWallet, usePayments } from "@neo/uniapp-sdk";
import { formatNumber } from "@/shared/utils/format";
import { createT } from "@/shared/utils/i18n";

const translations = {
  title: { en: "IL Guard", zh: "无常损失防护" },
  subtitle: { en: "Impermanent loss protection", zh: "无常损失保护" },
  poolInfo: { en: "Pool Info", zh: "池信息" },
  pair: { en: "Pair", zh: "交易对" },
  tvl: { en: "TVL", zh: "总锁仓量" },
  ilRisk: { en: "IL Risk", zh: "无常损失风险" },
  yourPosition: { en: "Your Position", zh: "您的仓位" },
  deposited: { en: "Deposited", zh: "已存入" },
  currentValue: { en: "Current value", zh: "当前价值" },
  ilAmount: { en: "IL Amount", zh: "无常损失金额" },
  activateProtection: { en: "Activate Protection", zh: "激活保护" },
  amountToProtect: { en: "Amount to protect", zh: "保护金额" },
  protectionFee: { en: "Protection fee (2%)", zh: "保护费用 (2%)" },
  processing: { en: t("processing"), zh: "处理中..." },
  activateILGuard: { en: t("activateILGuard"), zh: "激活无常损失防护" },
  coverage: { en: "{{ t("coverage") }}", zh: "覆盖范围：最高90%的无常损失至" },
  enterAmount: { en: "Enter 0.01-", zh: "请输入 0.01-" },
  protectionActivated: { en: "IL protection activated for", zh: "无常损失保护已激活，金额为" },
  paymentFailed: { en: t("paymentFailed"), zh: "支付失败" },
};

const t = createT(translations);

type StatusType = "success" | "error";
type Status = { msg: string; type: StatusType };
type Pool = { pair: string; tvl: number; ilRisk: number };
type Position = { deposited: number; currentValue: number; ilAmount: number };

const APP_ID = "miniapp-il-guard";
const { address, connect } = useWallet();
const { payGAS, isLoading } = usePayments(APP_ID);

const pool = ref<Pool>({ pair: "NEO/GAS", tvl: 125000, ilRisk: 8.3 });
const position = ref<Position>({ deposited: 1000, currentValue: 917, ilAmount: 83 });
const protectionAmount = ref<string>("");
const status = ref<Status | null>(null);
const fmt = (n: number, d = 2) => formatNumber(n, d);

const activateProtection = async (): Promise<void> => {
  if (isLoading.value) return;
  const amount = parseFloat(protectionAmount.value);
  if (!(amount > 0 && amount <= position.value.deposited))
    return void (status.value = { msg: t("enterAmount") + position.value.deposited, type: "error" });
  const fee = (amount * 0.02).toFixed(3);
  try {
    await payGAS(fee, `ilguard:${pool.value.pair}:${amount}`);
    status.value = { msg: t("protectionActivated") + " " + fmt(amount, 2) + " GAS", type: "success" };
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
.risk {
  color: #f59e0b;
}
.loss {
  color: $color-error;
}
.fee-row {
  display: flex;
  justify-content: space-between;
  margin: 16px 0;
  color: $color-text-secondary;
}
.fee {
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
