<template>
  <AppLayout :title="t('title')" show-top-nav :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <view v-if="activeTab === 'game'" class="tab-content">
      <NeoCard v-if="status" :variant="status.type === 'error' ? 'danger' : 'success'" class="mb-4 text-center">
        <text class="font-bold">{{ status.msg }}</text>
      </NeoCard>

      <!-- Dramatic Countdown Display -->
      <NeoCard variant="accent" :class="['doomsday-clock-card', dangerLevel]">
        <view class="clock-header">
          <text class="clock-label">{{ t("timeUntilEvent") }}</text>
          <view :class="['danger-badge', dangerLevel]">
            <text class="danger-text">{{ dangerLevelText }}</text>
          </view>
        </view>

        <view class="clock-display">
          <text :class="['clock-time', dangerLevel, { pulse: shouldPulse }]">{{ countdown }}</text>
        </view>

        <!-- Danger Level Meter -->
        <view class="danger-meter">
          <view class="meter-labels">
            <text class="meter-label">{{ t("safe") }}</text>
            <text class="meter-label">{{ t("critical") }}</text>
          </view>
          <view class="meter-bar">
            <view :class="['meter-fill', dangerLevel]" :style="{ width: dangerProgress + '%' }"></view>
            <view class="meter-indicator" :style="{ left: dangerProgress + '%' }"></view>
          </view>
        </view>

        <!-- Event Description -->
        <view class="event-description">
          <text class="event-title">{{ t("nextEvent") }}</text>
          <text class="event-text">{{ currentEventDescription }}</text>
        </view>
      </NeoCard>

      <!-- Stats Grid -->
      <NeoCard>
        <view class="stats-grid">
          <NeoCard class="flex-1 text-center">
            <text class="stat-value">{{ formatNum(totalPot) }}</text>
            <text class="stat-label">{{ t("totalPot") }}</text>
          </NeoCard>
          <NeoCard class="flex-1 text-center">
            <text class="stat-value">{{ userKeys }}</text>
            <text class="stat-label">{{ t("yourKeys") }}</text>
          </NeoCard>
          <NeoCard class="flex-1 text-center">
            <text class="stat-value">#{{ roundId }}</text>
            <text class="stat-label">{{ t("round") }}</text>
          </NeoCard>
        </view>
        <view class="stats-subgrid">
          <view class="stat-row">
            <text class="stat-row-label">{{ t("lastBuyer") }}</text>
            <text class="stat-row-value">{{ lastBuyerLabel }}</text>
          </view>
          <view class="stat-row">
            <text class="stat-row-label">{{ t("roundStatus") }}</text>
            <text class="stat-row-value" :class="{ active: isRoundActive }">
              {{ isRoundActive ? t("activeRound") : t("inactiveRound") }}
            </text>
          </view>
        </view>
      </NeoCard>

      <!-- Buy Keys Section -->
      <NeoCard>
        <text class="card-title">{{ t("buyKeys") }}</text>
        <NeoInput v-model="keyCount" type="number" :placeholder="t('keyCountPlaceholder')" suffix="Keys" />
        <view class="cost-row">
          <text class="cost-label">{{ t("estimatedCost") }}</text>
          <text class="cost-value">{{ estimatedCost }} GAS</text>
        </view>
        <text class="hint-text">{{ t("keyPrice") }}</text>
        <NeoButton variant="primary" size="lg" block @click="buyKeys" :disabled="isPaying">
          {{ isPaying ? t("buying") : t("buyKeys") }}
        </NeoButton>
      </NeoCard>
    </view>

    <view v-if="activeTab === 'history'" class="tab-content scrollable">
      <NeoCard :title="t('eventHistory')">
        <view v-if="history.length === 0" class="empty-state">
          <text>{{ t("noHistory") }}</text>
        </view>
        <view class="history-list">
          <view v-for="event in history" :key="event.id" class="history-item">
            <view class="history-header">
              <text class="history-title">{{ event.title }}</text>
              <text class="history-date">{{ event.date }}</text>
            </view>
            <text class="history-desc">{{ event.details }}</text>
          </view>
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
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useWallet, usePayments, useEvents } from "@neo/uniapp-sdk";
import { formatNumber, formatAddress } from "@/shared/utils/format";
import { createT } from "@/shared/utils/i18n";
import { parseInvokeResult, parseStackItem } from "@/shared/utils/neo";
import { AppLayout, NeoButton, NeoCard, NeoInput, NeoDoc } from "@/shared/components";

const translations = {
  title: { en: "Doomsday Clock", zh: "末日时钟" },
  subtitle: { en: "Time-locked governance events", zh: "时间锁定治理事件" },
  timeUntilEvent: { en: "Time Until Event", zh: "距离事件" },
  totalPot: { en: "Total Pot", zh: "奖池总额" },
  yourKeys: { en: "Your Keys", zh: "你的钥匙" },
  round: { en: "Round", zh: "轮次" },
  lastBuyer: { en: "Last Buyer", zh: "最后购买者" },
  roundStatus: { en: "Round Status", zh: "轮次状态" },
  activeRound: { en: "Active", zh: "进行中" },
  inactiveRound: { en: "Inactive", zh: "未开始" },
  buyKeys: { en: "Buy Keys", zh: "购买钥匙" },
  buying: { en: "Buying...", zh: "购买中..." },
  keyCountPlaceholder: { en: "1", zh: "1" },
  estimatedCost: { en: "Estimated Cost", zh: "预估花费" },
  keyPrice: { en: "Key price: 1 GAS each", zh: "单价：1 GAS/钥匙" },
  totalStaked: { en: "Total Staked", zh: "总质押" },
  yourStake: { en: "Your Stake", zh: "您的质押" },
  players: { en: "Players", zh: "参与者" },
  stakeOnOutcome: { en: "Stake on Outcome", zh: "押注结果" },
  amountToStake: { en: "Amount to stake", zh: "质押数量" },
  staking: { en: "Staking...", zh: "质押中..." },
  placeStake: { en: "Place Stake", zh: "下注" },
  eventHistory: { en: "Event History", zh: "事件历史" },
  noHistory: { en: "No events yet", zh: "暂无事件记录" },
  selectOutcome: { en: "Select an outcome", zh: "请选择一个结果" },
  minStake: { en: "Min stake: 1 GAS", zh: "最小质押：1 GAS" },
  placingStake: { en: "Placing stake...", zh: "正在质押..." },
  stakePlaced: { en: "Stake placed!", zh: "质押成功！" },
  error: { en: "Error", zh: "错误" },
  failedToLoad: { en: "Failed to load data", zh: "加载数据失败" },
  missingContract: { en: "Contract not configured", zh: "合约未配置" },
  keysPurchased: { en: "Keys purchased", zh: "钥匙购买成功" },
  roundStarted: { en: "Round started", zh: "新一轮开始" },
  winnerDeclared: { en: "Winner declared", zh: "赢家已揭晓" },
  protocolUpgrade: { en: "Protocol Upgrade", zh: "协议升级" },
  treasuryRelease: { en: "Treasury Release", zh: "国库释放" },
  governanceVote: { en: "Governance Vote", zh: "治理投票" },
  emergencyProposal: { en: "Emergency Proposal", zh: "紧急提案" },
  passed: { en: "Passed", zh: "通过" },
  feeAdjustment: { en: "Fee Adjustment", zh: "费用调整" },
  failed: { en: "Failed", zh: "失败" },
  game: { en: "Game", zh: "游戏" },
  history: { en: "History", zh: "历史" },
  docs: { en: "Docs", zh: "文档" },
  docSubtitle: {
    en: "Last-buyer-wins countdown game with growing prize pool",
    zh: "最后购买者获胜的倒计时游戏，奖池持续增长",
  },
  docDescription: {
    en: "Doomsday Clock is a thrilling countdown game where buying keys extends the timer and adds to the prize pool. When the clock hits zero, the last person to buy a key wins the entire pot. Watch the danger meter rise as time runs out!",
    zh: "末日时钟是一款刺激的倒计时游戏，购买钥匙可延长计时器并增加奖池。当时钟归零时，最后购买钥匙的人赢得全部奖池。随着时间流逝，观察危险指数上升！",
  },
  step1: { en: "Connect your Neo wallet and check the current round status.", zh: "连接 Neo 钱包并查看当前轮次状态。" },
  step2: { en: "Buy keys with GAS to extend the countdown timer.", zh: "使用 GAS 购买钥匙延长倒计时。" },
  step3: { en: "Monitor the danger level as time decreases.", zh: "随着时间减少监控危险等级。" },
  step4: { en: "Be the last buyer when time expires to win the pot.", zh: "在时间结束时成为最后购买者赢得奖池。" },
  feature1Name: { en: "Dynamic Prize Pool", zh: "动态奖池" },
  feature1Desc: {
    en: "Every key purchase adds to the pot and extends the timer.",
    zh: "每次购买钥匙都会增加奖池并延长计时器。",
  },
  feature2Name: { en: "Real-Time Danger Meter", zh: "实时危险指数" },
  feature2Desc: {
    en: "Visual indicator shows urgency as countdown approaches zero.",
    zh: "可视化指标显示倒计时接近零时的紧迫程度。",
  },
  safe: { en: "SAFE", zh: "安全" },
  critical: { en: "CRITICAL", zh: "危急" },
  nextEvent: { en: "NEXT EVENT", zh: "下一事件" },
  dangerLow: { en: "LOW RISK", zh: "低风险" },
  dangerMedium: { en: "ELEVATED", zh: "警戒" },
  dangerHigh: { en: "HIGH ALERT", zh: "高度警戒" },
  dangerCritical: { en: "CRITICAL", zh: "危急" },
};

const t = createT(translations);

const navTabs = [
  { id: "game", icon: "game", label: t("game") },
  { id: "history", icon: "time", label: t("history") },
  { id: "docs", icon: "book", label: t("docs") },
];
const activeTab = ref("game");

const docSteps = computed(() => [t("step1"), t("step2"), t("step3"), t("step4")]);
const docFeatures = computed(() => [
  { name: t("feature1Name"), desc: t("feature1Desc") },
  { name: t("feature2Name"), desc: t("feature2Desc") },
]);

const APP_ID = "miniapp-doomsday-clock";
const KEY_PRICE_GAS = 1;
const MAX_DURATION_SECONDS = 86400;

const { address, connect, invokeRead, invokeContract, getContractHash } = useWallet();
const { payGAS, isLoading: isPaying } = usePayments(APP_ID);
const { list: listEvents } = useEvents();

interface HistoryEvent {
  id: number;
  title: string;
  details: string;
  date: string;
}

const contractHash = ref<string | null>(null);
const roundId = ref(0);
const totalPot = ref(0);
const endTime = ref(0);
const isRoundActive = ref(false);
const lastBuyer = ref<string | null>(null);
const userKeys = ref(0);
const keyCount = ref("1");
const status = ref<{ msg: string; type: string } | null>(null);
const history = ref<HistoryEvent[]>([]);
const now = ref(Date.now());
const loading = ref(false);

const formatNum = (value: number) => formatNumber(value, 2);
const toGas = (value: any) => Number(value || 0) / 1e8;

const timeRemainingSeconds = computed(() => {
  if (!endTime.value) return 0;
  return Math.max(0, Math.floor((endTime.value * 1000 - now.value) / 1000));
});

const countdown = computed(() => {
  const total = timeRemainingSeconds.value;
  const hours = String(Math.floor(total / 3600)).padStart(2, "0");
  const mins = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const secs = String(total % 60).padStart(2, "0");
  return `${hours}:${mins}:${secs}`;
});

const dangerLevel = computed(() => {
  const seconds = timeRemainingSeconds.value;
  if (seconds > 7200) return "low";
  if (seconds > 3600) return "medium";
  if (seconds > 600) return "high";
  return "critical";
});

const dangerLevelText = computed(() => {
  switch (dangerLevel.value) {
    case "low":
      return t("dangerLow");
    case "medium":
      return t("dangerMedium");
    case "high":
      return t("dangerHigh");
    case "critical":
      return t("dangerCritical");
    default:
      return t("dangerLow");
  }
});

const dangerProgress = computed(() => {
  if (!timeRemainingSeconds.value) return 0;
  return Math.min(100, (timeRemainingSeconds.value / MAX_DURATION_SECONDS) * 100);
});

const shouldPulse = computed(() => timeRemainingSeconds.value <= 600);

const estimatedCost = computed(() => {
  const count = Math.max(0, Math.floor(Number(keyCount.value) || 0));
  return (count * KEY_PRICE_GAS).toFixed(0);
});

const lastBuyerLabel = computed(() => (lastBuyer.value ? formatAddress(lastBuyer.value) : "--"));

const currentEventDescription = computed(() => {
  if (!isRoundActive.value) return t("inactiveRound");
  return lastBuyer.value ? `${formatAddress(lastBuyer.value)} ${t("winnerDeclared")}` : t("roundStarted");
});

const showStatus = (msg: string, type: string) => {
  status.value = { msg, type };
  setTimeout(() => (status.value = null), 4000);
};

const ensureContractHash = async () => {
  if (!contractHash.value) {
    contractHash.value = await getContractHash();
  }
  if (!contractHash.value) {
    throw new Error(t("missingContract"));
  }
};

const loadRoundData = async () => {
  await ensureContractHash();
  const [roundRes, potRes, endRes, activeRes, buyerRes] = await Promise.all([
    invokeRead({ contractHash: contractHash.value as string, operation: "CurrentRound" }),
    invokeRead({ contractHash: contractHash.value as string, operation: "CurrentPot" }),
    invokeRead({ contractHash: contractHash.value as string, operation: "EndTime" }),
    invokeRead({ contractHash: contractHash.value as string, operation: "IsRoundActive" }),
    invokeRead({ contractHash: contractHash.value as string, operation: "LastBuyer" }),
  ]);
  roundId.value = Number(parseInvokeResult(roundRes) || 0);
  totalPot.value = toGas(parseInvokeResult(potRes));
  endTime.value = Number(parseInvokeResult(endRes) || 0);
  isRoundActive.value = Boolean(parseInvokeResult(activeRes));
  lastBuyer.value = String(parseInvokeResult(buyerRes) || "");
};

const loadUserKeys = async () => {
  if (!address.value || !roundId.value || !contractHash.value) {
    userKeys.value = 0;
    return;
  }
  const res = await invokeRead({
    contractHash: contractHash.value as string,
    operation: "GetPlayerKeys",
    args: [
      { type: "Hash160", value: address.value as string },
      { type: "Integer", value: roundId.value },
    ],
  });
  userKeys.value = Number(parseInvokeResult(res) || 0);
};

const parseEventDate = (raw: any) => {
  const date = raw ? new Date(raw) : new Date();
  if (Number.isNaN(date.getTime())) return new Date().toLocaleString();
  return date.toLocaleString();
};

const loadHistory = async () => {
  const [keysRes, winnerRes, roundRes] = await Promise.all([
    listEvents({ app_id: APP_ID, event_name: "KeysPurchased", limit: 20 }),
    listEvents({ app_id: APP_ID, event_name: "DoomsdayWinner", limit: 10 }),
    listEvents({ app_id: APP_ID, event_name: "RoundStarted", limit: 10 }),
  ]);

  const items: HistoryEvent[] = [];

  keysRes.events.forEach((evt: any) => {
    const values = Array.isArray(evt?.state) ? evt.state.map(parseStackItem) : [];
    const player = String(values[0] || "");
    const keys = Number(values[1] || 0);
    const potContribution = toGas(values[2]);
    items.push({
      id: evt.id,
      title: t("keysPurchased"),
      details: `${formatAddress(player)} • ${keys} keys • +${potContribution.toFixed(2)} GAS`,
      date: parseEventDate(evt.created_at),
    });
  });

  winnerRes.events.forEach((evt: any) => {
    const values = Array.isArray(evt?.state) ? evt.state.map(parseStackItem) : [];
    const winner = String(values[0] || "");
    const prize = toGas(values[1]);
    const round = Number(values[2] || 0);
    items.push({
      id: evt.id,
      title: t("winnerDeclared"),
      details: `${formatAddress(winner)} • ${prize.toFixed(2)} GAS • #${round}`,
      date: parseEventDate(evt.created_at),
    });
  });

  roundRes.events.forEach((evt: any) => {
    const values = Array.isArray(evt?.state) ? evt.state.map(parseStackItem) : [];
    const round = Number(values[0] || 0);
    const end = Number(values[1] || 0) * 1000;
    const endText = end ? new Date(end).toLocaleString() : "--";
    items.push({
      id: evt.id,
      title: t("roundStarted"),
      details: `#${round} • ${endText}`,
      date: parseEventDate(evt.created_at),
    });
  });

  history.value = items.sort((a, b) => b.id - a.id);
};

const refreshData = async () => {
  try {
    loading.value = true;
    await loadRoundData();
    await loadUserKeys();
    await loadHistory();
  } catch (e: any) {
    showStatus(e.message || t("failedToLoad"), "error");
  } finally {
    loading.value = false;
  }
};

const buyKeys = async () => {
  if (isPaying.value) return;
  const count = Math.max(0, Math.floor(Number(keyCount.value) || 0));
  if (count <= 0) {
    showStatus(t("error"), "error");
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
    const cost = count * KEY_PRICE_GAS;
    const payment = await payGAS(cost.toString(), `keys:${roundId.value}:${count}`);
    const receiptId = payment.receipt_id;
    if (!receiptId) {
      throw new Error("Missing payment receipt");
    }
    await invokeContract({
      scriptHash: contractHash.value as string,
      operation: "BuyKeys",
      args: [
        { type: "Hash160", value: address.value as string },
        { type: "Integer", value: count },
        { type: "Integer", value: Number(receiptId) },
      ],
    });
    keyCount.value = "1";
    showStatus(t("keysPurchased"), "success");
    await refreshData();
  } catch (e: any) {
    showStatus(e.message || t("error"), "error");
  }
};

const interval = ref<number | null>(null);

onMounted(async () => {
  await refreshData();
  interval.value = window.setInterval(() => {
    now.value = Date.now();
  }, 1000);
});

watch(address, async () => {
  await loadUserKeys();
});

onUnmounted(() => {
  if (interval.value) {
    clearInterval(interval.value);
  }
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

.doomsday-clock-card {
  position: relative;
  overflow: hidden;
  border-width: 4px!important;
  box-shadow: 12px 12px 0 black!important;
  &.critical { border-color: var(--brutal-red)!important; box-shadow: 12px 12px 0 var(--brutal-red)!important; }
}

.clock-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $space-6;
}
.clock-label { font-size: 12px; font-weight: $font-weight-black; text-transform: uppercase; border: 2px solid black; padding: 2px 8px; background: white; }

.danger-badge {
  padding: 4px 12px; border: 3px solid black; font-size: 12px; font-weight: $font-weight-black; text-transform: uppercase;
  &.low { background: var(--neo-green); }
  &.medium { background: var(--brutal-yellow); }
  &.high { background: var(--brutal-orange); color: white; }
  &.critical { background: var(--brutal-red); color: white; animation: pulse-red 0.5s infinite; }
}

@keyframes pulse-red { 0% { opacity: 1; } 50% { opacity: 0.7; } 100% { opacity: 1; } }

.clock-display { text-align: center; margin: $space-8 0; background: black; padding: $space-6; border: 3px solid black; box-shadow: inset 8px 8px 0 rgba(255,255,255,0.1); }
.clock-time {
  font-size: 56px; font-weight: $font-weight-black; font-family: $font-mono; line-height: 1; color: var(--brutal-green);
  &.critical { color: var(--brutal-red); }
  &.pulse { animation: time-pulse 0.5s infinite; }
}

@keyframes time-pulse { 0% { transform: scale(1); } 50% { transform: scale(1.02); } 100% { transform: scale(1); } }

.danger-meter { margin-top: $space-6; }
.meter-labels { display: flex; justify-content: space-between; margin-bottom: 8px; }
.meter-label { font-size: 10px; font-weight: $font-weight-black; text-transform: uppercase; }

.meter-bar { height: 20px; background: #eee; border: 3px solid black; position: relative; overflow: hidden; padding: 2px; }
.meter-fill {
  height: 100%; transition: width 0.3s ease; background: black;
  &.critical { background: var(--brutal-red); }
  &.high { background: var(--brutal-orange); }
}

.event-description { margin-top: $space-6; padding: $space-4; background: var(--brutal-yellow); border: 2px solid black; box-shadow: 4px 4px 0 black; }
.event-title { font-size: 10px; font-weight: $font-weight-black; text-transform: uppercase; border-bottom: 2px solid black; margin-bottom: 4px; display: inline-block; }
.event-text { font-size: 14px; font-weight: $font-weight-black; display: block; text-transform: uppercase; }

.stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: $space-4; }
.stat-value { font-size: 18px; font-weight: $font-weight-black; font-family: $font-mono; display: block; border-bottom: 3px solid black; margin-bottom: 4px; }
.stat-label { font-size: 10px; font-weight: $font-weight-black; text-transform: uppercase; opacity: 0.6; }

.stats-subgrid { margin-top: $space-6; display: flex; flex-direction: column; gap: $space-3; }
.stat-row { display: flex; justify-content: space-between; padding: $space-3; background: white; border: 2px solid black; box-shadow: 4px 4px 0 black; }
.stat-row-label { font-size: 10px; font-weight: $font-weight-black; text-transform: uppercase; }
.stat-row-value { font-size: 12px; font-weight: $font-weight-black; font-family: $font-mono; &.active { color: var(--neo-green); } }

.cost-row { display: flex; justify-content: space-between; margin: $space-4 0; padding: $space-3; background: #eee; border: 2px solid black; }
.cost-label { font-size: 12px; font-weight: $font-weight-black; text-transform: uppercase; }
.cost-value { font-size: 18px; font-weight: $font-weight-black; font-family: $font-mono; }

.history-list { display: flex; flex-direction: column; gap: $space-4; }
.history-item { padding: $space-4; background: white; border: 3px solid black; box-shadow: 6px 6px 0 black; margin-bottom: $space-2; }
.history-title { font-weight: $font-weight-black; text-transform: uppercase; font-size: 14px; border-bottom: 2px solid black; margin-bottom: 4px; display: inline-block; }
.history-date { font-size: 10px; opacity: 0.6; font-weight: $font-weight-black; display: block; margin-bottom: 8px; }
.history-desc { font-size: 12px; font-family: $font-mono; background: #f0f0f0; padding: 4px 8px; border: 1px solid black; }

.scrollable { overflow-y: auto; -webkit-overflow-scrolling: touch; }
</style>
