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
      <!-- Error Message -->
      <NeoCard v-if="errorMessage" variant="danger" class="mb-4">
        <text class="text-center font-bold">{{ errorMessage }}</text>
      </NeoCard>

      <!-- Coin Arena -->
      <view class="arena-container">
        <CoinArena :display-outcome="displayOutcome" :is-flipping="isFlipping" :result="result" :t="t as any" />
      </view>

      <!-- Bet Controls -->
      <view class="controls-container">
        <BetControls
          v-model:choice="choice"
          v-model:betAmount="betAmount"
          :is-flipping="isFlipping"
          :can-bet="canBet"
          :t="t as any"
          @flip="flip"
        />
      </view>

      <!-- Result Modal -->
      <ResultOverlay :visible="showWinOverlay" :win-amount="winAmount" :t="t as any" @close="showWinOverlay = false" />
      <Fireworks :active="showWinOverlay" :duration="3000" />
    </view>

    <!-- Stats Tab -->
    <view v-if="activeTab === 'stats'" class="tab-content scrollable">
      <NeoCard variant="erobo" class="mb-6">
        <NeoStats :stats="gameStats" />
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
import { ref, computed, onUnmounted } from "vue";
import { usePayments, useWallet, useEvents } from "@neo/uniapp-sdk";
import { formatNumber } from "@/shared/utils/format";
import { sha256Hex, sha256HexFromHex } from "@/shared/utils/hash";
import { parseInvokeResult, parseStackItem } from "@/shared/utils/neo";
import { useI18n } from "@/composables/useI18n";
import { AppLayout, NeoCard, NeoStats, NeoDoc, NeoButton, type StatItem } from "@/shared/components";
import Fireworks from "@/shared/components/Fireworks.vue";
import type { NavTab } from "@/shared/components/NavBar.vue";

import CoinArena, { type GameResult } from "./components/CoinArena.vue";
import BetControls from "./components/BetControls.vue";
import ResultOverlay from "./components/ResultOverlay.vue";

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

const APP_ID = "miniapp-coinflip";
const SCRIPT_NAME = "flip-coin";
const { payGAS } = usePayments(APP_ID);
const { address, connect, invokeContract, invokeRead, chainType, switchChain, getContractAddress } = useWallet() as any;
const { list: listEvents } = useEvents();

const betAmount = ref("1");
const choice = ref<"heads" | "tails">("heads");
const wins = ref(0);
const losses = ref(0);
const totalWon = ref(0);
const isFlipping = ref(false);
const result = ref<GameResult | null>(null);
const displayOutcome = ref<"heads" | "tails" | null>(null);
const showWinOverlay = ref(false);
const winAmount = ref("0");
const contractAddress = ref<string | null>(null);
const flipScriptHash = ref<string | null>(null);
const errorMessage = ref<string | null>(null);

// Timer tracking for cleanup
let errorClearTimer: ReturnType<typeof setTimeout> | null = null;

const formatNum = (n: number) => formatNumber(n, 2);
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForEvent = async (txid: string, eventName: string) => {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const res = await listEvents({ app_id: APP_ID, event_name: eventName, limit: 20 });
    const match = res.events.find((evt) => evt.tx_hash === txid);
    if (match) return match;
    await sleep(1500);
  }
  return null;
};

const MAX_BET = 100; // Maximum bet amount in GAS

/**
 * Convert hex seed to BigInt for deterministic result calculation
 */
const hexToBigInt = (hex: string): bigint => {
  const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;
  return BigInt("0x" + cleanHex);
};

const hashSeed = async (seed: string): Promise<string> => {
  const raw = String(seed ?? "").trim();
  const cleaned = raw.replace(/^0x/i, "");
  const isHex = cleaned.length > 0 && /^[0-9a-fA-F]+$/.test(cleaned);
  return isHex ? sha256HexFromHex(cleaned) : sha256Hex(raw);
};

/**
 * Simulate coin flip result locally using the deterministic seed from contract
 * This mirrors the on-chain CalculateExpectedResult logic
 */
const simulateCoinFlip = async (
  seed: string,
  playerChoice: boolean
): Promise<{ won: boolean; outcome: "heads" | "tails" }> => {
  // SHA256 the seed to get random number (mirrors contract logic)
  const hashHex = await hashSeed(seed);
  const rand = hexToBigInt(hashHex);
  const resultFlip = rand % BigInt(2) === BigInt(0);
  const won = resultFlip === playerChoice;
  const outcome = resultFlip ? "heads" : "tails";
  return { won, outcome };
};

const canBet = computed(() => {
  const n = parseFloat(betAmount.value);
  return n >= 0.05 && n <= MAX_BET;
});

const gameStats = computed<StatItem[]>(() => [
  { label: t("totalGames"), value: wins.value + losses.value },
  { label: t("wins"), value: wins.value, variant: "success" },
  { label: t("losses"), value: losses.value, variant: "danger" },
  { label: t("totalWon"), value: `${formatNum(totalWon.value)} GAS`, variant: "accent" },
]);

const ensureContractAddress = async () => {
  if (!contractAddress.value) {
    contractAddress.value = await getContractAddress();
  }
  if (!contractAddress.value) {
    throw new Error(t("contractUnavailable"));
  }
  return contractAddress.value;
};

const ensureScriptHash = async () => {
  if (flipScriptHash.value) return flipScriptHash.value;
  const contract = await ensureContractAddress();
  const info = await invokeRead({ scriptHash: contract, operation: "getFlipScriptInfo" });
  const parsed = parseInvokeResult(info);
  let hash = "";
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    hash = String((parsed as Record<string, unknown>).hash ?? "");
  }
  if (!hash) {
    const direct = await invokeRead({
      scriptHash: contract,
      operation: "getScriptHash",
      args: [{ type: "String", value: SCRIPT_NAME }],
    });
    const parsedDirect = parseInvokeResult(direct);
    hash = Array.isArray(parsedDirect) ? String(parsedDirect[0] ?? "") : String(parsedDirect ?? "");
  }
  if (!hash) {
    throw new Error(t("scriptHashMissing"));
  }
  flipScriptHash.value = hash.replace(/^0x/i, "");
  return flipScriptHash.value;
};

/**
 * Hybrid Mode Flip Flow:
 * 1. Pay GAS and call InitiateBet -> returns [betId, seed]
 * 2. Simulate result locally using seed (instant feedback)
 * 3. Call SettleBet with result -> verifies and transfers winnings
 *
 * Benefits: ~25% gas savings, instant UI feedback, verifiable fairness
 */
const flip = async () => {
  if (isFlipping.value || !canBet.value) return;

  isFlipping.value = true;
  result.value = null;
  displayOutcome.value = null;
  showWinOverlay.value = false;

  try {
    if (!address.value) {
      await connect();
    }
    if (!address.value) {
      throw new Error(t("connectWallet"));
    }
    const contract = await ensureContractAddress();

    // Phase 1: Pay and initiate bet (on-chain)
    const payment = await payGAS(betAmount.value, `coinflip:${choice.value}`);
    const receiptId = payment.receipt_id;
    if (!receiptId) {
      throw new Error(t("receiptMissing"));
    }

    const amountBase = Math.floor(Number.parseFloat(betAmount.value) * 1e8);
    if (!Number.isFinite(amountBase) || amountBase <= 0) {
      throw new Error(t("invalidBetAmount"));
    }

    // Call InitiateBet - returns [betId, seed] for hybrid mode
    const initiateTx = await invokeContract({
      scriptHash: contract,
      operation: "initiateBet",
      args: [
        { type: "Hash160", value: address.value as string },
        { type: "Integer", value: String(amountBase) },
        { type: "Boolean", value: choice.value === "heads" },
        { type: "Integer", value: String(receiptId) },
      ],
    });

    const initiateTxid = String((initiateTx as any)?.txid || (initiateTx as any)?.txHash || "");
    const initiatedEvent = initiateTxid ? await waitForEvent(initiateTxid, "BetInitiated") : null;
    if (!initiatedEvent) {
      throw new Error(t("betPending"));
    }

    // Extract betId and seed from BetInitiated event
    const initiatedValues = Array.isArray((initiatedEvent as any)?.state)
      ? (initiatedEvent as any).state.map(parseStackItem)
      : [];
    const betId = String(initiatedValues[1] ?? "");
    const seed = String(initiatedValues[4] ?? "");
    if (!betId || !seed) {
      throw new Error(t("betMissing"));
    }

    // Phase 2: Simulate result locally (instant feedback)
    const playerChoice = choice.value === "heads";
    const simulated = await simulateCoinFlip(seed, playerChoice);

    // Show result immediately for better UX
    displayOutcome.value = simulated.outcome;
    await sleep(400);
    isFlipping.value = false;
    result.value = { won: simulated.won, outcome: simulated.outcome.toUpperCase() };

    // Phase 3: Settle bet (on-chain verification and transfer)
    const scriptHash = await ensureScriptHash();
    const settleTx = await invokeContract({
      scriptHash: contract,
      operation: "settleBet",
      args: [
        { type: "Hash160", value: address.value as string },
        { type: "Integer", value: betId },
        { type: "Boolean", value: simulated.won },
        { type: "ByteArray", value: scriptHash },
      ],
    });

    const settleTxid = String((settleTx as any)?.txid || (settleTx as any)?.txHash || "");
    if (settleTxid) {
      const resolvedEvent = await waitForEvent(settleTxid, "BetResolved");
      if (resolvedEvent) {
        const values = Array.isArray((resolvedEvent as any)?.state)
          ? (resolvedEvent as any).state.map(parseStackItem)
          : [];
        const payoutRaw = values[3];
        const payoutValue = Number(payoutRaw || 0) / 1e8;

        if (simulated.won) {
          wins.value++;
          totalWon.value += payoutValue;
          winAmount.value = payoutValue.toFixed(2);
          showWinOverlay.value = true;
        } else {
          losses.value++;
        }
      }
    }
  } catch (e: any) {
    errorMessage.value = e?.message || t("error");
    isFlipping.value = false;
    if (errorClearTimer) clearTimeout(errorClearTimer);
    errorClearTimer = setTimeout(() => {
      errorMessage.value = null;
      errorClearTimer = null;
    }, 5000);
  }
};

// Cleanup on unmount
onUnmounted(() => {
  if (errorClearTimer) {
    clearTimeout(errorClearTimer);
    errorClearTimer = null;
  }
});
</script>

<style lang="scss" scoped>
@use "@/shared/styles/tokens.scss" as *;
@use "@/shared/styles/variables.scss";

$arcade-gold: #ffcc00;
$arcade-black: #202020;
$arcade-red: #ff3366;
$arcade-blue: #33ccff;
$arcade-bg: #1a1a2e;
$arcade-purple: #9900ff;

:global(page) {
  background: $arcade-bg;
}

.tab-content {
  padding: 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  background: radial-gradient(circle at 50% 50%, #2a2a4e 0%, #1a1a2e 100%);
  position: relative;
  font-family: 'Press Start 2P', cursive;
  
  /* Pixel grid overlay */
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: 
      linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
    background-size: 20px 20px;
    pointer-events: none;
  }

  /* CRT Scanline */
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%);
    background-size: 100% 4px;
    pointer-events: none;
    z-index: 100;
  }
}

.arena-container {
  margin-bottom: 8px;
  perspective: 1000px;
  z-index: 10;
  display: flex;
  justify-content: center;
  padding: 20px 0;
  background: rgba(0,0,0,0.2);
  border-radius: 16px;
  border: 4px solid $arcade-blue;
  box-shadow: 0 0 20px rgba(51, 204, 255, 0.3), inset 0 0 20px rgba(51, 204, 255, 0.1);
}

.controls-container {
  margin-top: 8px;
  background: #000;
  padding: 16px;
  border-radius: 4px;
  border: 4px solid $arcade-bg;
  outline: 4px solid $arcade-purple;
  box-shadow: 0 8px 0 rgba(0,0,0,0.5);
  z-index: 10;
}

/* Override card styles for arcade feel */
:deep(.neo-card) {
  border: 4px solid #fff !important;
  box-shadow: 6px 6px 0 #000 !important;
  background: $arcade-black !important;
  color: #fff !important;
  border-radius: 0 !important;
  image-rendering: pixelated;
  
  &.variant-danger {
    background: $arcade-red !important;
    color: #fff !important;
    border-color: #ff99aa !important;
  }
  
  &.variant-erobo {
    background: $arcade-blue !important;
    color: #000 !important;
    border-color: #ccffff !important;
  }
}

:deep(.neo-button) {
  font-family: inherit !important;
  font-weight: 800 !important;
  text-transform: uppercase;
  border: 4px solid #fff !important;
  box-shadow: 4px 4px 0 #000 !important;
  border-radius: 0 !important;
  transition: transform 0.1s !important;
  background: $arcade-gold !important;
  color: #000 !important;
  font-size: 12px !important;
  padding: 12px 16px !important;
  
  &:active {
    transform: translate(4px, 4px) !important;
    box-shadow: 0 0 0 #000 !important;
  }
  
  &.variant-primary {
    background: $arcade-gold !important;
    color: #000 !important;
  }
  
  &.variant-secondary {
    background: transparent !important;
    color: #fff !important;
    border: 4px solid #fff !important;
  }
}

:deep(.neo-input) {
  border: 4px solid #fff !important;
  background: #000 !important;
  color: $arcade-gold !important;
  font-family: inherit !important;
  border-radius: 0 !important;
  box-shadow: 4px 4px 0 rgba(255,255,255,0.2) !important;
}

.scrollable {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>
