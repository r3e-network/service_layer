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
      <text class="card-title">{{ t("vaultStats") }}</text>
      <view class="row"
        ><text>{{ t("apy") }}</text
        ><text class="v">{{ vault.apy }}%</text></view
      >
      <view class="row"
        ><text>{{ t("tvl") }}</text
        ><text class="v">{{ fmt(vault.tvl, 0) }} GAS</text></view
      >
      <view class="row"
        ><text>{{ t("compoundFreq") }}</text
        ><text class="v">{{ vault.compoundFreq }}</text></view
      >
    </view>

    <view class="card">
      <text class="card-title">{{ t("yourPosition") }}</text>
      <view class="row"
        ><text>{{ t("deposited") }}</text
        ><text class="v">{{ fmt(position.deposited, 2) }} GAS</text></view
      >
      <view class="row"
        ><text>{{ t("earned") }}</text
        ><text class="v">+{{ fmt(position.earned, 4) }} GAS</text></view
      >
      <view class="row"
        ><text>{{ t("est30d") }}</text
        ><text class="v">{{ fmt(position.est30d, 2) }} GAS</text></view
      >
    </view>

    <view class="card">
      <text class="card-title">{{ t("manage") }}</text>
      <uni-easyinput v-model="amount" type="number" :placeholder="t('amountPlaceholder')" />
      <view class="action-btn" @click="deposit"
        ><text>{{ isLoading ? t("processing") : t("deposit") }}</text></view
      >
      <text class="note">{{ t("mockDepositFee").replace("{fee}", depositFee) }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { usePayments } from "@neo/uniapp-sdk";
import { formatNumber } from "@/shared/utils/format";
import { createT } from "@/shared/utils/i18n";

const translations = {
  title: { en: "Compound Capsule", zh: "复利胶囊" },
  subtitle: { en: "Auto-compounding savings", zh: "自动复利储蓄" },
  vaultStats: { en: "Vault Stats", zh: "金库统计" },
  apy: { en: "APY", zh: "年化收益率" },
  tvl: { en: "TVL", zh: "总锁仓量" },
  compoundFreq: { en: "Compound freq", zh: "复利频率" },
  yourPosition: { en: "Your Position", zh: "你的仓位" },
  deposited: { en: "Deposited", zh: "已存入" },
  earned: { en: "Earned", zh: "已赚取" },
  est30d: { en: "Est. 30d", zh: "预计30天" },
  manage: { en: "Manage", zh: "管理" },
  amountPlaceholder: { en: "Amount (GAS)", zh: "金额 (GAS)" },
  processing: { en: "Processing...", zh: "处理中..." },
  deposit: { en: "Deposit", zh: "存入" },
  mockDepositFee: { en: "Mock deposit fee: {fee} GAS", zh: "模拟存款费用：{fee} GAS" },
  enterValidAmount: { en: "Enter a valid amount", zh: "请输入有效金额" },
  depositedAmount: { en: "Deposited {amount} GAS", zh: "已存入 {amount} GAS" },
  paymentFailed: { en: "Payment failed", zh: "支付失败" },
};
const t = createT(translations);

type StatusType = "success" | "error";
type Status = { msg: string; type: StatusType };
type Vault = { apy: number; tvl: number; compoundFreq: string };
type Position = { deposited: number; earned: number; est30d: number };

const APP_ID = "miniapp-compound-capsule";
const { address, connect } = useWallet();
const { payGAS, isLoading } = usePayments(APP_ID);

const vault = ref<Vault>({ apy: 18.5, tvl: 125000, compoundFreq: "Every 6h" });
const position = ref<Position>({ deposited: 100, earned: 1.2345, est30d: 1.54 });
const amount = ref<string>("");
const depositFee = "0.010";
const status = ref<Status | null>(null);
const fmt = (n: number, d = 2) => formatNumber(n, d);

const deposit = async (): Promise<void> => {
  if (isLoading.value) return;
  const amt = parseFloat(amount.value);
  if (!(amt > 0)) return void (status.value = { msg: t("enterValidAmount"), type: "error" });
  try {
    await payGAS((amt + parseFloat(depositFee)).toFixed(3), `compound:deposit:${amt}`);
    position.value.deposited += amt;
    status.value = { msg: t("depositedAmount").replace("{amount}", String(amt)), type: "success" };
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
