<template>
  <AppLayout :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <view v-if="chainType === 'evm'" class="px-4 mb-4">
      <NeoCard variant="danger">
        <view class="flex flex-col items-center gap-2 py-1">
          <text class="text-center font-bold text-red-400">{{ t("wrongChain") }}</text>
          <text class="text-xs text-center opacity-80 text-white">{{ t("wrongChainMessage") }}</text>
          <NeoButton size="sm" variant="secondary" class="mt-2" @click="() => switchChain('neo-n3-mainnet')">{{ t("switchToNeo") }}</NeoButton>
        </view>
      </NeoCard>
    </view>

    <view v-if="activeTab === 'game'" class="game-layout">
      <!-- Scrollable Buy Section -->
      <view class="buy-section">
        <NeoCard variant="erobo-neo" class="ticket-purchase-card">
          <!-- Ticket Selector -->
          <view class="ticket-selector">
            <NeoButton variant="secondary" @click="adjustTickets(-1)" class="adjust-btn">−</NeoButton>
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
            <NeoButton variant="secondary" @click="adjustTickets(1)" class="adjust-btn">+</NeoButton>
          </view>

          <!-- Total Cost -->
          <view class="total-row glass-panel mb-4 flex justify-between items-center">
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

      <!-- Fixed Hero Section: Countdown + Prize Pool (non-scrollable) -->
      <view class="hero-fixed">
        <NeoCard
          v-if="status"
          :variant="status.type === 'error' ? 'danger' : status.type === 'loading' ? 'accent' : 'success'"
          class="mb-4 status-card"
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
      </view>
    </view>

    <!-- Winners Tab -->
    <view v-if="activeTab === 'winners'" class="tab-content scrollable">
      <NeoCard variant="erobo">
        <view class="winners-list">
          <text v-if="winners.length === 0" class="empty">{{ t("noWinners") }}</text>
          <view v-for="(w, i) in winners" :key="i" class="winner-item glass-panel">
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
      <view class="stats-grid mb-6">
        <view class="stat-box glass-panel">
          <AppIcon name="target" :size="24" class="mb-1 icon-dim" />
          <text class="stat-value">#{{ round }}</text>
          <text class="stat-label">{{ t("round") }}</text>
        </view>
        <view class="stat-box glass-panel">
          <AppIcon name="ticket" :size="24" class="mb-1 icon-dim" />
          <text class="stat-value">{{ totalTickets }}</text>
          <text class="stat-label">{{ t("total") }}</text>
        </view>
        <view class="stat-box glass-panel highlight">
          <AppIcon name="sparkle" :size="24" class="mb-1 icon-glow" />
          <text class="stat-value highlight-text">{{ userTickets }}</text>
          <text class="stat-label">{{ t("yours") }}</text>
        </view>
      </view>
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
  wrongChain: { en: "Wrong Network", zh: "网络错误" },
  wrongChainMessage: { en: "This app requires Neo N3 network.", zh: "此应用需 Neo N3 网络。" },
  switchToNeo: { en: "Switch to Neo N3", zh: "切换到 Neo N3" },
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
const { address, connect, invokeRead, invokeContract, chainType, switchChain, getContractAddress } = useWallet() as any;
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
const contractAddress = ref<string | null>(null);

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
    if (!address.value) {
      throw new Error(t("connectWallet"));
    }
    if (!contractAddress.value) {
      contractAddress.value = await getContractAddress();
    }
    if (!contractAddress.value) {
      throw new Error(t("contractUnavailable"));
    }

    const payment = await payGAS(String(totalCost.value), `lottery:${round.value}:${tickets.value}`);
    const receiptId = payment.receipt_id;
    if (!receiptId) {
      throw new Error(t("receiptMissing"));
    }

    const tx = await invokeContract({
      scriptHash: contractAddress.value as string,
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
    if (!contractAddress.value) {
      contractAddress.value = await getContractAddress();
    }
    if (!contractAddress.value) {
      return;
    }

    const [roundRes, poolRes, ticketsRes, pendingRes] = await Promise.all([
      invokeRead({ scriptHash: contractAddress.value, operation: "CurrentRound" }),
      invokeRead({ scriptHash: contractAddress.value, operation: "PrizePool" }),
      invokeRead({ scriptHash: contractAddress.value, operation: "TotalTickets" }),
      invokeRead({ scriptHash: contractAddress.value, operation: "IsDrawPending" }),
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
    let userCount = 0;
    let afterId: string | undefined;
    let hasMore = true;
    let pages = 0;
    const maxPages = 50;

    while (hasMore && pages < maxPages) {
      const purchases = await listEvents({
        app_id: APP_ID,
        event_name: "TicketPurchased",
        limit: 200,
        after_id: afterId,
      });
      const purchaseEvents = Array.isArray(purchases?.events) ? purchases.events : [];
      purchaseEvents.forEach((evt) => {
        const values = Array.isArray((evt as any).state) ? (evt as any).state.map(parseStackItem) : [];
        const playerRaw = normalizeScriptHash(String(values[0] || ""));
        const countRaw = Number(values[1] || 0);
        const roundRaw = Number(values[2] || 0);
        if (roundRaw === round.value && playerRaw === userHash) {
          userCount += countRaw;
        }
      });

      hasMore = Boolean(purchases?.has_more);
      afterId = purchases?.last_id || undefined;
      if (!afterId) break;
      pages += 1;
    }
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
@use "@/shared/styles/tokens.scss" as *;
@use "@/shared/styles/variables.scss";

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
  padding: 12px;
}

.glass-panel {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.countdown-container {
  display: flex;
  justify-content: center;
  margin-bottom: 12px;
}
.countdown-circle {
  width: 100px;
  height: 100px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow: inset 0 0 20px rgba(0,0,0,0.5);
  border: 1px solid rgba(255,255,255,0.05);
}
.countdown-ring {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
  position: absolute;
  top: 0;
  left: 0;
}
.countdown-ring-bg {
  fill: none;
  stroke: rgba(255, 255, 255, 0.05);
  stroke-width: 10;
}
.countdown-ring-progress {
  fill: none;
  stroke: #00e599;
  stroke-width: 10;
  stroke-linecap: round;
  stroke-dasharray: 622;
  transition: stroke-dashoffset 1s linear;
  filter: drop-shadow(0 0 5px rgba(0, 229, 153, 0.5));
}
.countdown-text {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.countdown-time {
  font-family: $font-mono;
  font-weight: 800;
  font-size: 24px;
  color: white;
  text-shadow: 0 0 10px rgba(0, 229, 153, 0.5);
  letter-spacing: 0.05em;
}
.countdown-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--text-secondary, rgba(255, 255, 255, 0.5));
  margin-top: 4px;
  letter-spacing: 0.2em;
}

.lottery-balls {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 16px;
  perspective: 1000px;
}
.lottery-ball {
  width: 40px;
  height: 40px;
  background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.95), rgba(200,200,255,0.1));
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: $font-mono;
  font-weight: 800;
  font-size: 16px;
  color: #1a1a1a;
  box-shadow: 
    inset -5px -5px 15px rgba(0,0,0,0.3),
    0 0 20px rgba(255,255,255,0.2);
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  backdrop-filter: blur(4px);
  position: relative;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    top: 5px; left: 10px;
    width: 15px; height: 10px;
    background: rgba(255,255,255,0.8);
    border-radius: 50%;
    filter: blur(2px);
  }

  /* Neon Variants based on nth-type or just specific active state */
  &:nth-child(1) { color: #db2777; text-shadow: 0 0 2px rgba(219,39,119,0.3); }
  &:nth-child(2) { color: #ea580c; text-shadow: 0 0 2px rgba(234,88,12,0.3); }
  &:nth-child(3) { color: #16a34a; text-shadow: 0 0 2px rgba(22,163,74,0.3); }
  &:nth-child(4) { color: #2563eb; text-shadow: 0 0 2px rgba(37,99,235,0.3); }
  &:nth-child(5) { color: #9333ea; text-shadow: 0 0 2px rgba(147,51,234,0.3); }

  &.active {
    transform: scale(1.1);
    background: radial-gradient(circle at 30% 30%, #fff, #00e599);
    border-color: #00e599;
    box-shadow: 0 0 30px #00e599;
    color: black;
  }
}

.prize-pool-display {
  text-align: center;
  background: linear-gradient(135deg, rgba(255, 222, 10, 0.1), rgba(255, 107, 107, 0.1));
  padding: 16px;
  border: 1px solid rgba(255, 222, 10, 0.2);
  border-radius: 16px;
  backdrop-filter: blur(10px);
  box-shadow: 0 0 20px rgba(255, 107, 107, 0.1);
}
.prize-label {
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  color: #ffde59;
  letter-spacing: 0.2em;
  margin-bottom: 8px;
  display: block;
}
.prize-amount-container {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 8px;
}
.prize-amount {
  font-family: $font-mono;
  font-weight: 900;
  font-size: 32px;
  background: linear-gradient(180deg, #fff, #ffde59);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow: 0 0 20px rgba(255, 222, 10, 0.3);
  line-height: 1;
}
.prize-currency {
  font-size: 16px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-top: 16px;
}
.stat-box {
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s;
  
  &.highlight {
    background: rgba(0, 229, 153, 0.1);
    border-color: rgba(0, 229, 153, 0.3);
    box-shadow: 0 0 20px rgba(0, 229, 153, 0.1);
  }
}
.icon-dim { opacity: 0.6; }
.icon-glow { filter: drop-shadow(0 0 5px rgba(0, 229, 153, 0.5)); color: #00e599; }

.stat-value {
  font-weight: 700;
  font-family: $font-mono;
  font-size: 20px;
  display: block;
  margin-bottom: 4px;
  color: white;
  
  &.highlight-text {
    color: #00e599;
    text-shadow: 0 0 10px rgba(0, 229, 153, 0.3);
  }
}
.stat-label {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.5);
  letter-spacing: 0.05em;
}

.ticket-selector {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  margin: 24px 0;
  padding: 0;
}
.adjust-btn {
  font-weight: 900;
  font-size: 24px;
  width: 48px;
  height: 48px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.ticket-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.ticket-visual {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.mini-ticket {
  background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05));
  padding: 8px;
  border-radius: 8px;
  color: #ffde59;
  border: 1px solid rgba(255, 222, 10, 0.3);
  box-shadow: 0 4px 10px rgba(0,0,0,0.2);
}
.ticket-count {
  font-size: 32px;
  font-weight: 800;
  font-family: $font-mono;
  color: white;
}
.ticket-overflow {
  font-size: 12px;
  color: #00e599;
  font-weight: 700;
  background: rgba(0, 229, 153, 0.2);
  padding: 4px 8px;
  border-radius: 99px;
  margin-left: 8px;
  border: 1px solid rgba(0, 229, 153, 0.3);
}

.total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  margin-bottom: 24px;
}
.total-label {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.6);
  letter-spacing: 0.05em;
}
.total-value {
  font-size: 24px;
  font-weight: 800;
  color: white;
  font-family: $font-mono;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.2);
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
  transition: background 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
  }
}
.winner-medal {
  font-size: 24px;
  background: rgba(255, 255, 255, 0.05);
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
}
.winner-info {
  display: flex;
  flex-direction: column;
  flex: 1;
  margin-left: 16px;
}
.winner-round {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.5);
  letter-spacing: 0.05em;
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
  font-size: 16px;
  text-shadow: 0 0 10px rgba(0, 229, 153, 0.3);
}

.empty {
  text-align: center;
  color: rgba(255, 255, 255, 0.4);
  font-size: 12px;
  padding: 32px;
  font-style: italic;
}

.scrollable {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>
