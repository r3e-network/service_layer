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
      <text class="card-title">{{ t("loanTerms") }}</text>
      <view class="row"
        ><text>{{ t("maxBorrow") }}</text
        ><text class="v">{{ fmt(terms.maxBorrow, 0) }} GAS</text></view
      >
      <view class="row"
        ><text>{{ t("interestRate") }}</text
        ><text class="v">{{ terms.interestRate }}% APR</text></view
      >
      <view class="row"
        ><text>{{ t("repayment") }}</text
        ><text class="v">{{ terms.repaymentSchedule }}</text></view
      >
    </view>

    <view class="card">
      <text class="card-title">{{ t("yourLoan") }}</text>
      <view class="row"
        ><text>{{ t("borrowed") }}</text
        ><text class="v">{{ fmt(loan.borrowed, 2) }} GAS</text></view
      >
      <view class="row"
        ><text>{{ t("collateralLocked") }}</text
        ><text class="v">{{ fmt(loan.collateralLocked, 2) }} GAS</text></view
      >
      <view class="row"
        ><text>{{ t("nextPayment") }}</text
        ><text class="v">{{ fmt(loan.nextPayment, 2) }} GAS in {{ loan.nextPaymentDue }}</text></view
      >
    </view>

    <view class="card">
      <text class="card-title">{{ t("takeSelfLoan") }}</text>
      <uni-easyinput v-model="loanAmount" type="number" :placeholder="t('amountToBorrow')" />
      <view class="detail-row">
        <text>{{ t("collateralRequired") }}</text>
        <text class="collateral">{{ fmt(parseFloat(loanAmount || "0") * 1.5, 2) }} GAS</text>
      </view>
      <view class="detail-row">
        <text>{{ t("monthlyPayment") }}</text>
        <text class="payment">{{ fmt(parseFloat(loanAmount || "0") * 0.085, 3) }} GAS</text>
      </view>
      <view class="action-btn" @click="takeLoan"
        ><text>{{ isLoading ? t("processing") : t("borrowNow") }}</text></view
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
  title: { en: "Self Loan", zh: "自我贷款" },
  subtitle: { en: "Borrow against future deposits", zh: "以未来存款为抵押借款" },
  loanTerms: { en: "Loan Terms", zh: "贷款条款" },
  maxBorrow: { en: "Max borrow", zh: "最大借款" },
  interestRate: { en: "Interest rate", zh: "利率" },
  repayment: { en: "Repayment", zh: "还款" },
  yourLoan: { en: "Your Loan", zh: "你的贷款" },
  borrowed: { en: "Borrowed", zh: "已借款" },
  collateralLocked: { en: "Collateral locked", zh: "锁定抵押品" },
  nextPayment: { en: "Next payment", zh: "下次还款" },
  takeSelfLoan: { en: "Take Self-Loan", zh: "申请自我贷款" },
  amountToBorrow: { en: "Amount to borrow", zh: "借款金额" },
  collateralRequired: { en: "Collateral required (150%)", zh: "所需抵押品 (150%)" },
  monthlyPayment: { en: "Monthly payment", zh: "月供" },
  borrowNow: { en: "Borrow Now", zh: "立即借款" },
  processing: { en: "Processing...", zh: "处理中..." },
  note: { en: "12-month term. Auto-deduct from future deposits.", zh: "12个月期限。自动从未来存款中扣除。" },
  enterAmount: { en: "Enter 1-{max}", zh: "请输入 1-{max}" },
  loanApproved: { en: "Loan approved: {amount} GAS borrowed", zh: "贷款已批准：已借款 {amount} GAS" },
  paymentFailed: { en: "Payment failed", zh: "支付失败" },
};

const t = createT(translations);

type StatusType = "success" | "error";
type Status = { msg: string; type: StatusType };
type Terms = { maxBorrow: number; interestRate: number; repaymentSchedule: string };
type Loan = { borrowed: number; collateralLocked: number; nextPayment: number; nextPaymentDue: string };

const APP_ID = "miniapp-self-loan";
const { address, connect } = useWallet();
const { payGAS, isLoading } = usePayments(APP_ID);

const terms = ref<Terms>({ maxBorrow: 5000, interestRate: 8.5, repaymentSchedule: "Monthly" });
const loan = ref<Loan>({ borrowed: 0, collateralLocked: 0, nextPayment: 0, nextPaymentDue: "N/A" });
const loanAmount = ref<string>("");
const status = ref<Status | null>(null);
const fmt = (n: number, d = 2) => formatNumber(n, d);

const takeLoan = async (): Promise<void> => {
  if (isLoading.value) return;
  const amount = parseFloat(loanAmount.value);
  if (!(amount > 0 && amount <= terms.value.maxBorrow)) {
    return void (status.value = {
      msg: t("enterAmount").replace("{max}", String(terms.value.maxBorrow)),
      type: "error",
    });
  }
  const collateral = (amount * 1.5).toFixed(2);
  const fee = "0.015";
  try {
    await payGAS(fee, `selfloan:borrow:${amount}:collateral:${collateral}`);
    status.value = { msg: t("loanApproved").replace("{amount}", fmt(amount, 2)), type: "success" };
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
.collateral {
  color: #f59e0b;
  font-weight: 800;
}
.payment {
  color: $color-defi;
  font-weight: 800;
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
