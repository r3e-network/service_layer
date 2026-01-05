<template>
  <AppLayout :title="t('title')" show-top-nav :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <view v-if="activeTab === 'game'" class="tab-content">
      <view v-if="status" :class="['status-msg', status.type]">
        <text>{{ status.msg }}</text>
      </view>
      <NeoStats :stats="gameStats" />

      <!-- Mystery Riddle Card with Question Mark Decorations -->
      <NeoCard variant="accent" class="mystery-card">
        <view class="mystery-decorations">
          <text class="question-mark top-left">?</text>
          <text class="question-mark top-right">?</text>
          <text class="question-mark bottom-left">?</text>
          <text class="question-mark bottom-right">?</text>
        </view>

        <view class="riddle-header">
          <text class="card-title">{{ t("riddlePrefix") }}{{ currentRiddle.id }}</text>
          <view class="difficulty-badge" :class="currentRiddle.difficulty">
            <text>{{ t(currentRiddle.difficulty) }}</text>
          </view>
        </view>

        <!-- Riddle Content with Reveal Animation -->
        <view class="riddle-content reveal-animation">
          <view class="riddle-icon">
            <text class="puzzle-emoji">🧩</text>
          </view>
          <text class="riddle-text">{{ currentRiddle.question }}</text>
        </view>

        <!-- Hint System with Toggle -->
        <view class="hint-container">
          <view v-if="!hintRevealed" class="hint-locked" @click="revealHint">
            <text class="hint-icon">💡</text>
            <text class="hint-prompt">{{ t("clickForHint") }}</text>
          </view>
          <view v-else class="hint-section hint-revealed">
            <text class="hint-icon">💡</text>
            <view class="hint-content">
              <text class="hint-label">{{ t("hint") }}</text>
              <text class="hint-text">{{ currentRiddle.hint }}</text>
            </view>
          </view>
        </view>

        <!-- Prize Display -->
        <view class="prize-display">
          <text class="prize-icon">🏆</text>
          <text class="prize-text">{{ t("reward") }} {{ currentRiddle.reward }} GAS</text>
        </view>
      </NeoCard>

      <!-- Answer Input Card -->
      <NeoCard class="answer-card">
        <text class="card-title">{{ t("yourAnswer") }}</text>
        <NeoInput v-model="userAnswer" :placeholder="t('enterAnswer')" :disabled="isSubmitting" />
        <NeoButton variant="primary" size="lg" block :loading="isSubmitting" @click="submitAnswer">
          {{ isSubmitting ? t("checking") : t("submitAnswer") }}
        </NeoButton>
      </NeoCard>

      <!-- Result Card with Animation -->
      <NeoCard v-if="showResult" :variant="lastResult.correct ? 'success' : 'danger'" class="result-card">
        <view class="result-content">
          <text class="result-icon pulse-animation">{{ lastResult.correct ? "✅" : "❌" }}</text>
          <text class="result-text">{{ lastResult.message }}</text>
          <view v-if="!lastResult.correct" class="correct-answer">
            <text>{{ t("correctAnswer") }} {{ lastResult.correctAnswer }}</text>
          </view>
          <NeoButton variant="primary" size="lg" block @click="nextRiddle">
            {{ t("nextRiddle") }}
          </NeoButton>
        </view>
      </NeoCard>
    </view>

    <view v-if="activeTab === 'stats'" class="tab-content scrollable">
      <NeoCard title="Statistics">
        <view class="stat-row">
          <text class="stat-label">{{ t("totalGames") }}</text>
          <text class="stat-value">{{ solvedCount }}</text>
        </view>
        <view class="stat-row">
          <text class="stat-label">{{ t("gasEarned") }}</text>
          <text class="stat-value">{{ totalRewards }} GAS</text>
        </view>
        <view class="stat-row">
          <text class="stat-label">{{ t("streak") }}</text>
          <text class="stat-value">{{ currentStreak }}</text>
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
import { useWallet, usePayments } from "@neo/uniapp-sdk";
import { createT } from "@/shared/utils/i18n";
import AppLayout from "@/shared/components/AppLayout.vue";
import NeoDoc from "@/shared/components/NeoDoc.vue";
import NeoButton from "@/shared/components/NeoButton.vue";
import NeoInput from "@/shared/components/NeoInput.vue";
import NeoCard from "@/shared/components/NeoCard.vue";
import NeoStats from "@/shared/components/NeoStats.vue";
import type { StatItem } from "@/shared/components/NeoStats.vue";

const translations = {
  title: { en: "Crypto Riddle", zh: "加密谜题" },
  subtitle: { en: "Solve puzzles, earn rewards", zh: "解谜题，赚奖励" },
  solved: { en: "Solved", zh: "已解决" },
  gasEarned: { en: "GAS Earned", zh: "已赚取 GAS" },
  streak: { en: "Streak", zh: "连胜" },
  riddlePrefix: { en: "Riddle #", zh: "谜题 #" },
  hint: { en: "Hint:", zh: "提示：" },
  reward: { en: "Reward:", zh: "奖励：" },
  yourAnswer: { en: "Your Answer", zh: "你的答案" },
  enterAnswer: { en: "Enter your answer...", zh: "输入你的答案..." },
  checking: { en: "Checking...", zh: "检查中..." },
  submitAnswer: { en: "Submit Answer", zh: "提交答案" },
  nextRiddle: { en: "Next Riddle", zh: "下一题" },
  pleaseEnterAnswer: { en: "Please enter an answer", zh: "请输入答案" },
  correctEarned: { en: "Correct! You earned", zh: "正确！你赚取了" },
  brilliant: { en: "Brilliant! Keep going!", zh: "太棒了！继续加油！" },
  notQuite: { en: "Not quite right. Try again!", zh: "不太对。再试一次！" },
  wrongAnswer: { en: "Wrong answer. Study the hint!", zh: "答案错误。仔细看提示！" },
  correctAnswer: { en: "Correct answer:", zh: "正确答案：" },
  clickForHint: { en: "Click to reveal hint", zh: "点击查看提示" },
  easy: { en: "easy", zh: "简单" },
  medium: { en: "medium", zh: "中等" },
  hard: { en: "hard", zh: "困难" },
  riddle1: {
    en: "I am the first, yet I am everywhere. Without me, nothing can be verified. What am I?",
    zh: "我是第一个，但我无处不在。没有我，什么都无法验证。我是什么？",
  },
  riddle1Hint: { en: "Think about blockchain fundamentals", zh: "想想区块链基础" },
  riddle2: {
    en: "I have keys but no locks. I have space but no room. You can enter, but can't go outside. What am I?",
    zh: "我有键但没有锁。我有空间但没有房间。你可以进入，但不能出去。我是什么？",
  },
  riddle2Hint: { en: "Used for typing crypto addresses", zh: "用于输入加密地址" },
  riddle3: {
    en: "What has 256 bits, starts with many zeros, and miners race to find me?",
    zh: "什么有256位，以许多零开头，矿工们竞相寻找我？",
  },
  riddle3Hint: { en: "Proof of Work concept", zh: "工作量证明概念" },
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
const APP_ID = "miniapp-crypto-riddle";
const { address, connect } = useWallet();
const { payGAS } = usePayments(APP_ID);

const solvedCount = ref(0);
const totalRewards = ref(0);
const currentStreak = ref(0);
const userAnswer = ref("");
const isSubmitting = ref(false);
const showResult = ref(false);
const status = ref<{ msg: string; type: string } | null>(null);
const hintRevealed = ref(false);

const riddles = [
  {
    id: 1,
    question: t("riddle1"),
    answer: "hash",
    hint: t("riddle1Hint"),
    difficulty: "easy",
    reward: 1.0,
  },
  {
    id: 2,
    question: t("riddle2"),
    answer: "keyboard",
    hint: t("riddle2Hint"),
    difficulty: "easy",
    reward: 1.0,
  },
  {
    id: 3,
    question: t("riddle3"),
    answer: "nonce",
    hint: t("riddle3Hint"),
    difficulty: "medium",
    reward: 2.0,
  },
];

const currentRiddleIndex = ref(0);
const currentRiddle = ref(riddles[0]);

const lastResult = ref({
  correct: false,
  message: "",
  correctAnswer: "",
});

const submitAnswer = async () => {
  if (isSubmitting.value || !userAnswer.value.trim()) {
    status.value = { msg: t("pleaseEnterAnswer"), type: "error" };
    return;
  }

  isSubmitting.value = true;
  const answer = userAnswer.value.trim().toLowerCase();
  const correct = answer === currentRiddle.value.answer.toLowerCase();

  await new Promise((resolve) => setTimeout(resolve, 800));

  if (correct) {
    solvedCount.value++;
    totalRewards.value = parseFloat((totalRewards.value + currentRiddle.value.reward).toFixed(2));
    currentStreak.value++;
    lastResult.value = {
      correct: true,
      message: `${t("correctEarned")} ${currentRiddle.value.reward} GAS`,
      correctAnswer: "",
    };
    status.value = { msg: t("brilliant"), type: "success" };
  } else {
    currentStreak.value = 0;
    lastResult.value = {
      correct: false,
      message: t("notQuite"),
      correctAnswer: currentRiddle.value.answer,
    };
    status.value = { msg: t("wrongAnswer"), type: "error" };
  }

  showResult.value = true;
  isSubmitting.value = false;
};

const revealHint = () => {
  hintRevealed.value = true;
};

const nextRiddle = () => {
  currentRiddleIndex.value = (currentRiddleIndex.value + 1) % riddles.length;
  currentRiddle.value = riddles[currentRiddleIndex.value];
  userAnswer.value = "";
  showResult.value = false;
  status.value = null;
  hintRevealed.value = false;
};

const gameStats = computed<StatItem[]>(() => [
  { label: t("solved"), value: solvedCount.value, variant: "accent" },
  { label: t("gasEarned"), value: totalRewards.value, variant: "success" },
  { label: t("streak"), value: currentStreak.value, variant: "warning" },
]);
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

.status-msg {
  text-align: center;
  padding: $space-3;
  border: $border-width-md solid var(--border-color);
  font-weight: $font-weight-bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  &.success {
    background: var(--status-success);
    color: $neo-black;
    box-shadow: $shadow-sm;
  }

  &.error {
    background: var(--status-error);
    color: $neo-white;
    box-shadow: $shadow-sm;
  }
}

.card-title {
  color: var(--neo-green);
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
  display: block;
  margin-bottom: $space-3;
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* Mystery Card with Question Mark Decorations */
.mystery-card {
  position: relative;
  overflow: visible;
}

.mystery-decorations {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 1;
}

.question-mark {
  position: absolute;
  font-size: $font-size-4xl;
  font-weight: $font-weight-bold;
  color: var(--brutal-blue);
  opacity: 0.15;
  animation: float 3s ease-in-out infinite;

  &.top-left {
    top: -10px;
    left: -10px;
    animation-delay: 0s;
  }

  &.top-right {
    top: -10px;
    right: -10px;
    animation-delay: 0.5s;
  }

  &.bottom-left {
    bottom: -10px;
    left: -10px;
    animation-delay: 1s;
  }

  &.bottom-right {
    bottom: -10px;
    right: -10px;
    animation-delay: 1.5s;
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

.riddle-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $space-4;
  position: relative;
  z-index: 2;
}

.difficulty-badge {
  padding: $space-1 $space-3;
  border: $border-width-sm solid var(--border-color);
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  text-transform: uppercase;
  letter-spacing: 1px;

  &.easy {
    background: var(--status-success);
    color: $neo-black;
  }

  &.medium {
    background: var(--brutal-yellow);
    color: $neo-black;
  }

  &.hard {
    background: var(--status-error);
    color: $neo-white;
  }
}

/* Riddle Content with Reveal Animation */
.riddle-content {
  background: var(--bg-secondary);
  padding: $space-5;
  border: $border-width-md solid var(--border-color);
  margin-bottom: $space-4;
  position: relative;
  z-index: 2;
}

.reveal-animation {
  animation: revealCard 0.6s ease-out;
}

@keyframes revealCard {
  0% {
    opacity: 0;
    transform: scale(0.95);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.riddle-icon {
  text-align: center;
  margin-bottom: $space-3;
}

.puzzle-emoji {
  font-size: $font-size-4xl;
  display: block;
}

.riddle-text {
  font-size: $font-size-lg;
  line-height: $line-height-relaxed;
  color: var(--text-primary);
  font-weight: $font-weight-medium;
  text-align: center;
}

/* Hint System with Toggle */
.hint-container {
  margin-bottom: $space-4;
  position: relative;
  z-index: 2;
}

.hint-locked {
  background: var(--brutal-blue);
  padding: $space-4;
  border: $border-width-md solid var(--border-color);
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-2;

  &:active {
    transform: scale(0.98);
    box-shadow: $shadow-sm;
  }
}

.hint-icon {
  font-size: $font-size-3xl;
  display: block;
}

.hint-prompt {
  color: $neo-white;
  font-weight: $font-weight-bold;
  text-transform: uppercase;
  font-size: $font-size-sm;
  letter-spacing: 0.5px;
}

.hint-section {
  background: var(--brutal-yellow);
  padding: $space-4;
  border: $border-width-md solid var(--border-color);
  display: flex;
  align-items: flex-start;
  gap: $space-3;

  &.hint-revealed {
    animation: slideDown 0.4s ease-out;
  }
}

@keyframes slideDown {
  0% {
    opacity: 0;
    max-height: 0;
    padding-top: 0;
    padding-bottom: 0;
  }
  100% {
    opacity: 1;
    max-height: 200px;
    padding-top: $space-4;
    padding-bottom: $space-4;
  }
}

.hint-content {
  flex: 1;
}

.hint-label {
  color: $neo-black;
  font-weight: $font-weight-bold;
  margin-right: $space-2;
  text-transform: uppercase;
  font-size: $font-size-sm;
  display: block;
  margin-bottom: $space-1;
}

.hint-text {
  color: $neo-black;
  font-weight: $font-weight-medium;
  display: block;
}

/* Prize Display */
.prize-display {
  text-align: center;
  background: var(--neo-green);
  color: $neo-black;
  font-weight: $font-weight-bold;
  padding: $space-3;
  border: $border-width-md solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $space-2;
  position: relative;
  z-index: 2;
}

.prize-icon {
  font-size: $font-size-2xl;
}

.prize-text {
  font-size: $font-size-base;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Result Card with Animation */
.result-card {
  animation: slideUp 0.5s ease-out;
}

@keyframes slideUp {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.result-content {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.result-icon {
  font-size: $font-size-4xl;
  display: block;
}

.pulse-animation {
  animation: pulse 0.6s ease-in-out;
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
}

.result-text {
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  display: block;
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.correct-answer {
  background: var(--bg-secondary);
  padding: $space-3;
  border: $border-width-sm solid var(--border-color);
  color: var(--text-secondary);
  font-weight: $font-weight-medium;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  padding: $space-3 0;
  border-bottom: $border-width-sm solid var(--border-color);

  &:last-child {
    border-bottom: 0;
  }

  .stat-label {
    color: var(--text-secondary);
    font-weight: $font-weight-medium;
    text-transform: uppercase;
    font-size: $font-size-sm;
    letter-spacing: 0.5px;
  }

  .stat-value {
    font-weight: $font-weight-bold;
    color: var(--neo-green);
    font-size: $font-size-lg;
  }
}
</style>
