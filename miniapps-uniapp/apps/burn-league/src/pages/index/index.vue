<template>
  <AppLayout  :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <view v-if="chainType === 'evm'" class="px-5 mb-4">
      <NeoCard variant="danger">
        <view class="flex flex-col items-center gap-2 py-1">
          <text class="text-center font-bold text-red-400">{{ t("wrongChain") }}</text>
          <text class="text-xs text-center opacity-80 text-white">{{ t("wrongChainMessage") }}</text>
          <NeoButton size="sm" variant="secondary" class="mt-2" @click="() => switchChain('neo-n3-mainnet')">{{ t("switchToNeo") }}</NeoButton>
        </view>
      </NeoCard>
    </view>

    <view v-if="activeTab === 'game'" class="tab-content">
      <NeoCard v-if="status" :variant="status.type === 'error' ? 'danger' : 'success'" class="mb-4 text-center">
        <text class="font-bold">{{ status.msg }}</text>
      </NeoCard>

      <!-- Burn Action Card -->
      <BurnActionCard
        v-model:burnAmount="burnAmount"
        :estimated-reward="estimatedReward"
        :is-loading="isLoading"
        :t="t as any"
        @burn="burnTokens"
      />
    </view>

    <view v-if="activeTab === 'stats'" class="tab-content scrollable">
      <!-- Total Burned Hero Section with Fire Animation -->
      <HeroSection :total-burned="totalBurned" :t="t as any" />

      <!-- Stats Grid -->
      <StatsGrid :user-burned="userBurned" :rank="rank" :t="t as any" />

      <StatsTab
        :burn-count="burnCount"
        :user-burned="userBurned"
        :total-burned="totalBurned"
        :rank="rank"
        :estimated-reward="estimatedReward"
        :t="t as any"
      />

      <!-- Leaderboard in Stats Tab -->
      <LeaderboardList :leaderboard="leaderboard" />
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
import { ref, computed, onMounted, watch } from "vue";
import { useWallet, usePayments, useEvents } from "@neo/uniapp-sdk";
import { parseInvokeResult, parseStackItem } from "@/shared/utils/neo";
import { useI18n } from "@/composables/useI18n";
import { AppLayout, NeoCard, NeoDoc } from "@/shared/components";
import Fireworks from "../../../../../shared/components/Fireworks.vue";
import type { NavTab } from "@/shared/components/NavBar.vue";

import HeroSection from "./components/HeroSection.vue";
import StatsGrid from "./components/StatsGrid.vue";
import BurnActionCard from "./components/BurnActionCard.vue";
import LeaderboardList, { type LeaderEntry } from "./components/LeaderboardList.vue";
import StatsTab from "./components/StatsTab.vue";


const { t } = useI18n();

const navTabs = computed<NavTab[]>(() => [
  { id: "game", icon: "game", label: t("game") },
  { id: "stats", icon: "chart", label: t("stats") },
  { id: "docs", icon: "book", label: t("docs") },
]);
const activeTab = ref("game");

const docSteps = computed(() => [t("step1"), t("step2"), t("step3"), t("step4")]);
const docFeatures = computed(() => [
  { name: t("feature1Name"), desc: t("feature1Desc") },
  { name: t("feature2Name"), desc: t("feature2Desc") },
]);

const APP_ID = "miniapp-burn-league";
const { address, connect, invokeContract, invokeRead, chainType, switchChain, getContractAddress } = useWallet() as any;
const { list: listEvents } = useEvents();

const { payGAS, isLoading } = usePayments(APP_ID);

const burnAmount = ref("1");
const totalBurned = ref(0);
const rewardPool = ref(0);
const userBurned = ref(0);
const rank = ref(0);
const burnCount = ref(0);
const status = ref<{ msg: string; type: string } | null>(null);
const contractAddress = ref<string | null>(null);

const leaderboard = ref<LeaderEntry[]>([]);
const MIN_BURN = 1;

const toFixed8 = (value: string) => {
  const num = Number.parseFloat(value);
  if (!Number.isFinite(num)) return "0";
  return Math.floor(num * 1e8).toString();
};
const toGas = (value: any) => {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? num / 1e8 : 0;
};

const estimatedReward = computed(() => {
  if (!totalBurned.value) return 0;
  return (userBurned.value / totalBurned.value) * rewardPool.value;
});

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const ensureContractAddress = async () => {
  if (!contractAddress.value) {
    contractAddress.value = await getContractAddress();
  }
  if (!contractAddress.value) {
    throw new Error(t("missingContract"));
  }
};

const listAllEvents = async (eventName: string) => {
  const events: any[] = [];
  let afterId: string | undefined;
  let hasMore = true;
  while (hasMore) {
    const res = await listEvents({ app_id: APP_ID, event_name: eventName, limit: 50, after_id: afterId });
    events.push(...res.events);
    hasMore = Boolean(res.has_more && res.last_id);
    afterId = res.last_id || undefined;
  }
  return events;
};

const waitForEvent = async (txid: string, eventName: string) => {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const res = await listEvents({ app_id: APP_ID, event_name: eventName, limit: 25 });
    const match = res.events.find((evt) => evt.tx_hash === txid);
    if (match) return match;
    await sleep(1500);
  }
  return null;
};

const loadStats = async () => {
  await ensureContractAddress();
  const totalRes = await invokeRead({ scriptHash: contractAddress.value!, operation: "totalBurned" });
  totalBurned.value = toGas(parseInvokeResult(totalRes));
  const poolRes = await invokeRead({ scriptHash: contractAddress.value!, operation: "rewardPool" });
  rewardPool.value = toGas(parseInvokeResult(poolRes));
  if (address.value) {
    const userRes = await invokeRead({
      scriptHash: contractAddress.value!,
      operation: "getUserTotalBurned",
      args: [{ type: "Hash160", value: address.value }],
    });
    userBurned.value = toGas(parseInvokeResult(userRes));
  } else {
    userBurned.value = 0;
  }
};

const loadLeaderboard = async () => {
  const events = await listAllEvents("GasBurned");
  const totals: Record<string, number> = {};
  let userBurns = 0;
  events.forEach((evt) => {
    const values = Array.isArray((evt as any)?.state) ? (evt as any).state.map(parseStackItem) : [];
    const burner = String(values[0] ?? "");
    const amount = Number(values[1] ?? 0);
    if (!burner) return;
    totals[burner] = (totals[burner] || 0) + amount;
    if (address.value && burner === address.value) {
      userBurns += 1;
    }
  });
  const entries = Object.entries(totals)
    .map(([addr, amount]) => ({
      address: addr,
      burned: toGas(amount),
      isUser: address.value ? addr === address.value : false,
    }))
    .sort((a, b) => b.burned - a.burned)
    .map((entry, idx) => ({ rank: idx + 1, ...entry }));
  leaderboard.value = entries;
  const userEntry = entries.find((entry) => entry.isUser);
  rank.value = userEntry ? userEntry.rank : 0;
  burnCount.value = userBurns;
};

const refreshData = async () => {
  try {
    await Promise.all([loadStats(), loadLeaderboard()]);
  } catch {
    status.value = { msg: t("loadFailed"), type: "error" };
  }
};

const burnTokens = async () => {
  if (isLoading.value) return;
  const amount = parseFloat(burnAmount.value);
  if (!Number.isFinite(amount) || amount < MIN_BURN) {
    status.value = { msg: t("minBurn", { amount: MIN_BURN }), type: "error" };
    return;
  }
  try {
    if (!address.value) {
      await connect();
    }
    if (!address.value) {
      throw new Error(t("error"));
    }
    await ensureContractAddress();
    status.value = { msg: t("burning"), type: "loading" };
    const payment = await payGAS(burnAmount.value, "burn");
    const receiptId = payment.receipt_id;
    if (!receiptId) {
      throw new Error(t("receiptMissing"));
    }
    const tx = await invokeContract({
      scriptHash: contractAddress.value!,
      operation: "burnGas",
      args: [
        { type: "Hash160", value: address.value },
        { type: "Integer", value: toFixed8(burnAmount.value) },
        { type: "Integer", value: receiptId },
      ],
    });
    const txid = String((tx as any)?.txid || (tx as any)?.txHash || "");
    if (txid) {
      await waitForEvent(txid, "GasBurned");
    }
    status.value = { msg: `${t("burned")} ${amount} GAS ${t("success")}`, type: "success" };
    burnAmount.value = "1";
    await refreshData();
  } catch (e: any) {
    status.value = { msg: e.message || t("error"), type: "error" };
  }
};

onMounted(() => {
  refreshData();
});

watch(address, () => {
  refreshData();
});
</script>

<style lang="scss" scoped>
@use "@/shared/styles/tokens.scss" as *;
@use "@/shared/styles/variables.scss";

@import url('https://fonts.googleapis.com/css2?family=Russo+One&display=swap');

$inferno-bg: #0f0505;
$inferno-orange: #ff4500;
$inferno-yellow: #ffd700;
$inferno-text: #fff0f0;
$inferno-font: 'Russo One', sans-serif;

:global(page) {
  background: $inferno-bg;
  font-family: $inferno-font;
}

.tab-content {
  padding: 24px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
  background: radial-gradient(circle at 50% 100%, #300000 0%, #000 100%);
  min-height: 100vh;
  position: relative;
  font-family: $inferno-font;
  
  /* Ember effects */
  &::before {
    content: '';
    position: absolute;
    bottom: 0; left: 0; width: 100%; height: 100%;
    background-image: 
      url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDIwIDIwIj48Y2lyY2xlIGN4PSIyIiBjeT0iMiIgcj0iMSIgZmlsbD0iI2ZmNDUwMCIgb3BhY2l0eT0iMC41Ii8+PC9zdmc+');
    opacity: 0.4;
    pointer-events: none;
    mask-image: linear-gradient(to top, black, transparent);
  }
}

/* Inferno Component Overrides */
:deep(.neo-card) {
  background: rgba(40, 5, 5, 0.8) !important;
  border: 1px solid #700 !important;
  border-bottom: 4px solid $inferno-orange !important;
  border-radius: 4px !important;
  box-shadow: 0 4px 20px rgba(255, 69, 0, 0.2) !important;
  color: $inferno-text !important;
  backdrop-filter: blur(5px);
  font-family: $inferno-font !important;
  
  &.variant-danger {
    background: #2a0000 !important;
    border-color: #f00 !important;
  }
}

:deep(.neo-button) {
  text-transform: uppercase;
  font-weight: 900 !important;
  font-style: italic;
  letter-spacing: 0.05em;
  transform: skewX(-10deg);
  border-radius: 2px !important;
  font-family: $inferno-font !important;
  
  &.variant-primary {
    background: linear-gradient(45deg, $inferno-orange, #ff0000) !important;
    color: #fff !important;
    box-shadow: 4px 4px 0 #500 !important;
    border: none !important;
    
    &:active {
      transform: skewX(-10deg) translateY(2px);
      box-shadow: 2px 2px 0 #500 !important;
    }
  }
  
  &.variant-secondary {
    background: transparent !important;
    border: 2px solid $inferno-orange !important;
    color: $inferno-orange !important;
    
    &:active {
      transform: skewX(-10deg) translateY(2px);
    }
  }
  
  /* Counter-skew content */
  & > view, & > text {
    transform: skewX(10deg);
    display: inline-block;
  }
}

.scrollable {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>
