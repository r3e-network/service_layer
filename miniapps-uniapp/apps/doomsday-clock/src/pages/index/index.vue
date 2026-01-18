<template>
  <AppLayout  :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <view v-if="activeTab === 'game'" class="tab-content">
      <view v-if="chainType === 'evm'" class="mb-4">
        <NeoCard variant="danger">
          <view class="flex flex-col items-center gap-2 py-1">
            <text class="text-center font-bold text-red-400">{{ t("wrongChain") }}</text>
            <text class="text-xs text-center opacity-80 text-white">{{ t("wrongChainMessage") }}</text>
            <NeoButton size="sm" variant="secondary" class="mt-2" @click="() => switchChain('neo-n3-mainnet')">{{ t("switchToNeo") }}</NeoButton>
          </view>
        </NeoCard>
      </view>

      <NeoCard v-if="status" :variant="status.type === 'error' ? 'danger' : 'success'" class="mb-4 text-center">
        <text class="font-bold">{{ status.msg }}</text>
      </NeoCard>

      <!-- Claim Prize Section -->
      <NeoCard v-if="canClaim" variant="success" class="mb-4 text-center">
        <text class="text-xl font-bold block mb-2">{{ t("youWon") }}</text>
        <text class="block mb-4 text-lg">{{ formatNumber(totalPot, 2) }} GAS</text>
        <NeoButton variant="primary" size="lg" block :loading="isClaiming" @click="claimPrize">
          {{ t("claimPrize") }}
        </NeoButton>
      </NeoCard>

      <!-- Buy Keys Section -->
      <BuyKeysCard
        v-else-if="isRoundActive"
        v-model:keyCount="keyCount"
        :estimated-cost="estimatedCost"
        :is-paying="isPaying"
        :t="t as any"
        @buy="buyKeys"
      />

      <!-- Dramatic Countdown Display -->
      <ClockFace
        :danger-level="dangerLevel"
        :danger-level-text="dangerLevelText"
        :should-pulse="shouldPulse"
        :countdown="countdown"
        :danger-progress="dangerProgress"
        :current-event-description="currentEventDescription"
        :t="t as any"
      />
    </view>

    <view v-if="activeTab === 'history'" class="tab-content scrollable">
      <HistoryList :history="history" :t="t as any" />
    </view>

    <view v-if="activeTab === 'stats'" class="tab-content">
      <!-- Stats Grid -->
      <GameStats
        :total-pot="totalPot"
        :user-keys="userKeys"
        :round-id="roundId"
        :last-buyer-label="lastBuyerLabel"
        :is-round-active="isRoundActive"
        :t="t as any"
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
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useWallet, usePayments, useEvents } from "@neo/uniapp-sdk";
import { formatNumber, formatAddress } from "@/shared/utils/format";
import { useI18n } from "@/composables/useI18n";
import { addressToScriptHash, normalizeScriptHash, parseInvokeResult, parseStackItem } from "@/shared/utils/neo";
import { AppLayout, NeoCard, NeoDoc } from "@/shared/components";
import type { NavTab } from "@/shared/components/NavBar.vue";

import ClockFace from "./components/ClockFace.vue";
import GameStats from "./components/GameStats.vue";
import BuyKeysCard from "./components/BuyKeysCard.vue";
import HistoryList, { type HistoryEvent } from "./components/HistoryList.vue";


const { t } = useI18n();

const navTabs = computed<NavTab[]>(() => [
  { id: "game", icon: "game", label: t("title") },
  { id: "stats", icon: "chart", label: t("tabStats") },
  { id: "history", icon: "time", label: t("history") },
  { id: "docs", icon: "book", label: t("docs") },
]);
const activeTab = ref("game");

const docSteps = computed(() => [t("step1"), t("step2"), t("step3"), t("step4")]);
const docFeatures = computed(() => [
  { name: t("feature1Name"), desc: t("feature1Desc") },
  { name: t("feature2Name"), desc: t("feature2Desc") },
]);

const APP_ID = "miniapp-doomsday-clock";
const MAX_DURATION_SECONDS = 86400;

// Contract constants for dynamic pricing (in GAS units, 1e8 = 1 GAS)
const BASE_KEY_PRICE = 10000000n; // 0.1 GAS
const KEY_PRICE_INCREMENT_BPS = 10n; // 0.1% increment per key sold

// Current round state for cost calculation
const totalKeysInRound = ref(0n);

const { address, connect, invokeRead, invokeContract, chainType, switchChain, getContractAddress } = useWallet() as any;
const { payGAS, isLoading: isPaying } = usePayments(APP_ID);
const { list: listEvents } = useEvents();

const contractAddress = ref<string | null>(null);
const roundId = ref(0);
const totalPot = ref(0);
const endTime = ref(0);
const isRoundActive = ref(false);
const lastBuyer = ref<string | null>(null);
const userKeys = ref(0);
const keyCount = ref("1");
const status = ref<{ msg: string; type: string } | null>(null);
const history = ref<HistoryEvent[]>([]);
const now = ref(Date.now());
const loading = ref(false);
const isClaiming = ref(false);

const toGas = (value: any) => Number(value || 0) / 1e8;

const timeRemainingSeconds = computed(() => {
  if (!endTime.value) return 0;
  return Math.max(0, Math.floor((endTime.value - now.value) / 1000));
});

const countdown = computed(() => {
  const total = timeRemainingSeconds.value;
  const hours = String(Math.floor(total / 3600)).padStart(2, "0");
  const mins = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const secs = String(total % 60).padStart(2, "0");
  return `${hours}:${mins}:${secs}`;
});

const dangerLevel = computed(() => {
  const seconds = timeRemainingSeconds.value;
  if (seconds > 7200) return "low";
  if (seconds > 3600) return "medium";
  if (seconds > 600) return "high";
  return "critical";
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
  if (!timeRemainingSeconds.value) return 0;
  return Math.min(100, (timeRemainingSeconds.value / MAX_DURATION_SECONDS) * 100);
});

const shouldPulse = computed(() => timeRemainingSeconds.value <= 600);

/**
 * Calculate key cost using closed-form formula (matches contract logic).
 * Formula: Sum of arithmetic sequence where:
 * - First term: BASE_PRICE + currentKeys * BASE_PRICE * INCREMENT_BPS / 10000
 * - Common difference: BASE_PRICE * INCREMENT_BPS / 10000
 * - Sum = n * firstTerm + n*(n-1)/2 * commonDiff
 */
const calculateKeyCostFormula = (keyCount: bigint, currentTotalKeys: bigint): bigint => {
  if (keyCount <= 0n) return 0n;

  // Common difference per key
  const commonDiff = BASE_KEY_PRICE * KEY_PRICE_INCREMENT_BPS / 10000n;

  // First key price
  const firstKeyPrice = BASE_KEY_PRICE + (currentTotalKeys * commonDiff);

  // Sum of arithmetic sequence: n * first + n*(n-1)/2 * diff
  const baseCost = keyCount * firstKeyPrice;
  const incrementCost = keyCount * (keyCount - 1n) / 2n * commonDiff;

  return baseCost + incrementCost;
};

const estimatedCostRaw = computed(() => {
  const count = BigInt(Math.max(0, Math.floor(Number(keyCount.value) || 0)));
  return calculateKeyCostFormula(count, totalKeysInRound.value);
});

const estimatedCost = computed(() => {
  // Convert from GAS units (1e8) to GAS display
  return (Number(estimatedCostRaw.value) / 1e8).toFixed(2);
});

const lastBuyerLabel = computed(() => (lastBuyer.value ? formatAddress(lastBuyer.value) : "--"));

const currentEventDescription = computed(() => {
  if (!isRoundActive.value) return t("inactiveRound");
  return lastBuyer.value ? `${formatAddress(lastBuyer.value)} ${t("winnerDeclared")}` : t("roundStarted");
});

const lastBuyerHash = computed(() => normalizeScriptHash(String(lastBuyer.value || "")));
const addressHash = computed(() => (address.value ? addressToScriptHash(address.value) : ""));
const canClaim = computed(() => {
  return (
    !isRoundActive.value &&
    lastBuyerHash.value &&
    addressHash.value &&
    lastBuyerHash.value === addressHash.value &&
    totalPot.value > 0
  );
});

const showStatus = (msg: string, type: string) => {
  status.value = { msg, type };
  setTimeout(() => (status.value = null), 4000);
};

const ensureContractAddress = async () => {
  if (!contractAddress.value) {
    contractAddress.value = await getContractAddress();
  }
  return contractAddress.value;
};

const loadRoundData = async () => {
  await ensureContractAddress();
  const statusRes = await invokeRead({
    scriptHash: contractAddress.value as string,
    operation: "getGameStatus",
    args: [],
  });
  const data = parseInvokeResult(statusRes);
  if (data && typeof data === "object") {
    const statusMap = data as Record<string, any>;
    roundId.value = Number(statusMap.roundId || 0);
    totalPot.value = toGas(statusMap.pot);
    isRoundActive.value = Boolean(statusMap.active);
    lastBuyer.value = String(statusMap.lastBuyer || "");
    const remainingSeconds = Number(statusMap.remainingTime || 0);
    endTime.value = remainingSeconds > 0 ? Date.now() + remainingSeconds * 1000 : 0;
    // Store totalKeys for cost calculation
    totalKeysInRound.value = BigInt(statusMap.totalKeys || 0);
  }
};

const loadUserKeys = async () => {
  if (!address.value || !roundId.value || !contractAddress.value) {
    userKeys.value = 0;
    return;
  }
  const res = await invokeRead({
    scriptHash: contractAddress.value as string,
    operation: "getPlayerKeys",
    args: [
      { type: "Hash160", value: address.value as string },
      { type: "Integer", value: roundId.value },
    ],
  });
  userKeys.value = Number(parseInvokeResult(res) || 0);
};

const parseEventDate = (raw: any) => {
  const date = raw ? new Date(raw) : new Date();
  if (Number.isNaN(date.getTime())) return new Date().toLocaleString();
  return date.toLocaleString();
};

const loadHistory = async () => {
  const [keysRes, winnerRes, roundRes] = await Promise.all([
    listEvents({ app_id: APP_ID, event_name: "KeysPurchased", limit: 20 }),
    listEvents({ app_id: APP_ID, event_name: "DoomsdayWinner", limit: 10 }),
    listEvents({ app_id: APP_ID, event_name: "RoundStarted", limit: 10 }),
  ]);

  const items: HistoryEvent[] = [];

  keysRes.events.forEach((evt: any) => {
    const values = Array.isArray(evt?.state) ? evt.state.map(parseStackItem) : [];
    const player = String(values[0] || "");
    const keys = Number(values[1] || 0);
    const potContribution = toGas(values[2]);
    items.push({
      id: evt.id,
      title: t("keysPurchased"),
      details: `${formatAddress(player)} • ${keys} keys • +${potContribution.toFixed(2)} GAS`,
      date: parseEventDate(evt.created_at),
    });
  });

  winnerRes.events.forEach((evt: any) => {
    const values = Array.isArray(evt?.state) ? evt.state.map(parseStackItem) : [];
    const winner = String(values[0] || "");
    const prize = toGas(values[1]);
    const round = Number(values[2] || 0);
    items.push({
      id: evt.id,
      title: t("winnerDeclared"),
      details: `${formatAddress(winner)} • ${prize.toFixed(2)} GAS • #${round}`,
      date: parseEventDate(evt.created_at),
    });
  });

  roundRes.events.forEach((evt: any) => {
    const values = Array.isArray(evt?.state) ? evt.state.map(parseStackItem) : [];
    const round = Number(values[0] || 0);
    const end = Number(values[1] || 0) * 1000;
    const endText = end ? new Date(end).toLocaleString() : "--";
    items.push({
      id: evt.id,
      title: t("roundStarted"),
      details: `#${round} • ${endText}`,
      date: parseEventDate(evt.created_at),
    });
  });

  history.value = items.sort((a, b) => b.id - a.id);
};

const refreshData = async () => {
  try {
    loading.value = true;
    await loadRoundData();
    await loadUserKeys();
    await loadHistory();
  } catch (e: any) {
    showStatus(e.message || t("failedToLoad"), "error");
  } finally {
    loading.value = false;
  }
};

const buyKeys = async () => {
  if (isPaying.value) return;
  const count = Math.max(0, Math.floor(Number(keyCount.value) || 0));
  if (count <= 0) {
    showStatus(t("error"), "error");
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

    // Calculate cost using formula (matches contract logic)
    const costRaw = calculateKeyCostFormula(BigInt(count), totalKeysInRound.value);
    const costGas = Number(costRaw) / 1e8;

    const payment = await payGAS(costGas.toString(), `keys:${roundId.value}:${count}`);
    const receiptId = payment.receipt_id;
    if (!receiptId) {
      throw new Error(t("receiptMissing"));
    }

    // Use BuyKeysWithCost for O(1) verification instead of O(n) loop
    await invokeContract({
      scriptHash: contractAddress.value as string,
      operation: "buyKeysWithCost",
      args: [
        { type: "Hash160", value: address.value as string },
        { type: "Integer", value: count },
        { type: "Integer", value: costRaw.toString() },
        { type: "Integer", value: String(receiptId) },
      ],
    });
    keyCount.value = "1";
    showStatus(t("keysPurchased"), "success");
    await refreshData();
  } catch (e: any) {
    showStatus(e.message || t("error"), "error");
  }
};

const claimPrize = async () => {
  if (isClaiming.value) return;
  try {
    isClaiming.value = true;
    if (!address.value) await connect();
    if (!address.value) throw new Error(t("error"));
    await ensureContractAddress();
    
    await invokeContract({
      scriptHash: contractAddress.value as string,
      operation: "checkAndEndRound",
      args: [],
    });
    
    showStatus(t("prizeClaimed"), "success");
    await refreshData();
  } catch (e: any) {
    showStatus(e.message || t("error"), "error");
  } finally {
    isClaiming.value = false;
  }
};

const interval = ref<number | null>(null);

onMounted(async () => {
  await refreshData();
  interval.value = window.setInterval(() => {
    now.value = Date.now();
  }, 1000);
});

watch(address, async () => {
  await loadUserKeys();
});

onUnmounted(() => {
  if (interval.value) {
    clearInterval(interval.value);
  }
});
</script>

<style lang="scss" scoped>
@use "@/shared/styles/tokens.scss" as *;
@use "@/shared/styles/variables.scss";

@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');

$doom-bg: #0b0c10;
$doom-panel: #1f2833;
$doom-accent: #66fcf1;
$doom-warn: #e7c500;
$doom-danger: #c50000;
$doom-text: #c5c6c7;
$doom-font: 'Share Tech Mono', monospace;

:global(page) {
  background: $doom-bg;
}

.tab-content {
  padding: 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background-color: $doom-bg;
  /* Grunge texture */
  background-image: 
    linear-gradient(rgba(0,0,0,0.8), rgba(0,0,0,0.8)),
    url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiIHZpZXdCb3g9IjAgMCA0IDQiPjxwYXRoIGZpbGw9IiM0NTRhNjQiIGQ9Ik0xIDNoMXYxSDFWM3ptMi0yaDF2MUgzVjF6Ii8+PC9zdmc+');
  min-height: 100vh;
  position: relative;
  font-family: $doom-font;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* Industrial Overrides */
:deep(.neo-card) {
  background: linear-gradient(135deg, $doom-panel 0%, #151b24 100%) !important;
  border: 1px solid #45a29e !important;
  border-radius: 4px !important;
  box-shadow: 0 4px 0 #000, inset 0 0 20px rgba(102, 252, 241, 0.05) !important;
  color: $doom-text !important;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    top: 2px;
    right: 2px;
    width: 8px;
    height: 8px;
    background: #45a29e;
    box-shadow: 0 0 5px #45a29e;
  }
  
  &.variant-danger {
    border-color: $doom-danger !important;
    background: linear-gradient(135deg, rgba(80, 0, 0, 0.3) 0%, rgba(20, 0, 0, 0.6) 100%) !important;
    &::after {
      background: $doom-danger;
      box-shadow: 0 0 5px $doom-danger;
    }
  }
}

:deep(.neo-button) {
  border-radius: 2px !important;
  text-transform: uppercase;
  font-weight: 700 !important;
  font-family: $doom-font !important;
  letter-spacing: 0.1em;
  position: relative;
  overflow: hidden;
  
  &.variant-primary {
    background: $doom-accent !important;
    color: #0b0c10 !important;
    border: none !important;
    box-shadow: 0 0 10px rgba(102, 252, 241, 0.4) !important;
    
    &:active {
      transform: translateY(2px);
      box-shadow: 0 0 5px rgba(102, 252, 241, 0.2) !important;
    }
    
    /* Scanline effect */
    &::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: repeating-linear-gradient(
        0deg,
        rgba(0,0,0,0.1),
        rgba(0,0,0,0.1) 2px,
        transparent 2px,
        transparent 4px
      );
      pointer-events: none;
    }
  }
  
  &.variant-secondary {
    background: transparent !important;
    border: 1px solid $doom-accent !important;
    color: $doom-accent !important;
    
    &:hover {
      background: rgba(102, 252, 241, 0.1) !important;
    }
  }
}

.scrollable {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>
