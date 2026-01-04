<template>
  <AppLayout :title="t('title')" show-top-nav :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <view v-if="activeTab === 'game'" class="tab-content">
      <view v-if="status" :class="['status-msg', status.type]">
        <text>{{ status.msg }}</text>
      </view>

      <!-- Hero Section: Countdown + Prize Pool -->
      <view class="hero-card">
        <view class="countdown-container">
          <view class="countdown-circle">
            <svg class="countdown-ring" viewBox="0 0 120 120">
              <circle class="countdown-ring-bg" cx="60" cy="60" r="54" />
              <circle
                class="countdown-ring-progress"
                cx="60"
                cy="60"
                r="54"
                :style="{ strokeDashoffset: countdownProgress }"
              />
            </svg>
            <view class="countdown-text">
              <text class="countdown-time">{{ countdown }}</text>
              <text class="countdown-label">{{ t("timeLeft") }}</text>
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
          <view class="prize-glow"></view>
        </view>
      </view>

      <!-- Stats Grid -->
      <view class="stats-grid">
        <view class="stat-box">
          <text class="stat-icon">🎯</text>
          <text class="stat-value">#{{ round }}</text>
          <text class="stat-label">{{ t("round") }}</text>
        </view>
        <view class="stat-box">
          <text class="stat-icon">🎫</text>
          <text class="stat-value">{{ totalTickets }}</text>
          <text class="stat-label">{{ t("total") }}</text>
        </view>
        <view class="stat-box highlight">
          <text class="stat-icon">✨</text>
          <text class="stat-value">{{ userTickets }}</text>
          <text class="stat-label">{{ t("yours") }}</text>
        </view>
      </view>

      <!-- Buy Tickets Section -->
      <view class="card ticket-purchase-card">
        <text class="card-title">{{ t("buyTickets") }}</text>

        <!-- Ticket Selector -->
        <view class="ticket-selector">
          <view class="ticket-btn" @click="adjustTickets(-1)">
            <text>−</text>
          </view>
          <view class="ticket-display">
            <view class="ticket-visual">
              <view
                v-for="n in Math.min(tickets, 5)"
                :key="n"
                class="mini-ticket"
                :style="{ transform: `translateX(${(n - 1) * -8}px) rotate(${(n - 1) * 5}deg)` }"
              >
                <text class="mini-ticket-text">🎫</text>
              </view>
              <text v-if="tickets > 5" class="ticket-overflow">+{{ tickets - 5 }}</text>
            </view>
            <text class="ticket-count">{{ tickets }} {{ t("ticketsLabel") }}</text>
          </view>
          <view class="ticket-btn" @click="adjustTickets(1)">
            <text>+</text>
          </view>
        </view>

        <!-- Total Cost -->
        <view class="total-row">
          <text class="total-label">{{ t("totalCost") }}</text>
          <text class="total-value">{{ formatNum(totalCost, 1) }} GAS</text>
        </view>

        <!-- Buy Button -->
        <view class="buy-btn" @click="buyTickets" :style="{ opacity: isLoading ? 0.6 : 1 }">
          <text class="buy-btn-text">{{ isLoading ? t("processing") : t("buyNow") }}</text>
          <text class="buy-btn-icon">💰</text>
        </view>
      </view>

      <!-- Recent Winners -->
      <view class="card winners-card">
        <text class="card-title">
          <text>🏆 {{ t("recentWinners") }}</text>
        </text>
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
      </view>
    </view>

    <!-- Stats Tab -->
    <view v-if="activeTab === 'stats'" class="tab-content scrollable">
      <view class="stats-card">
        <text class="stats-title">📊 {{ t("statistics") }}</text>
        <view class="stat-row">
          <text class="stat-label">{{ t("totalGames") }}</text>
          <text class="stat-value">{{ gamesPlayed }}</text>
        </view>
        <view class="stat-row">
          <text class="stat-label">{{ t("totalTickets") }}</text>
          <text class="stat-value">{{ userTickets }}</text>
        </view>
        <view class="stat-row">
          <text class="stat-label">{{ t("prizePool") }}</text>
          <text class="stat-value">{{ formatNum(prizePool) }} GAS</text>
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
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useWallet, usePayments, useRNG } from "@neo/uniapp-sdk";
import { formatNumber, hexToBytes, randomIntFromBytes } from "@/shared/utils/format";
import { createT } from "@/shared/utils/i18n";
import AppLayout from "@/shared/components/AppLayout.vue";

const translations = {
  title: { en: "Neo Lottery", zh: "Neo彩票" },
  subtitle: { en: "Provably fair draws", zh: "可证明公平抽奖" },
  game: { en: "Game", zh: "游戏" },
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
const gamesPlayed = ref(0);

const docSteps = computed(() => [t("step1"), t("step2"), t("step3")]);
const docFeatures = computed(() => [
  { name: t("feature1Name"), desc: t("feature1Desc") },
  { name: t("feature2Name"), desc: t("feature2Desc") },
]);

const APP_ID = "miniapp-lottery";
const { address, connect } = useWallet();
const TICKET_PRICE = 0.1;
const ROUND_DURATION = 60000;

interface Winner {
  round: number;
  address: string;
  prize: number;
}

const { payGAS, isLoading } = usePayments(APP_ID);
const { requestRandom } = useRNG(APP_ID);

const tickets = ref(1);
const countdown = ref("01:00");
const round = ref(1);
const prizePool = ref(12.5);
const totalTickets = ref(125);
const userTickets = ref(3);
const winners = ref<Winner[]>([
  { round: 12, address: "0xAbCdEf1234567890AbCdEf1234567890AbCdEf12", prize: 8.5 },
  { round: 11, address: "0x1234567890AbCdEf1234567890AbCdEf12345678", prize: 6.2 },
  { round: 10, address: "0xFeDcBa0987654321FeDcBa0987654321FeDcBa09", prize: 4.8 },
]);
const status = ref<{ msg: string; type: string } | null>(null);
const roundStart = ref(Date.now());
const remainingMs = ref(ROUND_DURATION);

// Lottery balls for visual display
const lotteryBalls = computed(() => {
  const seed = round.value;
  return Array.from({ length: 5 }, (_, i) => ((seed * 7 + i * 13) % 90) + 1);
});

// Countdown progress for circular ring
const countdownProgress = computed(() => {
  const circumference = 2 * Math.PI * 54;
  const progress = remainingMs.value / ROUND_DURATION;
  return circumference * (1 - progress);
});

const totalCost = computed(() => tickets.value * TICKET_PRICE);

const formatNum = (n: number, d = 2) => formatNumber(n, d);

const adjustTickets = (delta: number) => {
  tickets.value = Math.max(1, Math.min(100, tickets.value + delta));
};

const buyTickets = async () => {
  if (isLoading.value) return;
  try {
    status.value = { msg: t("purchasing"), type: "loading" };
    await payGAS(String(totalCost.value), `lottery:${round.value}:${tickets.value}`);
    status.value = { msg: `${t("bought")} ${tickets.value} ${t("tickets")}`, type: "success" };
    totalTickets.value += tickets.value;
    userTickets.value += tickets.value;
    prizePool.value += totalCost.value;
  } catch (e: any) {
    status.value = { msg: e.message || t("error"), type: "error" };
  }
};

let timer: number;
onMounted(() => {
  timer = setInterval(() => {
    const elapsed = Date.now() - roundStart.value;
    const remaining = Math.max(0, ROUND_DURATION - (elapsed % ROUND_DURATION));
    remainingMs.value = remaining;
    const mins = Math.floor(remaining / 60000);
    const secs = Math.floor((remaining % 60000) / 1000);
    countdown.value = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }, 100);
});

onUnmounted(() => clearInterval(timer));
</script>

<style lang="scss" scoped>
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.tab-content {
  padding: $space-4;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: $space-4;
  overflow: hidden;

  &.scrollable {
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }
}

.status-msg {
  text-align: center;
  padding: $space-4;
  border: $border-width-md solid var(--border-color);
  box-shadow: $shadow-md;
  font-weight: $font-weight-bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  animation: slideDown 0.3s ease-out;

  &.success {
    background: var(--status-success);
    color: var(--neo-black);
    border-color: var(--neo-black);
  }

  &.error {
    background: var(--status-error);
    color: var(--neo-white);
    border-color: var(--neo-black);
  }

  &.loading {
    background: var(--brutal-blue);
    color: var(--neo-black);
    border-color: var(--neo-black);
  }
}

// Hero Card with Countdown and Prize Pool
.hero-card {
  background: var(--bg-card);
  border: $border-width-md solid var(--border-color);
  box-shadow: $shadow-lg;
  padding: $space-6;
  margin-bottom: $space-4;
  position: relative;
  overflow: hidden;
}

// Countdown Circle
.countdown-container {
  display: flex;
  justify-content: center;
  margin-bottom: $space-5;
}

.countdown-circle {
  position: relative;
  width: 120px;
  height: 120px;
}

.countdown-ring {
  width: 100%;
  flex: 1;
  min-height: 0;
  transform: rotate(-90deg);
}

.countdown-ring-bg {
  fill: none;
  stroke: var(--bg-secondary);
  stroke-width: 8;
}

.countdown-ring-progress {
  fill: none;
  stroke: var(--neo-green);
  stroke-width: 8;
  stroke-linecap: round;
  stroke-dasharray: 339.292;
  transition: stroke-dashoffset 0.1s linear;
  filter: drop-shadow(0 0 8px var(--neo-green));
}

.countdown-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.countdown-time {
  display: block;
  font-size: $font-size-3xl;
  font-weight: $font-weight-black;
  color: var(--neo-green);
  font-family: $font-mono;
  text-shadow: 0 0 10px var(--neo-green);
  animation: pulse 2s ease-in-out infinite;
}

.countdown-label {
  display: block;
  font-size: $font-size-xs;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-top: $space-1;
}

// Lottery Balls
.lottery-balls {
  display: flex;
  justify-content: center;
  gap: $space-3;
  margin-bottom: $space-5;
  flex-wrap: wrap;
}

.lottery-ball {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--brutal-yellow) 0%, var(--brutal-orange) 100%);
  border: $border-width-md solid var(--neo-black);
  box-shadow:
    $shadow-md,
    0 0 20px rgba(var(--brutal-yellow-rgb), 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: ballBounce 2s ease-in-out infinite;
}

.ball-number {
  font-size: $font-size-xl;
  font-weight: $font-weight-black;
  color: var(--neo-black);
  font-family: $font-mono;
}

// Prize Pool Display
.prize-pool-display {
  text-align: center;
  position: relative;
  padding: $space-4;
  background: var(--bg-secondary);
  border: $border-width-md solid var(--border-color);
  box-shadow: $shadow-md;
}

.prize-label {
  display: block;
  font-size: $font-size-sm;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: $space-2;
}

.prize-amount-container {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: $space-2;
}

.prize-amount {
  font-size: $font-size-4xl;
  font-weight: $font-weight-black;
  color: var(--brutal-yellow);
  font-family: $font-mono;
  text-shadow: 0 0 20px var(--brutal-yellow);
  animation: glow 2s ease-in-out infinite;
}

.prize-currency {
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  color: var(--neo-green);
}

.prize-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(var(--brutal-yellow-rgb), 0.2) 0%, transparent 70%);
  pointer-events: none;
  animation: glowPulse 3s ease-in-out infinite;
}

// Stats Grid
.stats-grid {
  display: flex;
  gap: $space-3;
  margin-bottom: $space-4;
}

.stat-box {
  flex: 1;
  text-align: center;
  background: var(--bg-secondary);
  border: $border-width-md solid var(--border-color);
  box-shadow: $shadow-sm;
  padding: $space-4;
  transition:
    transform $transition-fast,
    box-shadow $transition-fast;

  &.highlight {
    background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-elevated) 100%);
    border-color: var(--neo-green);
  }

  &:active {
    transform: translate(2px, 2px);
    box-shadow: none;
  }
}

.stat-icon {
  display: block;
  font-size: $font-size-2xl;
  margin-bottom: $space-2;
}

.stat-value {
  color: var(--neo-green);
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  display: block;
  margin-bottom: $space-1;
}

.stat-label {
  color: var(--text-secondary);
  font-size: $font-size-xs;
  font-weight: $font-weight-medium;
  text-transform: uppercase;
  display: block;
}

// Card Base
.card {
  background: var(--bg-card);
  border: $border-width-md solid var(--border-color);
  box-shadow: $shadow-md;
  padding: $space-5;
  margin-bottom: $space-4;
}

.card-title {
  color: var(--neo-green);
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
  display: block;
  margin-bottom: $space-4;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

// Ticket Purchase Card
.ticket-purchase-card {
  background: linear-gradient(135deg, var(--bg-card) 0%, var(--bg-elevated) 100%);
}

.ticket-selector {
  display: flex;
  align-items: center;
  gap: $space-4;
  margin-bottom: $space-4;
}

.ticket-btn {
  width: 50px;
  height: 50px;
  background: var(--neo-green);
  border: $border-width-md solid var(--neo-black);
  box-shadow: $shadow-sm;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--neo-black);
  font-size: $font-size-2xl;
  font-weight: $font-weight-bold;
  cursor: pointer;
  transition:
    transform $transition-fast,
    box-shadow $transition-fast;

  &:active {
    transform: translate(2px, 2px);
    box-shadow: none;
  }
}

.ticket-display {
  flex: 1;
  text-align: center;
}

.ticket-visual {
  position: relative;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: $space-2;
}

.mini-ticket {
  position: absolute;
  font-size: 40px;
  transition: transform $transition-normal;
  animation: ticketFloat 3s ease-in-out infinite;
}

.mini-ticket-text {
  filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.3));
}

.ticket-overflow {
  position: absolute;
  right: -10px;
  top: 0;
  background: var(--brutal-orange);
  color: var(--neo-black);
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  padding: $space-1 $space-2;
  border-radius: 12px;
  border: 2px solid var(--neo-black);
}

.ticket-count {
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
  color: var(--text-primary);
}

.total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $space-3;
  background: var(--bg-secondary);
  border: $border-width-sm solid var(--border-color);
  margin-bottom: $space-4;
}

.total-label {
  color: var(--text-secondary);
  font-weight: $font-weight-medium;
  text-transform: uppercase;
  font-size: $font-size-sm;
}

.total-value {
  color: var(--neo-green);
  font-weight: $font-weight-black;
  font-size: $font-size-xl;
  font-family: $font-mono;
}

.buy-btn {
  background: linear-gradient(135deg, var(--brutal-yellow) 0%, var(--brutal-orange) 100%);
  color: var(--neo-black);
  padding: $space-4;
  border: $border-width-md solid var(--neo-black);
  box-shadow: $shadow-lg;
  text-align: center;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  cursor: pointer;
  transition:
    transform $transition-fast,
    box-shadow $transition-fast;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $space-2;
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    transform: rotate(45deg);
    animation: shine 3s infinite;
  }

  &:active {
    transform: translate(3px, 3px);
    box-shadow: none;
  }
}

.buy-btn-text {
  font-size: $font-size-lg;
  position: relative;
  z-index: 1;
}

.buy-btn-icon {
  font-size: $font-size-xl;
  position: relative;
  z-index: 1;
}

// Winners Card
.winners-card {
  background: var(--bg-card);
}

.winners-list {
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.empty {
  color: var(--text-secondary);
  text-align: center;
  font-weight: $font-weight-medium;
  padding: $space-4;
}

.winner-item {
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: $space-3;
  background: var(--bg-secondary);
  border: $border-width-sm solid var(--border-color);
  box-shadow: $shadow-sm;
  transition: transform $transition-fast;

  &:active {
    transform: translateX(2px);
  }
}

.winner-medal {
  font-size: $font-size-2xl;
  min-width: 40px;
  text-align: center;
}

.winner-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: $space-1;
}

.winner-round {
  color: var(--neo-green);
  font-weight: $font-weight-bold;
  font-size: $font-size-sm;
}

.winner-addr {
  color: var(--text-primary);
  font-family: $font-mono;
  font-size: $font-size-xs;
}

.winner-prize {
  color: var(--brutal-yellow);
  font-weight: $font-weight-black;
  font-size: $font-size-lg;
  font-family: $font-mono;
  text-shadow: 0 0 10px rgba(var(--brutal-yellow-rgb), 0.3);
}

// Stats Tab
.stats-card {
  background: var(--bg-card);
  border: $border-width-md solid var(--border-color);
  box-shadow: $shadow-md;
  padding: $space-5;
  margin-bottom: $space-3;
}

.stats-title {
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  color: var(--neo-green);
  margin-bottom: $space-4;
  display: block;
  text-transform: uppercase;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $space-3 0;
  border-bottom: $border-width-sm solid var(--border-color);

  &:last-child {
    border-bottom: none;
  }

  .stat-label {
    color: var(--text-secondary);
    font-size: $font-size-base;
  }

  .stat-value {
    font-weight: $font-weight-bold;
    color: var(--neo-green);
    font-size: $font-size-lg;
  }
}

// Animations
@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.9;
  }
}

@keyframes ballBounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes glow {
  0%,
  100% {
    text-shadow:
      0 0 20px var(--brutal-yellow),
      0 0 30px var(--brutal-yellow);
  }
  50% {
    text-shadow:
      0 0 30px var(--brutal-yellow),
      0 0 40px var(--brutal-yellow),
      0 0 50px var(--brutal-orange);
  }
}

@keyframes glowPulse {
  0%,
  100% {
    opacity: 0.3;
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    opacity: 0.6;
    transform: translate(-50%, -50%) scale(1.2);
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes ticketFloat {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

@keyframes shine {
  0% {
    left: -50%;
  }
  100% {
    left: 150%;
  }
}
</style>
