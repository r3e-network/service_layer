<template>
  <AppLayout :title="t('title')" show-top-nav :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <view v-if="activeTab === 'game'" class="game-layout">
      <!-- Fixed Hero Section: Countdown + Prize Pool (non-scrollable) -->
      <view class="hero-fixed">
        <NeoCard
          v-if="status"
          :variant="status.type === 'error' ? 'danger' : status.type === 'loading' ? 'accent' : 'success'"
          class="mb-4"
        >
          <text class="text-center font-bold">{{ status.msg }}</text>
        </NeoCard>

        <NeoCard class="hero-card" variant="erobo-neo">
          <view class="countdown-container">
            <view class="countdown-circle">
              <svg class="countdown-ring" viewBox="0 0 220 220">
                <circle class="countdown-ring-bg" cx="110" cy="110" r="99" />
                <circle
                  class="countdown-ring-progress"
                  cx="110"
                  cy="110"
                  r="99"
                  :style="{ strokeDashoffset: countdownProgress }"
                />
              </svg>
              <view class="countdown-text">
                <text class="countdown-time">{{ countdownLabel }}</text>
                <text class="countdown-label">{{ t("status") }}</text>
              </view>
            </view>
          </view>

          <!-- Lottery Balls Display -->
          <view class="lottery-balls">
            <view
              v-for="(ball, i) in lotteryBalls"
              :key="i"
              class="lottery-ball"
              :style="{ animationDelay: `${i * 0.1}s` }"
            >
              <text class="ball-number">{{ ball }}</text>
            </view>
          </view>

          <!-- Prize Pool with Glow -->
          <view class="prize-pool-display">
            <text class="prize-label">{{ t("prizePool") }}</text>
            <view class="prize-amount-container">
              <text class="prize-amount">{{ formatNum(prizePool) }}</text>
              <text class="prize-currency">GAS</text>
            </view>
          </view>
        </NeoCard>

        <!-- Stats Grid -->
        <view class="stats-grid">
          <view class="stat-box">
            <AppIcon name="target" :size="32" class="mb-2" />
            <text class="stat-value">#{{ round }}</text>
            <text class="stat-label">{{ t("round") }}</text>
          </view>
          <view class="stat-box">
            <AppIcon name="ticket" :size="32" class="mb-2" />
            <text class="stat-value">{{ totalTickets }}</text>
            <text class="stat-label">{{ t("total") }}</text>
          </view>
          <view class="stat-box highlight">
            <AppIcon name="sparkle" :size="32" class="mb-2" />
            <text class="stat-value">{{ userTickets }}</text>
            <text class="stat-label">{{ t("yours") }}</text>
          </view>
        </view>
      </view>

      <!-- Scrollable Buy Section -->
      <view class="buy-section">
        <NeoCard :title="t('buyTickets')" variant="erobo-neo" class="ticket-purchase-card">
          <!-- Ticket Selector -->
          <view class="ticket-selector">
            <NeoButton variant="secondary" @click="adjustTickets(-1)">−</NeoButton>
            <view class="ticket-display">
              <view class="ticket-visual">
                <view
                  v-for="n in Math.min(tickets, 5)"
                  :key="n"
                  class="mini-ticket"
                  :style="{ transform: `translateX(${(n - 1) * -8}px) rotate(${(n - 1) * 5}deg)` }"
                >
                  <AppIcon name="ticket" :size="40" />
                </view>
                <text v-if="tickets > 5" class="ticket-overflow">+{{ tickets - 5 }}</text>
              </view>
              <text class="ticket-count">{{ tickets }} {{ t("ticketsLabel") }}</text>
            </view>
            <NeoButton variant="secondary" @click="adjustTickets(1)">+</NeoButton>
          </view>

          <!-- Total Cost -->
          <view class="total-row mb-4 flex justify-between items-center">
            <text class="total-label text-secondary font-medium">{{ t("totalCost") }}</text>
            <text class="total-value font-bold text-lg">{{ formatNum(totalCost, 1) }} GAS</text>
          </view>

          <!-- Buy Button -->
          <NeoButton variant="primary" size="lg" block :loading="isLoading" @click="buyTickets">
            <view class="flex items-center justify-center gap-2">
              <text>{{ isLoading ? t("processing") : t("buyNow") }}</text>
              <AppIcon name="money" :size="20" />
            </view>
          </NeoButton>
        </NeoCard>
      </view>
    </view>

    <!-- Winners Tab -->
    <view v-if="activeTab === 'winners'" class="tab-content scrollable">
      <NeoCard :title="t('recentWinners')" icon="trophy">
        <view class="winners-list">
          <text v-if="winners.length === 0" class="empty">{{ t("noWinners") }}</text>
          <view v-for="(w, i) in winners" :key="i" class="winner-item">
            <view class="winner-medal">
              <text>{{ i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "🎖️" }}</text>
            </view>
            <view class="winner-info">
              <text class="winner-round">Round #{{ w.round }}</text>
              <text class="winner-addr">{{ w.address.slice(0, 8) }}...{{ w.address.slice(-6) }}</text>
            </view>
            <text class="winner-prize">{{ formatNum(w.prize) }} GAS</text>
          </view>
        </view>
      </NeoCard>
    </view>

    <!-- Stats Tab -->
    <view v-if="activeTab === 'stats'" class="tab-content scrollable">
      <NeoStats :title="t('statistics')" :stats="statsItems" />
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
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useWallet, usePayments, useEvents } from "@neo/uniapp-sdk";
import { formatNumber } from "@/shared/utils/format";
import { addressToScriptHash, normalizeScriptHash, parseInvokeResult, parseStackItem } from "@/shared/utils/neo";
import { createT } from "@/shared/utils/i18n";
import { AppLayout, NeoDoc, AppIcon, NeoButton, NeoCard, NeoStats, type StatItem } from "@/shared/components";

const translations = {
  title: { en: "Neo Lottery", zh: "Neo彩票" },
  subtitle: { en: "Provably fair draws", zh: "可证明公平抽奖" },
  game: { en: "Play", zh: "游戏" },
  winners: { en: "Winners", zh: "中奖" },
  stats: { en: "Stats", zh: "统计" },
  statistics: { en: "Statistics", zh: "统计数据" },
  totalGames: { en: "Total Games", zh: "总游戏数" },
  totalTickets: { en: "Total Tickets", zh: "总彩票数" },
  round: { en: "Round", zh: "轮次" },
  prizePool: { en: "Prize Pool", zh: "奖池" },
  total: { en: "Total", zh: "总计" },
  yours: { en: "Yours", zh: "您的" },
  buyTickets: { en: "Buy Tickets", zh: "购买彩票" },
  buyNow: { en: "Buy Now", zh: "立即购买" },
  ticketsLabel: { en: "Tickets", zh: "张彩票" },
  totalCost: { en: "Total Cost", zh: "总费用" },
  processing: { en: "Processing...", zh: "处理中..." },
  recentWinners: { en: "Recent Winners", zh: "最近中奖者" },
  noWinners: { en: "No winners yet", zh: "暂无中奖者" },
  purchasing: { en: "Purchasing...", zh: "购买中..." },
  bought: { en: "Bought", zh: "已购买" },
  tickets: { en: "ticket(s)!", zh: "张彩票！" },
  error: { en: "Error", zh: "错误" },
  timeLeft: { en: "Time Left", zh: "剩余时间" },
  status: { en: "Status", zh: "状态" },
  open: { en: "Open", zh: "进行中" },
  drawing: { en: "Drawing", zh: "开奖中" },
  connectWallet: { en: "Connect wallet", zh: "请连接钱包" },
  receiptMissing: { en: "Payment receipt missing", zh: "支付凭证缺失" },
  contractUnavailable: { en: "Contract unavailable", zh: "合约不可用" },

  docs: { en: "Docs", zh: "文档" },
  docSubtitle: {
    en: "Provably fair lottery powered by VRF randomness",
    zh: "由 VRF 随机数驱动的可证明公平彩票",
  },
  docDescription: {
    en: "Neo Lottery is a decentralized lottery system that uses Verifiable Random Function (VRF) to ensure completely fair and transparent draws. Every ticket purchase and winner selection is recorded on-chain, making the entire process auditable and trustless.",
    zh: "Neo 彩票是一个去中心化彩票系统，使用可验证随机函数 (VRF) 确保完全公平透明的抽奖。每次购票和中奖者选择都记录在链上，使整个过程可审计且无需信任。",
  },
  step1: {
    en: "Connect your Neo wallet (NeoLine, O3, or OneGate)",
    zh: "连接您的 Neo 钱包（NeoLine、O3 或 OneGate）",
  },
  step2: {
    en: "Select the number of tickets to purchase (each ticket costs 1 GAS)",
    zh: "选择要购买的彩票数量（每张彩票 1 GAS）",
  },
  step3: {
    en: "Confirm the transaction and wait for the draw",
    zh: "确认交易并等待开奖",
  },
  step4: {
    en: "Winners are selected automatically using VRF - prizes sent directly to wallets",
    zh: "使用 VRF 自动选出中奖者 - 奖金直接发送到钱包",
  },
  feature1Name: { en: "VRF Randomness", zh: "VRF 随机数" },
  feature1Desc: {
    en: "Cryptographically secure random number generation ensures no one can predict or manipulate the draw results.",
    zh: "加密安全的随机数生成确保没有人可以预测或操纵抽奖结果。",
  },
  feature2Name: { en: "Automatic Payouts", zh: "自动支付" },
  feature2Desc: {
    en: "Smart contract automatically distributes prizes to winners - no manual intervention required.",
    zh: "智能合约自动向中奖者分配奖金 - 无需人工干预。",
  },
  feature3Name: { en: "On-Chain Transparency", zh: "链上透明" },
  feature3Desc: {
    en: "All ticket purchases, draws, and payouts are recorded on Neo N3 blockchain for full auditability.",
    zh: "所有购票、抽奖和支付都记录在 Neo N3 区块链上，完全可审计。",
  },
};

const t = createT(translations);

const navTabs = [
  { id: "game", icon: "game", label: t("game") },
  { id: "winners", icon: "trophy", label: t("winners") },
  { id: "stats", icon: "chart", label: t("stats") },
  { id: "docs", icon: "book", label: t("docs") },
];
const activeTab = ref("game");
const gamesPlayed = ref(0);

const docSteps = computed(() => [t("step1"), t("step2"), t("step3"), t("step4")]);
const docFeatures = computed(() => [
  { name: t("feature1Name"), desc: t("feature1Desc") },
  { name: t("feature2Name"), desc: t("feature2Desc") },
  { name: t("feature3Name"), desc: t("feature3Desc") },
]);

const APP_ID = "miniapp-lottery";
const { address, connect, invokeRead, invokeContract, getContractHash } = useWallet();
const { list: listEvents } = useEvents();
const TICKET_PRICE = 0.1;

interface Winner {
  round: number;
  address: string;
  prize: number;
}

const { payGAS, isLoading } = usePayments(APP_ID);

const tickets = ref(1);
const round = ref(0);
const prizePool = ref(0);
const totalTickets = ref(0);
const userTickets = ref(0);
const winners = ref<Winner[]>([]);
const status = ref<{ msg: string; type: string } | null>(null);
const drawPending = ref(false);
const countdownLabel = computed(() => (drawPending.value ? t("drawing") : t("open")));
const contractHash = ref<string | null>(null);

// Lottery balls for visual display
const lotteryBalls = computed(() => {
  const seed = round.value;
  return Array.from({ length: 5 }, (_, i) => ((seed * 7 + i * 13) % 90) + 1);
});

// Countdown progress for circular ring
const countdownProgress = computed(() => {
  const circumference = 2 * Math.PI * 99;
  return drawPending.value ? circumference : 0;
});

const totalCost = computed(() => tickets.value * TICKET_PRICE);

const statsItems = computed<StatItem[]>(() => [
  { label: t("totalGames"), value: gamesPlayed.value },
  { label: t("totalTickets"), value: userTickets.value },
  { label: t("prizePool"), value: `${formatNum(prizePool.value)} GAS`, variant: "success" },
]);

const formatNum = (n: number, d = 2) => formatNumber(n, d);
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForEvent = async (txid: string, eventName: string) => {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const res = await listEvents({ app_id: APP_ID, event_name: eventName, limit: 25 });
    const match = res.events.find((evt) => evt.tx_hash === txid);
    if (match) return match;
    await sleep(1500);
  }
  return null;
};

const adjustTickets = (delta: number) => {
  tickets.value = Math.max(1, Math.min(100, tickets.value + delta));
};

const buyTickets = async () => {
  if (isLoading.value) return;
  try {
    status.value = { msg: t("purchasing"), type: "loading" };
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

    const payment = await payGAS(String(totalCost.value), `lottery:${round.value}:${tickets.value}`);
    const receiptId = payment.receipt_id;
    if (!receiptId) {
      throw new Error(t("receiptMissing"));
    }

    const tx = await invokeContract({
      scriptHash: contractHash.value as string,
      operation: "BuyTickets",
      args: [
        { type: "Hash160", value: address.value as string },
        { type: "Integer", value: String(tickets.value) },
        { type: "Integer", value: String(receiptId) },
      ],
    });

    const txid = String((tx as any)?.txid || (tx as any)?.txHash || "");
    if (txid) {
      await waitForEvent(txid, "TicketPurchased");
    }
    await fetchLotteryData();
    status.value = { msg: `${t("bought")} ${tickets.value} ${t("tickets")}`, type: "success" };
  } catch (e: any) {
    status.value = { msg: e.message || t("error"), type: "error" };
  }
};

// Fetch lottery data from contract
const fetchLotteryData = async () => {
  try {
    if (!contractHash.value) {
      contractHash.value = (await getContractHash()) as string;
    }
    if (!contractHash.value) {
      return;
    }

    const [roundRes, poolRes, ticketsRes, pendingRes] = await Promise.all([
      invokeRead({ contractHash: contractHash.value, operation: "CurrentRound" }),
      invokeRead({ contractHash: contractHash.value, operation: "PrizePool" }),
      invokeRead({ contractHash: contractHash.value, operation: "TotalTickets" }),
      invokeRead({ contractHash: contractHash.value, operation: "IsDrawPending" }),
    ]);

    const roundValue = Number(parseInvokeResult(roundRes) || 0);
    const poolValue = Number(parseInvokeResult(poolRes) || 0);
    const totalValue = Number(parseInvokeResult(ticketsRes) || 0);
    const pendingValue = Boolean(parseInvokeResult(pendingRes));

    round.value = roundValue;
    gamesPlayed.value = Math.max(roundValue - 1, 0);
    prizePool.value = poolValue / 1e8;
    totalTickets.value = totalValue;
    drawPending.value = pendingValue;

    const winnersRes = await listEvents({ app_id: APP_ID, event_name: "WinnerDrawn", limit: 10 });
    const winnerEvents = Array.isArray(winnersRes?.events) ? winnersRes.events : [];
    winners.value = winnerEvents.map((evt) => {
      const values = Array.isArray((evt as any).state) ? (evt as any).state.map(parseStackItem) : [];
      const winnerRaw = values[0];
      const prizeRaw = values[1];
      const roundRaw = values[2];
      const winnerHash = normalizeScriptHash(String(winnerRaw || ""));
      return {
        round: Number(roundRaw || 0),
        address: winnerHash ? `0x${winnerHash}` : String(winnerRaw || ""),
        prize: Number(prizeRaw || 0) / 1e8,
      };
    });

    if (!address.value) {
      userTickets.value = 0;
      return;
    }
    const userHash = addressToScriptHash(address.value);
    if (!userHash) {
      userTickets.value = 0;
      return;
    }
    const purchases = await listEvents({ app_id: APP_ID, event_name: "TicketPurchased", limit: 200 });
    const purchaseEvents = Array.isArray(purchases?.events) ? purchases.events : [];
    let userCount = 0;
    purchaseEvents.forEach((evt) => {
      const values = Array.isArray((evt as any).state) ? (evt as any).state.map(parseStackItem) : [];
      const playerRaw = normalizeScriptHash(String(values[0] || ""));
      const countRaw = Number(values[1] || 0);
      const roundRaw = Number(values[2] || 0);
      if (roundRaw === round.value && playerRaw === userHash) {
        userCount += countRaw;
      }
    });
    userTickets.value = userCount;
  } catch (e) {
    console.warn("[Lottery] Failed to fetch data:", e);
  }
};

let timer: number;

onMounted(() => {
  connect().finally(() => fetchLotteryData());
  timer = setInterval(() => {
    fetchLotteryData();
  }, 10000) as unknown as number;
});

onUnmounted(() => clearInterval(timer));
</script>

<style lang="scss" scoped>
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.tab-content {
  padding: 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.hero-fixed {
  background: none;
  padding: 0;
  border: none;
  box-shadow: none;
  margin-bottom: 24px;
  position: relative;
}

.hero-card {
  padding: 20px;
}

.countdown-container {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}
.countdown-circle {
  width: 180px;
  height: 180px;
  background: transparent;
  border: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow: none;
}
.countdown-ring {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}
.countdown-ring-bg {
  fill: none;
  stroke: rgba(255, 255, 255, 0.05);
  stroke-width: 14;
}
.countdown-ring-progress {
  fill: none;
  stroke: #00e599;
  stroke-width: 14;
  stroke-linecap: round;
  stroke-dasharray: 622;
  transition: stroke-dashoffset 1s linear;
  filter: drop-shadow(0 0 10px rgba(0, 229, 153, 0.3));
}
.countdown-text {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.countdown-time {
  font-family: $font-mono;
  font-weight: 800;
  font-size: 36px;
  color: white;
  border-bottom: none;
  font-style: normal;
  text-shadow: 0 0 20px rgba(0, 229, 153, 0.3);
}
.countdown-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--text-secondary, rgba(255, 255, 255, 0.5));
  margin-top: 4px;
  letter-spacing: 0.1em;
}

.lottery-balls {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 24px;
}
.lottery-ball {
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid var(--border-color, rgba(255, 255, 255, 0.1));
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: $font-mono;
  font-weight: 700;
  font-size: 18px;
  color: white;
  box-shadow: 0 0 15px rgba(0, 229, 153, 0.1);
  transition: all 0.3s;

  &.active {
    background: #00e599;
    color: black;
    box-shadow: 0 0 20px rgba(0, 229, 153, 0.4);
  }
}

.prize-pool-display {
  text-align: center;
  background: rgba(0, 0, 0, 0.2);
  padding: 20px;
  border: 1px solid var(--border-color, rgba(255, 255, 255, 0.05));
  border-radius: 16px;
  box-shadow: none;
}
.prize-label {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  color: #ffde59;
  letter-spacing: 0.1em;
  font-style: normal;
}
.prize-amount-container {
  display: flex;
  align-items: baseline;
  justify-content: center;
}
.prize-amount {
  font-family: $font-mono;
  font-weight: 800;
  font-size: 40px;
  color: white;
  text-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
}
.prize-currency {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-secondary, rgba(255, 255, 255, 0.5));
  margin-left: 8px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-top: 16px;
}
.stat-box {
  padding: 16px;
  background: var(--bg-card, rgba(255, 255, 255, 0.05));
  border: 1px solid var(--border-color, rgba(255, 255, 255, 0.1));
  border-radius: 16px;
  text-align: center;
  box-shadow: none;

  &.highlight {
    background: rgba(0, 229, 153, 0.1);
    border-color: #00e599;
    box-shadow: 0 0 15px rgba(0, 229, 153, 0.1);
  }
}
.stat-value {
  font-weight: 700;
  font-family: $font-mono;
  font-size: 18px;
  border-bottom: none;
  display: block;
  margin-bottom: 4px;
  font-style: normal;
  color: white;
}
.stat-label {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--text-secondary, rgba(255, 255, 255, 0.5));
}

.ticket-selector {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  margin: 24px 0;
  background: transparent;
  padding: 0;
  border: none;
  box-shadow: none;
}
.ticket-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.ticket-visual {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.mini-ticket {
  background: rgba(255, 255, 255, 0.1);
  padding: 8px;
  border-radius: 8px;
  color: white;
}
.ticket-count {
  font-size: 40px;
  font-weight: 800;
  font-family: $font-mono;
  color: white;
  font-style: normal;
}
.ticket-overflow {
  font-size: 12px;
  color: #00e599;
  font-weight: 700;
  background: rgba(0, 229, 153, 0.2);
  padding: 4px 8px;
  border-radius: 99px;
  margin-left: 8px;
}

.winners-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.winner-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: var(--bg-card, rgba(255, 255, 255, 0.03));
  border: 1px solid var(--border-color, rgba(255, 255, 255, 0.05));
  border-radius: 16px;
  box-shadow: none;
  transition: background 0.2s;

  &:hover {
    background: var(--bg-card, rgba(255, 255, 255, 0.05));
    transform: none;
    box-shadow: none;
  }
}
.winner-medal {
  font-size: 24px;
  background: rgba(255, 255, 255, 0.1);
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
}
.winner-info {
  display: flex;
  flex-direction: column;
  flex: 1;
  margin-left: 16px;
}
.winner-round {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  border-bottom: none;
  display: block;
  width: fit-content;
  font-style: normal;
  color: var(--text-secondary, rgba(255, 255, 255, 0.5));
}
.winner-addr {
  font-family: $font-mono;
  font-size: 14px;
  font-weight: 600;
  margin-top: 4px;
  color: white;
}
.winner-prize {
  font-weight: 700;
  font-family: $font-mono;
  color: #00e599;
  background: transparent;
  padding: 0;
  font-size: 16px;
  border: none;
  box-shadow: none;
}

.empty {
  text-align: center;
  color: var(--text-secondary, rgba(255, 255, 255, 0.5));
  font-size: 14px;
  padding: 24px;
}

.total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  margin-bottom: 24px;
}
.total-label {
  font-size: 14px;
  color: var(--text-secondary, rgba(255, 255, 255, 0.6));
}
.total-value {
  font-size: 20px;
  font-weight: 700;
  color: white;
  font-family: $font-mono;
}

.scrollable {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>
