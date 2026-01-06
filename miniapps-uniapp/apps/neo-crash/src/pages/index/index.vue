<template>
  <AppLayout :title="t('title')" show-top-nav :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <view v-if="activeTab === 'game'" class="tab-content">
      <NeoCard
        v-if="status"
        :variant="status.type === 'error' ? 'danger' : status.type === 'loading' ? 'accent' : 'success'"
        class="mb-4 text-center"
      >
        <text class="font-bold">{{ status.msg }}</text>
      </NeoCard>

      <!-- Crash Game Graph Area -->
      <view class="crash-graph-container">
        <canvas canvas-id="crashGraph" id="crashGraph" class="crash-canvas" @touchstart="handleCanvasTouch"></canvas>

        <!-- Rocket/Ship Element -->
        <view :class="['rocket', gameState]" :style="rocketStyle">
          <view class="rocket-icon"><AppIcon name="rocket" :size="48" /></view>
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
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useWallet, usePayments, useEvents } from "@neo/uniapp-sdk";
import { formatNumber } from "@/shared/utils/format";
import { createT } from "@/shared/utils/i18n";
import { parseInvokeResult, parseStackItem } from "@/shared/utils/neo";
import { AppLayout, AppIcon, NeoDoc, NeoButton, NeoInput, NeoCard } from "@/shared/components";

const translations = {
  title: { en: "Neo Crash", zh: "Neo崩盘" },
  subtitle: { en: "Multiplier crash game", zh: "倍数崩盘游戏" },
  waiting: { en: "Waiting for next round...", zh: "等待下一轮..." },
  inProgress: { en: "Round running", zh: "回合进行中" },
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
  roundClosed: { en: "Betting is closed", zh: "下注已关闭" },
  roundNotRunning: { en: "Round not running", zh: "回合未开始" },
  invalidBet: { en: "Minimum bet is 0.05 GAS", zh: "最低下注 0.05 GAS" },
  invalidCashout: { en: "Auto cashout must be at least 1.00x", zh: "自动兑现至少 1.00x" },
  connectWallet: { en: "Connect wallet", zh: "请连接钱包" },
  contractUnavailable: { en: "Contract unavailable", zh: "合约不可用" },
  receiptMissing: { en: "Payment receipt missing", zh: "支付凭证缺失" },
  betPending: { en: "Bet confirmation pending", zh: "下注确认中" },
  cashoutPending: { en: "Cashout pending", zh: "兑现确认中" },
  game: { en: "Game", zh: "游戏" },
  stats: { en: "Stats", zh: "统计" },
  statistics: { en: "Statistics", zh: "统计数据" },
  totalGames: { en: "Total Games", zh: "总游戏数" },
  docs: { en: "Docs", zh: "文档" },
  docSubtitle: {
    en: "Multiplier crash game with VRF-powered randomness",
    zh: "使用 VRF 随机数的倍数崩盘游戏",
  },
  docDescription: {
    en: "Neo Crash is an exciting multiplier game where you bet GAS and watch the multiplier climb. Cash out before it crashes to win! Crash points are determined by verifiable random functions for provably fair gameplay.",
    zh: "Neo Crash 是一款刺激的倍数游戏，您下注 GAS 并观察倍数攀升。在崩盘前兑现即可获胜！崩盘点由可验证随机函数决定，确保可证明的公平游戏。",
  },
  step1: { en: "Place your bet with GAS before the round starts.", zh: "在回合开始前使用 GAS 下注。" },
  step2: { en: "Set an auto-cashout multiplier or watch manually.", zh: "设置自动兑现倍数或手动观察。" },
  step3: { en: "Cash out before the crash to lock in your winnings.", zh: "在崩盘前兑现以锁定您的奖金。" },
  step4: { en: "Review crash history to inform your strategy.", zh: "查看崩盘历史以制定您的策略。" },
  feature1Name: { en: "VRF Randomness", zh: "VRF 随机性" },
  feature1Desc: {
    en: "Crash points are generated using verifiable random functions.",
    zh: "崩盘点使用可验证随机函数生成。",
  },
  feature2Name: { en: "Real-Time Graph", zh: "实时图表" },
  feature2Desc: {
    en: "Watch the multiplier climb with animated rocket visualization.",
    zh: "通过动画火箭可视化观看倍数攀升。",
  },
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

const APP_ID = "miniapp-neo-crash";
const { address, connect, invokeContract, invokeRead, getContractHash } = useWallet();
const { payGAS, isLoading } = usePayments(APP_ID);
const { list: listEvents } = useEvents();

const betAmount = ref("1.0");
const autoCashout = ref("2.0");
const currentMultiplier = ref(1.0);
const currentBet = ref(0);
const status = ref<{ msg: string; type: string } | null>(null);
const history = ref<Array<{ multiplier: number }>>([]);
const contractHash = ref<string | null>(null);
const roundState = ref(0);
const currentRound = ref(1);
const crashFlash = ref(false);
const lastCrashEventId = ref<string | null>(null);
const lastMultiplier = ref(1.0);

// Canvas and animation state
const canvasContext = ref<any>(null);
const graphPoints = ref<Array<{ x: number; y: number }>>([]);
const showExplosion = ref(false);
const explosionParticles = ref<Array<{ style: string }>>([]);

const gameState = computed<"waiting" | "running" | "crashed">(() => {
  if (crashFlash.value) return "crashed";
  return roundState.value === 1 ? "running" : "waiting";
});

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

const toFixed8 = (value: string) => {
  const num = Number.parseFloat(value);
  if (!Number.isFinite(num)) return "0";
  return Math.floor(num * 1e8).toString();
};

const adjustBet = (delta: number) => {
  const val = Math.max(0.05, parseFloat(betAmount.value) + delta);
  betAmount.value = val.toFixed(2);
};

const ensureContractHash = async () => {
  if (!contractHash.value) {
    contractHash.value = await getContractHash();
  }
  if (!contractHash.value) throw new Error(t("contractUnavailable"));
  return contractHash.value;
};

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

const parseBetData = (data: any) => {
  if (!data) return null;
  if (Array.isArray(data)) {
    return {
      player: String(data[0] ?? ""),
      amount: Number(data[1] ?? 0),
      autoCashout: Number(data[2] ?? 0),
      cashedOut: Boolean(data[3]),
      cashoutMultiplier: Number(data[4] ?? 0),
    };
  }
  if (typeof data === "object") {
    return {
      player: String(data.player ?? ""),
      amount: Number(data.amount ?? 0),
      autoCashout: Number(data.autoCashout ?? 0),
      cashedOut: Boolean(data.cashedOut ?? false),
      cashoutMultiplier: Number(data.cashoutMultiplier ?? 0),
    };
  }
  return null;
};

const updateGraphPoint = (multiplier: number) => {
  if (!canvasContext.value) return;
  const { width, height } = canvasContext.value;
  const progress = Math.min(1, (multiplier - 1) / 9);
  const x = progress * width;
  const y = height - (Math.log(multiplier) / Math.log(10)) * height * 0.8;
  graphPoints.value.push({ x, y });
  drawGraph();
};

const refreshRoundState = async () => {
  try {
    if (!contractHash.value) {
      contractHash.value = await getContractHash();
    }
    if (!contractHash.value) return;
    const [roundRes, stateRes, multRes] = await Promise.all([
      invokeRead({ contractHash: contractHash.value, operation: "CurrentRound" }),
      invokeRead({ contractHash: contractHash.value, operation: "RoundState" }),
      invokeRead({ contractHash: contractHash.value, operation: "GetCurrentMultiplier" }),
    ]);
    currentRound.value = Number(parseInvokeResult(roundRes) || 1);
    roundState.value = Number(parseInvokeResult(stateRes) || 0);
    const rawMultiplier = Number(parseInvokeResult(multRes) || 0);
    const nextMultiplier = rawMultiplier > 0 ? rawMultiplier / 100 : 1;

    if (roundState.value !== 1) {
      graphPoints.value = [];
      lastMultiplier.value = 1;
      currentMultiplier.value = 1;
      drawGraph();
      return;
    }

    if (nextMultiplier > lastMultiplier.value) {
      lastMultiplier.value = nextMultiplier;
      currentMultiplier.value = nextMultiplier;
      updateGraphPoint(nextMultiplier);
    }
  } catch (e) {
    console.warn("[NeoCrash] Failed to refresh round state:", e);
  }
};

const refreshCurrentBet = async () => {
  if (!address.value || !contractHash.value) {
    currentBet.value = 0;
    return;
  }
  try {
    const betRes = await invokeRead({
      contractHash: contractHash.value,
      operation: "GetBet",
      args: [
        { type: "Integer", value: String(currentRound.value) },
        { type: "Hash160", value: address.value },
      ],
    });
    const parsed = parseBetData(parseInvokeResult(betRes));
    if (!parsed || !parsed.player) {
      currentBet.value = 0;
      return;
    }
    if (parsed.cashedOut) {
      currentBet.value = 0;
      return;
    }
    currentBet.value = parsed.amount ? parsed.amount / 1e8 : 0;
  } catch (e) {
    console.warn("[NeoCrash] Failed to refresh bet:", e);
  }
};

const refreshHistory = async () => {
  try {
    const res = await listEvents({ app_id: APP_ID, event_name: "CrashRoundEnded", limit: 10 });
    history.value = res.events.map((evt) => {
      const values = Array.isArray((evt as any)?.state) ? (evt as any).state.map(parseStackItem) : [];
      const crashPoint = Number(values[0] ?? 0) / 100;
      return { multiplier: Number(crashPoint.toFixed(2)) };
    });
  } catch (e) {
    console.warn("[NeoCrash] Failed to load history:", e);
  }
};

const refreshLatestCrash = async () => {
  try {
    const res = await listEvents({ app_id: APP_ID, event_name: "CrashRoundEnded", limit: 1 });
    const latest = res.events[0];
    if (!latest || latest.id === lastCrashEventId.value) return;
    lastCrashEventId.value = latest.id;
    const values = Array.isArray((latest as any)?.state) ? (latest as any).state.map(parseStackItem) : [];
    const crashPoint = Number(values[0] ?? 0) / 100;
    history.value.unshift({ multiplier: Number(crashPoint.toFixed(2)) });
    history.value = history.value.slice(0, 10);

    crashFlash.value = true;
    triggerExplosion();
    setTimeout(() => {
      crashFlash.value = false;
    }, 1500);
  } catch (e) {
    console.warn("[NeoCrash] Failed to fetch latest crash:", e);
  }
};

const handleAction = async () => {
  if (isLoading.value) return;

  if (gameState.value === "waiting") {
    await placeBet();
  } else if (gameState.value === "running" && currentBet.value > 0) {
    await cashOut();
  }
};

const placeBet = async () => {
  try {
    status.value = { msg: t("placingBet"), type: "loading" };
    if (!address.value) await connect();
    if (!address.value) throw new Error(t("connectWallet"));
    const contract = await ensureContractHash();

    if (roundState.value !== 0) throw new Error(t("roundClosed"));
    const betValue = Number(betAmount.value);
    if (!Number.isFinite(betValue) || betValue < 0.05) throw new Error(t("invalidBet"));
    const autoValue = Number(autoCashout.value);
    if (!Number.isFinite(autoValue) || autoValue < 1) throw new Error(t("invalidCashout"));
    const autoScaled = Math.round(autoValue * 100);

    const payment = await payGAS(betAmount.value, `crash:bet:${currentRound.value}`);
    const receiptId = payment.receipt_id;
    if (!receiptId) throw new Error(t("receiptMissing"));

    const tx = await invokeContract({
      scriptHash: contract,
      operation: "PlaceBet",
      args: [
        { type: "Hash160", value: address.value },
        { type: "Integer", value: toFixed8(betAmount.value) },
        { type: "Integer", value: String(autoScaled) },
        { type: "Integer", value: receiptId },
      ],
    });

    const txid = String((tx as any)?.txid || (tx as any)?.txHash || "");
    const placedEvt = txid ? await waitForEvent(txid, "CrashBetPlaced") : null;
    if (!placedEvt) throw new Error(t("betPending"));

    currentBet.value = betValue;
    status.value = { msg: t("betPlaced"), type: "success" };
  } catch (e: any) {
    status.value = { msg: e?.message || t("errorPlacingBet"), type: "error" };
  }
};

const cashOut = async () => {
  try {
    status.value = { msg: t("processing"), type: "loading" };
    if (!address.value) await connect();
    if (!address.value) throw new Error(t("connectWallet"));
    const contract = await ensureContractHash();
    if (roundState.value !== 1) throw new Error(t("roundNotRunning"));

    const multiplierScaled = Math.round(currentMultiplier.value * 100);
    const tx = await invokeContract({
      scriptHash: contract,
      operation: "CashOut",
      args: [
        { type: "Hash160", value: address.value },
        { type: "Integer", value: String(multiplierScaled) },
      ],
    });

    const txid = String((tx as any)?.txid || (tx as any)?.txHash || "");
    const cashEvt = txid ? await waitForEvent(txid, "CrashCashedOut") : null;
    if (!cashEvt) throw new Error(t("cashoutPending"));

    const values = Array.isArray((cashEvt as any)?.state) ? (cashEvt as any).state.map(parseStackItem) : [];
    const payout = Number(values[1] ?? 0) / 1e8;
    const multiplier = Number(values[2] ?? multiplierScaled) / 100;
    status.value = {
      msg: `${t("cashedOut")} ${multiplier.toFixed(2)}x! Won ${formatNum(payout)} GAS`,
      type: "success",
    };
    currentBet.value = 0;
  } catch (e: any) {
    status.value = { msg: e?.message || t("roundNotRunning"), type: "error" };
  }
};

// Initialize canvas
const initCanvas = () => {
  const query = uni.createSelectorQuery();
  query
    .select("#crashGraph")
    .fields({ node: true, size: true }, () => {})
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
    const velocity = 60 + i * 2;
    const x = Math.cos(angle) * velocity;
    const y = Math.sin(angle) * velocity;
    particles.push({
      style: `
        left: 50%;
        top: 50%;
        transform: translate(${x}px, ${y}px);
        animation-delay: ${((i % 5) * 0.05).toFixed(2)}s;
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

let pollTimer: number;
onMounted(async () => {
  setTimeout(() => {
    initCanvas();
  }, 300);

  await refreshRoundState();
  await refreshHistory();
  await refreshLatestCrash();
  await refreshCurrentBet();

  pollTimer = setInterval(async () => {
    await refreshRoundState();
    await refreshLatestCrash();
    if (address.value) {
      await refreshCurrentBet();
    }
  }, 2000) as unknown as number;
});

onUnmounted(() => clearInterval(pollTimer));

watch(address, async () => {
  await refreshCurrentBet();
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
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

// === CRASH GAME GRAPH ===
.crash-graph-container {
  position: relative;
  width: 100%;
  height: 300px;
  background: white;
  border: 4px solid black;
  box-shadow: 10px 10px 0 black;
  margin-bottom: $space-6;
  overflow: hidden;
}

.crash-canvas {
  width: 100%;
  height: 100%;
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
  font-size: 80px;
  font-weight: $font-weight-black;
  display: block;
  line-height: 1;
  margin-bottom: $space-2;
  transition: all $transition-fast;
  color: black;
  -webkit-text-stroke: 1px rgba(255, 255, 255, 0.5);

  &.waiting {
    color: #888;
    font-size: 40px;
  }
  &.running {
    color: black;
    animation: pulse-scale 0.5s ease-in-out infinite;
  }
  &.crashed {
    color: var(--brutal-red);
    animation: shake 0.3s ease-in-out;
  }
}

.game-status-overlay {
  color: white;
  background: black;
  font-size: 10px;
  display: inline-block;
  padding: 2px 8px;
  text-transform: uppercase;
  font-weight: $font-weight-black;
  border: 1px solid black;
}

// === ROCKET ANIMATION ===
.rocket {
  position: absolute;
  width: 50px;
  height: 50px;
  transition: all 0.1s linear;
  z-index: 20;
  color: black;
  filter: drop-shadow(2px 2px 0 black);

  &.running {
    animation: rocket-fly 0.3s ease-in-out infinite;
  }
}

.rocket-icon {
  display: block;
  transform: rotate(-45deg);
  width: 100%;
  height: 100%;
}

// === PULSE BUTTON ===
.pulse-button {
  box-shadow: 6px 6px 0 black;
}

// === HISTORY LIST ===
.history-list {
  display: flex;
  gap: $space-2;
  flex-wrap: wrap;
}

.history-item {
  padding: $space-2 $space-4;
  border: 2px solid black;
  font-weight: $font-weight-black;
  font-family: $font-mono;
  font-size: 14px;
  box-shadow: 2px 2px 0 black;

  &.high {
    background: var(--neo-green);
    color: black;
  }
  &.low {
    background: var(--brutal-red);
    color: white;
  }
}

// === STATS SECTION ===
.stats-card {
  background: white;
  border: 4px solid black;
  box-shadow: 8px 8px 0 black;
  padding: $space-6;
  margin-bottom: $space-4;
}

.stats-title {
  font-size: 20px;
  font-weight: $font-weight-black;
  color: black;
  margin-bottom: $space-4;
  display: block;
  text-transform: uppercase;
  border-bottom: 3px solid black;
  padding-bottom: $space-1;
}

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
.stat-value.success {
  background: var(--neo-green);
  padding: 2px 8px;
  border: 1px solid black;
}

// === BET ROW ===
.bet-row {
  margin-bottom: $space-4;
}
.input-group {
  display: flex;
  align-items: center;
  gap: $space-3;
}

@keyframes pulse-scale {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
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
    transform: translateY(-3px) rotate(-45deg);
  }
}
</style>
