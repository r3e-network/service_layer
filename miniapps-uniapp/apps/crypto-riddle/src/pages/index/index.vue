<template>
  <view class="app-container">
    <view class="header">
      <text class="title">{{ t("title") }}</text>
      <text class="subtitle">{{ t("subtitle") }}</text>
    </view>
    <view v-if="status" :class="['status-msg', status.type]">
      <text>{{ status.msg }}</text>
    </view>
    <view class="card">
      <view class="stats-row">
        <view class="stat">
          <text class="stat-value">{{ solvedCount }}</text>
          <text class="stat-label">{{ t("solved") }}</text>
        </view>
        <view class="stat">
          <text class="stat-value">{{ totalRewards }}</text>
          <text class="stat-label">{{ t("gasEarned") }}</text>
        </view>
        <view class="stat">
          <text class="stat-value">{{ currentStreak }}</text>
          <text class="stat-label">{{ t("streak") }}</text>
        </view>
      </view>
    </view>
    <view class="card">
      <view class="riddle-header">
        <text class="card-title">{{ t("riddlePrefix") }}{{ currentRiddle.id }}</text>
        <view class="difficulty-badge" :class="currentRiddle.difficulty">
          <text>{{ t(currentRiddle.difficulty) }}</text>
        </view>
      </view>
      <view class="riddle-content">
        <text class="riddle-text">{{ currentRiddle.question }}</text>
      </view>
      <view class="hint-section">
        <text class="hint-label">{{ t("hint") }}</text>
        <text class="hint-text">{{ currentRiddle.hint }}</text>
      </view>
      <view class="reward-info">
        <text>{{ t("reward") }} {{ currentRiddle.reward }} GAS</text>
      </view>
    </view>
    <view class="card">
      <text class="card-title">{{ t("yourAnswer") }}</text>
      <uni-easyinput v-model="userAnswer" :placeholder="t('enterAnswer')" :disabled="isSubmitting" />
      <view class="submit-btn" @click="submitAnswer">
        <text>{{ isSubmitting ? t("checking") : t("submitAnswer") }}</text>
      </view>
    </view>
    <view v-if="showResult" class="result-card" :class="lastResult.correct ? 'correct' : 'wrong'">
      <text class="result-icon">{{ lastResult.correct ? "✅" : "❌" }}</text>
      <text class="result-text">{{ lastResult.message }}</text>
      <view v-if="!lastResult.correct" class="correct-answer">
        <text>{{ t("correctAnswer") }} {{ lastResult.correctAnswer }}</text>
      </view>
      <view class="next-btn" @click="nextRiddle">
        <text>{{ t("nextRiddle") }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useWallet, usePayments } from "@neo/uniapp-sdk";
import { createT } from "@/shared/utils/i18n";

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
};

const t = createT(translations);

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

const nextRiddle = () => {
  currentRiddleIndex.value = (currentRiddleIndex.value + 1) % riddles.length;
  currentRiddle.value = riddles[currentRiddleIndex.value];
  userAnswer.value = "";
  showResult.value = false;
  status.value = null;
};
</script>

<style lang="scss">
@import "@/shared/styles/theme.scss";
.app-container {
  min-height: 100vh;
  background: linear-gradient(135deg, $color-bg-primary 0%, $color-bg-secondary 100%);
  color: #fff;
  padding: 20px;
}
.header {
  text-align: center;
  margin-bottom: 24px;
}
.title {
  font-size: 1.8em;
  font-weight: bold;
  color: $color-gaming;
}
.subtitle {
  color: $color-text-secondary;
  font-size: 0.9em;
  margin-top: 8px;
}
.status-msg {
  text-align: center;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
  &.success {
    background: rgba($color-success, 0.15);
    color: $color-success;
  }
  &.error {
    background: rgba($color-error, 0.15);
    color: $color-error;
  }
}
.card {
  background: $color-bg-card;
  border: 1px solid $color-border;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
}
.card-title {
  color: $color-gaming;
  font-size: 1.1em;
  font-weight: bold;
  display: block;
  margin-bottom: 12px;
}
.stats-row {
  display: flex;
  gap: 12px;
}
.stat {
  flex: 1;
  text-align: center;
  background: rgba($color-gaming, 0.1);
  border-radius: 8px;
  padding: 12px;
}
.stat-value {
  color: $color-gaming;
  font-size: 1.3em;
  font-weight: bold;
  display: block;
}
.stat-label {
  color: $color-text-secondary;
  font-size: 0.8em;
}
.riddle-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.difficulty-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.85em;
  font-weight: bold;
  &.easy {
    background: rgba($color-success, 0.2);
    color: $color-success;
  }
  &.medium {
    background: rgba(#f59e0b, 0.2);
    color: #f59e0b;
  }
  &.hard {
    background: rgba($color-error, 0.2);
    color: $color-error;
  }
}
.riddle-content {
  background: rgba($color-gaming, 0.05);
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 16px;
}
.riddle-text {
  font-size: 1.1em;
  line-height: 1.6;
  color: #fff;
}
.hint-section {
  background: rgba(#f59e0b, 0.1);
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 12px;
}
.hint-label {
  color: #f59e0b;
  font-weight: bold;
  margin-right: 8px;
}
.hint-text {
  color: $color-text-secondary;
}
.reward-info {
  text-align: center;
  color: $color-gaming;
  font-weight: bold;
  padding: 8px;
}
.submit-btn {
  background: linear-gradient(135deg, $color-gaming 0%, darken($color-gaming, 10%) 100%);
  color: #fff;
  padding: 14px;
  border-radius: 12px;
  text-align: center;
  font-weight: bold;
  margin-top: 16px;
}
.result-card {
  border-radius: 16px;
  padding: 24px;
  text-align: center;
  &.correct {
    background: rgba($color-success, 0.15);
    border: 2px solid $color-success;
  }
  &.wrong {
    background: rgba($color-error, 0.15);
    border: 2px solid $color-error;
  }
}
.result-icon {
  font-size: 3em;
  display: block;
  margin-bottom: 12px;
}
.result-text {
  font-size: 1.2em;
  font-weight: bold;
  display: block;
  margin-bottom: 12px;
}
.correct-answer {
  background: rgba(#000, 0.3);
  padding: 12px;
  border-radius: 8px;
  margin: 12px 0;
  color: $color-text-secondary;
}
.next-btn {
  background: $color-gaming;
  color: #fff;
  padding: 12px 24px;
  border-radius: 8px;
  display: inline-block;
  margin-top: 12px;
  font-weight: bold;
}
</style>
