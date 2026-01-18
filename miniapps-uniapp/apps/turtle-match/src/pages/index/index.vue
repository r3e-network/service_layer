<template>
  <AppLayout :title="t('title')" :show-back="true">
    <!-- Header Stats -->
    <view class="game-header">
      <view class="game-header__stat">
        <text class="game-header__label">{{ t('totalSessions') }}</text>
        <text class="game-header__value">{{ stats?.totalSessions || 0 }}</text>
      </view>
      <view class="game-header__stat">
        <text class="game-header__label">{{ t('totalRewards') }}</text>
        <text class="game-header__value">{{ formatGasDisplay(stats?.totalPaid) }}</text>
      </view>
    </view>

    <view v-if="error" class="error-banner">
      <text class="error-text">{{ error }}</text>
    </view>

    <!-- Not Connected -->
    <view v-if="!isConnected" class="connect-prompt">
      <GradientCard>
        <view class="connect-prompt__content">
          <text class="connect-prompt__icon">🐢</text>
          <text class="connect-prompt__title">{{ t('title') }}</text>
          <text class="connect-prompt__desc">{{ t('description') }}</text>
          <NeoButton @click="connect" :loading="loading">{{ t('connectWallet') }}</NeoButton>
        </view>
      </GradientCard>
    </view>

    <!-- Purchase Section -->
    <view v-else-if="!hasActiveSession" class="purchase-section">
      <GradientCard>
        <view class="purchase-section__content">
          <text class="purchase-section__title">{{ t('buyBlindbox') }}</text>
          <text class="purchase-section__price">0.1 {{ t('pricePerBox') }}</text>
          <view class="purchase-section__counter">
            <view class="counter-btn" @click="decreaseCount">-</view>
            <text class="counter-value">{{ boxCount }}</text>
            <view class="counter-btn" @click="increaseCount">+</view>
          </view>
          <view class="purchase-section__total">
            <text>{{ t('totalPrice') }}: {{ totalCost }} GAS</text>
          </view>
          <NeoButton @click="startGame" :loading="loading">{{ t('startGame') }}</NeoButton>
        </view>
      </GradientCard>
    </view>

    <!-- Active Game -->
    <view v-else class="game-area">
      <view class="game-stats">
        <view class="game-stats__item">
          <text class="game-stats__label">{{ t('remainingBoxes') }}</text>
          <text class="game-stats__value">{{ remainingBoxes }}</text>
        </view>
        <view class="game-stats__item">
          <text class="game-stats__label">{{ t('matches') }}</text>
          <text class="game-stats__value">{{ currentMatches }}</text>
        </view>
        <view class="game-stats__item">
          <text class="game-stats__label">{{ t('won') }}</text>
          <text class="game-stats__value--highlight">{{ formatGasDisplay(currentReward) }} GAS</text>
        </view>
      </view>

      <GradientCard class="grid-card">
        <TurtleGrid :gridTurtles="gridTurtles" :matchedPair="matchedPairRef" />
      </GradientCard>

      <view class="game-actions">
        <!-- Playing state - auto-play in progress -->
        <view v-if="gamePhase === 'playing'" class="auto-play-status">
          <text class="auto-play-text">🐢 {{ t('autoOpening') }}</text>
        </view>
        <!-- Settling state - game complete, ready to settle -->
        <NeoButton
          v-else-if="gamePhase === 'settling'"
          @click="finishGame"
          :loading="loading"
        >{{ t('settleRewards') }} ({{ formatGasDisplay(currentReward) }} GAS)</NeoButton>
        <!-- Complete state - show new game button -->
        <NeoButton
          v-else-if="gamePhase === 'complete'"
          @click="newGame"
          variant="secondary"
        >{{ t('newGame') }}</NeoButton>
      </view>
    </view>

    <!-- Animations -->
    <BlindboxOpening
      :visible="showBlindbox"
      :turtleColor="currentTurtleColor"
      @complete="onBlindboxComplete"
    />
    <MatchCelebration
      :visible="showCelebration"
      :turtleColor="matchColor"
      :reward="matchReward"
      @complete="onCelebrationComplete"
    />
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { AppLayout, GradientCard, NeoButton } from "@/shared/components";
import { useTurtleMatch, TurtleColor } from "@/shared/composables/useTurtleMatch";
import { useI18n } from "@/composables/useI18n";
import TurtleGrid from "./components/TurtleGrid.vue";
import BlindboxOpening from "./components/BlindboxOpening.vue";
import MatchCelebration from "./components/MatchCelebration.vue";

// Composables
const { t } = useI18n();
const {
  loading, error, session, localGame, stats,
  isConnected, hasActiveSession, blindboxPrice, gridTurtles,
  connect, startGame: contractStartGame, settleGame, processGameStep, resetLocalGame,
} = useTurtleMatch();

// Animation state
const matchedPairRef = ref<number[]>([]);

// Local state
const boxCount = ref(5);
const showBlindbox = ref(false);
const showCelebration = ref(false);
const currentTurtleColor = ref<TurtleColor>(TurtleColor.Green);
const matchColor = ref<TurtleColor>(TurtleColor.Green);
const matchReward = ref<bigint>(BigInt(0));
const isAutoPlaying = ref(false);
const gamePhase = ref<'idle' | 'playing' | 'settling' | 'complete'>('idle');

// Computed
const totalCost = computed(() => {
  const price = 0.1;
  return (price * boxCount.value).toFixed(1);
});

const remainingBoxes = computed(() => {
  if (!localGame.value || !session.value) return 0;
  return Number(session.value.boxCount) - localGame.value.currentBoxIndex;
});

const currentReward = computed(() => {
  if (!localGame.value) return 0n;
  return localGame.value.totalReward;
});

const currentMatches = computed(() => {
  if (!localGame.value) return 0;
  return localGame.value.totalMatches;
});

// Methods
function formatGasDisplay(value?: bigint): string {
  if (!value) return "0";
  return (Number(value) / 100000000).toFixed(2);
}

function increaseCount() {
  if (boxCount.value < 20) boxCount.value++;
}

function decreaseCount() {
  if (boxCount.value > 3) boxCount.value--;
}

async function startGame() {
  gamePhase.value = 'playing';
  const sessionId = await contractStartGame(boxCount.value);
  if (sessionId) {
    // Start auto-play after a short delay
    setTimeout(() => autoPlay(), 500);
  } else {
    gamePhase.value = 'idle';
  }
}

async function autoPlay() {
  if (!localGame.value || isAutoPlaying.value) return;

  isAutoPlaying.value = true;

  while (!localGame.value.isComplete) {
    // Show blindbox opening animation
    showBlindbox.value = true;

    // Process one game step
    const result = await processGameStep();

    if (result.turtle) {
      currentTurtleColor.value = result.turtle.color;
    }

    // Wait for blindbox animation
    await new Promise(resolve => setTimeout(resolve, 1500));
    showBlindbox.value = false;

    // If there were matches, show celebration
    if (result.matches > 0) {
      matchColor.value = currentTurtleColor.value;
      matchReward.value = result.reward;
      showCelebration.value = true;
      await new Promise(resolve => setTimeout(resolve, 1200));
      showCelebration.value = false;
    }

    // Small delay between boxes
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  isAutoPlaying.value = false;
  gamePhase.value = 'settling';
}

async function finishGame() {
  const success = await settleGame();
  if (success) {
    gamePhase.value = 'complete';
  }
}

function newGame() {
  resetLocalGame();
  gamePhase.value = 'idle';
}

function onBlindboxComplete() {
  showBlindbox.value = false;
}

function onCelebrationComplete() {
  showCelebration.value = false;
}
</script>

<style lang="scss" scoped>
// Header
.game-header {
  display: flex;
  justify-content: space-around;
  padding: 16px;
  margin-bottom: 20px;
}

.game-header__stat {
  text-align: center;
}

.game-header__label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  display: block;
}

.game-header__value {
  font-size: 20px;
  font-weight: bold;
  color: #10B981;
}

.error-banner {
  margin: 0 20px 16px;
  padding: 12px;
  border-radius: 12px;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.35);
  text-align: center;
}

.error-text {
  font-size: 12px;
  font-weight: 600;
  color: #FCA5A5;
}

// Connect Prompt
.connect-prompt {
  padding: 20px;
}

.connect-prompt__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 40px 20px;
}

.connect-prompt__icon {
  font-size: 64px;
}

.connect-prompt__title {
  font-size: 24px;
  font-weight: bold;
  color: #fff;
}

.connect-prompt__desc {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  text-align: center;
}

// Purchase Section
.purchase-section {
  padding: 20px;
}

.purchase-section__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 24px;
}

.purchase-section__title {
  font-size: 20px;
  font-weight: bold;
  color: #fff;
}

.purchase-section__price {
  font-size: 14px;
  color: #10B981;
}

.purchase-section__counter {
  display: flex;
  align-items: center;
  gap: 24px;
}

.counter-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(16, 185, 129, 0.2);
  border: 1px solid rgba(16, 185, 129, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #10B981;
  cursor: pointer;

  &:active {
    background: rgba(16, 185, 129, 0.4);
  }
}

.counter-value {
  font-size: 32px;
  font-weight: bold;
  color: #fff;
  min-width: 60px;
  text-align: center;
}

.purchase-section__total {
  font-size: 16px;
  color: #F59E0B;
}

// Game Area
.game-area {
  padding: 20px;
}

.game-stats {
  display: flex;
  justify-content: space-around;
  margin-bottom: 20px;
}

.game-stats__item {
  text-align: center;
}

.game-stats__label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  display: block;
}

.game-stats__value {
  font-size: 18px;
  font-weight: bold;
  color: #fff;
}

.game-stats__value--highlight {
  font-size: 18px;
  font-weight: bold;
  color: #F59E0B;
}

.grid-card {
  margin-bottom: 20px;
}

.game-actions {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

.auto-play-status {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px 32px;
  background: rgba(16, 185, 129, 0.15);
  border-radius: 12px;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.auto-play-text {
  font-size: 16px;
  color: #10B981;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
