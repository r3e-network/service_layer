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
        ><text>{{ t("totalDeposits") }}</text
        ><text class="v">{{ fmt(pool.totalDeposits, 0) }} GAS</text></view
      >
      <view class="row"
        ><text>{{ t("prizePool") }}</text
        ><text class="v">{{ fmt(pool.prizePool, 2) }} GAS</text></view
      >
      <view class="row"
        ><text>{{ t("nextDraw") }}</text
        ><text class="v">{{ pool.nextDraw }}</text></view
      >
    </view>

    <view class="card">
      <text class="card-title">{{ t("yourStats") }}</text>
      <view class="row"
        ><text>{{ t("deposit") }}</text
        ><text class="v">{{ fmt(user.deposit, 2) }} GAS</text></view
      >
      <view class="row"
        ><text>{{ t("tickets") }}</text
        ><text class="v">{{ user.tickets }}</text></view
      >
      <view class="row"
        ><text>{{ t("yieldSacrificed") }}</text
        ><text class="v">{{ fmt(user.yieldSacrificed, 3) }} GAS</text></view
      >
    </view>

    <view class="card">
      <text class="card-title">{{ t("joinLottery") }}</text>
      <uni-easyinput v-model="depositAmount" type="number" :placeholder="t('amountToDeposit')" />
      <view class="info-row">
        <text>{{ t("ticketsEarned") }}</text>
        <text class="tickets">{{ Math.floor(parseFloat(depositAmount || "0") / 10) }}</text>
      </view>
      <view class="action-btn" @click="joinLottery"
        ><text>{{ isLoading ? t("processing") : t("depositAndGetTickets") }}</text></view
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
  title: { en: "No-Loss Lottery", zh: "无损彩票" },
  subtitle: { en: "Prize savings account", zh: "奖金储蓄账户" },
  poolStats: { en: "Pool Stats", zh: "资金池统计" },
  totalDeposits: { en: "Total deposits", zh: "总存款" },
  prizePool: { en: "Prize pool", zh: "奖金池" },
  nextDraw: { en: "Next draw", zh: "下次开奖" },
  yourStats: { en: "Your Stats", zh: "您的统计" },
  deposit: { en: "Deposit", zh: "存款" },
  tickets: { en: "Tickets", zh: "彩票" },
  yieldSacrificed: { en: "Yield sacrificed", zh: "牺牲收益" },
  joinLottery: { en: "Join Lottery", zh: "加入彩票" },
  amountToDeposit: { en: "Amount to deposit", zh: "存款金额" },
  ticketsEarned: { en: "Tickets earned", zh: "获得彩票" },
  depositAndGetTickets: { en: "Deposit & Get Tickets", zh: "存款并获取彩票" },
  processing: { en: "Processing...", zh: "处理中..." },
  note: { en: "1 ticket per 10 GAS. Principal always withdrawable.", zh: "每 10 GAS 获得 1 张彩票。本金随时可提取。" },
  minDeposit: { en: "Minimum deposit: 10 GAS", zh: "最低存款：10 GAS" },
  deposited: { en: "Deposited", zh: "已存款" },
  earned: { en: "earned", zh: "获得" },
  paymentFailed: { en: "Payment failed", zh: "支付失败" },
};

const t = createT(translations);

type StatusType = "success" | "error";
type Status = { msg: string; type: StatusType };
type Pool = { totalDeposits: number; prizePool: number; nextDraw: string };
type User = { deposit: number; tickets: number; yieldSacrificed: number };

const APP_ID = "miniapp-no-loss-lottery";
const { address, connect } = useWallet();
const { payGAS, isLoading } = usePayments(APP_ID);

const pool = ref<Pool>({ totalDeposits: 850000, prizePool: 127.5, nextDraw: "2d 14h" });
const user = ref<User>({ deposit: 500, tickets: 50, yieldSacrificed: 0.875 });
const depositAmount = ref<string>("");
const status = ref<Status | null>(null);
const fmt = (n: number, d = 2) => formatNumber(n, d);

const joinLottery = async (): Promise<void> => {
  if (isLoading.value) return;
  const amount = parseFloat(depositAmount.value);
  if (!(amount >= 10)) return void (status.value = { msg: t("minDeposit"), type: "error" });
  try {
    await payGAS(amount.toFixed(2), `noloss:deposit:${amount}`);
    const tickets = Math.floor(amount / 10);
    status.value = {
      msg: `${t("deposited")} ${fmt(amount, 2)} GAS, ${t("earned")} ${tickets} ${t("tickets")}`,
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
.info-row {
  display: flex;
  justify-content: space-between;
  margin: 16px 0;
  color: $color-text-secondary;
}
.tickets {
  color: $color-success;
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
