<template>
  <AppLayout :title="t('title')" show-top-nav :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <view v-if="activeTab === 'game'" class="tab-content">
      <view v-if="status" :class="['status-msg', status.type]">
        <text>{{ status.msg }}</text>
      </view>

      <!-- Crash Game Graph Area -->
      <view class="crash-graph-container">
        <canvas canvas-id="crashGraph" id="crashGraph" class="crash-canvas" @touchstart="handleCanvasTouch"></canvas>

        <!-- Rocket/Ship Element -->
        <view :class="['rocket', gameState]" :style="rocketStyle">
          <text class="rocket-icon">🚀</text>
        </view>

        <!-- Explosion Particles -->
        <view v-if="showExplosion" class="explosion-container">
          <view v-for="(particle, i) in explosionParticles" :key="i" class="particle" :style="particle.style"></view>
        </view>

        <!-- Large Multiplier Display -->
        <view class="multiplier-overlay">
          <text :class="['multiplier-huge', gameState]">{{ currentMultiplier.toFixed(2) }}x</text>
          <text class="game-status-overlay">{{ gameStatusText }}</text>
        </view>
      </view>

      <NeoCard :title="t('placeBet')">
        <view class="bet-row">
          <view class="input-group">
            <NeoButton variant="secondary" size="sm" @click="adjustBet(-0.1)">-</NeoButton>
            <NeoInput v-model="betAmount" type="number" :label="t('amountGAS')" suffix="GAS" class="bet-input" />
            <NeoButton variant="secondary" size="sm" @click="adjustBet(0.1)">+</NeoButton>
          </view>
        </view>
        <view class="bet-row">
          <NeoInput v-model="autoCashout" type="number" :label="t('autoCashout')" placeholder="2.0" suffix="x" />
        </view>
        <NeoButton
          :variant="gameState === 'running' && currentBet > 0 ? 'danger' : 'primary'"
          :class="{ 'pulse-button': gameState === 'running' && currentBet > 0 }"
          size="lg"
          block
          :loading="isLoading"
          @click="handleAction"
        >
          {{ actionButtonText }}
        </NeoButton>
      </NeoCard>

      <NeoCard :title="t('recentCrashes')">
        <view class="history-list">
          <view v-for="(h, i) in history" :key="i" :class="['history-item', h.multiplier >= 2 ? 'high' : 'low']">
            <text class="history-multiplier">{{ h.multiplier }}x</text>
          </view>
        </view>
      </NeoCard>

      <NeoCard variant="accent">
        <view class="stat-row">
          <text class="stat-label">{{ t("yourBet") }}</text>
          <text class="stat-value">{{ formatNum(currentBet) }} GAS</text>
        </view>
        <view class="stat-row">
          <text class="stat-label">{{ t("potentialWin") }}</text>
          <text class="stat-value success">{{ formatNum(potentialWin) }} GAS</text>
        </view>
      </NeoCard>
    </view>

    <view v-if="activeTab === 'stats'" class="tab-content scrollable">
      <view class="stats-card">
        <text class="stats-title">{{ t("statistics") }}</text>
        <view class="stat-row">
          <text class="stat-label">{{ t("totalGames") }}</text>
          <text class="stat-value">{{ history.length }}</text>
        </view>
        <view class="stat-row">
          <text class="stat-label">{{ t("yourBet") }}</text>
          <text class="stat-value">{{ formatNum(currentBet) }} GAS</text>
        </view>
        <view class="stat-row">
          <text class="stat-label">{{ t("potentialWin") }}</text>
          <text class="stat-value success">{{ formatNum(potentialWin) }} GAS</text>
        </view>
        <view class="stat-row">
          <text class="stat-label">{{ t("autoCashout") }}</text>
          <text class="stat-value">{{ autoCashout || "-" }}x</text>
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
import { formatNumber } from "@/shared/utils/format";
import { createT } from "@/shared/utils/i18n";
import AppLayout from "@/shared/components/AppLayout.vue";
import NeoDoc from "@/shared/components/NeoDoc.vue";
import NeoButton from "@/shared/components/NeoButton.vue";
import NeoInput from "@/shared/components/NeoInput.vue";
import NeoCard from "@/shared/components/NeoCard.vue";

const translations = {
  title: { en: "Neo Crash", zh: "Neo崩盘" },
  subtitle: { en: "Multiplier crash game", zh: "倍数崩盘游戏" },
  waiting: { en: "Waiting for next round...", zh: "等待下一轮..." },
  inProgress: { en: "Game in progress!", zh: "游戏进行中！" },
  crashed: { en: "CRASHED!", zh: "崩盘了！" },
  placeBet: { en: "Place Bet", zh: "下注" },
  cashOut: { en: "Cash Out", zh: "兑现" },
  wait: { en: "Wait...", zh: "等待..." },
  processing: { en: "Processing...", zh: "处理中..." },
  amountGAS: { en: "Amount (GAS)", zh: "数量（GAS）" },
  autoCashout: { en: "Auto Cashout", zh: "自动兑现" },
  recentCrashes: { en: "Recent Crashes", zh: "最近崩盘" },
  yourBet: { en: "Your Bet", zh: "你的下注" },
  potentialWin: { en: "Potential Win", zh: "潜在赢利" },
  placingBet: { en: "Placing bet...", zh: "下注中..." },
  betPlaced: { en: "Bet placed! Good luck!", zh: "下注成功！祝你好运！" },
  errorPlacingBet: { en: "Error placing bet", zh: "下注错误" },
  cashedOut: { en: "Cashed out at", zh: "兑现于" },
  crashedBetterLuck: { en: "Crashed! Better luck next time.", zh: "崩盘了！下次好运。" },
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
const APP_ID = "miniapp-neo-crash";
const { address, connect } = useWallet();
const { payGAS, isLoading } = usePayments(APP_ID);
const { requestRandom } = useRNG(APP_ID);

const betAmount = ref("1.0");
const autoCashout = ref("2.0");
const currentMultiplier = ref(1.0);
const gameState = ref<"waiting" | "running" | "crashed">("waiting");
const currentBet = ref(0);
const status = ref<{ msg: string; type: string } | null>(null);
const history = ref<Array<{ multiplier: number }>>([]);
const dataLoading = ref(true);
const crashPoint = ref(0); // VRF-determined crash point

// Canvas and animation state
const canvasContext = ref<any>(null);
const graphPoints = ref<Array<{ x: number; y: number }>>([]);
const showExplosion = ref(false);
const explosionParticles = ref<Array<{ style: string }>>([]);

// Rocket position based on multiplier
const rocketStyle = computed(() => {
  const progress = Math.min(100, (currentMultiplier.value - 1) * 10);
  const x = progress;
  const y = 100 - progress;
  return {
    left: `${x}%`,
    bottom: `${y}%`,
    opacity: gameState.value === "waiting" ? "0" : "1",
    transform: gameState.value === "crashed" ? "scale(0)" : "scale(1)",
  };
});

const gameStatusText = computed(() => {
  if (gameState.value === "waiting") return t("waiting");
  if (gameState.value === "running") return t("inProgress");
  return t("crashed");
});

const actionButtonText = computed(() => {
  if (isLoading.value) return t("processing");
  if (gameState.value === "waiting") return t("placeBet");
  if (gameState.value === "running" && currentBet.value > 0) return t("cashOut");
  return t("wait");
});

const potentialWin = computed(() => currentBet.value * currentMultiplier.value);

const formatNum = (n: number, d = 2) => formatNumber(n, d);

const adjustBet = (delta: number) => {
  const val = Math.max(0.1, parseFloat(betAmount.value) + delta);
  betAmount.value = val.toFixed(1);
};

const handleAction = async () => {
  if (isLoading.value) return;

  if (gameState.value === "waiting") {
    await placeBet();
  } else if (gameState.value === "running" && currentBet.value > 0) {
    cashOut();
  }
};

const placeBet = async () => {
  try {
    status.value = { msg: t("placingBet"), type: "loading" };
    await payGAS(betAmount.value, `crash:bet:${Date.now()}`);
    currentBet.value = parseFloat(betAmount.value);
    status.value = { msg: t("betPlaced"), type: "success" };
  } catch (e: any) {
    status.value = { msg: e.message || t("errorPlacingBet"), type: "error" };
  }
};

const cashOut = () => {
  const winAmount = potentialWin.value;
  status.value = {
    msg: `${t("cashedOut")} ${currentMultiplier.value}x! Won ${formatNum(winAmount)} GAS`,
    type: "success",
  };
  currentBet.value = 0;
};

// Initialize canvas
const initCanvas = () => {
  const query = uni.createSelectorQuery();
  query
    .select("#crashGraph")
    .fields({ node: true, size: true })
    .exec((res) => {
      if (res[0]) {
        const canvas = res[0].node;
        const ctx = canvas.getContext("2d");
        const dpr = uni.getSystemInfoSync().pixelRatio;
        canvas.width = res[0].width * dpr;
        canvas.height = res[0].height * dpr;
        ctx.scale(dpr, dpr);
        canvasContext.value = { ctx, width: res[0].width, height: res[0].height };
      }
    });
};

// Draw crash graph
const drawGraph = () => {
  if (!canvasContext.value) return;
  const { ctx, width, height } = canvasContext.value;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // Draw grid
  ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 5; i++) {
    const y = (height / 5) * i;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Draw curve
  if (graphPoints.value.length > 1) {
    const gradient = ctx.createLinearGradient(0, height, 0, 0);
    gradient.addColorStop(0, "#00e599");
    gradient.addColorStop(1, "#ffde59");

    ctx.strokeStyle = gameState.value === "crashed" ? "#ff4757" : gradient;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(graphPoints.value[0].x, graphPoints.value[0].y);

    for (let i = 1; i < graphPoints.value.length; i++) {
      ctx.lineTo(graphPoints.value[i].x, graphPoints.value[i].y);
    }
    ctx.stroke();
  }
};

// Trigger explosion effect
const triggerExplosion = () => {
  showExplosion.value = true;
  const particles = [];
  for (let i = 0; i < 20; i++) {
    const angle = (Math.PI * 2 * i) / 20;
    const velocity = 50 + Math.random() * 50;
    const x = Math.cos(angle) * velocity;
    const y = Math.sin(angle) * velocity;
    particles.push({
      style: `
        left: 50%;
        top: 50%;
        transform: translate(${x}px, ${y}px);
        animation-delay: ${Math.random() * 0.2}s;
      `,
    });
  }
  explosionParticles.value = particles;

  setTimeout(() => {
    showExplosion.value = false;
  }, 1000);
};

const handleCanvasTouch = () => {
  // Optional: handle touch interactions
};

// Fetch VRF crash point for next round
const fetchCrashPoint = async () => {
  try {
    const randomHex = await requestRandom(`crash:${Date.now()}`);
    if (randomHex) {
      // Convert hex to crash multiplier (1.0 - 10.0 range)
      const randomValue = parseInt(randomHex.slice(0, 8), 16) / 0xffffffff;
      crashPoint.value = 1.0 + randomValue * 9.0;
    } else {
      crashPoint.value = 1.5 + Math.random() * 3; // Fallback
    }
  } catch (e) {
    console.warn("[NeoCrash] VRF failed, using fallback:", e);
    crashPoint.value = 1.5 + Math.random() * 3;
  }
};

let gameTimer: number;
onMounted(() => {
  // Initialize canvas
  setTimeout(() => {
    initCanvas();
  }, 300);

  gameTimer = setInterval(() => {
    if (gameState.value === "waiting") {
      graphPoints.value = [];
      // Fetch VRF crash point before starting
      fetchCrashPoint();
      setTimeout(() => {
        gameState.value = "running";
        currentMultiplier.value = 1.0;
      }, 3000);
    } else if (gameState.value === "running") {
      currentMultiplier.value += 0.05;

      // Update graph points
      if (canvasContext.value) {
        const { width, height } = canvasContext.value;
        const progress = Math.min(1, (currentMultiplier.value - 1) / 9);
        const x = progress * width;
        const y = height - (Math.log(currentMultiplier.value) / Math.log(10)) * height * 0.8;
        graphPoints.value.push({ x, y });
        drawGraph();
      }

      if (autoCashout.value && currentBet.value > 0 && currentMultiplier.value >= parseFloat(autoCashout.value)) {
        cashOut();
      }

      // Use VRF-determined crash point instead of Math.random()
      if (currentMultiplier.value >= crashPoint.value) {
        gameState.value = "crashed";
        triggerExplosion();
        drawGraph();
        history.value.unshift({ multiplier: parseFloat(currentMultiplier.value.toFixed(2)) });
        history.value = history.value.slice(0, 10);
        if (currentBet.value > 0) {
          status.value = { msg: t("crashedBetterLuck"), type: "error" };
          currentBet.value = 0;
        }
        setTimeout(() => {
          gameState.value = "waiting";
          currentMultiplier.value = 1.0;
        }, 2000);
      }
    }
  }, 100);
});

onUnmounted(() => clearInterval(gameTimer));

// Fetch game history from contract
const fetchData = async () => {
  try {
    dataLoading.value = true;
    const sdk = await import("@neo/uniapp-sdk").then((m) => m.waitForSDK?.() || null);
    if (!sdk?.invoke) return;

    const data = (await sdk.invoke("neoCrash.getHistory", { appId: APP_ID, limit: 10 })) as Array<{
      multiplier: number;
    }> | null;
    if (data) {
      history.value = data;
    }
  } catch (e) {
    console.warn("[NeoCrash] Failed to fetch data:", e);
  } finally {
    dataLoading.value = false;
  }
};

fetchData();
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
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
}

// === CRASH GAME GRAPH ===
.crash-graph-container {
  position: relative;
  width: 100%;
  height: 300px;
  background: var(--bg-card);
  border: $border-width-lg solid var(--border-color);
  box-shadow: $shadow-lg;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  margin-bottom: $space-4;
}

.crash-canvas {
  width: 100%;
  flex: 1;
  min-height: 0;
  display: block;
}

.multiplier-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  pointer-events: none;
  z-index: 10;
}

.multiplier-huge {
  font-size: 4rem;
  font-weight: $font-weight-black;
  display: block;
  text-shadow: 3px 3px 0 rgba(0, 0, 0, 0.8);
  line-height: 1;
  margin-bottom: $space-2;
  transition: all $transition-fast;

  &.waiting {
    color: var(--text-secondary);
    font-size: 2rem;
  }

  &.running {
    color: var(--neo-green);
    animation: pulse-scale 0.5s ease-in-out infinite;
  }

  &.crashed {
    color: var(--brutal-red);
    animation: shake 0.3s ease-in-out;
  }
}

.game-status-overlay {
  color: var(--text-secondary);
  font-size: $font-size-sm;
  display: block;
  text-transform: uppercase;
  font-weight: $font-weight-bold;
  text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.8);
}

// === ROCKET ANIMATION ===
.rocket {
  position: absolute;
  font-size: 2rem;
  transition: all 0.1s linear;
  z-index: 20;
  filter: drop-shadow(0 0 10px color-mix(in srgb, var(--neo-green) 80%, transparent));

  &.running {
    animation: rocket-fly 0.3s ease-in-out infinite;
  }

  &.crashed {
    animation: rocket-explode 0.3s ease-out forwards;
  }
}

.rocket-icon {
  display: block;
  transform: rotate(-45deg);
}

// === EXPLOSION EFFECT ===
.explosion-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  flex: 1;
  min-height: 0;
  pointer-events: none;
  z-index: 30;
}

.particle {
  position: absolute;
  width: 8px;
  height: 8px;
  background: var(--brutal-red);
  border-radius: 50%;
  animation: particle-fade 1s ease-out forwards;
  box-shadow: 0 0 10px var(--brutal-yellow);
}

@keyframes particle-fade {
  0% {
    opacity: 1;
    transform: translate(0, 0) scale(1);
  }
  100% {
    opacity: 0;
    transform: translate(var(--x), var(--y)) scale(0);
  }
}

@keyframes pulse-scale {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-10px);
  }
  75% {
    transform: translateX(10px);
  }
}

@keyframes rocket-fly {
  0%,
  100% {
    transform: translateY(0) rotate(-45deg);
  }
  50% {
    transform: translateY(-5px) rotate(-45deg);
  }
}

@keyframes rocket-explode {
  0% {
    transform: scale(1) rotate(-45deg);
    opacity: 1;
  }
  100% {
    transform: scale(3) rotate(-45deg);
    opacity: 0;
  }
}

// === PULSE BUTTON ===
.pulse-button {
  animation: button-pulse 1s ease-in-out infinite;
  box-shadow: 0 0 0 0 var(--brutal-red);
}

@keyframes button-pulse {
  0% {
    box-shadow: 0 0 0 0 color-mix(in srgb, var(--brutal-red) 70%, transparent);
  }
  50% {
    box-shadow: 0 0 0 10px color-mix(in srgb, var(--brutal-red) 0%, transparent);
  }
  100% {
    box-shadow: 0 0 0 0 color-mix(in srgb, var(--brutal-red) 0%, transparent);
  }
}

// === STATUS MESSAGE ===
.status-msg {
  text-align: center;
  padding: $space-4;
  border: $border-width-md solid var(--border-color);
  box-shadow: $shadow-md;
  font-weight: $font-weight-bold;
  text-transform: uppercase;
  animation: slide-down 0.3s ease-out;

  &.success {
    background: var(--status-success);
    color: var(--neo-black);
    border-color: var(--border-color);
  }

  &.error {
    background: var(--status-error);
    color: var(--neo-white);
    border-color: var(--border-color);
  }

  &.loading {
    background: var(--neo-green);
    color: var(--neo-black);
    border-color: var(--border-color);
  }
}

@keyframes slide-down {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.bet-row {
  margin-bottom: $space-4;
}

// === INPUT AND BUTTON STYLES ===
.input-group {
  display: flex;
  align-items: center;
  gap: $space-2;
}

.bet-input,
.cashout-input {
  flex: 1;
}

// === HISTORY LIST ===
.history-list {
  display: flex;
  gap: $space-2;
  flex-wrap: wrap;
}

.history-item {
  padding: $space-2 $space-3;
  border: $border-width-sm solid var(--border-color);
  box-shadow: $shadow-sm;
  font-weight: $font-weight-bold;
  transition: transform $transition-fast;

  &:hover {
    transform: translateY(-2px);
  }

  &.high {
    background: var(--status-success);
    color: var(--neo-black);
  }

  &.low {
    background: var(--status-error);
    color: var(--neo-white);
  }
}

.history-multiplier {
  font-weight: $font-weight-bold;
}

// === STATS SECTION ===
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

  &.success {
    color: var(--status-success);
  }
}
</style>
