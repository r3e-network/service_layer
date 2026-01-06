<template>
  <AppLayout :title="t('title')" show-top-nav :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <view v-if="activeTab === 'game'" class="tab-content">
      <NeoCard v-if="status" :variant="status.type === 'error' ? 'danger' : 'success'" class="mb-4 text-center">
        <text class="font-bold">{{ status.msg }}</text>
      </NeoCard>
      <NeoStats :stats="gameStats" />

      <!-- Mystery Riddle Card with Question Mark Decorations -->
      <NeoCard v-if="currentRiddle" variant="accent" class="mystery-card">
        <view class="mystery-decorations">
          <text class="question-mark top-left">?</text>
          <text class="question-mark top-right">?</text>
          <text class="question-mark bottom-left">?</text>
          <text class="question-mark bottom-right">?</text>
        </view>

        <view class="riddle-header">
          <text class="card-title">{{ t("riddlePrefix") }}{{ currentRiddle.id }}</text>
          <view class="difficulty-badge" :class="currentRiddle.solved ? 'solved' : 'open'">
            <text>{{ currentRiddle.solved ? t("solved") : t("unsolved") }}</text>
          </view>
        </view>

        <!-- Riddle Content with Reveal Animation -->
        <view class="riddle-content reveal-animation">
          <view class="riddle-icon">
            <text class="puzzle-emoji">🧩</text>
          </view>
          <text class="riddle-text">{{ currentRiddle.hint }}</text>
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
              <text class="hint-text">{{ t("noExtraHint") }}</text>
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
      <NeoCard v-if="currentRiddle" :title="t('yourAnswer')" class="answer-card-brutal">
        <view class="p-4 bg-white border-4 border-black mb-4">
          <NeoInput v-model="userAnswer" :placeholder="t('enterAnswer')" :disabled="isSubmitting" class="brutal-input" />
        </view>
        <NeoButton variant="primary" size="lg" block :loading="isSubmitting" @click="submitAnswer" class="brutal-action-btn">
          <text class="font-black italic uppercase">{{ isSubmitting ? t("checking") : t("submitAnswer") }}</text>
        </NeoButton>
      </NeoCard>

      <NeoCard v-if="!currentRiddle" :title="t('noRiddles')"> </NeoCard>

      <!-- Result Card with Animation -->
      <NeoCard v-if="showResult" :variant="lastResult.correct ? 'success' : 'danger'" class="result-card">
        <view class="result-content">
          <text class="result-icon pulse-animation">{{ lastResult.correct ? "✅" : "❌" }}</text>
          <text class="result-text">{{ lastResult.message }}</text>
          <NeoButton variant="primary" size="lg" block @click="nextRiddle">
            {{ t("nextRiddle") }}
          </NeoButton>
        </view>
      </NeoCard>
    </view>

    <view v-if="activeTab === 'create'" class="tab-content scrollable">
      <NeoCard :title="t('createRiddle')">
        <NeoInput v-model="newRiddle.prompt" :placeholder="t('promptPlaceholder')" />
        <NeoInput v-model="newRiddle.answer" :placeholder="t('answerPlaceholder')" />
        <NeoInput v-model="newRiddle.reward" type="number" :placeholder="t('rewardPlaceholder')" suffix="GAS" />
        <NeoButton variant="primary" size="lg" block :loading="isCreating" @click="createRiddle">
          {{ isCreating ? t("creating") : t("submitRiddle") }}
        </NeoButton>
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
import { ref, computed, onMounted } from "vue";
import { useWallet, usePayments, useEvents } from "@neo/uniapp-sdk";
import { parseInvokeResult, parseStackItem } from "@/shared/utils/neo";
import { sha256Hex } from "@/shared/utils/hash";
import { createT } from "@/shared/utils/i18n";
import { AppLayout, NeoDoc, NeoButton, NeoInput, NeoCard, NeoStats, type StatItem } from "@/shared/components";

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
  correctEarned: { en: "Correct!", zh: "正确！" },
  notQuite: { en: "Not quite right. Try again!", zh: "不太对。再试一次！" },
  clickForHint: { en: "Click to reveal hint", zh: "点击查看提示" },
  noExtraHint: { en: "No additional hint available.", zh: "暂无额外提示。" },
  noRiddles: { en: "No riddles yet. Create one!", zh: "暂无谜题，创建一个吧！" },
  createRiddle: { en: "Create Riddle", zh: "创建谜题" },
  promptPlaceholder: { en: "Enter riddle prompt", zh: "输入谜题内容" },
  answerPlaceholder: { en: "Enter answer", zh: "输入答案" },
  rewardPlaceholder: { en: "Reward amount", zh: "奖励金额" },
  submitRiddle: { en: "Submit Riddle", zh: "提交谜题" },
  creating: { en: "Creating...", zh: "创建中..." },
  error: { en: "Error", zh: "错误" },
  game: { en: "Game", zh: "游戏" },
  create: { en: "Create", zh: "创建" },
  stats: { en: "Stats", zh: "统计" },
  statistics: { en: "Statistics", zh: "统计数据" },
  totalGames: { en: "Total Games", zh: "总游戏数" },
  unsolved: { en: "Open", zh: "未解" },

  docs: { en: "Docs", zh: "文档" },
  docSubtitle: {
    en: "Solve cryptographic puzzles to earn GAS rewards",
    zh: "解决密码谜题赚取 GAS 奖励",
  },
  docDescription: {
    en: "Crypto Riddle challenges you with daily cryptographic puzzles. Solve them correctly to earn GAS rewards. Higher difficulty levels offer bigger prizes.",
    zh: "Crypto Riddle 每日为您提供密码谜题挑战。正确解答可赚取 GAS 奖励。难度越高，奖励越大。",
  },
  step1: {
    en: "Connect your Neo wallet to participate",
    zh: "连接您的 Neo 钱包参与",
  },
  step2: {
    en: "Choose a puzzle difficulty level",
    zh: "选择谜题难度等级",
  },
  step3: {
    en: "Read the riddle carefully and submit your answer",
    zh: "仔细阅读谜题并提交答案",
  },
  step4: {
    en: "Correct answers earn GAS rewards instantly",
    zh: "正确答案立即获得 GAS 奖励",
  },
  feature1Name: { en: "Daily Puzzles", zh: "每日谜题" },
  feature1Desc: {
    en: "New cryptographic challenges every day with fresh rewards.",
    zh: "每天都有新的密码挑战和新鲜奖励。",
  },
  feature2Name: { en: "Tiered Rewards", zh: "分级奖励" },
  feature2Desc: {
    en: "Higher difficulty puzzles offer larger GAS prizes.",
    zh: "难度越高的谜题提供越大的 GAS 奖励。",
  },
};

const t = createT(translations);

const navTabs = [
  { id: "game", icon: "game", label: t("game") },
  { id: "create", icon: "plus", label: t("create") },
  { id: "stats", icon: "chart", label: t("stats") },
  { id: "docs", icon: "book", label: t("docs") },
];
const activeTab = ref("game");

const docSteps = computed(() => [t("step1"), t("step2"), t("step3"), t("step4")]);
const docFeatures = computed(() => [
  { name: t("feature1Name"), desc: t("feature1Desc") },
  { name: t("feature2Name"), desc: t("feature2Desc") },
]);
const APP_ID = "miniapp-cryptoriddle";
const { address, connect, invokeContract, invokeRead, getContractHash } = useWallet();
const { payGAS } = usePayments(APP_ID);
const { list: listEvents } = useEvents();
const contractHash = ref<string | null>(null);

const MIN_REWARD = 0.1;
const ATTEMPT_FEE = 0.01;

const solvedCount = ref(0);
const totalRewards = ref(0);
const currentStreak = ref(0);
const userAnswer = ref("");
const isSubmitting = ref(false);
const isCreating = ref(false);
const showResult = ref(false);
const status = ref<{ msg: string; type: string } | null>(null);
const hintRevealed = ref(false);

interface RiddleData {
  id: number;
  hint: string;
  reward: number;
  attempts: number;
  solved: boolean;
}

const riddles = ref<RiddleData[]>([]);
const currentRiddleIndex = ref(0);
const currentRiddle = computed(() => riddles.value[currentRiddleIndex.value] || null);
const newRiddle = ref({ prompt: "", answer: "", reward: "0.1" });

const lastResult = ref({
  correct: false,
  message: "",
});

const toFixed8 = (value: string) => {
  const num = Number.parseFloat(value);
  if (!Number.isFinite(num)) return "0";
  return Math.floor(num * 1e8).toString();
};

const toGas = (value: any) => {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? num / 1e8 : 0;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const ensureContractHash = async () => {
  if (!contractHash.value) {
    contractHash.value = await getContractHash();
  }
  if (!contractHash.value) {
    throw new Error("Contract not configured");
  }
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

const loadRiddles = async () => {
  await ensureContractHash();
  const createdEvents = await listEvents({ app_id: APP_ID, event_name: "RiddleCreated", limit: 50 });
  const ids = new Set<number>();
  createdEvents.events.forEach((evt) => {
    const values = Array.isArray((evt as any)?.state) ? (evt as any).state.map(parseStackItem) : [];
    const id = Number(values[0] ?? 0);
    if (id > 0) ids.add(id);
  });

  const list: RiddleData[] = [];
  for (const id of Array.from(ids).sort((a, b) => b - a)) {
    const res = await invokeRead({
      contractHash: contractHash.value as string,
      operation: "GetRiddle",
      args: [{ type: "Integer", value: id }],
    });
    const data = parseInvokeResult(res);
    if (Array.isArray(data) && data.length >= 7) {
      list.push({
        id,
        hint: String(data[1] ?? ""),
        reward: toGas(data[3]),
        attempts: Number(data[4] ?? 0),
        solved: Boolean(data[5]),
      });
    }
  }
  riddles.value = list;
  if (currentRiddleIndex.value >= list.length) {
    currentRiddleIndex.value = 0;
  }
};

const loadStats = async () => {
  const solvedEvents = await listEvents({ app_id: APP_ID, event_name: "RiddleSolved", limit: 50 });
  let solved = 0;
  let rewards = 0;
  solvedEvents.events.forEach((evt) => {
    const values = Array.isArray((evt as any)?.state) ? (evt as any).state.map(parseStackItem) : [];
    const winner = String(values[1] ?? "");
    if (address.value && winner === address.value) {
      solved += 1;
      rewards += toGas(values[2]);
    }
  });
  solvedCount.value = solved;
  totalRewards.value = Number(rewards.toFixed(2));
  currentStreak.value = solved;
};

const refreshData = async () => {
  try {
    await loadRiddles();
    await loadStats();
  } catch (e) {
    console.warn("Failed to load riddles", e);
  }
};

const gameStats = computed<StatItem[]>(() => [
  { label: t("solved"), value: solvedCount.value, variant: "accent" },
  { label: t("gasEarned"), value: totalRewards.value, variant: "success" },
  { label: t("streak"), value: currentStreak.value, variant: "warning" },
]);

const revealHint = () => {
  hintRevealed.value = true;
};

const submitAnswer = async () => {
  if (!currentRiddle.value) return;
  if (!userAnswer.value) {
    status.value = { msg: t("pleaseEnterAnswer"), type: "error" };
    return;
  }
  if (isSubmitting.value) return;
  try {
    if (!address.value) {
      await connect();
    }
    if (!address.value) {
      throw new Error(t("error"));
    }
    await ensureContractHash();
    isSubmitting.value = true;
    const payment = await payGAS(String(ATTEMPT_FEE), `riddle:solve:${currentRiddle.value.id}`);
    const receiptId = payment.receipt_id;
    if (!receiptId) {
      throw new Error("Missing payment receipt");
    }
    const tx = await invokeContract({
      scriptHash: contractHash.value as string,
      operation: "SolveRiddle",
      args: [
        { type: "Integer", value: currentRiddle.value.id },
        { type: "Hash160", value: address.value as string },
        { type: "String", value: userAnswer.value },
        { type: "Integer", value: Number(receiptId) },
      ],
    });
    const txid = String((tx as any)?.txid || (tx as any)?.txHash || "");
    const attemptEvent = txid ? await waitForEvent(txid, "AttemptMade") : null;
    const values =
      attemptEvent && Array.isArray((attemptEvent as any)?.state)
        ? (attemptEvent as any).state.map(parseStackItem)
        : [];
    const correct = Boolean(values[2]);
    showResult.value = true;
    lastResult.value = {
      correct,
      message: correct ? t("correctEarned") : t("notQuite"),
    };
    if (correct) {
      await waitForEvent(txid, "RiddleSolved");
      await refreshData();
    }
  } catch (e: any) {
    status.value = { msg: e.message || t("error"), type: "error" };
  } finally {
    isSubmitting.value = false;
    userAnswer.value = "";
  }
};

const nextRiddle = () => {
  if (!riddles.value.length) return;
  const start = currentRiddleIndex.value;
  let nextIndex = (start + 1) % riddles.value.length;
  for (let i = 0; i < riddles.value.length; i += 1) {
    const idx = (start + 1 + i) % riddles.value.length;
    if (!riddles.value[idx].solved) {
      nextIndex = idx;
      break;
    }
  }
  currentRiddleIndex.value = nextIndex;
  hintRevealed.value = false;
  showResult.value = false;
};

const createRiddle = async () => {
  if (isCreating.value) return;
  const reward = parseFloat(newRiddle.value.reward);
  if (!newRiddle.value.prompt || !newRiddle.value.answer || !Number.isFinite(reward) || reward < MIN_REWARD) {
    status.value = { msg: t("error"), type: "error" };
    return;
  }
  try {
    if (!address.value) {
      await connect();
    }
    if (!address.value) {
      throw new Error(t("error"));
    }
    await ensureContractHash();
    isCreating.value = true;
    const payment = await payGAS(newRiddle.value.reward, `riddle:create:${newRiddle.value.prompt.slice(0, 12)}`);
    const receiptId = payment.receipt_id;
    if (!receiptId) {
      throw new Error("Missing payment receipt");
    }
    const hashHex = await sha256Hex(newRiddle.value.answer);
    await invokeContract({
      scriptHash: contractHash.value as string,
      operation: "CreateRiddle",
      args: [
        { type: "Hash160", value: address.value as string },
        { type: "String", value: newRiddle.value.prompt },
        { type: "ByteArray", value: hashHex },
        { type: "Integer", value: toFixed8(newRiddle.value.reward) },
        { type: "Integer", value: Number(receiptId) },
      ],
    });
    newRiddle.value = { prompt: "", answer: "", reward: "0.1" };
    await refreshData();
    activeTab.value = "game";
  } catch (e: any) {
    status.value = { msg: e.message || t("error"), type: "error" };
  } finally {
    isCreating.value = false;
  }
};

onMounted(() => {
  refreshData();
});
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

.mystery-card { 
  margin-bottom: $space-6; 
  border: 6px solid black; 
  box-shadow: 12px 12px 0 black; 
  position: relative;
  background: var(--neo-purple);
  padding: $space-4;
  rotate: -0.5deg;
}
.mystery-decorations {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none;
}
.question-mark {
  position: absolute; font-size: 32px; font-weight: 900; color: rgba(255,255,255,0.2);
  &.top-left { top: -10px; left: -10px; rotate: -15deg; }
  &.top-right { top: -10px; right: -10px; rotate: 15deg; }
  &.bottom-left { bottom: -10px; left: -10px; rotate: 10deg; }
  &.bottom-right { bottom: -10px; right: -10px; rotate: -10deg; }
}

.riddle-header { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  margin-bottom: $space-6;
  background: black;
  padding: $space-3 $space-4;
  border: 2px solid black;
}
.card-title { font-size: 18px; font-weight: 900; text-transform: uppercase; color: white; font-style: italic; }

.difficulty-badge {
  padding: 6px 14px; font-size: 12px; font-weight: 900; text-transform: uppercase; border: 3px solid black;
  &.open { background: var(--brutal-yellow); color: black; box-shadow: 4px 4px 0 black; }
  &.solved { background: var(--neo-green); color: black; box-shadow: 4px 4px 0 black; }
}

.riddle-content {
  background: white; 
  padding: $space-10; 
  border: 4px solid black; 
  text-align: center; 
  margin: $space-4 0; 
  position: relative; 
  box-shadow: 8px 8px 0 rgba(0,0,0,0.1);
  rotate: 0.5deg;
}

.puzzle-emoji { font-size: 64px; display: block; margin-bottom: $space-6; filter: drop-shadow(6px 6px 0 rgba(0,0,0,0.1)); }
.riddle-text { font-size: 20px; font-weight: 900; text-transform: uppercase; line-height: 1.2; color: black; letter-spacing: -0.5px; }

.hint-container { margin: $space-6 0; }
.hint-locked {
  background: #ffde59; color: black; padding: $space-6; border: 4px solid black;
  text-align: center; font-weight: 900; text-transform: uppercase; cursor: pointer;
  box-shadow: 8px 8px 0 black; transition: all $transition-fast;
  font-style: italic;
  &:active { transform: translate(2px, 2px); box-shadow: 4px 4px 0 black; }
}

.hint-section { background: var(--brutal-yellow); padding: $space-6; border: 4px solid black; box-shadow: 8px 8px 0 black; }
.hint-label { font-size: 11px; font-weight: 900; text-transform: uppercase; opacity: 1; display: block; margin-bottom: 8px; border-bottom: 3px solid black; padding-bottom: 4px; }
.hint-text { font-size: 14px; font-weight: 900; }

.prize-display {
  background: black; padding: $space-6; border: 4px solid black; display: flex; justify-content: center; align-items: center; gap: $space-4;
  margin-top: $space-4; box-shadow: 8px 8px 0 rgba(0,0,0,0.2);
}
.prize-icon { font-size: 24px; }
.prize-text { font-size: 24px; font-weight: 900; font-family: $font-mono; color: var(--neo-green); text-shadow: 2px 2px 0 #000; font-style: italic; }

.result-card { border: 6px solid black; box-shadow: 14px 14px 0 black; rotate: 1deg; overflow: hidden; }
.result-content { padding: $space-8; text-align: center; display: flex; flex-direction: column; gap: $space-6; }
.result-icon { font-size: 80px; display: block; margin-bottom: $space-2; }
.result-text { font-size: 24px; font-weight: 900; text-transform: uppercase; letter-spacing: -1px; }

.stat-row { display: flex; justify-content: space-between; padding: $space-4 0; border-bottom: 4px solid black; }
.stat-label { font-size: 12px; font-weight: 900; text-transform: uppercase; opacity: 1; color: black; }
.stat-value { font-size: 18px; font-weight: 900; font-family: $font-mono; color: var(--brutal-red); }

.answer-card-brutal {
  border: 6px solid black;
  box-shadow: 12px 12px 0 black;
  margin-top: $space-6;
}

.brutal-action-btn {
  border: 4px solid black !important;
  box-shadow: 6px 6px 0 black !important;
}

.scrollable { overflow-y: auto; -webkit-overflow-scrolling: touch; }
</style>
