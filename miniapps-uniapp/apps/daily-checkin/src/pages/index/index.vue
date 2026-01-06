<template>
  <AppLayout :title="t('title')" show-top-nav :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <!-- Check-in Tab -->
    <view v-if="activeTab === 'checkin'" class="tab-content">
      <NeoCard v-if="status" :variant="status.type === 'error' ? 'danger' : 'success'" class="mb-4">
        <text class="text-center font-bold">{{ status.msg }}</text>
      </NeoCard>

      <!-- Countdown Hero -->
      <view class="countdown-hero">
        <view class="countdown-circle">
          <svg class="countdown-ring" viewBox="0 0 220 220">
            <circle class="countdown-ring-bg" cx="110" cy="110" r="99" />
            <circle
              class="countdown-ring-progress"
              cx="110"
              cy="110"
              r="99"
              :style="{ strokeDashoffset: countdownProgress }"
            />
          </svg>
          <view class="countdown-text">
            <text class="countdown-time">{{ countdownLabel }}</text>
            <text class="countdown-label">{{ canCheckIn ? t("ready") : t("nextCheckin") }}</text>
          </view>
        </view>
      </view>

      <!-- Streak Display -->
      <view class="streak-display">
        <view class="streak-flames">
          <text v-for="i in Math.min(currentStreak, 7)" :key="i" class="flame">🔥</text>
          <text v-if="currentStreak === 0" class="flame-empty">💤</text>
        </view>
        <text class="streak-count">{{ currentStreak }} {{ t("dayStreak") }}</text>
        <text class="streak-best">{{ t("bestStreak") }}: {{ highestStreak }} {{ t("days") }}</text>
      </view>

      <!-- Reward Progress -->
      <NeoCard :title="t('rewardProgress')" class="reward-card">
        <view class="reward-milestones">
          <view
            v-for="milestone in milestones"
            :key="milestone.day"
            class="milestone"
            :class="{
              reached: currentStreak >= milestone.day,
              next: currentStreak < milestone.day && currentStreak >= milestone.day - 7,
            }"
          >
            <view class="milestone-icon">
              <text>{{ currentStreak >= milestone.day ? "✅" : "🎯" }}</text>
            </view>
            <text class="milestone-day">{{ t("day") }} {{ milestone.day }}</text>
            <text class="milestone-reward">+{{ milestone.reward }} GAS</text>
            <text class="milestone-cumulative">({{ milestone.cumulative }} {{ t("total") }})</text>
          </view>
        </view>
      </NeoCard>

      <!-- Check-in Button -->
      <NeoButton
        variant="primary"
        size="lg"
        block
        :disabled="!canCheckIn || isLoading"
        :loading="isLoading"
        @click="doCheckIn"
        class="checkin-btn"
      >
        <view class="btn-content">
          <text class="btn-icon">{{ canCheckIn ? "✨" : "⏳" }}</text>
          <text>{{ canCheckIn ? t("checkInNow") : t("waitForNext") }}</text>
        </view>
      </NeoButton>

      <!-- User Rewards -->
      <NeoCard :title="t('yourRewards')" variant="accent" class="mt-4">
        <view class="rewards-grid">
          <view class="reward-item">
            <text class="reward-value">{{ formatGas(unclaimedRewards) }}</text>
            <text class="reward-label">{{ t("unclaimed") }}</text>
          </view>
          <view class="reward-item">
            <text class="reward-value">{{ formatGas(totalClaimed) }}</text>
            <text class="reward-label">{{ t("totalClaimed") }}</text>
          </view>
        </view>
        <NeoButton
          v-if="unclaimedRewards > 0"
          variant="success"
          size="md"
          block
          :loading="isClaiming"
          @click="claimRewards"
          class="mt-4"
        >
          {{ t("claimRewards") }} ({{ formatGas(unclaimedRewards) }} GAS)
        </NeoButton>
      </NeoCard>
    </view>

    <!-- Stats Tab -->
    <view v-if="activeTab === 'stats'" class="tab-content scrollable">
      <NeoCard :title="t('globalStats')">
        <view class="global-stats">
          <view class="stat-item">
            <text class="stat-icon">👥</text>
            <text class="stat-value">{{ globalStats.totalUsers }}</text>
            <text class="stat-label">{{ t("totalUsers") }}</text>
          </view>
          <view class="stat-item">
            <text class="stat-icon">✅</text>
            <text class="stat-value">{{ globalStats.totalCheckins }}</text>
            <text class="stat-label">{{ t("totalCheckins") }}</text>
          </view>
          <view class="stat-item">
            <text class="stat-icon">💰</text>
            <text class="stat-value">{{ formatGas(globalStats.totalRewarded) }}</text>
            <text class="stat-label">{{ t("totalRewarded") }}</text>
          </view>
        </view>
      </NeoCard>

      <NeoCard :title="t('yourStats')" class="mt-4">
        <NeoStats :stats="userStats" />
      </NeoCard>

      <NeoCard :title="t('recentCheckins')" class="mt-4">
        <view v-if="checkinHistory.length === 0" class="empty-state">
          <text>{{ t("noCheckins") }}</text>
        </view>
        <view v-else class="history-list">
          <view v-for="(item, idx) in checkinHistory" :key="idx" class="history-item">
            <view class="history-icon">🔥</view>
            <view class="history-info">
              <text class="history-day">{{ t("day") }} {{ item.streak }}</text>
              <text class="history-time">{{ item.time }}</text>
            </view>
            <text v-if="item.reward > 0" class="history-reward">+{{ formatGas(item.reward) }} GAS</text>
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
import { useWallet, usePayments, useEvents } from "@neo/uniapp-sdk";
import { createT } from "@/shared/utils/i18n";
import { parseInvokeResult, parseStackItem } from "@/shared/utils/neo";
import { AppLayout, NeoButton, NeoCard, NeoDoc, NeoStats, type StatItem } from "@/shared/components";

const translations = {
  title: { en: "Daily Check-in", zh: "每日签到" },
  checkin: { en: "Check-in", zh: "签到" },
  stats: { en: "Stats", zh: "统计" },
  docs: { en: "Docs", zh: "文档" },
  ready: { en: "Ready!", zh: "可签到!" },
  nextCheckin: { en: "Next Check-in", zh: "下次签到" },
  dayStreak: { en: "Day Streak", zh: "天连续" },
  bestStreak: { en: "Best", zh: "最高" },
  days: { en: "days", zh: "天" },
  day: { en: "Day", zh: "第" },
  rewardProgress: { en: "Reward Progress", zh: "奖励进度" },
  checkInNow: { en: "Check In Now", zh: "立即签到" },
  waitForNext: { en: "Wait for Next", zh: "等待下次" },
  yourRewards: { en: "Your Rewards", zh: "你的奖励" },
  unclaimed: { en: "Unclaimed", zh: "待领取" },
  totalClaimed: { en: "Total Claimed", zh: "已领取" },
  total: { en: "total", zh: "累计" },
  claimRewards: { en: "Claim Rewards", zh: "领取奖励" },
  globalStats: { en: "Global Stats", zh: "全局统计" },
  totalUsers: { en: "Total Users", zh: "总用户数" },
  totalCheckins: { en: "Total Check-ins", zh: "总签到次数" },
  totalRewarded: { en: "Total Rewarded", zh: "总奖励发放" },
  yourStats: { en: "Your Stats", zh: "你的统计" },
  currentStreak: { en: "Current Streak", zh: "当前连续" },
  highestStreak: { en: "Highest Streak", zh: "最高连续" },
  totalUserCheckins: { en: "Your Check-ins", zh: "你的签到" },
  recentCheckins: { en: "Recent Check-ins", zh: "最近签到" },
  noCheckins: { en: "No check-ins yet", zh: "暂无签到记录" },
  checkinSuccess: { en: "Check-in successful!", zh: "签到成功!" },
  claimSuccess: { en: "Rewards claimed!", zh: "奖励已领取!" },
  error: { en: "Error occurred", zh: "发生错误" },
  connectWallet: { en: "Connect wallet first", zh: "请先连接钱包" },
  docSubtitle: { en: "Earn GAS by checking in daily", zh: "每日签到赚取 GAS" },
  docDescription: {
    en: "Check in every day to build your streak. Complete 7 consecutive days to earn 1 GAS, then earn 1.5 GAS for every additional 7 days. Miss a day and your streak resets!",
    zh: "每天签到累积连续天数。连续签到7天可获得1 GAS，之后每连续7天可额外获得1.5 GAS。错过一天连续天数将重置！",
  },
  step1: { en: "Connect your Neo wallet", zh: "连接你的 Neo 钱包" },
  step2: { en: "Check in once every 24 hours", zh: "每24小时签到一次" },
  step3: { en: "Build your streak to earn rewards", zh: "累积连续天数获得奖励" },
  step4: { en: "Claim your GAS rewards anytime", zh: "随时领取你的 GAS 奖励" },
  feature1Name: { en: "Rolling 24h Window", zh: "滚动24小时" },
  feature1Desc: {
    en: "Check in anytime, countdown resets from your last check-in",
    zh: "随时签到，倒计时从上次签到开始",
  },
  feature2Name: { en: "Streak Rewards", zh: "连续奖励" },
  feature2Desc: { en: "Day 7: 1 GAS, Day 14+: +1.5 GAS every 7 days", zh: "第7天: 1 GAS，第14天起: 每7天+1.5 GAS" },
};

const t = createT(translations);

const APP_ID = "miniapp-dailycheckin";
const CHECK_IN_FEE = 0.001;
const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

const { address, connect, invokeContract, invokeRead, getContractHash } = useWallet();
const { payGAS, isLoading } = usePayments(APP_ID);
const { list: listEvents } = useEvents();

const activeTab = ref("checkin");
const navTabs = [
  { id: "checkin", icon: "check", label: t("checkin") },
  { id: "stats", icon: "chart", label: t("stats") },
  { id: "docs", icon: "book", label: t("docs") },
];

const docSteps = computed(() => [t("step1"), t("step2"), t("step3"), t("step4")]);
const docFeatures = computed(() => [
  { name: t("feature1Name"), desc: t("feature1Desc") },
  { name: t("feature2Name"), desc: t("feature2Desc") },
]);

// User state
const currentStreak = ref(0);
const highestStreak = ref(0);
const lastCheckInTime = ref(0);
const unclaimedRewards = ref(0);
const totalClaimed = ref(0);
const totalUserCheckins = ref(0);
const status = ref<{ msg: string; type: "success" | "error" } | null>(null);
const isClaiming = ref(false);
const contractHash = ref<string | null>(null);

// Global stats
const globalStats = ref({
  totalUsers: 0,
  totalCheckins: 0,
  totalRewarded: 0,
});

// History
const checkinHistory = ref<{ streak: number; time: string; reward: number }[]>([]);

// Countdown
const now = ref(Date.now());
let countdownInterval: ReturnType<typeof setInterval> | null = null;

// Reward structure: Day 7 = 1 GAS, Day 14+ = +1.5 GAS every 7 days (cumulative)
const milestones = [
  { day: 7, reward: 1, cumulative: 1 },
  { day: 14, reward: 1.5, cumulative: 2.5 },
  { day: 21, reward: 1.5, cumulative: 4 },
  { day: 28, reward: 1.5, cumulative: 5.5 },
];

const nextCheckInTime = computed(() => {
  if (lastCheckInTime.value === 0) return 0;
  return lastCheckInTime.value + TWENTY_FOUR_HOURS;
});

const canCheckIn = computed(() => {
  if (lastCheckInTime.value === 0) return true;
  return now.value >= nextCheckInTime.value;
});

const remainingMs = computed(() => {
  if (canCheckIn.value) return 0;
  return Math.max(0, nextCheckInTime.value - now.value);
});

const countdownProgress = computed(() => {
  const circumference = 2 * Math.PI * 99;
  if (canCheckIn.value) return 0;
  const progress = remainingMs.value / TWENTY_FOUR_HOURS;
  return circumference * progress;
});

const countdownLabel = computed(() => {
  if (canCheckIn.value) return "00:00:00";
  const totalSeconds = Math.floor(remainingMs.value / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
});

const userStats = computed<StatItem[]>(() => [
  { label: t("currentStreak"), value: `${currentStreak.value} ${t("days")}`, variant: "accent" },
  { label: t("highestStreak"), value: `${highestStreak.value} ${t("days")}`, variant: "success" },
  { label: t("totalUserCheckins"), value: totalUserCheckins.value },
  { label: t("totalClaimed"), value: `${formatGas(totalClaimed.value)} GAS` },
]);

const formatGas = (value: number) => {
  return (value / 1e8).toFixed(2);
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const ensureContractHash = async () => {
  if (!contractHash.value) {
    contractHash.value = await getContractHash();
  }
  if (!contractHash.value) throw new Error("Contract unavailable");
  return contractHash.value;
};

const waitForEvent = async (txid: string, eventName: string) => {
  for (let attempt = 0; attempt < 20; attempt++) {
    const res = await listEvents({ app_id: APP_ID, event_name: eventName, limit: 25 });
    const match = res.events.find((evt) => evt.tx_hash === txid);
    if (match) return match;
    await sleep(1500);
  }
  return null;
};

const loadUserStats = async () => {
  if (!address.value) return;
  try {
    const contract = await ensureContractHash();
    const res = await invokeRead({
      contractHash: contract,
      operation: "GetUserStats",
      args: [{ type: "Hash160", value: address.value }],
    });
    const data = parseInvokeResult(res);
    if (Array.isArray(data)) {
      currentStreak.value = Number(data[0] ?? 0);
      highestStreak.value = Number(data[1] ?? 0);
      lastCheckInTime.value = Number(data[2] ?? 0) * 1000;
      unclaimedRewards.value = Number(data[3] ?? 0);
      totalClaimed.value = Number(data[4] ?? 0);
      totalUserCheckins.value = Number(data[5] ?? 0);
    }
  } catch (e) {
    console.warn("Failed to load user stats:", e);
  }
};

const loadGlobalStats = async () => {
  try {
    const contract = await ensureContractHash();
    const res = await invokeRead({
      contractHash: contract,
      operation: "GetGlobalStats",
      args: [],
    });
    const data = parseInvokeResult(res);
    if (Array.isArray(data)) {
      globalStats.value = {
        totalUsers: Number(data[0] ?? 0),
        totalCheckins: Number(data[1] ?? 0),
        totalRewarded: Number(data[2] ?? 0),
      };
    }
  } catch (e) {
    console.warn("Failed to load global stats:", e);
  }
};

const loadHistory = async () => {
  try {
    const res = await listEvents({ app_id: APP_ID, event_name: "CheckedIn", limit: 10 });
    checkinHistory.value = res.events
      .filter((evt) => {
        const values = Array.isArray((evt as any)?.state) ? (evt as any).state.map(parseStackItem) : [];
        return String(values[0] ?? "") === address.value;
      })
      .map((evt) => {
        const values = Array.isArray((evt as any)?.state) ? (evt as any).state.map(parseStackItem) : [];
        return {
          streak: Number(values[1] ?? 0),
          time: new Date(evt.created_at || Date.now()).toLocaleString(),
          reward: Number(values[2] ?? 0),
        };
      });
  } catch (e) {
    console.warn("Failed to load history:", e);
  }
};

const doCheckIn = async () => {
  if (!canCheckIn.value || isLoading.value) return;
  status.value = null;

  try {
    if (!address.value) {
      await connect();
    }
    if (!address.value) throw new Error(t("connectWallet"));

    const contract = await ensureContractHash();
    const payment = await payGAS(String(CHECK_IN_FEE), "checkin");
    const receiptId = payment.receipt_id;
    if (!receiptId) throw new Error("Payment failed");

    const tx = await invokeContract({
      scriptHash: contract,
      operation: "CheckIn",
      args: [
        { type: "Hash160", value: address.value },
        { type: "Integer", value: Number(receiptId) },
      ],
    });

    const txid = String((tx as any)?.txid || (tx as any)?.txHash || "");
    const evt = txid ? await waitForEvent(txid, "CheckedIn") : null;
    if (!evt) throw new Error("Check-in pending");

    status.value = { msg: t("checkinSuccess"), type: "success" };
    await loadUserStats();
    await loadGlobalStats();
    await loadHistory();
  } catch (e: any) {
    status.value = { msg: e?.message || t("error"), type: "error" };
  }
};

const claimRewards = async () => {
  if (unclaimedRewards.value <= 0 || isClaiming.value) return;
  isClaiming.value = true;
  status.value = null;

  try {
    if (!address.value) throw new Error(t("connectWallet"));

    const contract = await ensureContractHash();
    const tx = await invokeContract({
      scriptHash: contract,
      operation: "ClaimRewards",
      args: [{ type: "Hash160", value: address.value }],
    });

    const txid = String((tx as any)?.txid || (tx as any)?.txHash || "");
    const evt = txid ? await waitForEvent(txid, "RewardsClaimed") : null;
    if (!evt) throw new Error("Claim pending");

    status.value = { msg: t("claimSuccess"), type: "success" };
    await loadUserStats();
    await loadGlobalStats();
  } catch (e: any) {
    status.value = { msg: e?.message || t("error"), type: "error" };
  } finally {
    isClaiming.value = false;
  }
};

onMounted(async () => {
  countdownInterval = setInterval(() => {
    now.value = Date.now();
  }, 1000);

  await loadUserStats();
  await loadGlobalStats();
  await loadHistory();
});

onUnmounted(() => {
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }
});
</script>

<style lang="scss" scoped>
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.tab-content {
  padding: $space-4;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.countdown-hero {
  display: flex;
  justify-content: center;
  padding: $space-6;
  background: var(--bg-card);
  border: 4px solid var(--border-color);
  box-shadow: 10px 10px 0 var(--shadow-color);
}

.countdown-circle {
  position: relative;
  width: 200px;
  height: 200px;
}

.countdown-ring {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.countdown-ring-bg {
  fill: none;
  stroke: var(--border-color);
  stroke-width: 12;
}

.countdown-ring-progress {
  fill: none;
  stroke: var(--neo-green);
  stroke-width: 12;
  stroke-linecap: round;
  stroke-dasharray: 622;
  transition: stroke-dashoffset 1s linear;
}

.countdown-text {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.countdown-time {
  font-family: $font-mono;
  font-size: 32px;
  font-weight: $font-weight-black;
  color: var(--text-primary);
}

.countdown-label {
  font-size: 12px;
  font-weight: $font-weight-bold;
  color: var(--text-secondary);
  text-transform: uppercase;
}

.streak-display {
  text-align: center;
  padding: $space-4;
  background: var(--bg-card);
  border: 4px solid var(--border-color);
  box-shadow: 8px 8px 0 var(--shadow-color);
}

.streak-flames {
  font-size: 32px;
  margin-bottom: $space-2;
}

.flame-empty {
  opacity: 0.5;
}

.streak-count {
  display: block;
  font-size: 24px;
  font-weight: $font-weight-black;
  color: var(--text-primary);
}

.streak-best {
  display: block;
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: $space-1;
}

.reward-milestones {
  display: flex;
  justify-content: space-between;
  gap: $space-2;
}

.milestone {
  flex: 1;
  text-align: center;
  padding: $space-3;
  background: var(--bg-secondary);
  border: 2px solid var(--border-color);
  opacity: 0.5;

  &.reached {
    opacity: 1;
    background: var(--neo-green);
    border-color: var(--neo-green);
  }

  &.next {
    opacity: 1;
    border-color: var(--brutal-yellow);
  }
}

.milestone-icon {
  font-size: 20px;
}

.milestone-day {
  display: block;
  font-size: 10px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
}

.milestone-reward {
  display: block;
  font-size: 12px;
  font-weight: $font-weight-bold;
  color: var(--text-primary);
}

.milestone-cumulative {
  display: block;
  font-size: 9px;
  color: var(--text-secondary);
  margin-top: 2px;
}

.checkin-btn {
  margin-top: $space-4;
}

.btn-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $space-2;
}

.btn-icon {
  font-size: 20px;
}

.rewards-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $space-4;
}

.reward-item {
  text-align: center;
  padding: $space-3;
  background: var(--bg-secondary);
  border: 2px solid var(--border-color);
}

.reward-value {
  display: block;
  font-family: $font-mono;
  font-size: 24px;
  font-weight: $font-weight-black;
  color: var(--neo-green);
}

.reward-label {
  display: block;
  font-size: 10px;
  font-weight: $font-weight-bold;
  color: var(--text-secondary);
  text-transform: uppercase;
}

.global-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $space-3;
}

.stat-item {
  text-align: center;
  padding: $space-3;
  background: var(--bg-secondary);
  border: 2px solid var(--border-color);
}

.stat-icon {
  font-size: 24px;
  display: block;
  margin-bottom: $space-1;
}

.stat-value {
  display: block;
  font-family: $font-mono;
  font-size: 18px;
  font-weight: $font-weight-black;
  color: var(--text-primary);
}

.stat-label {
  display: block;
  font-size: 9px;
  font-weight: $font-weight-bold;
  color: var(--text-secondary);
  text-transform: uppercase;
}

.empty-state {
  text-align: center;
  padding: $space-6;
  color: var(--text-secondary);
  font-weight: $font-weight-bold;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.history-item {
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: $space-3;
  background: var(--bg-secondary);
  border: 2px solid var(--border-color);
}

.history-icon {
  font-size: 20px;
}

.history-info {
  flex: 1;
}

.history-day {
  display: block;
  font-weight: $font-weight-black;
  font-size: 12px;
}

.history-time {
  display: block;
  font-size: 10px;
  color: var(--text-secondary);
}

.history-reward {
  font-family: $font-mono;
  font-weight: $font-weight-black;
  font-size: 12px;
  color: var(--neo-green);
}

.scrollable {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>
