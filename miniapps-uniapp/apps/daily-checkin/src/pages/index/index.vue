<template>
  <AppLayout :title="t('title')" show-top-nav :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <!-- Check-in Tab -->
    <view v-if="activeTab === 'checkin'" class="tab-content">
      <NeoCard v-if="status" :variant="status.type === 'error' ? 'danger' : 'success'" class="mb-4">
        <text class="text-center font-bold">{{ status.msg }}</text>
      </NeoCard>

      <CountdownHero
        :countdown-progress="countdownProgress"
        :countdown-label="countdownLabel"
        :can-check-in="canCheckIn"
        :utc-time-display="utcTimeDisplay"
        :t="t as any"
      />

      <StreakDisplay :current-streak="currentStreak" :highest-streak="highestStreak" :t="t as any" />

      <RewardProgress :milestones="milestones" :current-streak="currentStreak" :t="t as any" />

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

      <UserRewards
        :unclaimed-rewards="unclaimedRewards"
        :total-claimed="totalClaimed"
        :is-claiming="isClaiming"
        :t="t as any"
        @claim="claimRewards"
      />
    </view>

    <!-- Stats Tab -->
    <StatsTab
      v-if="activeTab === 'stats'"
      :global-stats="globalStats"
      :user-stats="userStats"
      :checkin-history="checkinHistory"
      :t="t as any"
    />

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
import { AppLayout, NeoButton, NeoCard, NeoDoc, type StatItem } from "@/shared/components";
import CountdownHero from "./components/CountdownHero.vue";
import StreakDisplay from "./components/StreakDisplay.vue";
import RewardProgress from "./components/RewardProgress.vue";
import UserRewards from "./components/UserRewards.vue";
import StatsTab from "./components/StatsTab.vue";

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
  step2: { en: "Check in once per UTC day", zh: "每个 UTC 日签到一次" },
  step3: { en: "Build your streak to earn rewards", zh: "累积连续天数获得奖励" },
  step4: { en: "Claim your GAS rewards anytime", zh: "随时领取你的 GAS 奖励" },
  feature1Name: { en: "UTC Day Reset", zh: "UTC 日重置" },
  feature1Desc: {
    en: "Global countdown to UTC 00:00, same for all users",
    zh: "全局倒计时至 UTC 00:00，所有用户相同",
  },
  feature2Name: { en: "Streak Rewards", zh: "连续奖励" },
  feature2Desc: { en: "Day 7: 1 GAS, Day 14+: +1.5 GAS every 7 days", zh: "第7天: 1 GAS，第14天起: 每7天+1.5 GAS" },
  notCheckedIn: { en: "Not checked in today", zh: "今日未签到" },
  checkedInToday: { en: "Checked in today!", zh: "今日已签到!" },
};

const t = createT(translations);

const APP_ID = "miniapp-dailycheckin";
const CHECK_IN_FEE = 0.001;
const MS_PER_DAY = 24 * 60 * 60 * 1000; // milliseconds per day

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
const lastCheckInDay = ref(0); // UTC day number (not timestamp)
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

// Global UTC countdown (same for all users)
const currentUtcDay = computed(() => Math.floor(now.value / MS_PER_DAY));

const nextUtcMidnight = computed(() => (currentUtcDay.value + 1) * MS_PER_DAY);

const canCheckIn = computed(() => {
  if (lastCheckInDay.value === 0) return true;
  return currentUtcDay.value > lastCheckInDay.value;
});

const remainingMs = computed(() => {
  return Math.max(0, nextUtcMidnight.value - now.value);
});

// Always calculate countdown progress (circle fills as time passes toward next UTC midnight)
const countdownProgress = computed(() => {
  const circumference = 2 * Math.PI * 99; // 622
  // Calculate how much of the day has passed (0 = start of day, 1 = end of day)
  const elapsed = MS_PER_DAY - remainingMs.value;
  const elapsedRatio = elapsed / MS_PER_DAY;
  // Stroke offset: 0 = full circle visible, circumference = circle hidden
  // We want circle to fill up as time passes, so offset decreases as time passes
  return circumference * (1 - elapsedRatio);
});

// Always calculate countdown time to next UTC midnight
const countdownLabel = computed(() => {
  const totalSeconds = Math.floor(remainingMs.value / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
});

const utcTimeDisplay = computed(() => {
  const utcDate = new Date(now.value);
  const h = String(utcDate.getUTCHours()).padStart(2, "0");
  const m = String(utcDate.getUTCMinutes()).padStart(2, "0");
  const s = String(utcDate.getUTCSeconds()).padStart(2, "0");
  return `${h}:${m}:${s}`;
});

const userStats = computed<StatItem[]>(() => [
  { label: t("currentStreak"), value: `${currentStreak.value} ${t("days")}`, variant: "accent" },
  { label: t("highestStreak"), value: `${highestStreak.value} ${t("days")}`, variant: "success" },
  { label: t("totalUserCheckins"), value: totalUserCheckins.value },
  { label: t("totalClaimed"), value: `${formatGas(totalClaimed.value)} GAS` },
  { label: t("unclaimed"), value: `${formatGas(unclaimedRewards.value)} GAS` },
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
      lastCheckInDay.value = Number(data[2] ?? 0);
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
  padding: 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.checkin-btn {
  margin-top: 24px;
  box-shadow: 0 0 20px rgba(0, 229, 153, 0.4);
}

.btn-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-weight: 700;
  letter-spacing: 0.05em;
}

.btn-icon {
  font-size: 24px;
  filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.5));
}

.scrollable {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>
