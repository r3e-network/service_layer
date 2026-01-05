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
      <view class="controls-card">
        <text class="section-title">{{ t("makeChoice") }}</text>

        <view class="choice-row">
          <view :class="['choice-btn', choice === 'heads' && 'active']" @click="choice = 'heads'">
            <text class="choice-icon">🐲</text>
            <text class="choice-label">{{ t("heads") }}</text>
          </view>
          <view :class="['choice-btn', choice === 'tails' && 'active']" @click="choice = 'tails'">
            <text class="choice-icon">🔴</text>
            <text class="choice-label">{{ t("tails") }}</text>
          </view>
        </view>

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

      <!-- Result Modal -->
      <NeoModal
        :visible="showWinOverlay"
        :title="t('youWon')"
        variant="success"
        closeable
        @close="showWinOverlay = false"
      >
        <view class="win-content">
          <text class="win-emoji">🎉</text>
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
import { usePayments, useRNG } from "@neo/uniapp-sdk";
import { formatNumber } from "@/shared/utils/format";
import { createT } from "@/shared/utils/i18n";
import AppLayout from "@/shared/components/AppLayout.vue";
import { NeoButton, NeoInput, NeoModal, NeoStats, NeoDoc, type StatItem } from "@/shared/components";
import ThreeDCoin from "@/components/ThreeDCoin.vue";

const translations = {
  title: { en: "Coin Flip", zh: "抛硬币" },
  wins: { en: "Wins", zh: "胜利" },
  losses: { en: "Losses", zh: "失败" },
  won: { en: "Won", zh: "赢得" },
  makeChoice: { en: "Choose Side", zh: "选择面" },
  placeBet: { en: "Place Your Bet", zh: "请下注" },
  wager: { en: "Wager Amount", zh: "下注金额" },
  betAmountPlaceholder: { en: "0.1", zh: "0.1" },
  heads: { en: "Heads", zh: "正面" },
  tails: { en: "Tails", zh: "反面" },
  flipping: { en: "Flipping...", zh: "抛掷中..." },
  flipCoin: { en: "Flip Coin", zh: "抛硬币" },
  youWon: { en: "You Won!", zh: "你赢了！" },
  youLost: { en: "You Lost", zh: "你输了" },
  minBet: { en: "Min bet: 0.1 GAS", zh: "最小下注：0.1 GAS" },
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
    zh: "点击“抛硬币”，等待 TEE 驱动的安全随机数。",
  },
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

const docSteps = computed(() => [t("step1"), t("step2"), t("step3")]);
const docFeatures = computed(() => [
  { name: t("feature1Name"), desc: t("feature1Desc") },
  { name: t("feature2Name"), desc: t("feature2Desc") },
]);

const APP_ID = "miniapp-coinflip";
const { payGAS } = usePayments(APP_ID);
const { requestRandom } = useRNG(APP_ID);

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

const formatNum = (n: number) => formatNumber(n, 2);

const canBet = computed(() => {
  const n = parseFloat(betAmount.value);
  return n >= 0.1;
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
    await payGAS(betAmount.value, `coinflip:${choice.value}`);
    const rng = await requestRandom();

    // Simulate slight delay for suspense if RNG was too fast vs animation
    // The CSS animation is 2s, we want to set the final state around then.

    const byte = parseInt(rng.randomness.slice(0, 2), 16);
    const outcome = byte % 2 === 0 ? "heads" : "tails";
    const won = outcome === choice.value;

    setTimeout(() => {
      displayOutcome.value = outcome; // This triggers CSS to settle on this face

      setTimeout(() => {
        isFlipping.value = false;
        result.value = { won, outcome: outcome.toUpperCase() };

        if (won) {
          wins.value++;
          const amount = parseFloat(betAmount.value) * 2; // Simple 2x for demo
          totalWon.value += amount;
          winAmount.value = amount.toFixed(2);
          showWinOverlay.value = true;
        } else {
          losses.value++;
        }
      }, 500); // Wait for settle transition
    }, 1500); // 1.5s spinning before deciding final rotation target (or use CSS track)
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
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  padding: $space-4;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
}

.arena {
  height: 250px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-primary) 50%, var(--bg-secondary) 100%);
  border-bottom: $border-width-md solid var(--border-color);
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at 50% 50%, rgba(0, 229, 153, 0.05) 0%, transparent 70%);
    pointer-events: none;
  }
}

.status-text {
  margin-top: $space-5;
  font-size: $font-size-lg;
  font-weight: $font-weight-black;
  color: var(--text-primary);
  text-transform: uppercase;
  text-shadow: 0 0 10px var(--neo-green);
  position: relative;
  z-index: 1;

  &.blink {
    animation: pulse 1s infinite;
  }
}

.controls-card {
  background: var(--bg-card);
  border-top: $border-width-lg solid var(--neo-green);
  padding: $space-6;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: $space-5;
}

.section-title {
  color: var(--text-secondary);
  font-size: $font-size-sm;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  font-weight: $font-weight-bold;
}

.choice-row {
  display: flex;
  gap: $space-4;
}

.choice-btn {
  flex: 1;
  background: var(--bg-secondary);
  border: $border-width-md solid var(--border-color);
  padding: $space-4;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-2;
  cursor: pointer;
  transition:
    transform $transition-fast,
    box-shadow $transition-fast,
    border-color $transition-fast;
  position: relative;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background: var(--neo-green);
    opacity: 0;
    transition: opacity $transition-fast;
    pointer-events: none;
  }

  &.active {
    border-color: var(--neo-green);
    box-shadow: $shadow-neo;

    &::before {
      opacity: 0.05;
    }
  }

  &:active {
    transform: translate(3px, 3px);
    box-shadow: none;
  }
}

.choice-icon {
  font-size: 28px;
}

.choice-label {
  font-weight: $font-weight-bold;
  color: var(--text-primary);
  text-transform: uppercase;
}

// Win Modal Content
.win-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: $space-6;
}

.win-emoji {
  font-size: 64px;
  margin-bottom: $space-4;
  animation:
    bounce 1s infinite,
    rotate 2s ease-in-out infinite;
  filter: drop-shadow(0 0 20px var(--neo-green));
}

.win-amount {
  font-size: $font-size-3xl;
  font-weight: $font-weight-black;
  color: var(--neo-green);
  font-family: $font-mono;
  text-shadow: 0 0 20px var(--neo-green);
  animation: glow 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes rotate {
  0%,
  100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-10px) rotate(10deg);
  }
}

@keyframes glow {
  0%,
  100% {
    text-shadow: 0 0 20px var(--neo-green);
  }
  50% {
    text-shadow:
      0 0 30px var(--neo-green),
      0 0 40px var(--neo-green);
  }
}
</style>
