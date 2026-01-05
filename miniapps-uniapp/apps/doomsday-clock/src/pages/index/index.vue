<template>
  <AppLayout :title="t('title')" show-top-nav :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <view v-if="activeTab === 'game'" class="tab-content">
      <view v-if="status" :class="['status-msg', status.type]">
        <text>{{ status.msg }}</text>
      </view>

      <!-- Dramatic Countdown Display -->
      <NeoCard variant="accent" :class="['doomsday-clock-card', dangerLevel]">
        <view class="clock-header">
          <text class="clock-label">{{ t("timeUntilEvent") }}</text>
          <view :class="['danger-badge', dangerLevel]">
            <text class="danger-text">{{ dangerLevelText }}</text>
          </view>
        </view>

        <view class="clock-display">
          <text :class="['clock-time', dangerLevel, { pulse: shouldPulse }]">{{ countdown }}</text>
        </view>

        <!-- Danger Level Meter -->
        <view class="danger-meter">
          <view class="meter-labels">
            <text class="meter-label">{{ t("safe") }}</text>
            <text class="meter-label">{{ t("critical") }}</text>
          </view>
          <view class="meter-bar">
            <view :class="['meter-fill', dangerLevel]" :style="{ width: dangerProgress + '%' }"></view>
            <view class="meter-indicator" :style="{ left: dangerProgress + '%' }"></view>
          </view>
        </view>

        <!-- Event Description -->
        <view class="event-description">
          <text class="event-title">{{ t("nextEvent") }}</text>
          <text class="event-text">{{ currentEventDescription }}</text>
        </view>
      </NeoCard>

      <!-- Stats Grid -->
      <NeoCard>
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
      </NeoCard>

      <!-- Stake Section -->
      <NeoCard>
        <text class="card-title">{{ t("stakeOnOutcome") }}</text>
        <NeoInput v-model="stakeAmount" type="number" :placeholder="t('amountToStake')" suffix="GAS" />
        <view class="outcomes-list">
          <NeoButton
            v-for="(outcome, i) in outcomes"
            :key="i"
            :variant="selectedOutcome === i ? 'primary' : 'ghost'"
            block
            @click="selectedOutcome = i"
            class="outcome-btn"
          >
            <view class="outcome-content">
              <text class="outcome-name">{{ outcome.name }}</text>
              <text class="outcome-odds">{{ outcome.odds }}x</text>
            </view>
          </NeoButton>
        </view>
        <NeoButton variant="primary" size="lg" block @click="placeStake" :disabled="isLoading">
          {{ isLoading ? t("staking") : t("placeStake") }}
        </NeoButton>
      </NeoCard>
    </view>

    <view v-if="activeTab === 'history'" class="tab-content scrollable">
      <NeoCard :title="t('eventHistory')">
        <view class="history-list">
          <view v-for="(event, i) in history" :key="i" class="history-item">
            <view class="history-header">
              <text class="history-date">{{ event.date }}</text>
              <text :class="['history-result', event.result === t('passed') ? 'passed' : 'failed']">
                {{ event.result }}
              </text>
            </view>
            <text class="history-desc">{{ event.description }}</text>
          </view>
        </view>
      </NeoCard>
    </view>

    <!-- Docs Tab -->
    <view v-if="activeTab === 'docs'" class="tab-content scrollable">
      <NeoDoc
        :title="t('title')"
        :subtitle="t('docSubtitle')"
        :description="t('docDescription')"
        :steps="docSteps"
        :features="docFeatures"
      />
    </view>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useWallet, usePayments } from "@neo/uniapp-sdk";
import { formatNumber } from "@/shared/utils/format";
import { createT } from "@/shared/utils/i18n";
import AppLayout from "@/shared/components/AppLayout.vue";
import NeoButton from "@/shared/components/NeoButton.vue";
import NeoCard from "@/shared/components/NeoCard.vue";
import NeoInput from "@/shared/components/NeoInput.vue";
import NeoDoc from "@/shared/components/NeoDoc.vue";

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
  game: { en: "Game", zh: "游戏" },
  history: { en: "History", zh: "历史" },
  docs: { en: "Docs", zh: "文档" },
  docSubtitle: { en: "Learn more about this MiniApp.", zh: "了解更多关于此小程序的信息。" },
  docDescription: {
    en: "Professional documentation for this application is coming soon.",
    zh: "此应用程序的专业文档即将推出。",
  },
  step1: { en: "Open the application.", zh: "打开应用程序。" },
  step2: { en: "Follow the on-screen instructions.", zh: "按照屏幕上的指示操作。" },
  step3: { en: "Enjoy the secure experience!", zh: "享受安全体验！" },
  feature1Name: { en: "TEE Secured", zh: "TEE 安全保护" },
  feature1Desc: { en: "Hardware-level isolation.", zh: "硬件级隔离。" },
  feature2Name: { en: "On-Chain Fairness", zh: "链上公正" },
  feature2Desc: { en: "Provably fair execution.", zh: "可证明公平的执行。" },
  safe: { en: "SAFE", zh: "安全" },
  critical: { en: "CRITICAL", zh: "危急" },
  nextEvent: { en: "NEXT EVENT", zh: "下一事件" },
  dangerLow: { en: "LOW RISK", zh: "低风险" },
  dangerMedium: { en: "ELEVATED", zh: "警戒" },
  dangerHigh: { en: "HIGH ALERT", zh: "高度警戒" },
  dangerCritical: { en: "CRITICAL", zh: "危急" },
};

const t = createT(translations);

const navTabs = [
  { id: "game", icon: "game", label: t("game") },
  { id: "history", icon: "time", label: t("history") },
  { id: "docs", icon: "book", label: t("docs") },
];
const activeTab = ref("game");

const docSteps = computed(() => [t("step1"), t("step2"), t("step3")]);
const docFeatures = computed(() => [
  { name: t("feature1Name"), desc: t("feature1Desc") },
  { name: t("feature2Name"), desc: t("feature2Desc") },
]);

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

const currentEventDescription = computed(() => {
  return outcomes.value[0]?.name || t("protocolUpgrade");
});

// Calculate danger level based on remaining time
const totalSeconds = computed(() => {
  const parts = countdown.value.split(":");
  const hours = parseInt(parts[0]);
  const mins = parseInt(parts[1]);
  const secs = parseInt(parts[2]);
  return hours * 3600 + mins * 60 + secs;
});

const dangerLevel = computed(() => {
  const seconds = totalSeconds.value;
  if (seconds > 7200) return "low"; // > 2 hours
  if (seconds > 3600) return "medium"; // > 1 hour
  if (seconds > 600) return "high"; // > 10 minutes
  return "critical"; // <= 10 minutes
});

const dangerLevelText = computed(() => {
  switch (dangerLevel.value) {
    case "low":
      return t("dangerLow");
    case "medium":
      return t("dangerMedium");
    case "high":
      return t("dangerHigh");
    case "critical":
      return t("dangerCritical");
    default:
      return t("dangerLow");
  }
});

const dangerProgress = computed(() => {
  const seconds = totalSeconds.value;
  const maxSeconds = 21600; // 6 hours
  return Math.min(100, Math.max(0, 100 - (seconds / maxSeconds) * 100));
});

const shouldPulse = computed(() => {
  return dangerLevel.value === "critical" || dangerLevel.value === "high";
});

const formatNum = (n: number) => formatNumber(n, 0);

// Fetch data and check automation status
const fetchData = async () => {
  try {
    const sdk = await import("@neo/uniapp-sdk").then((m) => m.waitForSDK?.() || null);
    if (!sdk?.invoke) return;

    const data = (await sdk.invoke("doomsdayClock.getData", { appId: APP_ID })) as {
      countdown: string;
      totalStaked: number;
      userStake: number;
      participants: number;
      outcomes: typeof outcomes.value;
      history: typeof history.value;
    } | null;

    if (data) {
      countdown.value = data.countdown || countdown.value;
      totalStaked.value = data.totalStaked || 0;
      userStake.value = data.userStake || 0;
      participants.value = data.participants || 0;
      if (data.outcomes) outcomes.value = data.outcomes;
      if (data.history) history.value = data.history;
    }
  } catch (e) {
    console.warn("[DoomsdayClock] Failed to fetch data:", e);
  }
};

// Trigger event settlement when countdown reaches zero via Edge Function
const triggerEventSettlement = async () => {
  try {
    await fetch("/api/automation/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        appId: APP_ID,
        taskName: "settlement",
        taskType: "scheduled",
        payload: {
          action: "custom",
          handler: "doomsday:settlement",
          data: { event: "settlement" },
        },
      }),
    });

    // Refresh data after settlement
    setTimeout(() => fetchData(), 2000);
  } catch (e) {
    console.warn("[DoomsdayClock] Event settlement failed:", e);
  }
};

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
let lastSeconds = 0;

onMounted(() => {
  fetchData();

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

    const currentSeconds = hours * 3600 + mins * 60 + secs;

    // Trigger settlement when countdown reaches zero
    if (lastSeconds > 0 && currentSeconds === 0) {
      triggerEventSettlement();
    }
    lastSeconds = currentSeconds;

    countdown.value = `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }, 1000);
});

onUnmounted(() => clearInterval(timer));
</script>

<style lang="scss" scoped>
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.tab-content {
  padding: 12px;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: $space-4;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
}

.status-msg {
  text-align: center;
  padding: $space-4;
  border: $border-width-md solid var(--border-color);
  background: var(--bg-card);
  font-weight: $font-weight-bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  &.success {
    border-color: var(--status-success);
    box-shadow: 4px 4px 0 var(--status-success);
    color: var(--status-success);
  }
  &.error {
    border-color: var(--status-error);
    box-shadow: 4px 4px 0 var(--status-error);
    color: var(--status-error);
  }
  &.loading {
    border-color: var(--neo-green);
    box-shadow: 4px 4px 0 var(--neo-green);
    color: var(--neo-green);
  }
}

// Doomsday Clock Card
.doomsday-clock-card {
  position: relative;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;

  &.critical {
    border-color: var(--brutal-red);
    animation: borderPulse 1s ease-in-out infinite;
  }

  &.high {
    border-color: var(--brutal-orange);
  }

  &.medium {
    border-color: var(--brutal-yellow);
  }
}

.clock-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $space-4;
}

.clock-label {
  color: var(--text-secondary);
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  text-transform: uppercase;
  letter-spacing: 2px;
}

.danger-badge {
  padding: $space-2 $space-3;
  border: $border-width-sm solid var(--border-color);
  font-size: $font-size-xs;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  letter-spacing: 1px;

  &.low {
    background: var(--brutal-yellow);
    border-color: var(--brutal-yellow);
    color: var(--neo-black);
  }

  &.medium {
    background: var(--brutal-orange);
    border-color: var(--brutal-orange);
    color: var(--neo-black);
  }

  &.high {
    background: var(--brutal-red);
    border-color: var(--brutal-red);
    color: var(--neo-white);
  }

  &.critical {
    background: var(--brutal-red);
    border-color: var(--brutal-red);
    color: var(--neo-white);
    animation: badgePulse 0.5s ease-in-out infinite;
  }
}

.danger-text {
  display: block;
}

.clock-display {
  text-align: center;
  margin: $space-6 0;
}

.clock-time {
  font-size: 64px;
  font-weight: $font-weight-black;
  display: block;
  font-family: $font-mono;
  line-height: 1;
  text-shadow: 4px 4px 0 rgba(0, 0, 0, 0.2);

  &.low {
    color: var(--brutal-yellow);
  }

  &.medium {
    color: var(--brutal-orange);
  }

  &.high {
    color: var(--brutal-red);
  }

  &.critical {
    color: var(--brutal-red);
  }

  &.pulse {
    animation: timePulse 1s ease-in-out infinite;
  }
}

// Danger Meter
.danger-meter {
  margin-top: $space-6;
}

.meter-labels {
  display: flex;
  justify-content: space-between;
  margin-bottom: $space-2;
}

.meter-label {
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--text-secondary);
}

.meter-bar {
  height: 24px;
  background: var(--bg-secondary);
  border: $border-width-md solid var(--border-color);
  position: relative;
  overflow: hidden;
}

.meter-fill {
  flex: 1;
  min-height: 0;
  transition: width 0.3s ease-out;
  position: relative;

  &.low {
    background: var(--brutal-yellow);
  }

  &.medium {
    background: var(--brutal-orange);
  }

  &.high {
    background: var(--brutal-red);
  }

  &.critical {
    background: var(--brutal-red);
    animation: meterPulse 0.5s ease-in-out infinite;
  }

  &::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: repeating-linear-gradient(
      45deg,
      transparent,
      transparent 10px,
      rgba(0, 0, 0, 0.1) 10px,
      rgba(0, 0, 0, 0.1) 20px
    );
  }
}

.meter-indicator {
  position: absolute;
  top: -4px;
  bottom: -4px;
  width: 4px;
  background: var(--neo-black);
  border: 2px solid var(--neo-white);
  transform: translateX(-50%);
  transition: left 0.3s ease-out;
  z-index: 2;
}

// Event Description
.event-description {
  margin-top: $space-6;
  padding: $space-4;
  background: var(--bg-secondary);
  border: $border-width-sm solid var(--border-color);
}

.event-title {
  display: block;
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--text-secondary);
  margin-bottom: $space-2;
}

.event-text {
  display: block;
  font-size: $font-size-base;
  font-weight: $font-weight-semibold;
  color: var(--text-primary);
}

// Stats Grid
.stats-grid {
  display: flex;
  gap: $space-3;
}

.stat-box {
  flex: 1;
  text-align: center;
  background: var(--bg-secondary);
  border: $border-width-sm solid var(--border-color);
  box-shadow: $shadow-sm;
  padding: $space-4;
}

.stat-value {
  color: var(--neo-green);
  font-size: $font-size-xl;
  font-weight: $font-weight-black;
  display: block;
  font-family: $font-mono;
}

.stat-label {
  color: var(--text-secondary);
  font-size: $font-size-xs;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: $font-weight-bold;
}

// Card Title
.card-title {
  color: var(--neo-green);
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
  text-transform: uppercase;
  letter-spacing: 1px;
  display: block;
  margin-bottom: $space-4;
}

// Outcomes List
.outcomes-list {
  display: flex;
  flex-direction: column;
  gap: $space-3;
  margin: $space-4 0;
}

.outcome-btn {
  .outcome-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }

  .outcome-name {
    color: currentColor;
    font-weight: $font-weight-semibold;
  }

  .outcome-odds {
    color: currentColor;
    font-weight: $font-weight-black;
    font-family: $font-mono;
  }
}

// History List
.history-list {
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.history-item {
  padding: $space-4;
  background: var(--bg-secondary);
  border: $border-width-sm solid var(--border-color);
  box-shadow: $shadow-sm;
  transition:
    transform $transition-fast,
    box-shadow $transition-fast;

  &:hover {
    transform: translate(-2px, -2px);
    box-shadow: $shadow-md;
  }
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $space-2;
}

.history-date {
  color: var(--text-secondary);
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.history-desc {
  color: var(--text-primary);
  font-weight: $font-weight-medium;
  display: block;
}

.history-result {
  font-weight: $font-weight-black;
  font-size: $font-size-sm;
  font-family: $font-mono;
  padding: $space-1 $space-2;
  border: $border-width-sm solid var(--border-color);

  &.passed {
    color: var(--status-success);
    border-color: var(--status-success);
  }

  &.failed {
    color: var(--status-error);
    border-color: var(--status-error);
  }
}

// Animations
@keyframes timePulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.9;
  }
}

@keyframes borderPulse {
  0%,
  100% {
    box-shadow: 0 0 0 0 var(--brutal-red);
  }
  50% {
    box-shadow: 0 0 20px 4px var(--brutal-red);
  }
}

@keyframes badgePulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

@keyframes meterPulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}
</style>
