<template>
  <AppLayout :title="t('title')" show-top-nav :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <view v-if="activeTab === 'game'" class="tab-content mystical-bg">
      <!-- Mystical Background Decorations -->
      <view class="cosmic-stars">
        <text class="star star-1">✨</text>
        <text class="star star-2">⭐</text>
        <text class="star star-3">✨</text>
        <text class="star star-4">⭐</text>
        <text class="moon-decoration">🌙</text>
      </view>

      <view v-if="status" :class="['status-msg', status.type]">
        <text>{{ status.msg }}</text>
      </view>

      <NeoCard :title="t('drawYourCards')" variant="accent" class="mystical-card">
        <view class="card-spread-container">
          <view class="spread-labels">
            <text class="spread-label">{{ t("past") }}</text>
            <text class="spread-label">{{ t("present") }}</text>
            <text class="spread-label">{{ t("future") }}</text>
          </view>

          <view class="cards-row">
            <view
              v-for="(card, i) in drawn"
              :key="i"
              :class="['tarot-card', { flipped: card.flipped, 'card-glow': card.flipped }]"
              @click="flipCard(i)"
            >
              <view class="card-inner">
                <!-- Card Front (Revealed) -->
                <view v-if="card.flipped" class="card-front">
                  <view class="card-border-decoration">
                    <text class="corner-star top-left">✦</text>
                    <text class="corner-star top-right">✦</text>
                    <text class="corner-star bottom-left">✦</text>
                    <text class="corner-star bottom-right">✦</text>
                  </view>
                  <text class="card-face">{{ card.icon }}</text>
                  <text class="card-name">{{ card.name }}</text>
                </view>

                <!-- Card Back (Hidden) -->
                <view v-else class="card-back">
                  <view class="card-back-pattern">
                    <text class="pattern-moon">🌙</text>
                    <text class="pattern-stars">✨</text>
                    <text class="pattern-center">🔮</text>
                    <text class="pattern-stars">✨</text>
                  </view>
                </view>
              </view>
            </view>
          </view>
        </view>

        <view class="action-buttons">
          <NeoButton v-if="!hasDrawn" variant="primary" size="lg" block :loading="isLoading" @click="draw">
            {{ t("drawCards") }}
          </NeoButton>
          <NeoButton v-else variant="secondary" size="lg" block @click="reset">
            {{ t("drawAgain") }}
          </NeoButton>
        </view>
      </NeoCard>

      <NeoCard v-if="hasDrawn && allFlipped" :title="t('yourReading')" variant="default" class="reading-card">
        <view class="fortune-container">
          <text class="fortune-icon">🔮</text>
          <text class="reading-text">{{ getReading() }}</text>
          <view class="mystical-divider">
            <text>✦ ✦ ✦</text>
          </view>
        </view>
      </NeoCard>
    </view>

    <view v-if="activeTab === 'stats'" class="tab-content scrollable">
      <NeoCard :title="t('statistics')" variant="default">
        <view class="stat-row">
          <text class="stat-label">{{ t("totalGames") }}</text>
          <text class="stat-value">{{ readingsCount }}</text>
        </view>
        <view class="stat-row">
          <text class="stat-label">{{ t("cardsDrawnCount") }}</text>
          <text class="stat-value">{{ readingsCount * 3 }}</text>
        </view>
        <view class="stat-row">
          <text class="stat-label">{{ t("totalSpent") }}</text>
          <text class="stat-value">{{ readingsCount * 2 }} GAS</text>
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
import { createT } from "@/shared/utils/i18n";
import AppLayout from "@/shared/components/AppLayout.vue";
import NeoDoc from "@/shared/components/NeoDoc.vue";
import NeoButton from "@/shared/components/NeoButton.vue";
import NeoCard from "@/shared/components/NeoCard.vue";

const translations = {
  title: { en: "On-Chain Tarot", zh: "链上塔罗" },
  subtitle: { en: "Blockchain-powered divination", zh: "区块链占卜" },
  drawYourCards: { en: "Draw Your Cards", zh: "抽取您的牌" },
  drawCards: { en: "Draw 3 Cards (2 GAS)", zh: "抽取 3 张牌 (2 GAS)" },
  drawing: { en: "Drawing...", zh: "抽取中..." },
  drawAgain: { en: "Draw Again", zh: "再次抽取" },
  yourReading: { en: "Your Reading", zh: "您的解读" },
  cardsDrawn: { en: "Cards drawn!", zh: "牌已抽取！" },
  drawingCards: { en: "Drawing cards...", zh: "正在抽取牌..." },
  past: { en: "Past", zh: "过去" },
  present: { en: "Present", zh: "现在" },
  future: { en: "Future", zh: "未来" },
  readingText: {
    en: "Your past shows transformation, present reveals balance, and future promises new beginnings. Trust the journey ahead.",
    zh: "您的过去显示转变，现在揭示平衡，未来承诺新的开始。相信前方的旅程。",
  },
  game: { en: "Game", zh: "游戏" },
  stats: { en: "Stats", zh: "统计" },
  statistics: { en: "Statistics", zh: "统计数据" },
  totalGames: { en: "Total Games", zh: "总游戏数" },
  cardsDrawnCount: { en: "Cards Drawn", zh: "抽取卡牌数" },
  totalSpent: { en: "Total Spent", zh: "总花费" },

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
const APP_ID = "miniapp-onchaintarot";
const { address, connect } = useWallet();
const { payGAS, isLoading } = usePayments(APP_ID);
const { requestRandom } = useRNG(APP_ID);

interface Card {
  name: string;
  icon: string;
  flipped: boolean;
}

const tarotDeck = [
  { name: "The Fool", icon: "🃏" },
  { name: "The Magician", icon: "🎩" },
  { name: "The High Priestess", icon: "🔮" },
  { name: "The Empress", icon: "👑" },
  { name: "The Emperor", icon: "⚔️" },
  { name: "The Lovers", icon: "💕" },
  { name: "The Chariot", icon: "🏇" },
  { name: "Strength", icon: "🦁" },
  { name: "The Hermit", icon: "🕯️" },
  { name: "Wheel of Fortune", icon: "☸️" },
  { name: "Justice", icon: "⚖️" },
  { name: "The Hanged Man", icon: "🙃" },
  { name: "Death", icon: "💀" },
  { name: "Temperance", icon: "🍷" },
  { name: "The Devil", icon: "😈" },
  { name: "The Tower", icon: "🗼" },
  { name: "The Star", icon: "⭐" },
  { name: "The Moon", icon: "🌙" },
  { name: "The Sun", icon: "☀️" },
  { name: "Judgement", icon: "📯" },
  { name: "The World", icon: "🌍" },
];

const drawn = ref<Card[]>([]);
const status = ref<{ msg: string; type: string } | null>(null);
const hasDrawn = computed(() => drawn.value.length === 3);
const allFlipped = computed(() => drawn.value.every((c) => c.flipped));
const readingsCount = ref(0);

const draw = async () => {
  if (isLoading.value) return;
  try {
    status.value = { msg: t("drawingCards"), type: "loading" };
    await payGAS("2", `draw:${Date.now()}`);
    const rand = await requestRandom(`tarot:${Date.now()}`);
    const indices = [rand % 22, (rand * 7) % 22, (rand * 13) % 22];
    drawn.value = indices.map((i) => ({ ...tarotDeck[i], flipped: false }));
    readingsCount.value++;
    status.value = { msg: t("cardsDrawn"), type: "success" };
  } catch (e: any) {
    status.value = { msg: e.message || "Error", type: "error" };
  }
};

const flipCard = (index: number) => {
  if (drawn.value[index]) {
    drawn.value[index].flipped = true;
  }
};

const reset = () => {
  drawn.value = [];
  status.value = null;
};

const getReading = () => {
  return t("readingText");
};
</script>

<style lang="scss" scoped>
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.tab-content {
  padding: 12px;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  position: relative;

  &.mystical-bg {
    background: linear-gradient(
      180deg,
      var(--bg-primary) 0%,
      color-mix(in srgb, var(--neo-purple) 5%, transparent) 100%
    );
  }
}

// Cosmic Background Decorations
.cosmic-stars {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.star {
  position: absolute;
  font-size: $font-size-lg;
  opacity: 0.6;
  animation: twinkle 3s ease-in-out infinite;

  &.star-1 {
    top: 10%;
    left: 15%;
    animation-delay: 0s;
  }

  &.star-2 {
    top: 20%;
    right: 20%;
    animation-delay: 1s;
  }

  &.star-3 {
    bottom: 30%;
    left: 10%;
    animation-delay: 2s;
  }

  &.star-4 {
    bottom: 15%;
    right: 15%;
    animation-delay: 1.5s;
  }
}

.moon-decoration {
  position: absolute;
  top: 5%;
  right: 10%;
  font-size: $font-size-3xl;
  opacity: 0.3;
  animation: float 6s ease-in-out infinite;
}

@keyframes twinkle {
  0%,
  100% {
    opacity: 0.3;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.2);
  }
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}
.status-msg {
  text-align: center;
  padding: $space-3;
  margin-bottom: $space-4;
  border: $border-width-md solid var(--border-color);
  box-shadow: $shadow-sm;
  font-weight: $font-weight-bold;
  position: relative;
  z-index: 1;

  &.success {
    background: var(--status-success);
    color: var(--neo-black);
  }

  &.error {
    background: var(--status-error);
    color: var(--neo-white);
  }

  &.loading {
    background: var(--status-info);
    color: var(--neo-black);
  }
}

// Mystical Card Container
.mystical-card {
  position: relative;
  z-index: 1;
}

.card-spread-container {
  margin-bottom: $space-4;
}

.spread-labels {
  display: flex;
  justify-content: space-around;
  margin-bottom: $space-3;
  padding: 0 $space-2;
}

.spread-label {
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: var(--neo-purple);
  text-transform: uppercase;
  letter-spacing: 1px;
}
.cards-row {
  display: flex;
  justify-content: center;
  gap: $space-3;
  margin-bottom: $space-4;
}

// Tarot Card Styling
.tarot-card {
  width: 90px;
  height: 140px;
  perspective: 1000px;
  cursor: pointer;
  transition: transform $transition-normal;

  &:hover {
    transform: translateY(-5px);
  }

  &.card-glow {
    filter: drop-shadow(0 0 8px var(--neo-purple));
  }
}

.card-inner {
  width: 100%;
  flex: 1;
  min-height: 0;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.6s;
}

.card-front,
.card-back {
  width: 100%;
  flex: 1;
  min-height: 0;
  position: absolute;
  backface-visibility: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: $border-width-md solid var(--neo-purple);
  box-shadow: 3px 3px 0 var(--neo-purple);
  background: var(--bg-card);
}

.card-front {
  background: linear-gradient(135deg, var(--bg-card) 0%, color-mix(in srgb, var(--neo-purple) 10%, transparent) 100%);
  position: relative;
  padding: $space-2;
}
.card-back {
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--neo-purple) 20%, transparent) 0%,
    var(--bg-secondary) 100%
  );
}

.card-back-pattern {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-1;
}

.pattern-moon,
.pattern-center {
  font-size: $font-size-2xl;
}

.pattern-stars {
  font-size: $font-size-sm;
}

.pattern-center {
  margin: $space-1 0;
}
.card-face {
  font-size: $font-size-3xl;
  margin-bottom: $space-2;
}

.card-border-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.corner-star {
  position: absolute;
  font-size: $font-size-xs;
  color: var(--brutal-yellow);

  &.top-left {
    top: 4px;
    left: 4px;
  }

  &.top-right {
    top: 4px;
    right: 4px;
  }

  &.bottom-left {
    bottom: 4px;
    left: 4px;
  }

  &.bottom-right {
    bottom: 4px;
    right: 4px;
  }
}

.card-name {
  font-size: $font-size-xs;
  color: var(--neo-purple);
  text-align: center;
  padding: 0 $space-1;
  font-weight: $font-weight-bold;
  text-transform: uppercase;
  line-height: $line-height-tight;
}
// Action Buttons
.action-buttons {
  margin-top: $space-2;
}

// Reading Card
.reading-card {
  position: relative;
  z-index: 1;
}

.fortune-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-3;
}

.fortune-icon {
  font-size: $font-size-3xl;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
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

.reading-text {
  color: var(--text-primary);
  line-height: $line-height-relaxed;
  display: block;
  font-size: $font-size-base;
  text-align: center;
  font-style: italic;
}

.mystical-divider {
  color: var(--brutal-yellow);
  font-size: $font-size-sm;
  margin-top: $space-2;
}
// Stats Section
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
  font-size: $font-size-sm;
}

.stat-value {
  font-weight: $font-weight-bold;
  color: var(--neo-purple);
  font-size: $font-size-base;
}
</style>
