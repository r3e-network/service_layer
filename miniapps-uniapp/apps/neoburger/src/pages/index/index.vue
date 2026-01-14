<template>
  <AppLayout  :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <NeoCard v-if="statusMessage" :variant="statusType === 'error' ? 'danger' : 'success'" class="mb-4">
      <text class="status-text">{{ statusMessage }}</text>
    </NeoCard>

    <view v-if="chainType === 'evm'" class="mb-4 px-4">
      <NeoCard variant="danger">
        <view class="flex flex-col items-center gap-2 py-1">
          <text class="status-text text-red-400">{{ t("wrongChain") }}</text>
          <text class="text-xs text-center opacity-80 text-white">{{ t("wrongChainMessage") }}</text>
          <NeoButton size="sm" variant="secondary" class="mt-2" @click="() => switchChain('neo-n3-mainnet')">{{
            t("switchToNeo")
          }}</NeoButton>
        </view>
      </NeoCard>
    </view>

    <view v-if="activeTab === 'stake' || activeTab === 'unstake'" class="app-container">
      <!-- Stake Panel -->
      <StakePanel
        v-if="activeTab === 'stake'"
        v-model:stakeAmount="stakeAmount"
        :neo-balance="neoBalance"
        :estimated-bneo="estimatedBneo"
        :yearly-return="yearlyReturn"
        :can-stake="canStake"
        :loading="loading"
        :t="t as any"
        @setAmount="setStakeAmount"
        @stake="handleStake"
      />

      <!-- Unstake Panel -->
      <UnstakePanel
        v-if="activeTab === 'unstake'"
        v-model:unstakeAmount="unstakeAmount"
        :b-neo-balance="bNeoBalance"
        :estimated-neo="estimatedNeo"
        :can-unstake="canUnstake"
        :loading="loading"
        :t="t as any"
        @setAmount="setUnstakeAmount"
        @unstake="handleUnstake"
      />

      <!-- Hero APY Card -->
      <NeoBurgerHero :animated-apy="animatedApy" :t="t as any" />
    </view>

    <!-- Stats Tab -->
    <view v-if="activeTab === 'stats'" class="app-container">
      <NeoCard class="mb-6">
        <NeoStats :stats="statsData" />
      </NeoCard>

      <RewardsSummaryCard
        :daily-rewards="dailyRewards"
        :daily-rewards-usd="dailyRewardsUsd"
        :rewards-progress="rewardsProgress"
        :t="t as any"
      />
    </view>

    <!-- Rewards Tab -->
    <RewardsTab
      v-if="activeTab === 'rewards'"
      :total-rewards="totalRewards"
      :total-rewards-usd="totalRewardsUsd"
      :b-neo-balance="bNeoBalance"
      :daily-rewards="dailyRewards"
      :weekly-rewards="weeklyRewards"
      :monthly-rewards="monthlyRewards"
      :t="t as any"
      @claim="handleClaimRewards"
    />

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
import { useWallet } from "@neo/uniapp-sdk";
import { createT } from "@/shared/utils/i18n";
import { AppLayout, NeoCard, NeoStats, NeoDoc } from "@/shared/components";
import type { NavTab } from "@/shared/components/NavBar.vue";
import type { StatItem } from "@/shared/components/NeoStats.vue";
import { getPrices, type PriceData } from "@/shared/utils/price";
import NeoBurgerHero from "./components/NeoBurgerHero.vue";
import RewardsSummaryCard from "./components/RewardsSummaryCard.vue";
import StakePanel from "./components/StakePanel.vue";
import UnstakePanel from "./components/UnstakePanel.vue";
import RewardsTab from "./components/RewardsTab.vue";

const APP_ID = "miniapp-neoburger";
const BNEO_CONTRACT = ref<string | null>(null);
const NEO_CONTRACT = "0xef4073a0f2b305a38ec4050e4d3d28bc40ea63f5";


const translations = {
  title: { en: "NeoBurger", zh: "NeoBurger" },
  subtitle: { en: "Liquid Staking for NEO", zh: "NEO 流动性质押" },
  liquidStaking: { en: "Liquid Staking Protocol", zh: "流动性质押协议" },
  yourBneo: { en: "Your bNEO", zh: "您的 bNEO" },
  yourNeo: { en: "Your NEO", zh: "您的 NEO" },
  currentApy: { en: "Current APY", zh: "当前年化收益" },
  estimatedRewards: { en: "Estimated Rewards", zh: "预估奖励" },
  daily: { en: "Est. Daily", zh: "预估每日" },
  utcProgress: { en: "UTC day progress", zh: "UTC 日进度" },
  stake: { en: "Stake", zh: "质押" },
  unstake: { en: "Unstake", zh: "解除质押" },
  rewards: { en: "Rewards", zh: "奖励" },
  stakeNeoTitle: { en: "Stake NEO", zh: "质押 NEO" },
  stakeSubtitle: { en: "Earn rewards while keeping liquidity", zh: "在保持流动性的同时赚取奖励" },
  unstakeBneoTitle: { en: "Unstake bNEO", zh: "解除质押 bNEO" },
  unstakeSubtitle: { en: "Convert bNEO back to NEO", zh: "将 bNEO 转换回 NEO" },
  amountToStake: { en: "Amount to Stake", zh: "质押数量" },
  amountToUnstake: { en: "Amount to Unstake", zh: "解除质押数量" },
  balance: { en: "Balance", zh: "余额" },
  youWillReceive: { en: "You will receive", zh: "您将收到" },
  exchangeRate: { en: "Exchange Rate", zh: "兑换率" },
  yearlyReturn: { en: "Yearly Return", zh: "年度收益" },
  processing: { en: "Processing...", zh: "处理中..." },
  stakeNeo: { en: "Stake NEO", zh: "质押 NEO" },
  unstakeBneo: { en: "Unstake bNEO", zh: "解除质押 bNEO" },
  claimRewards: { en: "Claim Rewards", zh: "领取奖励" },
  totalRewards: { en: "Estimated Rewards (30d)", zh: "预估奖励（30天）" },
  stakedAmount: { en: "Staked Amount", zh: "质押金额" },
  dailyRewards: { en: "Daily Rewards", zh: "每日奖励" },
  weeklyRewards: { en: "Weekly Rewards", zh: "每周奖励" },
  monthlyRewards: { en: "Monthly Rewards", zh: "每月奖励" },
  stakeSuccess: { en: "Staked", zh: "质押成功" },
  stakeFailed: { en: "Stake failed", zh: "质押失败" },
  unstakeSuccess: { en: "Unstaked", zh: "解除质押成功" },
  unstakeFailed: { en: "Unstake failed", zh: "解除质押失败" },
  claimSuccess: { en: "Rewards claimed", zh: "奖励已领取" },
  claimFailed: { en: "Claim failed", zh: "领取失败" },
  tabStake: { en: "Stake", zh: "质押" },
  tabUnstake: { en: "Unstake", zh: "解除质押" },
  tabRewards: { en: "Rewards", zh: "奖励" },
  tabStats: { en: "Stats", zh: "统计" },
  statistics: { en: "Statistics", zh: "数据" },
  docs: { en: "Docs", zh: "文档" },
  docSubtitle: {
    en: "Liquid staking protocol for NEO with bNEO rewards",
    zh: "NEO 流动性质押协议，获取 bNEO 奖励",
  },
  docDescription: {
    en: "NeoBurger is a liquid staking protocol that lets you stake NEO and receive bNEO tokens. Earn GAS rewards while maintaining liquidity - use bNEO in DeFi while your NEO generates yield.",
    zh: "NeoBurger 是一个流动性质押协议，让您质押 NEO 并获得 bNEO 代币。在保持流动性的同时赚取 GAS 奖励 - 在 DeFi 中使用 bNEO，同时您的 NEO 产生收益。",
  },
  step1: {
    en: "Connect your Neo wallet and check your NEO balance",
    zh: "连接您的 Neo 钱包并查看 NEO 余额",
  },
  step2: {
    en: "Enter the amount of NEO to stake and receive bNEO tokens",
    zh: "输入要质押的 NEO 数量并获得 bNEO 代币",
  },
  step3: {
    en: "Use bNEO in DeFi protocols while earning staking rewards",
    zh: "在 DeFi 协议中使用 bNEO，同时赚取质押奖励",
  },
  step4: {
    en: "Unstake anytime by converting bNEO back to NEO plus rewards",
    zh: "随时通过将 bNEO 转换回 NEO 加奖励来解除质押",
  },
  feature1Name: { en: "Liquid Staking", zh: "流动性质押" },
  feature1Desc: {
    en: "Receive bNEO tokens that can be used in DeFi while your NEO earns rewards.",
    zh: "获得可在 DeFi 中使用的 bNEO 代币，同时您的 NEO 赚取奖励。",
  },
  feature2Name: { en: "Auto-Compounding", zh: "自动复利" },
  feature2Desc: {
    en: "Rewards are automatically compounded, increasing your bNEO value over time.",
    zh: "奖励自动复利，随时间增加您的 bNEO 价值。",
  },
  error: { en: "Error", zh: "错误" },
  wrongChain: { en: "Wrong Network", zh: "网络错误" },
  wrongChainMessage: { en: "This app requires Neo N3 network.", zh: "此应用需 Neo N3 网络。" },
  switchToNeo: { en: "Switch to Neo N3", zh: "切换到 Neo N3" },
};

const t = createT(translations);

const { getAddress, invokeContract, getBalance, chainType, switchChain, getContractAddress } = useWallet() as any;

// Navigation tabs
const activeTab = ref("stake");

// Navigation tabs
const navTabs: NavTab[] = [
  { id: "stake", icon: "lock", label: t("tabStake") },
  { id: "unstake", icon: "unlock", label: t("tabUnstake") },
  { id: "rewards", icon: "gift", label: t("tabRewards") },
  { id: "stats", icon: "chart", label: t("tabStats") },
  { id: "docs", icon: "book", label: t("docs") },
];

// State
const stakeAmount = ref("");
const unstakeAmount = ref("");
const neoBalance = ref(0);
const bNeoBalance = ref(0);
const loading = ref(false);
const statusMessage = ref("");
const statusType = ref<"success" | "error">("success");
const apy = ref(0);
const animatedApy = ref("0.0");
const loadingApy = ref(true);
const priceData = ref<PriceData | null>(null);

// Timer tracking for cleanup
let apyAnimationTimer: ReturnType<typeof setInterval> | null = null;
let statusTimer: ReturnType<typeof setTimeout> | null = null;

const statsData = computed<StatItem[]>(() => [
  { label: t("yourNeo"), value: formatAmount(neoBalance.value), unit: "NEO", variant: "default" },
  { label: t("yourBneo"), value: formatAmount(bNeoBalance.value), unit: "bNEO", variant: "accent" },
]);

// Docs
const docSteps = computed(() => [t("step1"), t("step2"), t("step3"), t("step4")]);
const docFeatures = computed(() => [
  { name: t("feature1Name"), desc: t("feature1Desc") },
  { name: t("feature2Name"), desc: t("feature2Desc") },
]);

// Computed
const canStake = computed(() => {
  const amount = parseFloat(stakeAmount.value);
  return amount > 0 && amount <= neoBalance.value;
});

const canUnstake = computed(() => {
  const amount = parseFloat(unstakeAmount.value);
  return amount > 0 && amount <= bNeoBalance.value;
});

const estimatedBneo = computed(() => {
  const amount = parseFloat(stakeAmount.value) || 0;
  return (amount * 0.99).toFixed(2);
});

const estimatedNeo = computed(() => {
  const amount = parseFloat(unstakeAmount.value) || 0;
  return (amount * 1.01).toFixed(2);
});

const yearlyReturn = computed(() => {
  const amount = parseFloat(stakeAmount.value) || 0;
  return (amount * (apy.value / 100)).toFixed(2);
});

const dailyRewards = computed(() => {
  return (bNeoBalance.value * (apy.value / 100 / 365)).toFixed(4);
});

const weeklyRewards = computed(() => {
  return (bNeoBalance.value * (apy.value / 100 / 52)).toFixed(4);
});

const monthlyRewards = computed(() => {
  return (bNeoBalance.value * (apy.value / 100 / 12)).toFixed(4);
});

const totalRewards = computed(() => {
  const monthly = parseFloat(monthlyRewards.value);
  return Number.isFinite(monthly) ? monthly : 0;
});

const dailyRewardsUsd = computed(() => {
  const neoPrice = priceData.value?.neo.usd ?? 0;
  return (parseFloat(dailyRewards.value) * neoPrice).toFixed(2);
});

const totalRewardsUsd = computed(() => {
  const neoPrice = priceData.value?.neo.usd ?? 0;
  return (totalRewards.value * neoPrice).toFixed(2);
});

const rewardsProgress = computed(() => {
  const now = new Date();
  const secondsToday =
    now.getUTCHours() * 3600 + now.getUTCMinutes() * 60 + now.getUTCSeconds();
  return Math.min((secondsToday / 86400) * 100, 100);
});

// Methods
function formatAmount(amount: number): string {
  return amount.toFixed(2);
}

function setStakeAmount(percentage: number) {
  stakeAmount.value = (neoBalance.value * percentage).toFixed(2);
}

function setUnstakeAmount(percentage: number) {
  unstakeAmount.value = (bNeoBalance.value * percentage).toFixed(2);
}

function showStatus(message: string, type: "success" | "error") {
  statusMessage.value = message;
  statusType.value = type;
  // Clear previous timer if exists
  if (statusTimer) clearTimeout(statusTimer);
  statusTimer = setTimeout(() => {
    statusMessage.value = "";
    statusTimer = null;
  }, 5000);
}

// Animate APY counter
function animateApy() {
  const target = apy.value;
  const duration = 2000;
  const steps = 60;
  const increment = target / steps;
  let current = 0;
  let step = 0;

  // Clear previous animation if exists
  if (apyAnimationTimer) clearInterval(apyAnimationTimer);

  apyAnimationTimer = setInterval(() => {
    current += increment;
    step++;
    animatedApy.value = current.toFixed(1);

    if (step >= steps) {
      animatedApy.value = target.toFixed(1);
      if (apyAnimationTimer) {
        clearInterval(apyAnimationTimer);
        apyAnimationTimer = null;
      }
    }
  }, duration / steps);
}

async function loadBalances() {
  try {
    const address = await getAddress();
    if (!address) return;

    if (!BNEO_CONTRACT.value) {
      BNEO_CONTRACT.value = await getContractAddress();
    }
    const bneoContract = BNEO_CONTRACT.value!;

    const neo = await getBalance("NEO");
    const bneo = await getBalance(bneoContract);
    // Handle both string and number return types
    neoBalance.value = typeof neo === "string" ? parseFloat(neo) || 0 : typeof neo === "number" ? neo : 0;
    bNeoBalance.value = typeof bneo === "string" ? parseFloat(bneo) || 0 : typeof bneo === "number" ? bneo : 0;
  } catch (e) {
    console.error("Failed to load balances:", e);
  }
}

const APY_CACHE_KEY = "neoburger_apy_cache";

const readCachedApy = () => {
  try {
    const uniApi = (globalThis as any)?.uni;
    const raw = uniApi?.getStorageSync?.(APY_CACHE_KEY) ?? (typeof localStorage !== "undefined" ? localStorage.getItem(APY_CACHE_KEY) : null);
    const value = Number(raw);
    return Number.isFinite(value) && value >= 0 ? value : null;
  } catch {
    return null;
  }
};

const writeCachedApy = (value: number) => {
  try {
    const uniApi = (globalThis as any)?.uni;
    if (uniApi?.setStorageSync) {
      uniApi.setStorageSync(APY_CACHE_KEY, String(value));
    } else if (typeof localStorage !== "undefined") {
      localStorage.setItem(APY_CACHE_KEY, String(value));
    }
  } catch {
    // Ignore cache write failures
  }
};

async function loadApy() {
  try {
    loadingApy.value = true;
    const cached = readCachedApy();
    if (cached !== null) {
      apy.value = cached;
    }
    const response = await fetch("/api/neoburger/stats");
    if (response.ok) {
      const data = await response.json();
      const nextApy = parseFloat(data.apr);
      if (Number.isFinite(nextApy) && nextApy >= 0) {
        apy.value = nextApy;
        writeCachedApy(nextApy);
      }
    }
  } catch (e) {
    console.error("Failed to load APY:", e);
  } finally {
    loadingApy.value = false;
    animateApy();
  }
}

async function handleStake() {
  if (!canStake.value || loading.value) return;

  loading.value = true;
  try {
    const amount = parseFloat(stakeAmount.value);
    // Transfer NEO to bNEO contract to receive bNEO tokens
    await invokeContract({
      scriptHash: NEO_CONTRACT,
      operation: "transfer",
      args: [
        { type: "Hash160", value: await getAddress() },
        { type: "Hash160", value: BNEO_CONTRACT.value! },
        { type: "Integer", value: Math.floor(amount) }, // NEO is indivisible
        { type: "Any", value: null },
      ],
    });
    showStatus(`${t("stakeSuccess")} ${amount} NEO!`, "success");
    stakeAmount.value = "";
    await loadBalances();
  } catch (e: any) {
    showStatus(e.message || t("stakeFailed"), "error");
  } finally {
    loading.value = false;
  }
}

async function handleUnstake() {
  if (!canUnstake.value || loading.value) return;

  loading.value = true;
  try {
    const amount = parseFloat(unstakeAmount.value);
    await invokeContract({
      scriptHash: BNEO_CONTRACT.value!,
      operation: "transfer",
      args: [
        { type: "Hash160", value: await getAddress() },
        { type: "Hash160", value: BNEO_CONTRACT.value! },
        { type: "Integer", value: amount * 100000000 },
        { type: "ByteArray", value: "" },
      ],
    });
    showStatus(`${t("unstakeSuccess")} ${amount} bNEO!`, "success");
    unstakeAmount.value = "";
    await loadBalances();
  } catch (e: any) {
    showStatus(e.message || t("unstakeFailed"), "error");
  } finally {
    loading.value = false;
  }
}

async function handleClaimRewards() {
  if (loading.value) return;

  loading.value = true;
  try {
    // Call NeoBurger contract to claim rewards
    const sdk = await import("@neo/uniapp-sdk").then((m) => m.waitForSDK?.() || null);
    if (!sdk?.invoke) {
      throw new Error("SDK not available");
    }

    // NeoBurger contract address (bNEO)
    const bneoContract = BNEO_CONTRACT.value || await getContractAddress();
    if (!bneoContract) throw new Error("Contract address unavailable");

    await sdk.invoke("invokeFunction", {
      contract: bneoContract,
      method: "claim",
      args: [],
    });

    showStatus(t("claimSuccess"), "success");
    await loadBalances();
  } catch (e: any) {
    showStatus(e.message || t("claimFailed"), "error");
  } finally {
    loading.value = false;
  }
}

async function loadPrices() {
  try {
    priceData.value = await getPrices();
  } catch (e) {
    console.warn("Failed to load prices:", e);
  }
}

onMounted(() => {
  loadBalances();
  loadApy();
  loadPrices();
});

onUnmounted(() => {
  // Clean up timers to prevent memory leaks
  if (apyAnimationTimer) {
    clearInterval(apyAnimationTimer);
    apyAnimationTimer = null;
  }
  if (statusTimer) {
    clearTimeout(statusTimer);
    statusTimer = null;
  }
});
</script>

<style lang="scss" scoped>
@use "@/shared/styles/tokens.scss" as *;
@use "@/shared/styles/variables.scss";

.app-container {
  padding: 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.scrollable {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.status-text {
  font-weight: 700;
  text-transform: uppercase;
  font-size: 13px;
  text-align: center;
  letter-spacing: 0.05em;
}
</style>
