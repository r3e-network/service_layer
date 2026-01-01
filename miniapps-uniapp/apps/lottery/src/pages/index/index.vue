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
      <text class="countdown">{{ countdown }}</text>
      <view class="stats-grid">
        <view class="stat-box">
          <text class="stat-value">#{{ round }}</text>
          <text class="stat-label">{{ t("round") }}</text>
        </view>
        <view class="stat-box">
          <text class="stat-value">{{ formatNum(prizePool) }}</text>
          <text class="stat-label">{{ t("prizePool") }}</text>
        </view>
        <view class="stat-box">
          <text class="stat-value">{{ totalTickets }}</text>
          <text class="stat-label">{{ t("total") }}</text>
        </view>
        <view class="stat-box">
          <text class="stat-value">{{ userTickets }}</text>
          <text class="stat-label">{{ t("yours") }}</text>
        </view>
      </view>
    </view>

    <view class="card">
      <text class="card-title">{{ t("buyTickets") }}</text>
      <view class="ticket-row">
        <view class="ticket-btn" @click="adjustTickets(-1)">
          <text>-</text>
        </view>
        <uni-easyinput v-model="tickets" type="number" class="ticket-input" />
        <view class="ticket-btn" @click="adjustTickets(1)">
          <text>+</text>
        </view>
      </view>
      <view class="total-row">
        <text class="total-label">{{ t("totalCost") }}</text>
        <text class="total-value">{{ formatNum(totalCost, 1) }} GAS</text>
      </view>
      <view class="buy-btn" @click="buyTickets" :style="{ opacity: isLoading ? 0.6 : 1 }">
        <text>{{ isLoading ? t("processing") : t("buyTickets") }}</text>
      </view>
    </view>

    <view class="card">
      <text class="card-title">{{ t("recentWinners") }}</text>
      <view class="winners-list">
        <text v-if="winners.length === 0" class="empty">{{ t("noWinners") }}</text>
        <view v-for="(w, i) in winners" :key="i" class="winner-item">
          <text class="winner-round">#{{ w.round }}</text>
          <text class="winner-addr">{{ w.address.slice(0, 8) }}...</text>
          <text class="winner-prize">{{ formatNum(w.prize) }} GAS</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useWallet, usePayments, useRNG } from "@neo/uniapp-sdk";
import { formatNumber, hexToBytes, randomIntFromBytes } from "@/shared/utils/format";
import { createT } from "@/shared/utils/i18n";

const translations = {
  title: { en: "Neo Lottery", zh: "Neo彩票" },
  subtitle: { en: "Provably fair draws", zh: "可证明公平抽奖" },
  round: { en: "Round", zh: "轮次" },
  prizePool: { en: "Prize Pool", zh: "奖池" },
  total: { en: "Total", zh: "总计" },
  yours: { en: "Yours", zh: "您的" },
  buyTickets: { en: "Buy Tickets", zh: "购买彩票" },
  totalCost: { en: "Total Cost", zh: "总费用" },
  processing: { en: "Processing...", zh: "处理中..." },
  recentWinners: { en: "Recent Winners", zh: "最近中奖者" },
  noWinners: { en: "No winners yet", zh: "暂无中奖者" },
  purchasing: { en: "Purchasing...", zh: "购买中..." },
  bought: { en: "Bought", zh: "已购买" },
  tickets: { en: "ticket(s)!", zh: "张彩票！" },
  error: { en: "Error", zh: "错误" },
};

const t = createT(translations);

const APP_ID = "miniapp-lottery";
const { address, connect } = useWallet();
const TICKET_PRICE = 0.1;
const ROUND_DURATION = 60000;

interface Winner {
  round: number;
  address: string;
  prize: number;
}

const { payGAS, isLoading } = usePayments(APP_ID);
const { requestRandom } = useRNG(APP_ID);

const tickets = ref(1);
const countdown = ref("01:00");
const round = ref(1);
const prizePool = ref(0);
const totalTickets = ref(0);
const userTickets = ref(0);
const winners = ref<Winner[]>([]);
const status = ref<{ msg: string; type: string } | null>(null);
const roundStart = ref(Date.now());

const totalCost = computed(() => tickets.value * TICKET_PRICE);

const formatNum = (n: number, d = 2) => formatNumber(n, d);

const adjustTickets = (delta: number) => {
  tickets.value = Math.max(1, Math.min(100, tickets.value + delta));
};

const buyTickets = async () => {
  if (isLoading.value) return;
  try {
    status.value = { msg: t("purchasing"), type: "loading" };
    await payGAS(String(totalCost.value), `lottery:${round.value}:${tickets.value}`);
    status.value = { msg: `${t("bought")} ${tickets.value} ${t("tickets")}`, type: "success" };
    totalTickets.value += tickets.value;
    userTickets.value += tickets.value;
    prizePool.value += totalCost.value;
  } catch (e: any) {
    status.value = { msg: e.message || t("error"), type: "error" };
  }
};

let timer: number;
onMounted(() => {
  timer = setInterval(() => {
    const elapsed = Date.now() - roundStart.value;
    const remaining = Math.max(0, ROUND_DURATION - (elapsed % ROUND_DURATION));
    const mins = Math.floor(remaining / 60000);
    const secs = Math.floor((remaining % 60000) / 1000);
    countdown.value = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }, 1000);
});

onUnmounted(() => clearInterval(timer));
</script>

<style lang="scss">
@import "@/shared/styles/theme.scss";

.app-container {
  min-height: 100vh;
  background: linear-gradient(135deg, $color-bg-primary 0%, $color-bg-secondary 100%);
  color: $color-text-primary;
  padding: 20px;
}

.header {
  text-align: center;
  margin-bottom: 24px;
}
.title {
  font-size: 1.8em;
  font-weight: bold;
  color: $color-gaming;
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
  color: $color-gaming;
  font-size: 1.1em;
  font-weight: bold;
  display: block;
  margin-bottom: 12px;
}
.countdown {
  font-size: 2em;
  font-weight: bold;
  color: $color-gaming;
  text-align: center;
  display: block;
}

.stats-grid {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}
.stat-box {
  flex: 1;
  text-align: center;
  background: rgba($color-gaming, 0.1);
  border-radius: 8px;
  padding: 12px;
}
.stat-value {
  color: $color-gaming;
  font-size: 1.2em;
  font-weight: bold;
  display: block;
}
.stat-label {
  color: $color-text-secondary;
  font-size: 0.8em;
}

.ticket-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.ticket-btn {
  width: 40px;
  height: 40px;
  background: rgba($color-gaming, 0.2);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $color-gaming;
  font-size: 1.5em;
}
.ticket-input {
  flex: 1;
}

.total-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
}
.total-label {
  color: $color-text-secondary;
}
.total-value {
  color: $color-gaming;
  font-weight: bold;
}

.buy-btn {
  background: linear-gradient(135deg, $color-gaming 0%, darken($color-gaming, 10%) 100%);
  color: #fff;
  padding: 14px;
  border-radius: 12px;
  text-align: center;
  font-weight: bold;
}

.winners-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.empty {
  color: $color-text-secondary;
  text-align: center;
}
.winner-item {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  background: rgba($color-gaming, 0.1);
  border-radius: 8px;
}
.winner-round {
  color: $color-gaming;
  font-weight: bold;
}
.winner-addr {
  color: $color-text-primary;
}
.winner-prize {
  color: $color-gaming;
}
</style>
