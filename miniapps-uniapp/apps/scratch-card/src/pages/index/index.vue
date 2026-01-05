<template>
  <AppLayout :title="t('title')" show-top-nav :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <view v-if="activeTab === 'game'" class="tab-content">
      <view v-if="status" :class="['status-msg', status.type]">
        <text>{{ status.msg }}</text>
      </view>

      <!-- Main Scratch Card -->
      <view class="scratch-card-container">
        <view class="prize-tiers">
          <view class="tier-item">
            <text class="tier-symbol">⭐</text>
            <text class="tier-label">10 GAS</text>
          </view>
          <view class="tier-item">
            <text class="tier-symbol">💎</text>
            <text class="tier-label">2 GAS</text>
          </view>
          <view class="tier-item">
            <text class="tier-symbol">🪙</text>
            <text class="tier-label">1 GAS</text>
          </view>
        </view>

        <view :class="['scratch-card', { revealed: revealed, scratching: isScratching }]">
          <!-- Scratch Layer (Top) -->
          <view v-if="!revealed" class="scratch-layer" @click="scratch">
            <view class="metallic-overlay"></view>
            <view class="scratch-instruction">
              <text class="scratch-icon">🎫</text>
              <text class="scratch-text">{{ t("tapToScratch") }}</text>
            </view>
          </view>

          <!-- Prize Layer (Bottom) -->
          <view :class="['prize-layer', { win: prize > 0, 'no-win': revealed && prize === 0 }]">
            <view v-if="revealed" class="prize-content">
              <view v-if="prize > 0" class="win-display">
                <text class="prize-symbol">{{ getPrizeSymbol(prize) }}</text>
                <text class="prize-amount">{{ prize }} GAS</text>
                <view class="sparkles">
                  <text class="sparkle">✨</text>
                  <text class="sparkle">✨</text>
                  <text class="sparkle">✨</text>
                </view>
              </view>
              <view v-else class="no-win-display">
                <text class="no-win-icon">😢</text>
                <text class="no-win-text">{{ t("noWin") }}</text>
              </view>
            </view>
            <view v-else class="prize-placeholder">
              <text class="placeholder-text">???</text>
            </view>
          </view>
        </view>

        <view class="buy-btn" @click="buyCard" v-if="revealed || !hasCard">
          <text class="btn-text">{{ isLoading ? t("buying") : t("buyCard") }}</text>
          <text class="btn-icon">🎟️</text>
        </view>
      </view>
    </view>

    <view v-if="activeTab === 'stats'" class="tab-content scrollable">
      <view class="stats-card">
        <text class="stats-title">{{ t("statistics") }}</text>
        <view class="stat-row">
          <text class="stat-label">{{ t("totalGames") }}</text>
          <text class="stat-value">{{ cardsScratched }}</text>
        </view>
        <view class="stat-row">
          <text class="stat-label">{{ t("wonGas") }}</text>
          <text class="stat-value">{{ totalWon }} GAS</text>
        </view>
        <view class="stat-row">
          <text class="stat-label">{{ t("lastPrize") }}</text>
          <text class="stat-value">{{ revealed ? `${prize} GAS` : "-" }}</text>
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

    <!-- Win Celebration Modal -->
    <view v-if="showCelebration" class="celebration-modal" @click="showCelebration = false">
      <view class="celebration-content">
        <text class="celebration-title">🎉 {{ t("congratulations") }} 🎉</text>
        <text class="celebration-prize">{{ prize }} GAS</text>
        <view class="celebration-sparkles">
          <text class="big-sparkle">✨</text>
          <text class="big-sparkle">⭐</text>
          <text class="big-sparkle">✨</text>
        </view>
      </view>
    </view>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useWallet, usePayments, useRNG } from "@neo/uniapp-sdk";
import { createT } from "@/shared/utils/i18n";
import AppLayout from "@/shared/components/AppLayout.vue";
import NeoDoc from "@/shared/components/NeoDoc.vue";

const translations = {
  title: { en: "Scratch Card", zh: "刮刮卡" },
  subtitle: { en: "Instant win prizes", zh: "即时赢取奖品" },
  tapToScratch: { en: "Tap to Scratch", zh: "点击刮开" },
  prizeWin: { en: "🎉 {0} GAS!", zh: "🎉 {0} GAS！" },
  noWin: { en: "No Win", zh: "未中奖" },
  buying: { en: "Buying...", zh: "购买中..." },
  buyCard: { en: "Buy Card (1 GAS)", zh: "购买卡片 (1 GAS)" },
  yourStats: { en: "Your Stats", zh: "您的统计" },
  scratched: { en: "Scratched", zh: "已刮开" },
  wonGas: { en: "Won (GAS)", zh: "赢得 (GAS)" },
  cardPurchased: { en: "Card purchased!", zh: "卡片已购买！" },
  error: { en: "Error", zh: "错误" },
  game: { en: "Game", zh: "游戏" },
  stats: { en: "Stats", zh: "统计" },
  statistics: { en: "Statistics", zh: "统计数据" },
  totalGames: { en: "Total Games", zh: "总游戏数" },
  lastPrize: { en: "Last Prize", zh: "最近奖品" },
  congratulations: { en: "CONGRATULATIONS!", zh: "恭喜中奖！" },

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

const APP_ID = "miniapp-scratchcard";
const { address, connect } = useWallet();
const { payGAS, isLoading } = usePayments(APP_ID);
const { requestRandom } = useRNG(APP_ID);

const hasCard = ref(false);
const revealed = ref(false);
const prize = ref(0);
const cardsScratched = ref(0);
const totalWon = ref(0);
const status = ref<{ msg: string; type: string } | null>(null);
const isScratching = ref(false);
const showCelebration = ref(false);

const getPrizeSymbol = (prizeAmount: number): string => {
  if (prizeAmount >= 10) return "⭐";
  if (prizeAmount >= 2) return "💎";
  if (prizeAmount >= 1) return "🪙";
  return "";
};

const buyCard = async () => {
  if (isLoading.value) return;
  try {
    await payGAS("1", "scratchcard:buy");
    hasCard.value = true;
    revealed.value = false;
    prize.value = 0;
    showCelebration.value = false;
    status.value = { msg: t("cardPurchased"), type: "success" };
  } catch (e: any) {
    status.value = { msg: e.message || t("error"), type: "error" };
  }
};

const scratch = async () => {
  if (!hasCard.value || revealed.value || isScratching.value) return;

  isScratching.value = true;

  try {
    const rng = await requestRandom();
    const val = parseInt(rng.randomness.slice(0, 4), 16) % 100;
    prize.value = val < 5 ? 10 : val < 20 ? 2 : val < 40 ? 1 : 0;

    // Delay reveal for animation
    setTimeout(() => {
      revealed.value = true;
      cardsScratched.value++;
      if (prize.value > 0) {
        totalWon.value += prize.value;
        setTimeout(() => {
          showCelebration.value = true;
        }, 300);
      }
      hasCard.value = false;
      isScratching.value = false;
    }, 600);
  } catch (e: any) {
    status.value = { msg: e.message || "Error", type: "error" };
    isScratching.value = false;
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
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
}

.status-msg {
  text-align: center;
  padding: $space-3;
  border: $border-width-md solid var(--border-color);
  box-shadow: $shadow-md;
  margin-bottom: $space-4;
  font-weight: $font-weight-bold;
  text-transform: uppercase;

  &.success {
    background: var(--status-success);
    color: $neo-black;
    border-color: $neo-black;
  }

  &.error {
    background: var(--status-error);
    color: $neo-white;
    border-color: $neo-black;
  }
}

// === SCRATCH CARD CONTAINER ===

.scratch-card-container {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.prize-tiers {
  display: flex;
  justify-content: space-around;
  gap: $space-2;
  padding: $space-3;
  background: var(--bg-card);
  border: $border-width-md solid var(--border-color);
  box-shadow: $shadow-md;
}

.tier-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-1;
}

.tier-symbol {
  font-size: $font-size-2xl;
  line-height: 1;
}

.tier-label {
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  color: var(--text-secondary);
  text-transform: uppercase;
}

// === SCRATCH CARD ===

.scratch-card {
  position: relative;
  width: 100%;
  aspect-ratio: 1.6;
  border: $border-width-lg solid var(--border-color);
  box-shadow: $shadow-lg;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  background: var(--bg-card);

  &.scratching {
    animation: shake 0.3s ease-in-out;
  }

  &.revealed {
    .scratch-layer {
      animation: scratchOff 0.6s ease-out forwards;
    }
  }
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-4px) rotate(-1deg);
  }
  75% {
    transform: translateX(4px) rotate(1deg);
  }
}

@keyframes scratchOff {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.05);
  }
  100% {
    opacity: 0;
    transform: scale(1.1);
    pointer-events: none;
  }
}

// === SCRATCH LAYER (Top) ===

.scratch-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  flex: 1;
  min-height: 0;
  z-index: 2;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(
    135deg,
    var(--text-secondary) 0%,
    var(--bg-elevated) 25%,
    var(--text-secondary) 50%,
    var(--bg-elevated) 75%,
    var(--text-secondary) 100%
  );
  transition: transform $transition-fast;

  &:active {
    transform: scale(0.98);
  }
}

.metallic-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  flex: 1;
  min-height: 0;
  background: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 10px,
    rgba(255, 255, 255, 0.1) 10px,
    rgba(255, 255, 255, 0.1) 20px
  );
  pointer-events: none;
}

.scratch-instruction {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-2;
  z-index: 1;
}

.scratch-icon {
  font-size: $font-size-4xl;
  animation: bounce 2s ease-in-out infinite;
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

.scratch-text {
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
  color: $neo-black;
  text-transform: uppercase;
  text-shadow: 1px 1px 0 rgba(255, 255, 255, 0.5);
}

// === PRIZE LAYER (Bottom) ===

.prize-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  flex: 1;
  min-height: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);

  &.win {
    background: linear-gradient(135deg, var(--brutal-yellow) 0%, var(--brutal-orange) 100%);
  }

  &.no-win {
    background: var(--bg-elevated);
  }
}

.prize-placeholder {
  font-size: $font-size-4xl;
  font-weight: $font-weight-black;
  color: var(--text-muted);
  opacity: 0.3;
}

.prize-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: revealPrize 0.5s ease-out;
}

@keyframes revealPrize {
  0% {
    opacity: 0;
    transform: scale(0.5);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

// === WIN DISPLAY ===

.win-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-2;
}

.prize-symbol {
  font-size: 80px;
  line-height: 1;
  animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.prize-amount {
  font-size: $font-size-3xl;
  font-weight: $font-weight-black;
  color: $neo-black;
  text-transform: uppercase;
  text-shadow: 2px 2px 0 rgba(255, 255, 255, 0.5);
}

.sparkles {
  display: flex;
  gap: $space-3;
  margin-top: $space-2;
}

.sparkle {
  font-size: $font-size-xl;
  animation: sparkle 1s ease-in-out infinite;

  &:nth-child(2) {
    animation-delay: 0.2s;
  }

  &:nth-child(3) {
    animation-delay: 0.4s;
  }
}

@keyframes sparkle {
  0%,
  100% {
    opacity: 0.3;
    transform: scale(0.8) rotate(0deg);
  }
  50% {
    opacity: 1;
    transform: scale(1.2) rotate(180deg);
  }
}

// === NO WIN DISPLAY ===

.no-win-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-2;
}

.no-win-icon {
  font-size: 60px;
  line-height: 1;
  opacity: 0.6;
}

.no-win-text {
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  color: var(--text-secondary);
  text-transform: uppercase;
}

// === BUY BUTTON ===

.buy-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $space-2;
  background: var(--neo-green);
  color: $neo-black;
  padding: $space-4;
  border: $border-width-md solid $neo-black;
  box-shadow: $shadow-md;
  font-weight: $font-weight-bold;
  cursor: pointer;
  transition: transform $transition-fast;

  &:active {
    transform: translate(3px, 3px);
    box-shadow: none;
  }
}

.btn-text {
  font-size: $font-size-lg;
  text-transform: uppercase;
}

.btn-icon {
  font-size: $font-size-xl;
}

// === STATS CARD ===

.stats-card {
  background: var(--bg-card);
  border: $border-width-md solid var(--border-color);
  box-shadow: $shadow-md;
  padding: $space-4;
  margin-bottom: $space-3;
}

.stats-title {
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
  color: var(--neo-green);
  margin-bottom: $space-3;
  display: block;
  text-transform: uppercase;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  padding: $space-2 0;
  border-bottom: $border-width-sm solid var(--border-color);

  &:last-child {
    border-bottom: 0;
  }
}

.stat-label {
  color: var(--text-secondary);
}

.stat-value {
  font-weight: $font-weight-bold;
  color: var(--text-primary);
}

// === CELEBRATION MODAL ===

.celebration-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  flex: 1;
  min-height: 0;
  z-index: $z-modal;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.celebration-content {
  background: linear-gradient(135deg, var(--brutal-yellow) 0%, var(--brutal-orange) 100%);
  border: $border-width-lg solid $neo-black;
  box-shadow: $shadow-xl;
  padding: $space-8;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-4;
  animation: celebrationPop 0.5s ease-out;
}

@keyframes celebrationPop {
  0% {
    transform: scale(0.5) rotate(-10deg);
    opacity: 0;
  }
  50% {
    transform: scale(1.1) rotate(5deg);
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}

.celebration-title {
  font-size: $font-size-2xl;
  font-weight: $font-weight-black;
  color: $neo-black;
  text-transform: uppercase;
  text-align: center;
}

.celebration-prize {
  font-size: $font-size-4xl;
  font-weight: $font-weight-black;
  color: $neo-black;
  text-shadow: 2px 2px 0 rgba(255, 255, 255, 0.5);
}

.celebration-sparkles {
  display: flex;
  gap: $space-4;
}

.big-sparkle {
  font-size: 40px;
  animation: bigSparkle 1s ease-in-out infinite;

  &:nth-child(2) {
    animation-delay: 0.3s;
  }

  &:nth-child(3) {
    animation-delay: 0.6s;
  }
}

@keyframes bigSparkle {
  0%,
  100% {
    transform: scale(1) rotate(0deg);
  }
  50% {
    transform: scale(1.5) rotate(360deg);
  }
}
</style>
