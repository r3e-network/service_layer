<template>
  <AppLayout :title="t('title')" show-top-nav :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <view v-if="chainType === 'evm'" class="px-5 mb-4">
      <NeoCard variant="danger">
        <view class="flex flex-col items-center gap-2 py-1">
          <text class="text-center font-bold text-red-400">{{ t("wrongChain") }}</text>
          <text class="text-xs text-center opacity-80 text-white">{{ t("wrongChainMessage") }}</text>
          <NeoButton size="sm" variant="secondary" class="mt-2" @click="() => switchChain('neo-n3-mainnet')">{{ t("switchToNeo") }}</NeoButton>
        </view>
      </NeoCard>
    </view>

    <view v-if="activeTab === 'game'" class="tab-content">
      <NeoCard v-if="status" :variant="status.type === 'error' ? 'danger' : 'success'" class="mb-4 text-center">
        <text class="font-bold">{{ status.msg }}</text>
      </NeoCard>

      <!-- Total Burned Hero Section with Fire Animation -->
      <HeroSection :total-burned="totalBurned" :t="t as any" />

      <!-- Stats Grid -->
      <StatsGrid :user-burned="userBurned" :rank="rank" :t="t as any" />

      <!-- Burn Action Card -->
      <BurnActionCard
        v-model:burnAmount="burnAmount"
        :estimated-reward="estimatedReward"
        :is-loading="isLoading"
        :t="t as any"
        @burn="burnTokens"
      />

      <!-- Leaderboard with Medal Icons -->
      <LeaderboardList :leaderboard="leaderboard" :t="t as any" />
    </view>

    <view v-if="activeTab === 'stats'" class="tab-content scrollable">
      <StatsTab
        :burn-count="burnCount"
        :user-burned="userBurned"
        :total-burned="totalBurned"
        :rank="rank"
        :estimated-reward="estimatedReward"
        :t="t as any"
      />
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
import { AppLayout, NeoCard, NeoDoc } from "@/shared/components";
import type { NavTab } from "@/shared/components/NavBar.vue";

import HeroSection from "./components/HeroSection.vue";
import StatsGrid from "./components/StatsGrid.vue";
import BurnActionCard from "./components/BurnActionCard.vue";
import LeaderboardList, { type LeaderEntry } from "./components/LeaderboardList.vue";
import StatsTab from "./components/StatsTab.vue";

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
  wrongChain: { en: "Wrong Network", zh: "网络错误" },
  wrongChainMessage: { en: "This app requires Neo N3 network.", zh: "此应用需 Neo N3 网络。" },
  switchToNeo: { en: "Switch to Neo N3", zh: "切换到 Neo N3" },
};

const t = createT(translations);

const navTabs: NavTab[] = [
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
const { address, connect, invokeContract, invokeRead, chainType, switchChain } = useWallet() as any;
const { list: listEvents } = useEvents();

const { payGAS, isLoading } = usePayments(APP_ID);

const burnAmount = ref("1");
const totalBurned = ref(0);
const rewardPool = ref(0);
const userBurned = ref(0);
const rank = ref(0);
const burnCount = ref(0);
const status = ref<{ msg: string; type: string } | null>(null);
const contractAddress = ref<string | null>(null);

const leaderboard = ref<LeaderEntry[]>([]);

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

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const ensureContractAddress = async () => {
  if (!contractAddress.value) {
    contractAddress.value = "0xc56f33fc6ec47edbd594472833cf57505d5f99aa";
  }
  if (!contractAddress.value) {
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
    await ensureContractAddress();
    const totalRes = await invokeRead({ scriptHash: contractAddress.value!, operation: "TotalBurned" });
    totalBurned.value = toGas(parseInvokeResult(totalRes));
    const poolRes = await invokeRead({ scriptHash: contractAddress.value!, operation: "RewardPool" });
    rewardPool.value = toGas(parseInvokeResult(poolRes));
    if (address.value) {
      const userRes = await invokeRead({
        scriptHash: contractAddress.value!,
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
    await ensureContractAddress();
    status.value = { msg: t("burning"), type: "loading" };
    const payment = await payGAS(burnAmount.value, "burn");
    const receiptId = payment.receipt_id;
    if (!receiptId) {
      throw new Error("Missing payment receipt");
    }
    const tx = await invokeContract({
      scriptHash: contractAddress.value!,
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
@use "@/shared/styles/tokens.scss" as *;
@use "@/shared/styles/variables.scss";

.tab-content {
  padding: 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.scrollable {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>
