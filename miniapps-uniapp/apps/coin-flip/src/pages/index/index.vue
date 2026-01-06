<template>
  <AppLayout :title="t('title')" show-top-nav :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <view v-if="activeTab === 'game'" class="tab-content">
      <!-- Coin Arena -->
      <view class="arena">
        <ThreeDCoin :result="displayOutcome" :flipping="isFlipping" />
        <text class="status-text" :class="{ blink: isFlipping }">
          {{ isFlipping ? t("flipping") : result ? (result.won ? t("youWon") : t("youLost")) : t("placeBet") }}
        </text>
      </view>

      <!-- Bet Controls -->
      <NeoCard :title="t('makeChoice')">
        <view class="choice-row">
          <view :class="['choice-btn', choice === 'heads' && 'active']" @click="choice = 'heads'">
            <AppIcon name="heads" :size="32" />
            <text class="choice-label">{{ t("heads") }}</text>
          </view>
          <view :class="['choice-btn', choice === 'tails' && 'active']" @click="choice = 'tails'">
            <AppIcon name="tails" :size="32" />
            <text class="choice-label">{{ t("tails") }}</text>
          </view>
        </view>

        <view class="mt-4 flex flex-col gap-4">
          <NeoInput
            v-model="betAmount"
            type="number"
            :label="t('wager')"
            :placeholder="t('betAmountPlaceholder')"
            suffix="GAS"
            :hint="t('minBet')"
          />

          <NeoButton
            variant="primary"
            size="lg"
            block
            :disabled="isFlipping || !canBet"
            :loading="isFlipping"
            @click="flip"
          >
            {{ isFlipping ? t("flipping") : t("flipCoin") }}
          </NeoButton>
        </view>
      </NeoCard>

      <!-- Result Modal -->
      <NeoModal
        :visible="showWinOverlay"
        :title="t('youWon')"
        variant="success"
        closeable
        @close="showWinOverlay = false"
      >
        <view class="win-content">
          <view class="win-icon">
            <AppIcon name="trophy" :size="64" />
          </view>
          <text class="win-amount">+{{ winAmount }} GAS</text>
        </view>
      </NeoModal>
    </view>

    <!-- Stats Tab -->
    <view v-if="activeTab === 'stats'" class="tab-content scrollable">
      <NeoStats :stats="gameStats" />
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
import { ref, computed } from "vue";
import { usePayments, useWallet, useEvents } from "@neo/uniapp-sdk";
import { formatNumber } from "@/shared/utils/format";
import { parseStackItem } from "@/shared/utils/neo";
import { createT } from "@/shared/utils/i18n";
import {
  AppLayout,
  NeoButton,
  NeoInput,
  NeoModal,
  NeoStats,
  NeoDoc,
  AppIcon,
  type StatItem,
} from "@/shared/components";
import ThreeDCoin from "@/components/ThreeDCoin.vue";

const translations = {
  title: { en: "Coin Flip", zh: "抛硬币" },
  wins: { en: "Wins", zh: "胜利" },
  losses: { en: "Losses", zh: "失败" },
  won: { en: "Won", zh: "赢得" },
  makeChoice: { en: "Choose Side", zh: "选择面" },
  placeBet: { en: "Place Your Bet", zh: "请下注" },
  wager: { en: "Wager Amount", zh: "下注金额" },
  betAmountPlaceholder: { en: "0.05", zh: "0.05" },
  heads: { en: "Heads", zh: "正面" },
  tails: { en: "Tails", zh: "反面" },
  flipping: { en: "Flipping...", zh: "抛掷中..." },
  flipCoin: { en: "Flip Coin", zh: "抛硬币" },
  youWon: { en: "You Won!", zh: "你赢了！" },
  youLost: { en: "You Lost", zh: "你输了" },
  minBet: { en: "Min bet: 0.05 GAS", zh: "最小下注：0.05 GAS" },
  connectWallet: { en: "Connect wallet to continue", zh: "请连接钱包" },
  error: { en: "Error", zh: "错误" },
  game: { en: "Play", zh: "游戏" },
  stats: { en: "Stats", zh: "统计" },
  docs: { en: "Docs", zh: "文档" },
  statistics: { en: "Statistics", zh: "统计数据" },
  totalGames: { en: "Total Games", zh: "总游戏数" },
  totalWon: { en: "Total Earnings", zh: "总收益" },
  docSubtitle: { en: "Provably fair coin toss powered by NeoHub TEE.", zh: "由 NeoHub TEE 驱动的可证明公平的抛硬币。" },
  docDescription: {
    en: "Coin Flip is a simple yet powerful demonstration of NeoHub's secure random number generation. Every flip is transparent, immutable, and provably fair.",
    zh: "抛硬币是 NeoHub 安全随机数生成的简单而强大的演示。每一次抛掷都是透明、不可篡改且可证明公平的。",
  },
  step1: { en: "Choose your side: Heads or Tails.", zh: "选择你的面：正面或反面。" },
  step2: { en: "Enter the amount of GAS you want to wager.", zh: "输入你想下注的 GAS 金额。" },
  step3: {
    en: "Click 'Flip Coin' and wait for the TEE-powered secure RNG.",
    zh: "点击「抛硬币」，等待 TEE 驱动的安全随机数。",
  },
  step4: { en: "View your win/loss stats in the Stats tab.", zh: "在统计标签页查看您的胜负统计。" },
  feature1Name: { en: "TEE Verification", zh: "TEE 验证" },
  feature1Desc: { en: "Randomness is generated inside an Intel SGX enclave.", zh: "随机数在 Intel SGX 安全区内生成。" },
  feature2Name: { en: "Instant Payout", zh: "即时支付" },
  feature2Desc: { en: "Winnings are automatically sent via smart contract.", zh: "奖金通过智能合约自动发送。" },
};
const t = createT(translations);

const navTabs = [
  { id: "game", icon: "game", label: t("game") },
  { id: "stats", icon: "chart", label: t("stats") },
  { id: "docs", icon: "book", label: t("docs") },
];
const activeTab = ref("game");

const docSteps = computed(() => [t("step1"), t("step2"), t("step3"), t("step4")]);
const docFeatures = computed(() => [
  { name: t("feature1Name"), desc: t("feature1Desc") },
  { name: t("feature2Name"), desc: t("feature2Desc") },
]);

const APP_ID = "miniapp-coinflip";
const { payGAS } = usePayments(APP_ID);
const { address, connect, invokeContract, getContractHash } = useWallet();
const { list: listEvents } = useEvents();

const betAmount = ref("1");
const choice = ref<"heads" | "tails">("heads");
const wins = ref(0);
const losses = ref(0);
const totalWon = ref(0);
const isFlipping = ref(false);
const result = ref<{ won: boolean; outcome: string } | null>(null);
const displayOutcome = ref<"heads" | "tails" | null>(null);
const showWinOverlay = ref(false);
const winAmount = ref("0");
const contractHash = ref<string | null>(null);

const formatNum = (n: number) => formatNumber(n, 2);
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const toFixed8 = (value: string) => {
  const num = Number.parseFloat(value);
  if (!Number.isFinite(num)) return "0";
  return Math.floor(num * 1e8).toString();
};

const waitForEvent = async (txid: string, eventName: string) => {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const res = await listEvents({ app_id: APP_ID, event_name: eventName, limit: 20 });
    const match = res.events.find((evt) => evt.tx_hash === txid);
    if (match) return match;
    await sleep(1500);
  }
  return null;
};

const waitForResolved = async (betId: string) => {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const res = await listEvents({ app_id: APP_ID, event_name: "BetResolved", limit: 25 });
    const match = res.events.find((evt) => {
      const values = Array.isArray((evt as any)?.state) ? (evt as any).state.map(parseStackItem) : [];
      return String(values[3] ?? "") === String(betId);
    });
    if (match) return match;
    await sleep(1500);
  }
  return null;
};

const canBet = computed(() => {
  const n = parseFloat(betAmount.value);
  return n >= 0.05;
});

const gameStats = computed<StatItem[]>(() => [
  { label: t("totalGames"), value: wins.value + losses.value },
  { label: t("wins"), value: wins.value, variant: "success" },
  { label: t("losses"), value: losses.value, variant: "danger" },
  { label: t("totalWon"), value: formatNum(totalWon.value), variant: "accent" },
]);

const flip = async () => {
  if (isFlipping.value || !canBet.value) return;

  isFlipping.value = true;
  result.value = null;
  displayOutcome.value = null; // Reset for animation start if needed, though usually handled by style
  showWinOverlay.value = false;

  try {
    if (!address.value) {
      await connect();
    }
    if (!address.value) {
      throw new Error(t("connectWallet"));
    }
    if (!contractHash.value) {
      contractHash.value = await getContractHash();
    }
    if (!contractHash.value) {
      throw new Error(t("error"));
    }

    const payment = await payGAS(betAmount.value, `coinflip:${choice.value}`);
    const receiptId = payment.receipt_id;
    if (!receiptId) {
      throw new Error("Missing payment receipt");
    }

    const amountInt = toFixed8(betAmount.value);
    const tx = await invokeContract({
      scriptHash: contractHash.value as string,
      operation: "PlaceBet",
      args: [
        { type: "Hash160", value: address.value as string },
        { type: "Integer", value: amountInt },
        { type: "Boolean", value: choice.value === "heads" },
        { type: "Integer", value: Number(receiptId) },
      ],
    });

    const txid = String((tx as any)?.txid || (tx as any)?.txHash || "");
    const placedEvent = txid ? await waitForEvent(txid, "BetPlaced") : null;
    if (!placedEvent) {
      throw new Error("Bet confirmation not available yet");
    }
    const placedValues = Array.isArray((placedEvent as any)?.state)
      ? (placedEvent as any).state.map(parseStackItem)
      : [];
    const betId = String(placedValues[3] ?? "");
    if (!betId) {
      throw new Error("Bet id missing");
    }

    const resolvedEvent = await waitForResolved(betId);
    if (!resolvedEvent) {
      throw new Error("Result not available yet");
    }
    const values = Array.isArray((resolvedEvent as any)?.state) ? (resolvedEvent as any).state.map(parseStackItem) : [];
    const payoutRaw = values[1];
    const won = Boolean(values[2]);
    const payoutValue = Number(payoutRaw || 0) / 1e8;
    const outcome = won ? choice.value : choice.value === "heads" ? "tails" : "heads";

    displayOutcome.value = outcome;
    await sleep(400);
    isFlipping.value = false;
    result.value = { won, outcome: outcome.toUpperCase() };

    if (won) {
      wins.value++;
      totalWon.value += payoutValue;
      winAmount.value = payoutValue.toFixed(2);
      showWinOverlay.value = true;
    } else {
      losses.value++;
    }
  } catch (e: any) {
    console.error(e);
    isFlipping.value = false;
  }
};
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

.arena {
  background: white;
  border: 4px solid black;
  padding: $space-8;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-4;
  box-shadow: 10px 10px 0 black;
}

.status-text {
  font-family: $font-mono;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  color: var(--neo-green);
  font-size: 16px;
  background: black;
  padding: 4px 12px;
  border: 2px solid var(--neo-green);
}

.choice-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $space-3;
}

.choice-btn {
  background: white;
  border: 2px solid black;
  padding: $space-4;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-2;
  cursor: pointer;
  &.active {
    background: var(--brutal-yellow);
    box-shadow: 6px 6px 0 black;
    transform: translate(-2px, -2px);
  }
  transition: all $transition-fast;
}

.choice-label {
  font-size: 10px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
}

.win-content {
  padding: $space-6;
  text-align: center;
}
.win-amount {
  font-family: $font-mono;
  font-weight: $font-weight-black;
  font-size: 36px;
  color: var(--neo-green);
  display: block;
  margin-top: $space-4;
  text-shadow: 2px 2px 0 black;
}

.blink {
  animation: flash-status 0.5s infinite;
}
@keyframes flash-status {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.2;
  }
}

.scrollable {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>
