<template>
  <AppLayout :title="t('title')" show-top-nav :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <view v-if="activeTab === 'game'" class="tab-content">
      <NeoCard v-if="status" :variant="status.type === 'error' ? 'danger' : 'success'" class="mb-4 text-center">
        <text class="font-bold">{{ status.msg }}</text>
      </NeoCard>

      <!-- Total Burned Hero Section with Fire Animation -->
      <NeoCard variant="default" class="hero-card">
        <view class="fire-container">
          <view class="flame flame-1"></view>
          <view class="flame flame-2"></view>
          <view class="flame flame-3"></view>
        </view>
        <view class="hero-content">
          <text class="hero-label">{{ t("totalBurned") }}</text>
          <text class="hero-value">{{ formatNum(totalBurned) }}</text>
          <text class="hero-suffix">GAS</text>
        </view>
      </NeoCard>

      <!-- Stats Grid -->
      <view class="stats-grid">
        <NeoCard variant="accent" class="flex-1 text-center">
          <text class="stat-icon">🔥</text>
          <text class="stat-value">{{ formatNum(userBurned) }}</text>
          <text class="stat-label">{{ t("youBurned") }}</text>
        </NeoCard>
        <NeoCard variant="warning" class="flex-1 text-center">
          <text class="stat-icon">{{ getRankIcon(rank) }}</text>
          <text class="stat-value">#{{ rank }}</text>
          <text class="stat-label">{{ t("rank") }}</text>
        </NeoCard>
      </view>

      <!-- Burn Action Card -->
      <NeoCard :title="t('burnTokens')" variant="accent" class="burn-card">
        <NeoInput v-model="burnAmount" type="number" :placeholder="t('amountPlaceholder')" suffix="GAS" />
        <view class="reward-info">
          <text class="reward-label">{{ t("estimatedRewards") }}</text>
          <text class="reward-value">+{{ formatNum(estimatedReward) }} {{ t("points") }}</text>
        </view>
        <NeoButton variant="primary" size="lg" block :loading="isLoading" @click="burnTokens" class="burn-button">
          <text class="burn-button-text">🔥 {{ t("burnNow") }}</text>
        </NeoButton>
      </NeoCard>

      <!-- Leaderboard with Medal Icons -->
      <NeoCard :title="t('leaderboard')" variant="default" class="leaderboard-card">
        <view class="leaderboard-list">
          <view
            v-for="(entry, i) in leaderboard"
            :key="i"
            :class="['leader-item', entry.isUser && 'highlight', `rank-${entry.rank}`]"
          >
            <view class="leader-rank-container">
              <text class="leader-medal">{{ getMedalIcon(entry.rank) }}</text>
              <text class="leader-rank">#{{ entry.rank }}</text>
            </view>
            <text class="leader-addr">{{ entry.address }}</text>
            <view class="leader-burned-container">
              <text class="leader-burned">{{ formatNum(entry.burned) }}</text>
              <text class="leader-burned-suffix">GAS</text>
            </view>
          </view>
        </view>
      </NeoCard>
    </view>

    <view v-if="activeTab === 'stats'" class="tab-content scrollable">
      <NeoCard :title="t('statistics')" variant="default">
        <view class="stat-row">
          <text class="stat-label">{{ t("totalGames") }}</text>
          <text class="stat-value">{{ burnCount }}</text>
        </view>
        <view class="stat-row">
          <text class="stat-label">{{ t("youBurned") }}</text>
          <text class="stat-value">{{ formatNum(userBurned) }} GAS</text>
        </view>
        <view class="stat-row">
          <text class="stat-label">{{ t("totalBurned") }}</text>
          <text class="stat-value">{{ formatNum(totalBurned) }} GAS</text>
        </view>
        <view class="stat-row">
          <text class="stat-label">{{ t("rank") }}</text>
          <text class="stat-value">#{{ rank }}</text>
        </view>
        <view class="stat-row">
          <text class="stat-label">{{ t("estimatedRewards") }}</text>
          <text class="stat-value">{{ formatNum(estimatedReward) }} {{ t("points") }}</text>
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
import { ref, computed, onMounted, watch } from "vue";
import { useWallet, usePayments, useEvents } from "@neo/uniapp-sdk";
import { formatNumber } from "@/shared/utils/format";
import { parseInvokeResult, parseStackItem } from "@/shared/utils/neo";
import { createT } from "@/shared/utils/i18n";
import { AppLayout, NeoButton, NeoCard, NeoInput, NeoDoc } from "@/shared/components";

const translations = {
  title: { en: "Burn League", zh: "燃烧联盟" },
  subtitle: { en: "Burn tokens, earn rewards", zh: "燃烧代币，赚取奖励" },
  totalBurned: { en: "Total Burned", zh: "总燃烧量" },
  youBurned: { en: "You Burned", zh: "你的燃烧量" },
  rank: { en: "Rank", zh: "排名" },
  burnTokens: { en: "Burn Tokens", zh: "燃烧代币" },
  amountPlaceholder: { en: "Amount to burn", zh: "燃烧数量" },
  estimatedRewards: { en: "Estimated Rewards", zh: "预估奖励" },
  points: { en: "GAS", zh: "GAS" },
  burning: { en: "Burning...", zh: "燃烧中..." },
  burnNow: { en: "Burn Now", zh: "立即燃烧" },
  leaderboard: { en: "Leaderboard", zh: "排行榜" },
  burned: { en: "Burned", zh: "已燃烧" },
  success: { en: "successfully!", zh: "成功！" },
  error: { en: "Error", zh: "错误" },
  game: { en: "Game", zh: "游戏" },
  stats: { en: "Stats", zh: "统计" },
  statistics: { en: "Statistics", zh: "统计数据" },
  totalGames: { en: "Total Games", zh: "总游戏数" },
  docs: { en: "Docs", zh: "文档" },
  docSubtitle: {
    en: "Competitive token burning with seasonal rewards",
    zh: "带有赛季奖励的竞争性代币销毁",
  },
  docDescription: {
    en: "Burn League is a competitive token burning platform where participants compete to burn the most tokens during seasonal competitions. Climb the leaderboard, earn points, and win exclusive rewards.",
    zh: "Burn League 是一个竞争性代币销毁平台，参与者在赛季竞赛中竞争销毁最多的代币。攀登排行榜，赚取积分，赢取独家奖励。",
  },
  step1: {
    en: "Connect your Neo wallet and join the current season",
    zh: "连接您的 Neo 钱包并加入当前赛季",
  },
  step2: {
    en: "Burn tokens to earn points and climb the leaderboard",
    zh: "销毁代币以赚取积分并攀登排行榜",
  },
  step3: {
    en: "Compete with others for top positions before season ends",
    zh: "在赛季结束前与他人竞争顶级位置",
  },
  step4: {
    en: "Claim your seasonal rewards based on final ranking",
    zh: "根据最终排名领取赛季奖励",
  },
  feature1Name: { en: "Seasonal Competitions", zh: "赛季竞赛" },
  feature1Desc: {
    en: "Time-limited seasons with fresh leaderboards and prize pools.",
    zh: "限时赛季，全新排行榜和奖池。",
  },
  feature2Name: { en: "On-Chain Leaderboard", zh: "链上排行榜" },
  feature2Desc: {
    en: "All burns and rankings are transparently recorded on Neo N3.",
    zh: "所有销毁和排名都透明地记录在 Neo N3 上。",
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

const APP_ID = "miniapp-burn-league";
const { address, connect, invokeContract, invokeRead, getContractHash } = useWallet();
const { list: listEvents } = useEvents();

interface LeaderEntry {
  rank: number;
  address: string;
  burned: number;
  isUser: boolean;
}

const { payGAS, isLoading } = usePayments(APP_ID);

const burnAmount = ref("1");
const totalBurned = ref(0);
const rewardPool = ref(0);
const userBurned = ref(0);
const rank = ref(0);
const burnCount = ref(0);
const status = ref<{ msg: string; type: string } | null>(null);
const contractHash = ref<string | null>(null);

const leaderboard = ref<LeaderEntry[]>([]);

const formatNum = (n: number) => formatNumber(n, 2);
const toFixed8 = (value: string) => {
  const num = Number.parseFloat(value);
  if (!Number.isFinite(num)) return "0";
  return Math.floor(num * 1e8).toString();
};
const toGas = (value: any) => {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? num / 1e8 : 0;
};

const estimatedReward = computed(() => {
  if (!totalBurned.value) return 0;
  return (userBurned.value / totalBurned.value) * rewardPool.value;
});

const getMedalIcon = (rank: number): string => {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return "";
};

const getRankIcon = (rank: number): string => {
  if (rank <= 3) return "👑";
  if (rank <= 10) return "⭐";
  return "📊";
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
    const res = await listEvents({ app_id: APP_ID, event_name: eventName, limit: 25 });
    const match = res.events.find((evt) => evt.tx_hash === txid);
    if (match) return match;
    await sleep(1500);
  }
  return null;
};

const loadStats = async () => {
  try {
    await ensureContractHash();
    const totalRes = await invokeRead({ contractHash: contractHash.value!, operation: "TotalBurned" });
    totalBurned.value = toGas(parseInvokeResult(totalRes));
    const poolRes = await invokeRead({ contractHash: contractHash.value!, operation: "RewardPool" });
    rewardPool.value = toGas(parseInvokeResult(poolRes));
    if (address.value) {
      const userRes = await invokeRead({
        contractHash: contractHash.value!,
        operation: "GetUserBurned",
        args: [{ type: "Hash160", value: address.value }],
      });
      userBurned.value = toGas(parseInvokeResult(userRes));
    } else {
      userBurned.value = 0;
    }
  } catch (e) {
    console.warn("Failed to load burn stats", e);
  }
};

const loadLeaderboard = async () => {
  try {
    const res = await listEvents({ app_id: APP_ID, event_name: "GasBurned", limit: 100 });
    const totals: Record<string, number> = {};
    let userBurns = 0;
    res.events.forEach((evt) => {
      const values = Array.isArray((evt as any)?.state) ? (evt as any).state.map(parseStackItem) : [];
      const burner = String(values[0] ?? "");
      const amount = Number(values[1] ?? 0);
      if (!burner) return;
      totals[burner] = (totals[burner] || 0) + amount;
      if (address.value && burner === address.value) {
        userBurns += 1;
      }
    });
    const entries = Object.entries(totals)
      .map(([addr, amount]) => ({
        address: addr,
        burned: toGas(amount),
        isUser: address.value ? addr === address.value : false,
      }))
      .sort((a, b) => b.burned - a.burned)
      .map((entry, idx) => ({ rank: idx + 1, ...entry }));
    leaderboard.value = entries;
    const userEntry = entries.find((entry) => entry.isUser);
    rank.value = userEntry ? userEntry.rank : 0;
    burnCount.value = userBurns;
  } catch (e) {
    console.warn("Failed to load leaderboard", e);
  }
};

const refreshData = async () => {
  await Promise.all([loadStats(), loadLeaderboard()]);
};

const burnTokens = async () => {
  if (isLoading.value) return;
  const amount = parseFloat(burnAmount.value);
  if (amount < 1) {
    status.value = { msg: `${t("error")}: Min burn: 1 GAS`, type: "error" };
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
    status.value = { msg: t("burning"), type: "loading" };
    const payment = await payGAS(burnAmount.value, "burn");
    const receiptId = payment.receipt_id;
    if (!receiptId) {
      throw new Error("Missing payment receipt");
    }
    const tx = await invokeContract({
      scriptHash: contractHash.value!,
      operation: "BurnGas",
      args: [
        { type: "Hash160", value: address.value },
        { type: "Integer", value: toFixed8(burnAmount.value) },
        { type: "Integer", value: receiptId },
      ],
    });
    const txid = String((tx as any)?.txid || (tx as any)?.txHash || "");
    if (txid) {
      await waitForEvent(txid, "GasBurned");
    }
    status.value = { msg: `${t("burned")} ${amount} GAS ${t("success")}`, type: "success" };
    burnAmount.value = "1";
    await refreshData();
  } catch (e: any) {
    status.value = { msg: e.message || t("error"), type: "error" };
  }
};

onMounted(() => {
  refreshData();
});

watch(address, () => {
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

.hero-card {
  text-align: center; padding: $space-6; background: black; border: 4px solid black; box-shadow: 10px 10px 0 black; position: relative; overflow: hidden;
}

.fire-container {
  position: absolute; bottom: 0; left: 0; right: 0; height: 30px;
  display: flex; justify-content: space-around; align-items: flex-end; pointer-events: none;
}

.flame {
  width: 15px; height: 20px; background: var(--brutal-orange); border-radius: 50% 50% 0 0;
  animation: neo-flicker 0.8s infinite alternate;
  &.flame-2 { height: 30px; animation-delay: 0.1s; background: var(--brutal-red); }
  &.flame-3 { height: 18px; animation-delay: 0.2s; background: var(--brutal-yellow); }
}

@keyframes neo-flicker {
  0% { transform: scaleY(1); opacity: 0.6; }
  100% { transform: scaleY(1.5); opacity: 1; }
}

.hero-content { position: relative; z-index: 1; }
.hero-label { font-size: 8px; font-weight: $font-weight-black; text-transform: uppercase; color: white; opacity: 0.6; }
.hero-value { font-size: 36px; font-weight: $font-weight-black; color: var(--brutal-orange); font-family: $font-mono; display: block; filter: drop-shadow(2px 2px 0 black); }
.hero-suffix { font-size: 10px; font-weight: $font-weight-black; text-transform: uppercase; color: white; }

.stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: $space-3; }
.stat-icon { font-size: 24px; display: block; margin-bottom: 4px; }
.stat-value { font-size: 20px; font-weight: $font-weight-black; font-family: $font-mono; }
.stat-label { font-size: 8px; font-weight: $font-weight-black; text-transform: uppercase; opacity: 0.6; }

.reward-info {
  background: white; padding: $space-3; border: 2px solid black;
  display: flex; justify-content: space-between; align-items: center; margin: $space-4 0;
}
.reward-label { font-size: 8px; font-weight: $font-weight-black; text-transform: uppercase; opacity: 0.6; }
.reward-value { font-size: 12px; font-weight: $font-weight-black; color: var(--neo-purple); font-family: $font-mono; }

.burn-button-text { font-size: 14px; font-weight: $font-weight-black; text-transform: uppercase; }

.leaderboard-list { display: flex; flex-direction: column; gap: $space-3; }
.leader-item {
  display: flex; justify-content: space-between; align-items: center; padding: $space-3;
  background: white; border: 2px solid black; box-shadow: 4px 4px 0 black;
  &.highlight { background: var(--brutal-yellow); border-color: black; }
}

.leader-rank-container { display: flex; align-items: center; gap: 4px; }
.leader-medal { font-size: 14px; }
.leader-rank { font-size: 10px; font-weight: $font-weight-black; font-family: $font-mono; }
.leader-addr { font-size: 8px; font-family: $font-mono; font-weight: $font-weight-bold; opacity: 0.6; flex: 1; padding: 0 $space-4; word-break: break-all; }
.leader-burned { font-size: 14px; font-weight: $font-weight-black; font-family: $font-mono; color: var(--brutal-orange); }
.leader-burned-suffix { font-size: 8px; font-weight: $font-weight-black; opacity: 0.6; margin-left: 2px; }

.stat-row { display: flex; justify-content: space-between; padding: $space-3 0; border-bottom: 1px dashed black; }

.scrollable { overflow-y: auto; -webkit-overflow-scrolling: touch; }
</style>
