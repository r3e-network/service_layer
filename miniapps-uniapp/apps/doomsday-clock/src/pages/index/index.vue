<template>
  <view class="app-container">
    <view class="header">
      <text class="title">{{ t("title") }}</text>
      <text class="subtitle">{{ t("subtitle") }}</text>
    </view>

    <view v-if="status" :class="['status-msg', status.type]">
      <text>{{ status.msg }}</text>
    </view>

    <view class="card clock-card">
      <text class="clock-label">{{ t("timeUntilEvent") }}</text>
      <text class="clock-time">{{ countdown }}</text>
      <view class="clock-progress">
        <view class="progress-bar" :style="{ width: progress + '%' }"></view>
      </view>
    </view>

    <view class="card">
      <view class="stats-grid">
        <view class="stat-box">
          <text class="stat-value">{{ formatNum(totalStaked) }}</text>
          <text class="stat-label">{{ t("totalStaked") }}</text>
        </view>
        <view class="stat-box">
          <text class="stat-value">{{ formatNum(userStake) }}</text>
          <text class="stat-label">{{ t("yourStake") }}</text>
        </view>
        <view class="stat-box">
          <text class="stat-value">{{ participants }}</text>
          <text class="stat-label">{{ t("players") }}</text>
        </view>
      </view>
    </view>

    <view class="card">
      <text class="card-title">{{ t("stakeOnOutcome") }}</text>
      <uni-easyinput v-model="stakeAmount" type="number" :placeholder="t('amountToStake')" />
      <view class="outcomes-list">
        <view
          v-for="(outcome, i) in outcomes"
          :key="i"
          :class="['outcome-btn', selectedOutcome === i && 'active']"
          @click="selectedOutcome = i"
        >
          <text class="outcome-name">{{ outcome.name }}</text>
          <text class="outcome-odds">{{ outcome.odds }}x</text>
        </view>
      </view>
      <view class="stake-btn" @click="placeStake" :style="{ opacity: isLoading ? 0.6 : 1 }">
        <text>{{ isLoading ? t("staking") : t("placeStake") }}</text>
      </view>
    </view>

    <view class="card">
      <text class="card-title">{{ t("eventHistory") }}</text>
      <view class="history-list">
        <view v-for="(event, i) in history" :key="i" class="history-item">
          <text class="history-date">{{ event.date }}</text>
          <text class="history-desc">{{ event.description }}</text>
          <text class="history-result">{{ event.result }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useWallet, usePayments } from "@neo/uniapp-sdk";
import { formatNumber } from "@/shared/utils/format";
import { createT } from "@/shared/utils/i18n";

const translations = {
  title: { en: "Doomsday Clock", zh: "末日时钟" },
  subtitle: { en: "Time-locked governance events", zh: "时间锁定治理事件" },
  timeUntilEvent: { en: "Time Until Event", zh: "距离事件" },
  totalStaked: { en: "Total Staked", zh: "总质押" },
  yourStake: { en: "Your Stake", zh: "您的质押" },
  players: { en: "Players", zh: "参与者" },
  stakeOnOutcome: { en: "Stake on Outcome", zh: "押注结果" },
  amountToStake: { en: "Amount to stake", zh: "质押数量" },
  staking: { en: "Staking...", zh: "质押中..." },
  placeStake: { en: "Place Stake", zh: "下注" },
  eventHistory: { en: "Event History", zh: "事件历史" },
  selectOutcome: { en: "Select an outcome", zh: "请选择一个结果" },
  minStake: { en: "Min stake: 1 GAS", zh: "最小质押：1 GAS" },
  placingStake: { en: "Placing stake...", zh: "正在质押..." },
  stakePlaced: { en: "Stake placed!", zh: "质押成功！" },
  error: { en: "Error", zh: "错误" },
  protocolUpgrade: { en: "Protocol Upgrade", zh: "协议升级" },
  treasuryRelease: { en: "Treasury Release", zh: "国库释放" },
  governanceVote: { en: "Governance Vote", zh: "治理投票" },
  emergencyProposal: { en: "Emergency Proposal", zh: "紧急提案" },
  passed: { en: "Passed", zh: "通过" },
  feeAdjustment: { en: "Fee Adjustment", zh: "费用调整" },
  failed: { en: "Failed", zh: "失败" },
};

const t = createT(translations);

const APP_ID = "miniapp-doomsday-clock";
const { address, connect } = useWallet();

interface Outcome {
  name: string;
  odds: number;
}

interface HistoryEvent {
  date: string;
  description: string;
  result: string;
}

const { payGAS, isLoading } = usePayments(APP_ID);

const stakeAmount = ref("5");
const totalStaked = ref(25000);
const userStake = ref(50);
const participants = ref(142);
const countdown = ref("05:23:45");
const progress = ref(65);
const selectedOutcome = ref<number | null>(null);
const status = ref<{ msg: string; type: string } | null>(null);

const outcomes = ref<Outcome[]>([
  { name: t("protocolUpgrade"), odds: 2.5 },
  { name: t("treasuryRelease"), odds: 3.0 },
  { name: t("governanceVote"), odds: 1.8 },
]);

const history = ref<HistoryEvent[]>([
  { date: "2025-12-20", description: t("emergencyProposal"), result: t("passed") },
  { date: "2025-12-15", description: t("feeAdjustment"), result: t("failed") },
]);

const formatNum = (n: number) => formatNumber(n, 0);

const placeStake = async () => {
  if (isLoading.value || selectedOutcome.value === null) {
    status.value = { msg: t("selectOutcome"), type: "error" };
    return;
  }
  const amount = parseFloat(stakeAmount.value);
  if (amount < 1) {
    status.value = { msg: t("minStake"), type: "error" };
    return;
  }
  try {
    status.value = { msg: t("placingStake"), type: "loading" };
    await payGAS(stakeAmount.value, `stake:${selectedOutcome.value}`);
    userStake.value += amount;
    totalStaked.value += amount;
    status.value = { msg: t("stakePlaced"), type: "success" };
  } catch (e: any) {
    status.value = { msg: e.message || t("error"), type: "error" };
  }
};

let timer: number;
onMounted(() => {
  timer = setInterval(() => {
    const parts = countdown.value.split(":");
    let hours = parseInt(parts[0]);
    let mins = parseInt(parts[1]);
    let secs = parseInt(parts[2]);

    if (secs > 0) secs--;
    else if (mins > 0) {
      mins--;
      secs = 59;
    } else if (hours > 0) {
      hours--;
      mins = 59;
      secs = 59;
    }

    countdown.value = `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
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
  color: $color-governance;
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

.clock-card {
  text-align: center;
}
.clock-label {
  color: $color-text-secondary;
  font-size: 0.9em;
  display: block;
  margin-bottom: 8px;
}
.clock-time {
  font-size: 2.5em;
  font-weight: bold;
  color: $color-governance;
  display: block;
  margin-bottom: 16px;
}
.clock-progress {
  height: 8px;
  background: rgba($color-governance, 0.2);
  border-radius: 4px;
  overflow: hidden;
}
.progress-bar {
  height: 100%;
  background: $color-governance;
  transition: width 0.3s;
}

.card-title {
  color: $color-governance;
  font-size: 1.1em;
  font-weight: bold;
  display: block;
  margin-bottom: 12px;
}

.stats-grid {
  display: flex;
  gap: 8px;
}
.stat-box {
  flex: 1;
  text-align: center;
  background: rgba($color-governance, 0.1);
  border-radius: 8px;
  padding: 12px;
}
.stat-value {
  color: $color-governance;
  font-size: 1.2em;
  font-weight: bold;
  display: block;
}
.stat-label {
  color: $color-text-secondary;
  font-size: 0.8em;
}

.outcomes-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 16px 0;
}
.outcome-btn {
  padding: 12px;
  background: rgba($color-governance, 0.1);
  border: 2px solid transparent;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  &.active {
    border-color: $color-governance;
    background: rgba($color-governance, 0.2);
  }
}
.outcome-name {
  color: $color-text-primary;
}
.outcome-odds {
  color: $color-governance;
  font-weight: bold;
}

.stake-btn {
  background: linear-gradient(135deg, $color-governance 0%, darken($color-governance, 10%) 100%);
  color: #fff;
  padding: 14px;
  border-radius: 12px;
  text-align: center;
  font-weight: bold;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.history-item {
  padding: 12px;
  background: rgba($color-governance, 0.05);
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.history-date {
  color: $color-text-secondary;
  font-size: 0.85em;
}
.history-desc {
  color: $color-text-primary;
  flex: 1;
  margin: 0 12px;
}
.history-result {
  color: $color-governance;
  font-weight: bold;
  font-size: 0.9em;
}
</style>
