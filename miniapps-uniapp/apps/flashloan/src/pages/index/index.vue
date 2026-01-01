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
      <text class="card-title">{{ t("availableLiquidity") }}</text>
      <view class="liquidity-row">
        <text class="token">GAS</text>
        <text class="amount">{{ formatNum(gasLiquidity) }}</text>
      </view>
      <view class="liquidity-row">
        <text class="token">NEO</text>
        <text class="amount">{{ neoLiquidity }}</text>
      </view>
    </view>
    <view class="card">
      <text class="card-title">{{ t("requestFlashLoan") }}</text>
      <uni-easyinput v-model="loanAmount" type="number" :placeholder="t('amountPlaceholder')" />
      <view class="fee-row">
        <text>{{ t("fee") }}</text>
        <text class="fee">{{ (parseFloat(loanAmount || "0") * 0.0009).toFixed(4) }} GAS</text>
      </view>
      <view class="action-btn" @click="requestLoan">
        <text>{{ isLoading ? t("processing") : t("executeLoan") }}</text>
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
  title: { en: "Flash Loan", zh: "闪电贷" },
  subtitle: { en: "Instant uncollateralized loans", zh: "即时无抵押贷款" },
  availableLiquidity: { en: "Available Liquidity", zh: "可用流动性" },
  requestFlashLoan: { en: "Request Flash Loan", zh: "申请闪电贷" },
  amountPlaceholder: { en: "Amount", zh: "金额" },
  fee: { en: "Fee (0.09%)", zh: "手续费 (0.09%)" },
  processing: { en: "Processing...", zh: "处理中..." },
  executeLoan: { en: "Execute Flash Loan", zh: "执行闪电贷" },
  invalidAmount: { en: "Invalid amount", zh: "无效金额" },
  loanExecuted: { en: "Flash loan executed", zh: "闪电贷已执行" },
  error: { en: "Error", zh: "错误" },
};

const t = createT(translations);

const APP_ID = "miniapp-flashloan";
const { address, connect } = useWallet();
const { payGAS, isLoading } = usePayments(APP_ID);

const gasLiquidity = ref(50000);
const neoLiquidity = ref(1000);
const loanAmount = ref("");
const status = ref<{ msg: string; type: string } | null>(null);

const formatNum = (n: number) => formatNumber(n, 0);

const requestLoan = async () => {
  if (isLoading.value) return;
  const amount = parseFloat(loanAmount.value);
  if (amount <= 0 || amount > gasLiquidity.value) {
    status.value = { msg: t("invalidAmount"), type: "error" };
    return;
  }
  try {
    const fee = (amount * 0.0009).toFixed(4);
    await payGAS(fee, `flashloan:${amount}`);
    status.value = { msg: `${t("loanExecuted")}: ${amount} GAS`, type: "success" };
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
  color: #fff;
  padding: 20px;
}
.header {
  text-align: center;
  margin-bottom: 24px;
}
.title {
  font-size: 1.8em;
  font-weight: bold;
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
  color: $color-defi;
  font-size: 1.1em;
  font-weight: bold;
  display: block;
  margin-bottom: 12px;
}
.liquidity-row {
  display: flex;
  justify-content: space-between;
  padding: 12px;
  background: rgba($color-defi, 0.1);
  border-radius: 8px;
  margin-bottom: 8px;
}
.token {
  color: $color-text-primary;
  font-weight: bold;
}
.amount {
  color: $color-defi;
  font-weight: bold;
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
  color: #fff;
  padding: 14px;
  border-radius: 12px;
  text-align: center;
  font-weight: bold;
}
</style>
