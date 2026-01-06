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
      <!-- Status Message -->
      <NeoCard v-if="status" :variant="status.type === 'error' ? 'danger' : 'success'" class="mb-4">
        <text class="text-center font-bold">{{ status.msg }}</text>
      </NeoCard>

      <!-- Poker Table -->
      <view class="poker-table">
        <view class="table-felt">
          <!-- Pot Display with Chips -->
          <view class="pot-display">
            <view class="chip-stack">
              <view v-for="i in Math.min(Math.floor(pot / 0.5), 10)" :key="i" class="chip"></view>
            </view>
            <text class="pot-label">{{ t("pot") }}</text>
            <text class="pot-amount">{{ formatNum(pot) }} GAS</text>
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
          <NeoInput v-model="buyIn" type="number" :placeholder="t('buyInPlaceholder')" suffix="GAS" />
          <NeoInput v-model="tableIdInput" type="number" :placeholder="t('tableIdPlaceholder')" />
        </view>
        <view class="actions-row">
          <NeoButton variant="ghost" size="md" @click="createTable" :disabled="isPlaying">
            {{ t("createTable") }}
          </NeoButton>
          <NeoButton variant="primary" size="md" @click="joinTable" :loading="isPlaying" block>
            {{ t("joinTable") }}
          </NeoButton>
          <NeoButton variant="secondary" size="md" @click="startHand" :disabled="isPlaying">
            {{ t("startHand") }}
          </NeoButton>
        </view>
        <view v-if="tables.length" class="tables-list">
          <text class="tables-title">{{ t("recentTables") }}</text>
          <view v-for="table in tables" :key="table.id" class="table-item" @click="selectTable(table.id)">
            <text class="table-id">#{{ table.id }}</text>
            <text class="table-buyin">{{ formatNum(table.buyIn) }} GAS</text>
          </view>
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
import { ref, computed, onMounted } from "vue";
import { useWallet, usePayments, useEvents } from "@neo/uniapp-sdk";
import { formatNumber } from "@/shared/utils/format";
import { createT } from "@/shared/utils/i18n";
import { parseInvokeResult, parseStackItem } from "@/shared/utils/neo";
import { AppLayout, NeoButton, NeoInput, NeoCard, NeoStats, NeoDoc, type StatItem } from "@/shared/components";

const translations = {
  title: { en: "Secret Poker", zh: "秘密扑克" },
  subtitle: { en: "Hidden card poker game", zh: "隐藏牌扑克游戏" },
  yourHand: { en: "Your Hand", zh: "你的手牌" },
  pot: { en: "Pot:", zh: "底池：" },
  actions: { en: "Actions", zh: "操作" },
  buyInPlaceholder: { en: "Buy-in (GAS)", zh: "买入金额 (GAS)" },
  tableIdPlaceholder: { en: "Table ID", zh: "牌桌 ID" },
  createTable: { en: "Create Table", zh: "创建牌桌" },
  joinTable: { en: "Join Table", zh: "加入牌桌" },
  startHand: { en: "Start Hand", zh: "开始手牌" },
  recentTables: { en: "Recent Tables", zh: "最近牌桌" },
  gameStats: { en: "Game Stats", zh: "游戏统计" },
  games: { en: "Games", zh: "局数" },
  won: { en: "Won", zh: "胜利" },
  earnings: { en: "Earnings", zh: "收益" },
  minBuyIn: { en: "Min buy-in: 1 GAS", zh: "最小买入：1 GAS" },
  tableCreated: { en: "Table created", zh: "牌桌已创建" },
  tableJoined: { en: "Joined table (seat {seat})", zh: "加入牌桌 (座位 {seat})" },
  handStarted: { en: "Hand started", zh: "手牌已开始" },
  handPending: { en: "Hand result pending", zh: "等待开奖结果" },
  handWon: { en: "You won {amount} GAS!", zh: "你赢得了 {amount} GAS！" },
  handLost: { en: "Hand finished - not winner", zh: "手牌结束 - 未获胜" },
  missingTable: { en: "Enter a table ID", zh: "请输入牌桌 ID" },
  connectWallet: { en: "Connect wallet", zh: "请连接钱包" },
  contractUnavailable: { en: "Contract unavailable", zh: "合约不可用" },
  receiptMissing: { en: "Payment receipt missing", zh: "支付凭证缺失" },
  error: { en: "Error", zh: "错误" },
  game: { en: "Game", zh: "游戏" },
  stats: { en: "Stats", zh: "统计" },
  statistics: { en: "Statistics", zh: "统计数据" },
  totalGames: { en: "Total Games", zh: "总游戏数" },

  docs: { en: "Docs", zh: "文档" },
  docSubtitle: {
    en: "Multiplayer poker with TEE-secured card dealing",
    zh: "使用 TEE 安全发牌的多人扑克",
  },
  docDescription: {
    en: "Secret Poker is a multiplayer poker game where hands are dealt and resolved using Trusted Execution Environment (TEE) services. Create or join tables, buy in with GAS, and compete for the pot with provably fair card dealing.",
    zh: "秘密扑克是一款多人扑克游戏，使用可信执行环境 (TEE) 服务发牌和结算。创建或加入牌桌，使用 GAS 买入，通过可证明公平的发牌竞争奖池。",
  },
  step1: {
    en: "Create a new table or join an existing one with GAS buy-in.",
    zh: "创建新牌桌或使用 GAS 买入加入现有牌桌。",
  },
  step2: { en: "Wait for other players to join the table.", zh: "等待其他玩家加入牌桌。" },
  step3: { en: "Start a hand and watch the TEE deal your cards.", zh: "开始手牌并观看 TEE 发牌。" },
  step4: { en: "Win the pot if you have the best hand!", zh: "如果你有最好的牌就赢得奖池！" },
  feature1Name: { en: "TEE Card Dealing", zh: "TEE 发牌" },
  feature1Desc: {
    en: "Cards are dealt in a secure enclave, preventing cheating.",
    zh: "卡牌在安全飞地中发放，防止作弊。",
  },
  feature2Name: { en: "Animated Cards", zh: "动画卡牌" },
  feature2Desc: { en: "Beautiful card flip animations reveal your hand.", zh: "精美的翻牌动画揭示您的手牌。" },
};

const t = createT(translations);

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
const APP_ID = "miniapp-secretpoker";
const { address, connect, invokeContract, invokeRead, getContractHash } = useWallet();
const { payGAS, isLoading } = usePayments(APP_ID);
const { list: listEvents } = useEvents();

const buyIn = ref("1");
const tableIdInput = ref("");
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
const contractHash = ref<string | null>(null);

type TableSummary = {
  id: number;
  buyIn: number;
};

const tables = ref<TableSummary[]>([]);
const currentTableId = ref<number | null>(null);
const currentBuyIn = ref(0);
const currentPlayerCount = ref(0);
const currentHandId = ref(0);

const playerHand = ref([
  { rank: "?", suit: "♠", revealed: false },
  { rank: "?", suit: "♥", revealed: false },
  { rank: "?", suit: "♦", revealed: false },
]);

const formatNum = (n: number) => formatNumber(n, 2);

const gameStats = computed<StatItem[]>(() => [
  { label: t("games"), value: gamesPlayed.value, variant: "default" },
  { label: t("won"), value: gamesWon.value, variant: "success" },
  { label: t("earnings"), value: formatNum(totalEarnings.value), variant: "accent" },
]);

const getSuitColor = (suit: string) => {
  return suit === "♥" || suit === "♦" ? "red" : "black";
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const toFixed8 = (value: string) => {
  const num = Number.parseFloat(value);
  if (!Number.isFinite(num)) return "0";
  return Math.floor(num * 1e8).toString();
};

const fromFixed8 = (value: number) => {
  if (!Number.isFinite(value)) return 0;
  return value / 1e8;
};

const ensureContractHash = async () => {
  if (!contractHash.value) {
    contractHash.value = await getContractHash();
  }
  if (!contractHash.value) throw new Error(t("contractUnavailable"));
  return contractHash.value;
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

const waitForHandResult = async (handId: string) => {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const res = await listEvents({ app_id: APP_ID, event_name: "HandResult", limit: 25 });
    const match = res.events.find((evt) => {
      const values = Array.isArray((evt as any)?.state) ? (evt as any).state.map(parseStackItem) : [];
      return String(values[1] ?? "") === String(handId);
    });
    if (match) return match;
    await sleep(1500);
  }
  return null;
};

const triggerCelebration = (type: "win" | "lose", text: string) => {
  celebrationType.value = type;
  celebrationText.value = text;
  showCelebration.value = true;
  setTimeout(() => {
    showCelebration.value = false;
  }, 3000);
};

const playCardSound = () => {
  // Optional sound effect hook.
};

const loadTables = async () => {
  const res = await listEvents({ app_id: APP_ID, event_name: "TableCreated", limit: 20 });
  tables.value = res.events.map((evt) => {
    const values = Array.isArray((evt as any)?.state) ? (evt as any).state.map(parseStackItem) : [];
    return {
      id: Number(values[0] ?? 0),
      buyIn: fromFixed8(Number(values[2] ?? 0)),
    };
  });
};

const refreshTable = async () => {
  if (!currentTableId.value) return;
  const contract = await ensureContractHash();
  const res = await invokeRead({
    contractHash: contract,
    operation: "GetTable",
    args: [{ type: "Integer", value: String(currentTableId.value) }],
  });
  const data = parseInvokeResult(res);
  if (Array.isArray(data)) {
    currentBuyIn.value = fromFixed8(Number(data[1] ?? 0));
    currentPlayerCount.value = Number(data[2] ?? 0);
    currentHandId.value = Number(data[4] ?? 0);
  } else if (typeof data === "object" && data) {
    currentBuyIn.value = fromFixed8(Number((data as any).buyIn ?? 0));
    currentPlayerCount.value = Number((data as any).playerCount ?? 0);
    currentHandId.value = Number((data as any).currentHand ?? 0);
  }
  pot.value = Number((currentBuyIn.value * currentPlayerCount.value).toFixed(2));
};

const selectTable = async (id: number) => {
  tableIdInput.value = String(id);
  currentTableId.value = id;
  await refreshTable();
};

const createTable = async () => {
  if (isPlaying.value) return;
  const amount = Number(buyIn.value);
  if (!Number.isFinite(amount) || amount < 1) {
    status.value = { msg: t("minBuyIn"), type: "error" };
    return;
  }
  isPlaying.value = true;
  try {
    if (!address.value) await connect();
    if (!address.value) throw new Error(t("connectWallet"));
    const contract = await ensureContractHash();
    const tx = await invokeContract({
      scriptHash: contract,
      operation: "CreateTable",
      args: [
        { type: "Hash160", value: address.value },
        { type: "Integer", value: toFixed8(buyIn.value) },
      ],
    });
    const txid = String((tx as any)?.txid || (tx as any)?.txHash || "");
    const evt = txid ? await waitForEvent(txid, "TableCreated") : null;
    if (evt) {
      const values = Array.isArray((evt as any)?.state) ? (evt as any).state.map(parseStackItem) : [];
      const tableId = Number(values[0] ?? 0);
      currentTableId.value = tableId;
      tableIdInput.value = String(tableId);
      status.value = { msg: t("tableCreated"), type: "success" };
      await loadTables();
      await refreshTable();
    } else {
      status.value = { msg: t("tableCreated"), type: "success" };
    }
  } catch (e: any) {
    status.value = { msg: e.message || t("error"), type: "error" };
  } finally {
    isPlaying.value = false;
  }
};

const joinTable = async () => {
  if (isPlaying.value || isLoading.value) return;
  if (!tableIdInput.value) {
    status.value = { msg: t("missingTable"), type: "error" };
    return;
  }
  isPlaying.value = true;
  try {
    if (!address.value) await connect();
    if (!address.value) throw new Error(t("connectWallet"));
    const contract = await ensureContractHash();
    const tableId = Number(tableIdInput.value);
    if (!currentBuyIn.value) {
      currentTableId.value = tableId;
      await refreshTable();
    }
    const payment = await payGAS(String(currentBuyIn.value || buyIn.value), `poker:join:${tableId}`);
    const receiptId = payment.receipt_id;
    if (!receiptId) throw new Error(t("receiptMissing"));
    const tx = await invokeContract({
      scriptHash: contract,
      operation: "JoinTable",
      args: [
        { type: "Integer", value: String(tableId) },
        { type: "Hash160", value: address.value },
        { type: "Integer", value: receiptId },
      ],
    });
    const txid = String((tx as any)?.txid || (tx as any)?.txHash || "");
    const evt = txid ? await waitForEvent(txid, "PlayerJoined") : null;
    if (evt) {
      const values = Array.isArray((evt as any)?.state) ? (evt as any).state.map(parseStackItem) : [];
      const seat = String(values[2] ?? "");
      status.value = { msg: t("tableJoined").replace("{seat}", seat), type: "success" };
    } else {
      status.value = { msg: t("tableJoined").replace("{seat}", "-"), type: "success" };
    }
    await refreshTable();
  } catch (e: any) {
    status.value = { msg: e.message || t("error"), type: "error" };
  } finally {
    isPlaying.value = false;
  }
};

const startHand = async () => {
  if (isPlaying.value) return;
  if (!tableIdInput.value) {
    status.value = { msg: t("missingTable"), type: "error" };
    return;
  }
  isPlaying.value = true;
  isAnimating.value = true;
  playerHand.value.forEach((c) => (c.revealed = false));
  try {
    const contract = await ensureContractHash();
    const tableId = Number(tableIdInput.value);
    const tx = await invokeContract({
      scriptHash: contract,
      operation: "StartHand",
      args: [{ type: "Integer", value: String(tableId) }],
    });
    const txid = String((tx as any)?.txid || (tx as any)?.txHash || "");
    const startedEvt = txid ? await waitForEvent(txid, "HandStarted") : null;
    if (!startedEvt) {
      status.value = { msg: t("handStarted"), type: "success" };
      return;
    }
    const startedValues = Array.isArray((startedEvt as any)?.state)
      ? (startedEvt as any).state.map(parseStackItem)
      : [];
    const handId = String(startedValues[1] ?? "");
    status.value = { msg: t("handStarted"), type: "success" };

    const resultEvt = await waitForHandResult(handId);
    if (!resultEvt) {
      status.value = { msg: t("handPending"), type: "error" };
      return;
    }
    const values = Array.isArray((resultEvt as any)?.state) ? (resultEvt as any).state.map(parseStackItem) : [];
    const winner = String(values[2] ?? "");
    const payout = fromFixed8(Number(values[3] ?? 0));
    pot.value = payout;
    gamesPlayed.value += 1;
    playerHand.value.forEach((c) => (c.revealed = true));

    if (address.value && winner && winner === address.value) {
      gamesWon.value += 1;
      totalEarnings.value += payout;
      const winMsg = t("handWon").replace("{amount}", formatNum(payout));
      status.value = { msg: winMsg, type: "success" };
      triggerCelebration("win", winMsg);
    } else {
      status.value = { msg: t("handLost"), type: "error" };
      triggerCelebration("lose", t("handLost"));
    }
  } catch (e: any) {
    status.value = { msg: e.message || t("error"), type: "error" };
  } finally {
    isPlaying.value = false;
    isAnimating.value = false;
  }
};

onMounted(async () => {
  await loadTables();
});
</script>

<style lang="scss" scoped>
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.tab-content {
  padding: $space-3;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: $space-4;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

// === CELEBRATION ANIMATION ===
.celebration {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  animation: celebration-bounce 0.6s ease-out;
}

.celebration-text {
  font-size: 40px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  background: white;
  padding: $space-4 $space-8;
  border: 4px solid black;
  box-shadow: 10px 10px 0 black;
  margin-bottom: $space-4;
}

.celebration.win .celebration-text {
  color: var(--brutal-yellow);
  background: black;
}
.celebration.lose .celebration-text {
  color: var(--brutal-red);
}

@keyframes celebration-bounce {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  70% {
    transform: scale(1.1);
    opacity: 1;
  }
  100% {
    transform: scale(1);
  }
}

// === POKER TABLE ===
.poker-table {
  margin-bottom: $space-4;
  border: 6px solid black;
  box-shadow: 12px 12px 0 black;
  overflow: hidden;
}

.table-felt {
  background: var(--neo-green);
  padding: $space-8;
  position: relative;
  border: 2px solid rgba(0, 0, 0, 0.1);
}

// === POT DISPLAY WITH CHIPS ===
.pot-display {
  text-align: center;
  margin-bottom: $space-8;
  background: white;
  border: 3px solid black;
  padding: $space-4;
  box-shadow: 6px 6px 0 black;
}

.chip-stack {
  display: flex;
  justify-content: center;
  gap: 4px;
  margin-bottom: 8px;
}
.chip {
  width: 30px;
  height: 10px;
  background: var(--brutal-yellow);
  border: 2px solid black;
  border-radius: 4px;
}

.pot-label {
  font-size: 12px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
}
.pot-amount {
  font-size: 32px;
  font-weight: $font-weight-black;
  font-family: $font-mono;
  display: block;
  line-height: 1;
}

// === HAND SECTION ===
.hand-title {
  font-size: 14px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  text-align: center;
  margin-bottom: $space-4;
  background: black;
  color: white;
  padding: 2px 12px;
  display: inline-block;
  position: relative;
  left: 50%;
  transform: translateX(-50%);
}

.cards-row {
  display: flex;
  gap: $space-4;
  justify-content: center;
  perspective: 1000px;
}

.poker-card {
  width: 80px;
  height: 120px;
  position: relative;
  transform-style: preserve-3d;
  transition: all 0.4s;
  &.revealed {
    transform: rotateY(0deg);
  }
  &:not(.revealed) {
    transform: rotateY(180deg);
  }
}

.card-front,
.card-back {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  border: 3px solid black;
  box-shadow: 4px 4px 0 black;
}

.card-back {
  background: var(--brutal-red);
  transform: rotateY(180deg);
  display: flex;
  align-items: center;
  justify-content: center;
}
.card-pattern {
  width: 60%;
  height: 70%;
  border: 2px solid white;
  background-image: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 10px,
    rgba(255, 255, 255, 0.1) 10px,
    rgba(255, 255, 255, 0.1) 20px
  );
}

.card-front {
  background: white;
  padding: $space-2;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.card-corner {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.card-rank {
  font-size: 20px;
  font-weight: $font-weight-black;
  line-height: 1;
}
.card-suit {
  font-size: 16px;
}
.card-suit-center {
  font-size: 40px;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  opacity: 0.2;
}
.card-corner.bottom-right {
  transform: rotate(180deg);
}

.card-rank.red,
.card-suit.red {
  color: var(--brutal-red);
}
.card-rank.black,
.card-suit.black {
  color: black;
}

// === BETTING CONTROLS ===
.bet-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: $space-3;
  margin-bottom: $space-4;
}
.actions-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: $space-2;
  margin-top: $space-4;
}

.tables-list {
  border-top: 3px solid black;
  margin-top: $space-6;
  padding-top: $space-4;
}
.tables-title {
  font-size: 12px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  margin-bottom: 8px;
  display: block;
}
.table-item {
  display: flex;
  justify-content: space-between;
  padding: $space-3;
  background: white;
  border: 2px solid black;
  box-shadow: 4px 4px 0 black;
  margin-bottom: $space-2;
}
.table-id {
  font-weight: $font-weight-black;
  font-family: $font-mono;
}
.table-buyin {
  font-weight: $font-weight-black;
  background: var(--neo-green);
  padding: 2px 8px;
  border: 1px solid black;
}

// === STATISTICS ===
.stat-row {
  display: flex;
  justify-content: space-between;
  padding: $space-3 0;
  border-bottom: 2px solid black;
  &:last-child {
    border-bottom: none;
  }
}
.stat-label {
  font-size: 12px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  opacity: 0.6;
}
.stat-value {
  font-weight: $font-weight-black;
  font-family: $font-mono;
  font-size: 16px;
  color: black;
}
.stat-value.win {
  color: var(--neo-green);
}

.scrollable {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>
