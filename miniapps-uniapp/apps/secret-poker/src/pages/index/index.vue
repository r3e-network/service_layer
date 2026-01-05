<template>
  <AppLayout :title="t('title')" show-top-nav :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <view v-if="activeTab === 'game'" class="tab-content">
      <!-- Win/Loss Celebration -->
      <view v-if="showCelebration" :class="['celebration', celebrationType]">
        <text class="celebration-text">{{ celebrationText }}</text>
        <view class="celebration-coins">
          <text v-for="i in 5" :key="i" class="coin">💰</text>
        </view>
      </view>

      <!-- Status Message -->
      <view v-if="status" :class="['status-msg', status.type]">
        <text>{{ status.msg }}</text>
      </view>

      <!-- Poker Table -->
      <view class="poker-table">
        <view class="table-felt">
          <!-- Pot Display with Chips -->
          <view class="pot-display">
            <view class="chip-stack">
              <view v-for="i in Math.min(Math.floor(pot / 0.5), 10)" :key="i" class="chip"></view>
            </view>
            <text class="pot-label">{{ t("pot") }}</text>
            <text class="pot-amount">{{ pot }} GAS</text>
          </view>

          <!-- Player Hand -->
          <view class="hand-section">
            <text class="hand-title">{{ t("yourHand") }}</text>
            <view class="cards-row">
              <view
                v-for="(card, i) in playerHand"
                :key="i"
                :class="['poker-card', card.revealed && 'revealed', isAnimating && 'flip']"
                @click="card.revealed && playCardSound()"
              >
                <!-- Card Back -->
                <view class="card-back">
                  <view class="card-pattern"></view>
                </view>
                <!-- Card Front -->
                <view class="card-front">
                  <view class="card-corner top-left">
                    <text :class="['card-rank', getSuitColor(card.suit)]">{{ card.rank }}</text>
                    <text :class="['card-suit', getSuitColor(card.suit)]">{{ card.suit }}</text>
                  </view>
                  <text :class="['card-suit-center', getSuitColor(card.suit)]">{{ card.suit }}</text>
                  <view class="card-corner bottom-right">
                    <text :class="['card-rank', getSuitColor(card.suit)]">{{ card.rank }}</text>
                    <text :class="['card-suit', getSuitColor(card.suit)]">{{ card.suit }}</text>
                  </view>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- Betting Controls -->
      <NeoCard :title="t('actions')" variant="accent">
        <view class="bet-input-wrapper">
          <NeoInput v-model="betAmount" type="number" :placeholder="t('betAmountPlaceholder')" suffix="GAS" />
          <view class="quick-bet-chips">
            <view
              v-for="amount in [0.5, 1, 5, 10]"
              :key="amount"
              class="quick-chip"
              @click="betAmount = String(amount)"
            >
              <text class="chip-value">{{ amount }}</text>
            </view>
          </view>
        </view>
        <view class="actions-row">
          <NeoButton variant="ghost" size="md" @click="fold" :disabled="isPlaying">
            {{ t("fold") }}
          </NeoButton>
          <NeoButton variant="primary" size="md" @click="bet" :loading="isPlaying" block>
            {{ t("bet") }}
          </NeoButton>
          <NeoButton variant="secondary" size="md" @click="reveal" :disabled="isPlaying">
            {{ t("reveal") }}
          </NeoButton>
        </view>
      </NeoCard>

      <!-- Game Stats -->
      <NeoCard :title="t('gameStats')" variant="success">
        <NeoStats :stats="gameStats" />
      </NeoCard>
    </view>

    <view v-if="activeTab === 'stats'" class="tab-content scrollable">
      <NeoCard :title="t('statistics')" variant="accent">
        <view class="stat-row">
          <text class="stat-label">{{ t("totalGames") }}</text>
          <text class="stat-value">{{ gamesPlayed }}</text>
        </view>
        <view class="stat-row">
          <text class="stat-label">{{ t("won") }}</text>
          <text class="stat-value win">{{ gamesWon }}</text>
        </view>
        <view class="stat-row">
          <text class="stat-label">{{ t("earnings") }}</text>
          <text class="stat-value">{{ formatNum(totalEarnings) }} GAS</text>
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
import { ref, computed } from "vue";
import { useWallet, usePayments, useRNG } from "@neo/uniapp-sdk";
import { formatNumber } from "@/shared/utils/format";
import { createT } from "@/shared/utils/i18n";
import AppLayout from "@/shared/components/AppLayout.vue";
import { NeoButton, NeoInput, NeoCard, NeoStats, type StatItem, NeoDoc } from "@/shared/components";

const translations = {
  title: { en: "Secret Poker", zh: "秘密扑克" },
  subtitle: { en: "Hidden card poker game", zh: "隐藏牌扑克游戏" },
  yourHand: { en: "Your Hand", zh: "你的手牌" },
  pot: { en: "Pot:", zh: "底池：" },
  actions: { en: "Actions", zh: "操作" },
  betAmountPlaceholder: { en: "Bet amount (GAS)", zh: "下注金额 (GAS)" },
  fold: { en: "Fold", zh: "弃牌" },
  bet: { en: "Bet", zh: "下注" },
  playing: { en: "Playing...", zh: "游戏中..." },
  reveal: { en: "Reveal", zh: "揭示" },
  gameStats: { en: "Game Stats", zh: "游戏统计" },
  games: { en: "Games", zh: "局数" },
  won: { en: "Won", zh: "胜利" },
  earnings: { en: "Earnings", zh: "收益" },
  minBet: { en: "Min bet: 0.1 GAS", zh: "最小下注：0.1 GAS" },
  betPlaced: { en: "Bet {amount} GAS placed", zh: "已下注 {amount} GAS" },
  error: { en: "Error", zh: "错误" },
  foldedHand: { en: "Folded hand", zh: "已弃牌" },
  wonAmount: { en: "Won {amount} GAS!", zh: "赢得 {amount} GAS！" },
  lostRound: { en: "Lost this round", zh: "本轮失败" },
  game: { en: "Game", zh: "游戏" },
  stats: { en: "Stats", zh: "统计" },
  statistics: { en: "Statistics", zh: "统计数据" },
  totalGames: { en: "Total Games", zh: "总游戏数" },

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
const APP_ID = "miniapp-secretpoker";
const { address, connect } = useWallet();
const { payGAS } = usePayments(APP_ID);
const { requestRandom } = useRNG(APP_ID);

const betAmount = ref("1");
const pot = ref(0);
const gamesPlayed = ref(0);
const gamesWon = ref(0);
const totalEarnings = ref(0);
const isPlaying = ref(false);
const isAnimating = ref(false);
const status = ref<{ msg: string; type: string } | null>(null);
const showCelebration = ref(false);
const celebrationType = ref<"win" | "lose">("win");
const celebrationText = ref("");

// Card suits and ranks
const suits = ["♠", "♥", "♦", "♣"];
const ranks = ["A", "K", "Q", "J", "10", "9", "8", "7"];

const playerHand = ref([
  { rank: "A", suit: "♠", revealed: false },
  { rank: "K", suit: "♥", revealed: false },
  { rank: "Q", suit: "♦", revealed: false },
]);

const formatNum = (n: number) => formatNumber(n, 2);

const gameStats = computed<StatItem[]>(() => [
  { label: t("games"), value: gamesPlayed.value, variant: "default" },
  { label: t("won"), value: gamesWon.value, variant: "success" },
  { label: t("earnings"), value: formatNum(totalEarnings.value), variant: "accent" },
]);

// Helper function to get suit color
const getSuitColor = (suit: string) => {
  return suit === "♥" || suit === "♦" ? "red" : "black";
};

// Helper function to shuffle and deal new cards
const dealNewHand = () => {
  const newHand = [];
  for (let i = 0; i < 3; i++) {
    const randomSuit = suits[Math.floor(Math.random() * suits.length)];
    const randomRank = ranks[Math.floor(Math.random() * ranks.length)];
    newHand.push({ rank: randomRank, suit: randomSuit, revealed: false });
  }
  playerHand.value = newHand;
};

// Play card sound effect (placeholder)
const playCardSound = () => {
  // Sound effect placeholder - implement with actual audio in production
};

// Show celebration animation
const triggerCelebration = (type: "win" | "lose", text: string) => {
  celebrationType.value = type;
  celebrationText.value = text;
  showCelebration.value = true;
  setTimeout(() => {
    showCelebration.value = false;
  }, 3000);
};

const bet = async () => {
  if (isPlaying.value) return;
  const amount = parseFloat(betAmount.value);
  if (amount < 0.1) {
    status.value = { msg: t("minBet"), type: "error" };
    return;
  }

  isPlaying.value = true;
  try {
    await payGAS(betAmount.value, "poker:bet");
    pot.value += amount;
    status.value = { msg: t("betPlaced").replace("{amount}", String(amount)), type: "success" };
  } catch (e: any) {
    status.value = { msg: e.message || t("error"), type: "error" };
  } finally {
    isPlaying.value = false;
  }
};

const fold = () => {
  if (isPlaying.value) return;
  pot.value = 0;
  dealNewHand();
  status.value = { msg: t("foldedHand"), type: "error" };
  triggerCelebration("lose", t("foldedHand"));
};

const reveal = async () => {
  if (isPlaying.value) return;
  isPlaying.value = true;
  isAnimating.value = true;

  try {
    const rng = await requestRandom();
    const byte = parseInt(rng.randomness.slice(0, 2), 16);
    const won = byte % 2 === 0;

    // Animate card flip
    setTimeout(() => {
      playerHand.value.forEach((c) => (c.revealed = true));
      isAnimating.value = false;
    }, 600);

    // Wait for animation to complete
    await new Promise((resolve) => setTimeout(resolve, 800));

    gamesPlayed.value++;

    if (won) {
      gamesWon.value++;
      const winAmount = pot.value * 2;
      totalEarnings.value += winAmount;
      const winMsg = t("wonAmount").replace("{amount}", String(winAmount));
      status.value = { msg: winMsg, type: "success" };
      triggerCelebration("win", winMsg);
    } else {
      status.value = { msg: t("lostRound"), type: "error" };
      triggerCelebration("lose", t("lostRound"));
    }

    pot.value = 0;

    // Deal new hand after a delay
    setTimeout(() => {
      dealNewHand();
    }, 2000);
  } catch (e: any) {
    status.value = { msg: e.message || t("error"), type: "error" };
    isAnimating.value = false;
  } finally {
    isPlaying.value = false;
  }
};
</script>

<style lang="scss" scoped>
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.tab-content {
  padding: $space-3;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: $space-4;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
}

// === CELEBRATION ANIMATION ===
.celebration {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: $z-modal;
  text-align: center;
  animation: celebration-bounce 0.6s ease-out;
  pointer-events: none;

  &.win {
    .celebration-text {
      color: var(--brutal-yellow);
      text-shadow: 3px 3px 0 var(--neo-black);
    }
  }

  &.lose {
    .celebration-text {
      color: var(--status-error);
      text-shadow: 3px 3px 0 var(--neo-black);
    }
  }
}

.celebration-text {
  font-size: $font-size-3xl;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  margin-bottom: $space-4;
}

.celebration-coins {
  display: flex;
  gap: $space-2;
  justify-content: center;

  .coin {
    font-size: $font-size-2xl;
    animation: coin-fall 1s ease-out forwards;
    opacity: 0;

    @for $i from 1 through 5 {
      &:nth-child(#{$i}) {
        animation-delay: #{$i * 0.1}s;
      }
    }
  }
}

@keyframes celebration-bounce {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 0;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.2);
  }
  100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
}

@keyframes coin-fall {
  0% {
    transform: translateY(-100px);
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
}

// === STATUS MESSAGE ===
.status-msg {
  text-align: center;
  padding: $space-3;
  border: $border-width-md solid var(--border-color);
  box-shadow: $shadow-sm;
  margin-bottom: $space-4;
  font-weight: $font-weight-bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  animation: status-slide-in 0.3s ease-out;

  &.success {
    background: var(--status-success);
    color: var(--neo-black);
    border-color: var(--neo-black);
  }
  &.error {
    background: var(--status-error);
    color: var(--neo-white);
    border-color: var(--neo-black);
  }
}

@keyframes status-slide-in {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
// === POKER TABLE ===
.poker-table {
  margin-bottom: $space-4;
  border: $border-width-lg solid var(--border-color);
  border-radius: $radius-lg;
  box-shadow: $shadow-lg;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
}

.table-felt {
  background: linear-gradient(135deg, var(--neo-green) 0%, color-mix(in srgb, var(--neo-green) 85%, black) 100%);
  padding: $space-6;
  position: relative;

  // Felt texture pattern
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: repeating-linear-gradient(
      45deg,
      transparent,
      transparent 10px,
      rgba(0, 0, 0, 0.03) 10px,
      rgba(0, 0, 0, 0.03) 20px
    );
    pointer-events: none;
  }
}

// === POT DISPLAY WITH CHIPS ===
.pot-display {
  text-align: center;
  margin-bottom: $space-6;
  position: relative;
  z-index: 1;
}

.chip-stack {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  height: 60px;
  margin-bottom: $space-3;
  gap: 2px;
}

.chip {
  width: 40px;
  height: 8px;
  background: linear-gradient(135deg, var(--brutal-yellow) 0%, var(--brutal-yellow) 100%);
  border: 2px solid var(--neo-black);
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  position: relative;
  animation: chip-stack 0.3s ease-out backwards;

  @for $i from 1 through 10 {
    &:nth-child(#{$i}) {
      animation-delay: #{$i * 0.05}s;
      margin-bottom: #{($i - 1) * 6}px;
    }
  }

  &::after {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 20px;
    height: 20px;
    border: 2px solid var(--neo-black);
    border-radius: 50%;
  }
}

@keyframes chip-stack {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.pot-label {
  display: block;
  color: var(--brutal-yellow);
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  text-transform: uppercase;
  letter-spacing: 1px;
  text-shadow: 2px 2px 0 var(--neo-black);
}

.pot-amount {
  display: block;
  color: var(--neo-white);
  font-size: $font-size-3xl;
  font-weight: $font-weight-black;
  text-shadow: 3px 3px 0 var(--neo-black);
  margin-top: $space-2;
}
// === HAND SECTION ===
.hand-section {
  position: relative;
  z-index: 1;
}

.hand-title {
  display: block;
  text-align: center;
  color: var(--neo-white);
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: $space-4;
  text-shadow: 2px 2px 0 var(--neo-black);
}

.cards-row {
  display: flex;
  gap: $space-3;
  justify-content: center;
  perspective: 1000px;
}
// === POKER CARD ===
.poker-card {
  width: 90px;
  height: 130px;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.6s;
  cursor: pointer;

  &.flip {
    animation: card-flip 0.6s ease-in-out;
  }

  &.revealed {
    .card-back {
      transform: rotateY(180deg);
    }
    .card-front {
      transform: rotateY(0deg);
    }
  }

  &:not(.revealed) {
    .card-back {
      transform: rotateY(0deg);
    }
    .card-front {
      transform: rotateY(-180deg);
    }
  }

  &:hover {
    transform: translateY(-8px);
  }
}

@keyframes card-flip {
  0% {
    transform: rotateY(0deg) scale(1);
  }
  50% {
    transform: rotateY(90deg) scale(1.1);
  }
  100% {
    transform: rotateY(180deg) scale(1);
  }
}

// Card Back
.card-back {
  position: absolute;
  width: 100%;
  flex: 1;
  min-height: 0;
  background: linear-gradient(135deg, var(--brutal-red) 0%, var(--brutal-red) 100%);
  border: $border-width-md solid var(--neo-black);
  border-radius: $radius-md;
  box-shadow: $shadow-md;
  backface-visibility: hidden;
  transition: transform 0.6s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-pattern {
  width: 70%;
  height: 80%;
  border: 3px solid var(--neo-white);
  border-radius: $radius-sm;
  background-image: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 8px,
    rgba(255, 255, 255, 0.1) 8px,
    rgba(255, 255, 255, 0.1) 16px
  );
}
// Card Front
.card-front {
  position: absolute;
  width: 100%;
  flex: 1;
  min-height: 0;
  background: var(--neo-white);
  border: $border-width-md solid var(--neo-black);
  border-radius: $radius-md;
  box-shadow: $shadow-md;
  backface-visibility: hidden;
  transition: transform 0.6s;
  padding: $space-2;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.card-corner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;

  &.top-left {
    align-self: flex-start;
  }

  &.bottom-right {
    align-self: flex-end;
    transform: rotate(180deg);
  }
}

.card-rank {
  font-size: $font-size-lg;
  font-weight: $font-weight-black;
  line-height: 1;

  &.red {
    color: var(--brutal-red);
  }

  &.black {
    color: var(--neo-black);
  }
}

.card-suit {
  font-size: $font-size-base;
  line-height: 1;

  &.red {
    color: var(--brutal-red);
  }

  &.black {
    color: var(--neo-black);
  }
}

.card-suit-center {
  font-size: 48px;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  line-height: 1;

  &.red {
    color: var(--brutal-red);
  }

  &.black {
    color: var(--neo-black);
  }
}
// === BETTING CONTROLS ===
.bet-input-wrapper {
  margin-bottom: $space-4;
}

.quick-bet-chips {
  display: flex;
  gap: $space-2;
  margin-top: $space-3;
  justify-content: space-between;
}

.quick-chip {
  flex: 1;
  aspect-ratio: 1;
  background: linear-gradient(135deg, var(--brutal-yellow) 0%, var(--brutal-yellow) 100%);
  border: $border-width-md solid var(--neo-black);
  border-radius: 50%;
  box-shadow: $shadow-sm;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all $transition-fast;
  position: relative;

  &::before {
    content: "";
    position: absolute;
    inset: 8px;
    border: 2px solid var(--neo-black);
    border-radius: 50%;
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: $shadow-md;
  }

  &:active {
    transform: translateY(-2px);
    box-shadow: $shadow-sm;
  }
}

.chip-value {
  font-size: $font-size-base;
  font-weight: $font-weight-black;
  color: var(--neo-black);
  z-index: 1;
}

.actions-row {
  display: flex;
  gap: $space-3;
  margin-top: $space-4;
}

// === STATISTICS ===
.stat-row {
  display: flex;
  justify-content: space-between;
  padding: $space-3 0;
  border-bottom: $border-width-sm solid var(--border-color);

  &:last-child {
    border-bottom: 0;
  }
}

.stat-label {
  color: var(--text-secondary);
  font-size: $font-size-base;
}

.stat-value {
  font-weight: $font-weight-bold;
  color: var(--text-primary);
  font-size: $font-size-base;

  &.win {
    color: var(--status-success);
  }

  &.loss {
    color: var(--status-error);
  }
}
</style>
