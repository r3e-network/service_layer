<template>
  <AppLayout  :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <view v-if="chainType === 'evm'" class="px-4 mb-4">
      <NeoCard variant="danger">
        <view class="flex flex-col items-center gap-2 py-1">
          <text class="text-center font-bold text-red-400">{{ t("wrongChain") }}</text>
          <text class="text-xs text-center opacity-80 text-white">{{ t("wrongChainMessage") }}</text>
          <NeoButton size="sm" variant="secondary" class="mt-2" @click="() => switchChain('neo-n3-mainnet')">{{
            t("switchToNeo")
          }}</NeoButton>
        </view>
      </NeoCard>
    </view>

    <!-- Check-in Tab -->
    <view v-if="activeTab === 'checkin'" class="tab-content">
      <NeoCard v-if="status" :variant="status.type === 'error' ? 'danger' : 'erobo-neo'" class="mb-4">
        <text class="text-center font-bold status-msg">{{ status.msg }}</text>
      </NeoCard>

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

      <CountdownHero
        :countdown-progress="countdownProgress"
        :countdown-label="countdownLabel"
        :can-check-in="canCheckIn"
        :utc-time-display="utcTimeDisplay"
       
      />

      <StreakDisplay :current-streak="currentStreak" :highest-streak="highestStreak" />

    </view>

    <!-- Stats Tab -->
    <view v-if="activeTab === 'stats'" class="tab-content scrollable">
      <RewardProgress :milestones="milestones" :current-streak="currentStreak" />
      <UserRewards
        :unclaimed-rewards="unclaimedRewards"
        :total-claimed="totalClaimed"
        :is-claiming="isClaiming"
       
        @claim="claimRewards"
        class="mb-4"
      />
      <StatsTab
        :global-stats="globalStats"
        :user-stats="userStats"
        :checkin-history="checkinHistory"
       
      />
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
    <Fireworks :active="status?.type === 'success'" :duration="3000" />
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useWallet, usePayments, useEvents } from "@neo/uniapp-sdk";
import { useI18n } from "@/composables/useI18n";
import { parseInvokeResult, parseStackItem } from "@/shared/utils/neo";
import { AppLayout, NeoButton, NeoCard, NeoDoc, type StatItem } from "@/shared/components";
import Fireworks from "@/shared/components/Fireworks.vue";
import CountdownHero from "./components/CountdownHero.vue";
import StreakDisplay from "./components/StreakDisplay.vue";
import RewardProgress from "./components/RewardProgress.vue";
import UserRewards from "./components/UserRewards.vue";
import StatsTab from "./components/StatsTab.vue";

const { t } = useI18n();

const APP_ID = "miniapp-dailycheckin";
const CHECK_IN_FEE = 0.001;
const MS_PER_DAY = 24 * 60 * 60 * 1000; // milliseconds per day

const { address, connect, invokeContract, invokeRead, chainType, switchChain, getContractAddress } = useWallet() as any;
const { payGAS, isLoading } = usePayments(APP_ID);
const { list: listEvents } = useEvents();

const activeTab = ref("checkin");
const navTabs = computed(() => [
  { id: "checkin", icon: "check", label: t("checkin") },
  { id: "stats", icon: "chart", label: t("stats") },
  { id: "docs", icon: "book", label: t("docs") },
]);

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
const contractAddress = ref<string | null>(null);

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

const ensureContractAddress = async () => {
  if (!contractAddress.value) {
    contractAddress.value = await getContractAddress();
  }
  if (!contractAddress.value) throw new Error(t("contractUnavailable"));
  return contractAddress.value;
};

const waitForEvent = async (txid: string, eventName: string): Promise<{ event: any; pending: boolean }> => {
  for (let attempt = 0; attempt < 20; attempt++) {
    const res = await listEvents({ app_id: APP_ID, event_name: eventName, limit: 25 });
    const match = res.events.find((evt) => evt.tx_hash === txid);
    if (match) return { event: match, pending: false };
    await sleep(1500);
  }
  // Return pending status instead of null - transaction may still succeed
  return { event: null, pending: true };
};

const loadUserStats = async () => {
  if (!address.value) return;
  try {
    const contract = await ensureContractAddress();
    const res = await invokeRead({
      contractHash: contract,
      operation: "getUserStats",
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
  } catch {
  }
};

const loadGlobalStats = async () => {
  try {
    const contract = await ensureContractAddress();
    const res = await invokeRead({
      contractHash: contract,
      operation: "getPlatformStats",
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
  } catch {
  }
};

const loadHistory = async () => {
  if (!address.value) return; // Guard against null address
  try {
    const res = await listEvents({ app_id: APP_ID, event_name: "CheckedIn", limit: 10 });
    const currentAddress = address.value; // Capture current address for comparison
    checkinHistory.value = res.events
      .filter((evt) => {
        const values = Array.isArray((evt as any)?.state) ? (evt as any).state.map(parseStackItem) : [];
        return String(values[0] ?? "") === currentAddress;
      })
      .map((evt) => {
        const values = Array.isArray((evt as any)?.state) ? (evt as any).state.map(parseStackItem) : [];
        return {
          streak: Number(values[1] ?? 0),
          time: new Date(evt.created_at || Date.now()).toLocaleString(),
          reward: Number(values[2] ?? 0),
        };
      });
  } catch {
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

    const contract = await ensureContractAddress();
    const payment = await payGAS(String(CHECK_IN_FEE), "checkin");
    const receiptId = payment.receipt_id;
    if (!receiptId) throw new Error(t("receiptMissing"));

    const tx = await invokeContract({
      scriptHash: contract,
      operation: "checkIn",
      args: [
        { type: "Hash160", value: address.value },
        { type: "Integer", value: String(receiptId) },
      ],
    });

    const txid = String((tx as any)?.txid || (tx as any)?.txHash || "");
    const result = txid ? await waitForEvent(txid, "CheckedIn") : { event: null, pending: true };

    if (result.pending) {
      // Transaction submitted but event not yet indexed - show pending status
      status.value = { msg: t("pendingConfirmation", { action: t("checkinSuccess") }), type: "success" };
    } else {
      status.value = { msg: t("checkinSuccess"), type: "success" };
    }

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

    const contract = await ensureContractAddress();
    const tx = await invokeContract({
      scriptHash: contract,
      operation: "claimRewards",
      args: [{ type: "Hash160", value: address.value }],
    });

    const txid = String((tx as any)?.txid || (tx as any)?.txHash || "");
    const result = txid ? await waitForEvent(txid, "RewardsClaimed") : { event: null, pending: true };

    if (result.pending) {
      status.value = { msg: t("pendingConfirmation", { action: t("claimSuccess") }), type: "success" };
    } else {
      status.value = { msg: t("claimSuccess"), type: "success" };
    }

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
@use "@/shared/styles/tokens.scss" as *;
@use "@/shared/styles/variables.scss";

@import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@300..700&family=Quicksand:wght@300;400;500;600;700&display=swap');

$sunrise-bg: #fffbf0;
$sunrise-yellow: #fcd34d;
$sunrise-orange: #f97316;
$sunrise-red: #ef4444;
$sunrise-blue: #0ea5e9;
$sunrise-text: #78350f;
$sunrise-font: 'Fredoka', 'Quicksand', sans-serif;

:global(page) {
  background: $sunrise-bg;
  font-family: $sunrise-font;
}

.tab-content {
  padding: 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
  background: linear-gradient(180deg, #fff7ed 0%, #ffedd5 100%);
  min-height: 100vh;
  position: relative;
  font-family: $sunrise-font;
  
  /* Sun Ray Pattern */
  &::before {
    content: '';
    position: absolute;
    top: -20%; left: 50%;
    width: 200%; height: 100%;
    transform: translateX(-50%);
    background: repeating-conic-gradient(
      from 0deg,
      rgba(255, 215, 0, 0.05) 0deg 20deg,
      transparent 20deg 40deg
    );
    pointer-events: none;
    z-index: 0;
  }
}

/* Gamified/Sunrise Card Overrides */
:deep(.neo-card) {
  background: #ffffff !important;
  border: 2px solid #fed7aa !important; /* Orange-200 */
  border-bottom: 6px solid #fdba74 !important; /* Orange-300 */
  border-radius: 24px !important;
  box-shadow: 0 10px 20px rgba(249, 115, 22, 0.1) !important;
  color: $sunrise-text !important;
  position: relative;
  z-index: 1;
  
  &.variant-erobo-neo {
    background: #fff !important;
    border-color: #fde68a !important; /* Yellow-200 */
    border-bottom-color: #fcd34d !important; /* Yellow-300 */
  }
  
  &.variant-danger {
    background: #fef2f2 !important;
    border-color: #fecaca !important;
    border-bottom-color: #f87171 !important;
    color: #991b1b !important;
  }
}

.status-msg {
  color: $sunrise-text;
  font-weight: 800;
  font-size: 16px;
}

:deep(.neo-button) {
  border-radius: 20px !important;
  box-shadow: 0 4px 0 rgba(0,0,0,0.1) !important;
  font-weight: 800 !important;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  transition: all 0.1s cubic-bezier(0.4, 0, 0.2, 1) !important;
  font-family: $sunrise-font !important;
  
  &:active {
    transform: translateY(4px);
    box-shadow: none !important;
    border-bottom-width: 0 !important; 
  }
  
  &.variant-primary {
    background: linear-gradient(135deg, $sunrise-yellow 0%, $sunrise-orange 100%) !important;
    border: none !important;
    border-bottom: 4px solid #ea580c !important; /* Darker orange */
    color: #fff !important;
    text-shadow: 1px 1px 0 rgba(0,0,0,0.1);
  }
  
  &.variant-secondary {
    background: #fff !important;
    border: 2px solid $sunrise-blue !important;
    border-bottom: 4px solid #0284c7 !important;
    color: $sunrise-blue !important;
  }
}

.checkin-btn {
  margin-top: 16px;
  transform: scale(1.02);
}

.btn-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-weight: 900;
  text-transform: uppercase;
  font-size: 18px;
}

.btn-icon {
  font-size: 24px;
}

.scrollable {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>
