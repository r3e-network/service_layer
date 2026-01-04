<template>
  <AppLayout :title="t('title')" show-top-nav :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <!-- Game Tab -->
    <view v-if="activeTab === 'game'" class="tab-content" id="game-container">
      <!-- 3D Dice Area -->
      <view
        class="dice-arena"
        :class="{ 'arena-rolling': isRolling, 'arena-win': lastResult === 'win', 'arena-loss': lastResult === 'loss' }"
      >
        <!-- Casino Table Pattern -->
        <view class="casino-felt"></view>

        <!-- Celebration Particles -->
        <view v-if="lastResult === 'win'" class="particles">
          <view
            v-for="i in 20"
            :key="i"
            class="particle"
            :style="{ '--delay': i * 0.05 + 's', '--angle': i * 18 + 'deg' }"
          ></view>
        </view>

        <!-- Dice Container -->
        <view class="dice-container">
          <ThreeDDice :value="d1" :rolling="isRolling" />
          <ThreeDDice :value="d2" :rolling="isRolling" />
        </view>

        <!-- Total Display with Enhanced Effects -->
        <view class="total-display-wrapper">
          <text
            class="total-display"
            :class="{
              'win-glow': lastResult === 'win',
              'loss-shake': lastResult === 'loss',
              'rolling-pulse': isRolling,
            }"
          >
            {{ isRolling ? "..." : lastRoll || t("ready") }}
          </text>
          <text v-if="lastResult === 'win'" class="result-label win-label">{{ t("winner") }}!</text>
          <text v-if="lastResult === 'loss'" class="result-label loss-label">{{ t("tryAgain") }}</text>
        </view>
      </view>

      <!-- Prediction Controls -->
      <view class="controls-card">
        <text class="section-title">{{ t("predictOverUnder") }}</text>

        <view class="target-control">
          <view class="target-display">
            <text class="target-label">{{ t("target") }}</text>
            <text class="target-value">{{ target }}</text>
          </view>
          <slider
            :value="target"
            :min="3"
            :max="11"
            @change="target = $event.detail.value"
            activeColor="#00E599"
            backgroundColor="#334155"
            block-color="#fff"
            block-size="24"
          />
        </view>

        <view class="prediction-row">
          <view :class="['prediction-btn', prediction === 'under' && 'active']" @click="prediction = 'under'">
            <text class="pred-label">{{ t("under") }} {{ target }}</text>
            <text class="pred-sub">{{ t("payout") }} {{ calculateMultiplier("under") }}x</text>
          </view>
          <view :class="['prediction-btn', prediction === 'over' && 'active']" @click="prediction = 'over'">
            <text class="pred-label">{{ t("over") }} {{ target }}</text>
            <text class="pred-sub">{{ t("payout") }} {{ calculateMultiplier("over") }}x</text>
          </view>
        </view>

        <!-- Bet Input -->
        <NeoInput v-model="betAmount" type="number" :label="t('betGAS')" :placeholder="t('betGAS')" suffix="GAS" />

        <!-- Roll Button -->
        <NeoButton
          class="roll-button"
          variant="primary"
          size="lg"
          block
          :disabled="isRolling || !canBet"
          :loading="isRolling"
          @click="roll"
        >
          {{ isRolling ? t("rolling") : t("rollDice") }}
        </NeoButton>
      </view>

      <!-- Win Modal -->
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

      <view class="history-list">
        <text class="list-title">{{ t("recentRolls") }}</text>
        <view
          v-for="(roll, idx) in recentRolls"
          :key="idx"
          class="history-item"
          :class="{ 'item-win': roll.won, 'item-loss': !roll.won }"
        >
          <view class="roll-result">
            <!-- Visual Dice Faces -->
            <view class="mini-dice-pair">
              <view class="mini-dice" :data-value="roll.dice1">
                <view v-for="dot in getDiceDots(roll.dice1)" :key="dot" class="mini-dot" :class="`dot-${dot}`"></view>
              </view>
              <view class="mini-dice" :data-value="roll.dice2">
                <view v-for="dot in getDiceDots(roll.dice2)" :key="dot" class="mini-dot" :class="`dot-${dot}`"></view>
              </view>
            </view>
            <view class="roll-info">
              <text class="roll-total">{{ roll.result }}</text>
              <text class="roll-target">{{ roll.prediction === "over" ? ">" : "<" }}{{ roll.target }}</text>
            </view>
          </view>
          <text :class="['roll-outcome', roll.won ? 'win' : 'loss']">
            {{ roll.won ? `+${roll.payout}` : `-${roll.bet}` }} GAS
          </text>
        </view>
      </view>
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
import { createT } from "@/shared/utils/i18n";
import AppLayout from "@/shared/components/AppLayout.vue";
import { NeoButton, NeoInput, NeoModal, NeoStats, NeoDoc, type StatItem } from "@/shared/components";
import ThreeDDice from "@/components/ThreeDDice.vue";

const translations = {
  title: { en: "Dice Game", zh: "骰子游戏" },
  predictOverUnder: { en: "Predict Result", zh: "预测结果" },
  target: { en: "Target", zh: "目标" },
  over: { en: "Over", zh: "大于" },
  under: { en: "Under", zh: "小于" },
  payout: { en: "Payout", zh: "赔率" },
  betGAS: { en: "Bet Amount", zh: "下注数量" },
  rolling: { en: "Rolling...", zh: "掷骰中..." },
  rollDice: { en: "Roll Dice", zh: "掷骰子" },
  ready: { en: "Ready", zh: "准备" },
  youWon: { en: "You Won!", zh: "你赢了！" },
  winner: { en: "WINNER", zh: "赢了" },
  tryAgain: { en: "Try Again", zh: "再试一次" },
  game: { en: "Play", zh: "游戏" },
  stats: { en: "Stats", zh: "统计" },
  docs: { en: "Docs", zh: "文档" },
  statistics: { en: "Statistics", zh: "统计数据" },
  totalGames: { en: "Games", zh: "场次" },
  wins: { en: "Wins", zh: "胜" },
  losses: { en: "Losses", zh: "负" },
  winRate: { en: "Win Rate", zh: "胜率" },
  recentRolls: { en: "Recent History", zh: "最近记录" },
  docSubtitle: { en: "Predictive dice rolling with custom targets.", zh: "带有自定义目标预测的掷骰子游戏。" },
  docDescription: {
    en: "Dice Game lets you customize your risk and reward. Set a target number and predict if the sum of two dice will be over or under that target. Powered by NeoHub's TEE-verified randomness.",
    zh: "骰子游戏让你自定义风险和奖励。设置一个目标数字，并预测两个骰子的总和将大于还是小于该目标。由 NeoHub 的 TEE 验证随机数驱动。",
  },
  step1: { en: "Adjust the slider to set your target sum (3-11).", zh: "调整滑块设置你的目标总和（3-11）。" },
  step2: {
    en: "Choose 'Over' or 'Under' and see the calculated payout.",
    zh: "选择“大于”或“小于”，查看计算出的赔率。",
  },
  step3: { en: "Enter your GAS bet and roll the dice!", zh: "输入你的 GAS 赌注并掷骰子！" },
  feature1Name: { en: "Dynamic Odds", zh: "动态赔率" },
  feature1Desc: { en: "Multipliers are calculated based on mathematical probability.", zh: "根据数学概率计算赔率。" },
  feature2Name: { en: "Dual Dice RNG", zh: "双骰子随机数" },
  feature2Desc: {
    en: "Uses 2 bytes of TEE entropy to ensure independent dice outcomes.",
    zh: "使用 2 字节的 TEE 熵确保独立的骰子结果。",
  },
};

const t = createT(translations);
const APP_ID = "miniapp-dicegame";
const { payGAS } = usePayments(APP_ID);
const { requestRandom } = useRNG(APP_ID);

// Navigation
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

// Game State
const d1 = ref(1);
const d2 = ref(1);
const betAmount = ref("1.0");
const target = ref(7);
const prediction = ref<"over" | "under">("over");
const isRolling = ref(false);
const lastRoll = ref<number | null>(null);
const lastResult = ref<"win" | "loss" | null>(null);
const showWinOverlay = ref(false);
const winAmount = ref("0");

// Stats State
const stats = ref({ totalGames: 0, wins: 0, losses: 0 });
const recentRolls = ref<any[]>([]);

// Computed
const winRate = computed(() => {
  if (stats.value.totalGames === 0) return 0;
  return Math.round((stats.value.wins / stats.value.totalGames) * 100);
});

const gameStats = computed<StatItem[]>(() => [
  { label: t("totalGames"), value: stats.value.totalGames },
  { label: t("wins"), value: stats.value.wins, variant: "success" },
  { label: t("losses"), value: stats.value.losses, variant: "danger" },
  { label: t("winRate"), value: `${winRate.value}%`, variant: "accent" },
]);

const canBet = computed(() => {
  const amt = parseFloat(betAmount.value);
  return amt > 0 && !isNaN(amt);
});

// Helper: Get dice dot positions for visual display
function getDiceDots(value: number): number[] {
  const dotPatterns: Record<number, number[]> = {
    1: [5],
    2: [1, 9],
    3: [1, 5, 9],
    4: [1, 3, 7, 9],
    5: [1, 3, 5, 7, 9],
    6: [1, 3, 4, 6, 7, 9],
  };
  return dotPatterns[value] || [];
}

// Logic
function calculateMultiplier(pred: "over" | "under"): string {
  // Simple probability calc: (36 / combinations) * house_edge (0.98)
  // Over 7: 8,9,10,11,12 -> 5+4+3+2+1 = 15 combos. P = 15/36 = 0.416. Mult = 0.98/0.416 = 2.35
  const ways = {
    under: [0, 0, 0, 1, 3, 6, 10, 15, 21, 26, 30, 33, 35], // Cumulative ways < N (approx)
    // Actually let's just do dynamic
  };

  let winningCombos = 0;
  for (let i = 1; i <= 6; i++) {
    for (let j = 1; j <= 6; j++) {
      const sum = i + j;
      if (pred === "over" && sum > target.value) winningCombos++;
      if (pred === "under" && sum < target.value) winningCombos++;
    }
  }

  if (winningCombos === 0) return "0.00";
  return ((36 / winningCombos) * 0.98).toFixed(2);
}

const roll = async () => {
  if (isRolling.value || !canBet.value) return;

  isRolling.value = true;
  lastResult.value = null;
  showWinOverlay.value = false;

  try {
    // 1. Payment
    await payGAS(betAmount.value, `dice:${prediction.value}:${target.value}`);

    // 2. RNG
    const rng = await requestRandom();

    // 3. Resolve
    const r1 = (parseInt(rng.randomness.slice(0, 2), 16) % 6) + 1;
    const r2 = (parseInt(rng.randomness.slice(2, 4), 16) % 6) + 1;

    // Animate outcome
    d1.value = r1;
    d2.value = r2;
    lastRoll.value = r1 + r2;

    // Check win
    const won = prediction.value === "over" ? lastRoll.value > target.value : lastRoll.value < target.value;

    // Update stats
    stats.value.totalGames++;
    if (won) {
      stats.value.wins++;
      lastResult.value = "win";
      const mult = parseFloat(calculateMultiplier(prediction.value));
      const payout = (parseFloat(betAmount.value) * mult).toFixed(2);
      winAmount.value = payout;
      setTimeout(() => (showWinOverlay.value = true), 500); // Delay for roll animation finish
    } else {
      stats.value.losses++;
      lastResult.value = "loss";
    }

    recentRolls.value.unshift({
      result: lastRoll.value,
      dice1: r1,
      dice2: r2,
      prediction: prediction.value,
      target: target.value,
      won,
      bet: betAmount.value,
      payout: won ? (parseFloat(betAmount.value) * parseFloat(calculateMultiplier(prediction.value))).toFixed(2) : 0,
    });
    if (recentRolls.value.length > 20) recentRolls.value.pop();
  } catch (e: any) {
    console.error(e);
    // uni.showToast not imported but available globally
  } finally {
    setTimeout(() => {
      isRolling.value = false;
    }, 1000); // Ensure animation plays out
  }
};
</script>

<style lang="scss" scoped>
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

// Layout
.tab-content {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  overflow: hidden;

  &.scrollable {
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    padding: $space-4;
  }
}

// Dice Arena - Casino Style
.dice-arena {
  position: relative;
  height: 280px;
  background: var(--bg-secondary);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  perspective: 1000px;
  margin-top: $space-5;
  border-bottom: $border-width-lg solid var(--border-color);
  overflow: hidden;
  transition: background $transition-normal;

  // Casino felt texture
  .casino-felt {
    position: absolute;
    inset: 0;
    background:
      repeating-linear-gradient(
        45deg,
        transparent,
        transparent 10px,
        color-mix(in srgb, var(--neo-green) 3%, transparent) 10px,
        color-mix(in srgb, var(--neo-green) 3%, transparent) 20px
      ),
      radial-gradient(circle at 30% 50%, color-mix(in srgb, var(--neo-green) 15%, transparent) 0%, transparent 50%),
      radial-gradient(circle at 70% 50%, color-mix(in srgb, var(--brutal-yellow) 8%, transparent) 0%, transparent 50%);
    pointer-events: none;
  }

  // Arena states
  &.arena-rolling .casino-felt {
    animation: felt-pulse 0.5s ease-in-out infinite;
  }

  &.arena-win {
    background: radial-gradient(
      circle at center,
      color-mix(in srgb, var(--neo-green) 20%, transparent) 0%,
      var(--bg-secondary) 70%
    );

    .casino-felt {
      background: radial-gradient(
        circle at center,
        color-mix(in srgb, var(--neo-green) 25%, transparent) 0%,
        transparent 60%
      );
    }
  }

  &.arena-loss {
    background: radial-gradient(
      circle at center,
      color-mix(in srgb, var(--brutal-red) 15%, transparent) 0%,
      var(--bg-secondary) 70%
    );
  }
}

// Celebration Particles
.particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 10;
}

.particle {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 8px;
  height: 8px;
  background: var(--neo-green);
  border-radius: 50%;
  animation: particle-burst 1s ease-out forwards;
  animation-delay: var(--delay);
  opacity: 0;
  box-shadow: 0 0 8px var(--neo-green);
}

.dice-container {
  display: flex;
  gap: $space-10;
  z-index: 2;
}

// Total Display
.total-display-wrapper {
  margin-top: $space-6;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-2;
  z-index: 2;
}

.total-display {
  font-size: $font-size-3xl;
  font-weight: $font-weight-black;
  color: var(--text-primary);
  text-shadow: 3px 3px 0 var(--shadow-color);
  transition:
    transform $transition-normal,
    color $transition-normal,
    text-shadow $transition-normal;
  font-family: $font-mono;
  letter-spacing: 2px;

  &.rolling-pulse {
    animation: pulse-scale 0.6s ease-in-out infinite;
  }

  &.win-glow {
    color: var(--neo-green);
    text-shadow:
      0 0 20px color-mix(in srgb, var(--neo-green) 80%, transparent),
      0 0 40px color-mix(in srgb, var(--neo-green) 40%, transparent),
      3px 3px 0 var(--shadow-color);
    transform: scale(1.2);
    animation: win-bounce 0.6s ease-out;
  }

  &.loss-shake {
    color: var(--brutal-red);
    animation: shake 0.5s ease-in-out;
  }
}

.result-label {
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  text-transform: uppercase;
  letter-spacing: 2px;
  animation: fade-in-up 0.4s ease-out;

  &.win-label {
    color: var(--neo-green);
    text-shadow: 0 0 10px color-mix(in srgb, var(--neo-green) 50%, transparent);
  }

  &.loss-label {
    color: var(--brutal-red);
  }
}

// Controls
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

.target-control {
  background: var(--bg-secondary);
  padding: $space-4;
  border: $border-width-md solid var(--border-color);
  box-shadow: $shadow-sm;
}

.target-display {
  display: flex;
  justify-content: space-between;
  margin-bottom: $space-2;

  .target-label {
    color: var(--text-secondary);
    font-weight: $font-weight-semibold;
  }

  .target-value {
    color: var(--neo-green);
    font-weight: $font-weight-black;
    font-size: $font-size-lg;
    font-family: $font-mono;
  }
}

.prediction-row {
  display: flex;
  gap: $space-3;
}

.prediction-btn {
  flex: 1;
  background: var(--bg-secondary);
  border: $border-width-md solid var(--border-color);
  padding: $space-4;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  box-shadow: $shadow-sm;
  transition:
    transform $transition-fast,
    box-shadow $transition-fast,
    border-color $transition-fast;

  &.active {
    background: var(--bg-elevated);
    border-color: var(--neo-green);
    box-shadow: 5px 5px 0 var(--neo-green);

    .pred-label {
      color: var(--neo-green);
    }
  }

  &:active {
    transform: translate(2px, 2px);
    box-shadow: none;
  }
}

.pred-label {
  font-weight: $font-weight-bold;
  font-size: $font-size-base;
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.pred-sub {
  font-size: $font-size-xs;
  color: var(--text-muted);
  margin-top: $space-1;
}

.roll-button {
  margin-top: auto;
}

.win-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.win-emoji {
  font-size: 64px;
  margin-bottom: $space-4;
  animation: bounce 1s infinite;
}

.win-amount {
  color: var(--neo-green);
  font-size: $font-size-3xl;
  font-weight: $font-weight-black;
  font-family: $font-mono;
}

.history-list {
  margin-top: $space-6;
}

.list-title {
  display: block;
  margin-bottom: $space-3;
  color: var(--text-secondary);
  font-weight: $font-weight-bold;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-size: $font-size-sm;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $space-3 $space-4;
  border-bottom: $border-width-sm solid var(--border-color);
  transition: background $transition-fast;

  &:last-child {
    border: none;
  }

  &.item-win {
    background: linear-gradient(
      90deg,
      transparent 0%,
      color-mix(in srgb, var(--neo-green) 5%, transparent) 50%,
      transparent 100%
    );
    border-left: 3px solid var(--neo-green);
  }

  &.item-loss {
    background: linear-gradient(
      90deg,
      transparent 0%,
      color-mix(in srgb, var(--brutal-red) 3%, transparent) 50%,
      transparent 100%
    );
    border-left: 3px solid var(--brutal-red);
  }
}

.roll-result {
  display: flex;
  align-items: center;
  gap: $space-3;
}

// Mini Dice Visualization
.mini-dice-pair {
  display: flex;
  gap: $space-2;
}

.mini-dice {
  width: 32px;
  height: 32px;
  background: var(--bg-elevated);
  border: 2px solid var(--border-color);
  border-radius: $radius-sm;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  padding: 2px;
  box-shadow: $shadow-sm;
}

.mini-dot {
  width: 4px;
  height: 4px;
  background: var(--text-primary);
  border-radius: 50%;

  &.dot-1 {
    grid-area: 1 / 1;
  }
  &.dot-2 {
    grid-area: 1 / 2;
  }
  &.dot-3 {
    grid-area: 1 / 3;
  }
  &.dot-4 {
    grid-area: 2 / 1;
  }
  &.dot-5 {
    grid-area: 2 / 2;
  }
  &.dot-6 {
    grid-area: 2 / 3;
  }
  &.dot-7 {
    grid-area: 3 / 1;
  }
  &.dot-8 {
    grid-area: 3 / 2;
  }
  &.dot-9 {
    grid-area: 3 / 3;
  }
}

.roll-info {
  display: flex;
  flex-direction: column;
  gap: $space-1;
}

.roll-total {
  color: var(--text-primary);
  font-weight: $font-weight-bold;
  font-size: $font-size-lg;
  font-family: $font-mono;
}

.roll-target {
  color: var(--text-muted);
  font-size: $font-size-xs;
  font-family: $font-mono;
}

.roll-outcome {
  font-weight: $font-weight-bold;
  font-family: $font-mono;
  font-size: $font-size-sm;
  white-space: nowrap;

  &.win {
    color: var(--neo-green);
  }
  &.loss {
    color: var(--brutal-red);
  }
}

// Animations
@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes felt-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

@keyframes particle-burst {
  0% {
    transform: translate(0, 0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(calc(cos(var(--angle)) * 150px), calc(sin(var(--angle)) * 150px)) scale(0);
    opacity: 0;
  }
}

@keyframes pulse-scale {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

@keyframes win-bounce {
  0% {
    transform: scale(1);
  }
  30% {
    transform: scale(1.3);
  }
  50% {
    transform: scale(1.15);
  }
  70% {
    transform: scale(1.25);
  }
  100% {
    transform: scale(1.2);
  }
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  10%,
  30%,
  50%,
  70%,
  90% {
    transform: translateX(-5px);
  }
  20%,
  40%,
  60%,
  80% {
    transform: translateX(5px);
  }
}

@keyframes fade-in-up {
  0% {
    opacity: 0;
    transform: translateY(10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
