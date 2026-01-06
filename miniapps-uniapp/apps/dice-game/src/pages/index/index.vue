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
      <NeoCard :title="t('pickNumber')">
        <view class="prediction-row">
          <view
            v-for="n in 6"
            :key="n"
            :class="['prediction-btn', chosenNumber === n && 'active']"
            @click="chosenNumber = n"
          >
            <text class="pred-label">{{ n }}</text>
            <text class="pred-sub">{{ t("payout") }} {{ payoutMultiplier }}x</text>
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
      </NeoCard>

      <!-- Win Modal -->
      <NeoModal
        :visible="showWinOverlay"
        :title="t('youWon')"
        variant="success"
        closeable
        @close="showWinOverlay = false"
      >
        <view class="win-content">
          <view class="win-icon"><AppIcon name="trophy" :size="64" class="text-yellow" /></view>
          <text class="win-amount">+{{ winAmount }} GAS</text>
        </view>
      </NeoModal>
    </view>

    <!-- Stats Tab -->
    <view v-if="activeTab === 'stats'" class="tab-content scrollable">
      <NeoStats :stats="gameStats" />

      <NeoCard :title="t('recentRolls')">
        <view
          v-for="(roll, idx) in recentRolls"
          :key="idx"
          class="history-item"
          :class="{ 'item-win': roll.won, 'item-loss': !roll.won }"
        >
          <view class="roll-result">
            <view class="mini-dice-pair">
              <view class="mini-dice" :data-value="roll.rolled">
                <view v-for="dot in getDiceDots(roll.rolled)" :key="dot" class="mini-dot" :class="`dot-${dot}`"></view>
              </view>
            </view>
            <view class="roll-info">
              <text class="roll-total">{{ roll.rolled }}</text>
              <text class="roll-target">#{{ roll.chosen }}</text>
            </view>
          </view>
          <text :class="['roll-outcome', roll.won ? 'win' : 'loss']">
            {{ roll.won ? `+${roll.payout}` : `-${roll.bet}` }} GAS
          </text>
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
import { useWallet, usePayments, useEvents } from "@neo/uniapp-sdk";
import { createT } from "@/shared/utils/i18n";
import { parseStackItem } from "@/shared/utils/neo";
import {
  AppLayout,
  NeoButton,
  NeoInput,
  NeoModal,
  NeoStats,
  NeoDoc,
  AppIcon,
  NeoCard,
  type StatItem,
} from "@/shared/components";
import ThreeDDice from "@/components/ThreeDDice.vue";

const translations = {
  title: { en: "Dice Game", zh: "骰子游戏" },
  pickNumber: { en: "Pick a Number", zh: "选择点数" },
  chosenNumber: { en: "Chosen Number", zh: "选择点数" },
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
  connectWallet: { en: "Connect wallet", zh: "请连接钱包" },
  contractUnavailable: { en: "Contract unavailable", zh: "合约不可用" },
  receiptMissing: { en: "Payment receipt missing", zh: "支付凭证缺失" },
  betPending: { en: "Bet confirmation pending", zh: "下注确认中" },
  resultPending: { en: "Result pending", zh: "结果等待中" },
  docSubtitle: { en: "Single-die roll with provable randomness.", zh: "单骰随机数验证的掷骰子游戏。" },
  docDescription: {
    en: "Pick a number from 1-6 and roll a single die. Outcomes are determined on-chain with VRF-backed randomness.",
    zh: "选择 1-6 的点数并掷单骰，结果由链上 VRF 随机数决定。",
  },
  step1: { en: "Choose a number from 1 to 6.", zh: "选择 1 到 6 的点数。" },
  step2: { en: "Enter your GAS bet amount.", zh: "输入下注的 GAS 数量。" },
  step3: { en: "Roll the dice and wait for the on-chain result.", zh: "掷骰子并等待链上结果。" },
  step4: { en: "Check your stats and recent rolls in the Stats tab.", zh: "在统计标签页查看您的统计和最近记录。" },
  feature1Name: { en: "Provable RNG", zh: "可验证随机数" },
  feature1Desc: { en: "Dice outcomes come from TEE-backed VRF.", zh: "结果来自 TEE 支持的 VRF。" },
  feature2Name: { en: "Fixed Odds", zh: "固定赔率" },
  feature2Desc: {
    en: "Payout multiplier is fixed by on-chain rules.",
    zh: "赔率由链上规则固定。",
  },
};

const t = createT(translations);
const APP_ID = "miniapp-dicegame";
const { payGAS } = usePayments(APP_ID);
const { address, connect, invokeContract, getContractHash } = useWallet();
const { list: listEvents } = useEvents();

// Navigation
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

// Game State
const d1 = ref(1);
const betAmount = ref("1.0");
const chosenNumber = ref(1);
const isRolling = ref(false);
const lastRoll = ref<number | null>(null);
const lastResult = ref<"win" | "loss" | null>(null);
const showWinOverlay = ref(false);
const winAmount = ref("0");
const contractHash = ref<string | null>(null);

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
  return amt >= 0.05 && !Number.isNaN(amt);
});

const payoutMultiplier = computed(() => (6 * 0.95).toFixed(2));

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

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const toFixed8 = (value: string) => {
  const num = Number.parseFloat(value);
  if (!Number.isFinite(num)) return "0";
  return Math.floor(num * 1e8).toString();
};

const waitForEvent = async (txid: string, eventName: string) => {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const res = await listEvents({ app_id: APP_ID, event_name: eventName, limit: 25 });
    const match = res.events.find((evt) => evt.tx_hash === txid);
    if (match) return match;
    await sleep(1500);
  }
  return null;
};

const waitForRoll = async (betId: string) => {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const res = await listEvents({ app_id: APP_ID, event_name: "DiceRolled", limit: 25 });
    const match = res.events.find((evt) => {
      const values = Array.isArray((evt as any)?.state) ? (evt as any).state.map(parseStackItem) : [];
      return String(values[4] ?? "") === String(betId);
    });
    if (match) return match;
    await sleep(1500);
  }
  return null;
};

const notifyError = (message: string) => {
  if (typeof uni !== "undefined" && typeof uni.showToast === "function") {
    uni.showToast({ title: message, icon: "none" });
  }
};

const roll = async () => {
  if (isRolling.value || !canBet.value) return;

  isRolling.value = true;
  lastResult.value = null;
  showWinOverlay.value = false;

  try {
    if (!address.value) {
      await connect();
    }
    if (!address.value) {
      throw new Error(t("connectWallet"));
    }
    if (!contractHash.value) {
      contractHash.value = (await getContractHash()) as string;
    }
    if (!contractHash.value) {
      throw new Error(t("contractUnavailable"));
    }

    const payment = await payGAS(betAmount.value, `dice:${chosenNumber.value}`);
    const receiptId = payment.receipt_id;
    if (!receiptId) {
      throw new Error(t("receiptMissing"));
    }

    const tx = await invokeContract({
      scriptHash: contractHash.value as string,
      operation: "PlaceBet",
      args: [
        { type: "Hash160", value: address.value as string },
        { type: "Integer", value: String(chosenNumber.value) },
        { type: "Integer", value: toFixed8(betAmount.value) },
        { type: "Integer", value: Number(receiptId) },
      ],
    });

    const txid = String((tx as any)?.txid || (tx as any)?.txHash || "");
    const placedEvt = txid ? await waitForEvent(txid, "BetPlaced") : null;
    if (!placedEvt) {
      throw new Error(t("betPending"));
    }
    const placedValues = Array.isArray((placedEvt as any)?.state) ? (placedEvt as any).state.map(parseStackItem) : [];
    const betId = String(placedValues[3] ?? "");
    if (!betId) {
      throw new Error("Bet id missing");
    }

    const rolledEvt = await waitForRoll(betId);
    if (!rolledEvt) {
      throw new Error(t("resultPending"));
    }
    const values = Array.isArray((rolledEvt as any)?.state) ? (rolledEvt as any).state.map(parseStackItem) : [];
    const chosen = Number(values[1] ?? chosenNumber.value);
    const rolled = Number(values[2] ?? 0);
    const payout = Number(values[3] ?? 0) / 1e8;
    const won = rolled === chosen;

    d1.value = rolled || 1;
    lastRoll.value = rolled || 0;

    stats.value.totalGames++;
    if (won) {
      stats.value.wins++;
      lastResult.value = "win";
      winAmount.value = payout.toFixed(2);
      setTimeout(() => (showWinOverlay.value = true), 500);
    } else {
      stats.value.losses++;
      lastResult.value = "loss";
    }

    recentRolls.value.unshift({
      rolled,
      chosen,
      won,
      bet: betAmount.value,
      payout: won ? payout.toFixed(2) : 0,
    });
    if (recentRolls.value.length > 20) recentRolls.value.pop();
  } catch (e: any) {
    console.error(e);
    notifyError(e?.message || t("contractUnavailable"));
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

.tab-content {
  padding: $space-4;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.dice-arena {
  height: 220px;
  background: black;
  border: 4px solid black;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  box-shadow: 10px 10px 0 black;
  &.arena-win {
    border-color: var(--neo-green);
    outline: 4px solid var(--neo-green);
    outline-offset: -8px;
  }
  &.arena-loss {
    border-color: var(--brutal-red);
    outline: 4px solid var(--brutal-red);
    outline-offset: -8px;
  }
}

.casino-felt {
  position: absolute;
  inset: 0;
  opacity: 0.1;
  background-image: radial-gradient(circle at 2px 2px, white 1px, transparent 0);
  background-size: 20px 20px;
}

.total-display-wrapper {
  text-align: center;
  margin-top: $space-4;
  z-index: 5;
  background: rgba(255, 255, 255, 0.9);
  padding: 4px 20px;
  border: 2px solid black;
  box-shadow: 4px 4px 0 black;
}
.total-display {
  font-family: $font-mono;
  font-size: 56px;
  font-weight: $font-weight-black;
  display: block;
  color: black;
  line-height: 1;
}
.result-label {
  font-size: 12px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  margin-top: 4px;
  display: block;
}
.win-label {
  color: var(--neo-green);
}
.loss-label {
  color: var(--brutal-red);
}

.prediction-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $space-3;
  margin-bottom: $space-4;
}

.prediction-btn {
  padding: $space-3;
  background: white;
  border: 2px solid black;
  text-align: center;
  cursor: pointer;
  &.active {
    background: var(--brutal-yellow);
    box-shadow: 6px 6px 0 black;
    transform: translate(-2px, -2px);
  }
  transition: all $transition-fast;
}

.pred-label {
  font-weight: $font-weight-black;
  font-size: 24px;
  display: block;
}
.pred-sub {
  font-size: 8px;
  font-weight: $font-weight-black;
  opacity: 0.6;
  text-transform: uppercase;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $space-3;
  background: white;
  border: 2px solid black;
  margin-bottom: $space-2;
  box-shadow: 4px 4px 0 black;
}

.roll-result {
  display: flex;
  align-items: center;
  gap: $space-3;
}
.roll-info {
  display: flex;
  align-items: center;
  gap: 8px;
}
.roll-total {
  font-family: $font-mono;
  font-weight: $font-weight-black;
  font-size: 20px;
}
.roll-target {
  font-size: 12px;
  opacity: 0.6;
  font-weight: $font-weight-black;
  background: #eee;
  padding: 2px 6px;
}
.roll-outcome {
  font-family: $font-mono;
  font-weight: $font-weight-black;
  font-size: 14px;
}
.roll-outcome.win {
  color: var(--neo-green);
  text-shadow: 1px 1px 0 black;
}
.roll-outcome.loss {
  color: var(--brutal-red);
}

.win-content {
  text-align: center;
  padding: $space-6;
}
.win-amount {
  font-family: $font-mono;
  font-size: 40px;
  font-weight: $font-weight-black;
  color: var(--neo-green);
  display: block;
  margin-top: $space-4;
  text-shadow: 2px 2px 0 black;
}

.scrollable {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>
