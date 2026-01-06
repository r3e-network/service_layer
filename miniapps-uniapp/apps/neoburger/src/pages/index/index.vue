<template>
  <AppLayout :title="t('title')" show-top-nav :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <NeoCard v-if="statusMessage" :variant="statusType === 'error' ? 'danger' : 'success'" class="mb-4">
      <text class="status-text">{{ statusMessage }}</text>
    </NeoCard>

    <!-- Hero APY Card with Burger Theme -->
    <NeoCard variant="accent" class="hero-apy-card mb-6 text-center">
      <view class="burger-icon"><AppIcon name="burger" :size="64" /></view>
      <text class="hero-label">{{ t("currentApy") }}</text>
      <text class="hero-value">{{ animatedApy }}%</text>
      <text class="hero-subtitle">{{ t("liquidStaking") }}</text>
    </NeoCard>

    <!-- Stats Dashboard -->
    <NeoCard class="mb-6">
      <NeoStats :stats="statsData" />
    </NeoCard>

    <!-- Rewards Card -->
    <NeoCard :title="t('estimatedRewards')" variant="success" class="mb-6">
      <template #header-extra>
        <view class="rewards-badge">{{ t("daily") }}</view>
      </template>
      <view class="rewards-body">
        <text class="rewards-amount">+{{ dailyRewards }} NEO</text>
        <text class="rewards-usd">≈ ${{ dailyRewardsUsd }}</text>
      </view>
      <view class="rewards-progress-container">
        <view class="rewards-progress-bar" :style="{ width: rewardsProgress + '%' }"></view>
      </view>
    </NeoCard>

    <!-- Stake Panel -->
    <NeoCard v-if="activeTab === 'stake'" :title="t('stakeNeoTitle')" class="mb-6">
      <text class="panel-subtitle mb-4 text-center block">{{ t("stakeSubtitle") }}</text>

      <view class="input-group">
        <view class="input-header">
          <text class="input-label">{{ t("amountToStake") }}</text>
          <text class="balance-hint">{{ t("balance") }}: {{ formatAmount(neoBalance) }} NEO</text>
        </view>

        <NeoInput v-model="stakeAmount" type="number" placeholder="0.00" class="mb-4">
          <template #suffix>
            <text class="token-symbol">NEO</text>
          </template>
        </NeoInput>

        <view class="quick-amounts mb-4">
          <NeoButton variant="secondary" size="sm" @click="setStakeAmount(0.25)">25%</NeoButton>
          <NeoButton variant="secondary" size="sm" @click="setStakeAmount(0.5)">50%</NeoButton>
          <NeoButton variant="secondary" size="sm" @click="setStakeAmount(0.75)">75%</NeoButton>
          <NeoButton variant="secondary" size="sm" @click="setStakeAmount(1)">MAX</NeoButton>
        </view>
      </view>

      <view class="conversion-card-neo mb-6">
        <view class="conversion-row">
          <text class="conversion-label">{{ t("youWillReceive") }}</text>
          <text class="conversion-value">{{ estimatedBneo }} bNEO</text>
        </view>
        <view class="conversion-row">
          <text class="conversion-label">{{ t("exchangeRate") }}</text>
          <text class="conversion-value">1 NEO = 0.99 bNEO</text>
        </view>
        <view class="conversion-row">
          <text class="conversion-label">{{ t("yearlyReturn") }}</text>
          <text class="conversion-value highlight">+{{ yearlyReturn }} NEO</text>
        </view>
      </view>

      <NeoButton variant="primary" size="lg" block :disabled="!canStake" :loading="loading" @click="handleStake">
        {{ loading ? t("processing") : t("stakeNeo") }}
      </NeoButton>
    </NeoCard>

    <!-- Unstake Panel -->
    <NeoCard v-if="activeTab === 'unstake'" :title="t('unstakeBneoTitle')" class="mb-6">
      <text class="panel-subtitle mb-4 text-center block">{{ t("unstakeSubtitle") }}</text>

      <view class="input-group">
        <view class="input-header">
          <text class="input-label">{{ t("amountToUnstake") }}</text>
          <text class="balance-hint">{{ t("balance") }}: {{ formatAmount(bNeoBalance) }} bNEO</text>
        </view>

        <NeoInput v-model="unstakeAmount" type="number" placeholder="0.00" class="mb-4">
          <template #suffix>
            <text class="token-symbol">bNEO</text>
          </template>
        </NeoInput>

        <view class="quick-amounts mb-4">
          <NeoButton variant="secondary" size="sm" @click="setUnstakeAmount(0.25)">25%</NeoButton>
          <NeoButton variant="secondary" size="sm" @click="setUnstakeAmount(0.5)">50%</NeoButton>
          <NeoButton variant="secondary" size="sm" @click="setUnstakeAmount(0.75)">75%</NeoButton>
          <NeoButton variant="secondary" size="sm" @click="setUnstakeAmount(1)">MAX</NeoButton>
        </view>
      </view>

      <view class="conversion-card-neo mb-6">
        <view class="conversion-row">
          <text class="conversion-label">{{ t("youWillReceive") }}</text>
          <text class="conversion-value">{{ estimatedNeo }} NEO</text>
        </view>
        <view class="conversion-row">
          <text class="conversion-label">{{ t("exchangeRate") }}</text>
          <text class="conversion-value">1 bNEO = 1.01 NEO</text>
        </view>
      </view>

      <NeoButton variant="danger" size="lg" block :disabled="!canUnstake" :loading="loading" @click="handleUnstake">
        {{ loading ? t("processing") : t("unstakeBneo") }}
      </NeoButton>
    </NeoCard>

    <!-- Rewards Tab -->
    <view v-if="activeTab === 'rewards'" class="tab-content">
      <NeoCard class="rewards-panel-card">
        <view class="rewards-summary text-center mb-6">
          <text class="summary-title block mb-2">{{ t("totalRewards") }}</text>
          <text class="summary-value block mb-1">{{ formatAmount(totalRewards) }} NEO</text>
          <text class="summary-usd block">≈ ${{ totalRewardsUsd }}</text>
        </view>

        <view class="rewards-breakdown mb-6">
          <view class="breakdown-item">
            <text class="breakdown-label">{{ t("stakedAmount") }}</text>
            <text class="breakdown-value">{{ formatAmount(bNeoBalance) }} bNEO</text>
          </view>
          <view class="breakdown-item">
            <text class="breakdown-label">{{ t("dailyRewards") }}</text>
            <text class="breakdown-value">+{{ dailyRewards }} NEO</text>
          </view>
          <view class="breakdown-item">
            <text class="breakdown-label">{{ t("weeklyRewards") }}</text>
            <text class="breakdown-value">+{{ weeklyRewards }} NEO</text>
          </view>
          <view class="breakdown-item">
            <text class="breakdown-label">{{ t("monthlyRewards") }}</text>
            <text class="breakdown-value">+{{ monthlyRewards }} NEO</text>
          </view>
        </view>

        <NeoButton variant="success" size="lg" block :disabled="totalRewards <= 0" @click="handleClaimRewards">
          {{ t("claimRewards") }}
        </NeoButton>
      </NeoCard>
    </view>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useWallet } from "@neo/uniapp-sdk";
import { createT } from "@/shared/utils/i18n";
import { AppLayout, AppIcon, NeoButton, NeoDoc, NeoInput, NeoCard, NeoStats } from "@/shared/components";
import type { NavTab } from "@/shared/components/NavBar.vue";
import type { StatItem } from "@/shared/components/NeoStats.vue";
import { getPrices, type PriceData } from "@/shared/utils/price";

const APP_ID = "miniapp-neoburger";
const BNEO_CONTRACT = "0x48c40d4666f93408be1bef038b6722404d9a4c2a";

const translations = {
  title: { en: "NeoBurger", zh: "NeoBurger" },
  subtitle: { en: "Liquid Staking for NEO", zh: "NEO 流动性质押" },
  liquidStaking: { en: "Liquid Staking Protocol", zh: "流动性质押协议" },
  yourBneo: { en: "Your bNEO", zh: "您的 bNEO" },
  yourNeo: { en: "Your NEO", zh: "您的 NEO" },
  currentApy: { en: "Current APY", zh: "当前年化收益" },
  estimatedRewards: { en: "Estimated Rewards", zh: "预估奖励" },
  daily: { en: "Daily", zh: "每日" },
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
  totalRewards: { en: "Total Rewards", zh: "总奖励" },
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
};

const t = createT(translations);

const { getAddress, invokeContract, getBalance } = useWallet();

// Navigation tabs
const navTabs: NavTab[] = [
  { id: "stake", icon: "lock", label: t("tabStake") },
  { id: "unstake", icon: "unlock", label: t("tabUnstake") },
  { id: "rewards", icon: "gift", label: t("tabRewards") },
  { id: "docs", icon: "book", label: t("docs") },
];
const activeTab = ref("stake");

// State
const stakeAmount = ref("");
const unstakeAmount = ref("");
const neoBalance = ref(0);
const bNeoBalance = ref(0);
const loading = ref(false);
const statusMessage = ref("");
const statusType = ref<"success" | "error">("success");
const apy = ref(19.5);
const animatedApy = ref("0.0");
const loadingApy = ref(true);
const priceData = ref<PriceData | null>(null);

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
  return parseFloat(dailyRewards.value) * 30; // Mock: 30 days of rewards
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
  // Mock progress based on time of day
  const now = new Date();
  const secondsToday = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  const secondsInDay = 86400;
  return Math.min((secondsToday / secondsInDay) * 100, 100);
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
  setTimeout(() => (statusMessage.value = ""), 5000);
}

// Animate APY counter
function animateApy() {
  const target = apy.value;
  const duration = 2000;
  const steps = 60;
  const increment = target / steps;
  let current = 0;
  let step = 0;

  const timer = setInterval(() => {
    current += increment;
    step++;
    animatedApy.value = current.toFixed(1);

    if (step >= steps) {
      animatedApy.value = target.toFixed(1);
      clearInterval(timer);
    }
  }, duration / steps);
}

async function loadBalances() {
  try {
    const address = await getAddress();
    if (!address) return;

    const neo = await getBalance("NEO");
    const bneo = await getBalance(BNEO_CONTRACT);
    neoBalance.value = typeof neo === "number" ? neo : 0;
    bNeoBalance.value = typeof bneo === "number" ? bneo : 0;
  } catch (e) {
    console.error("Failed to load balances:", e);
  }
}

async function loadApy() {
  try {
    loadingApy.value = true;
    const response = await fetch("/api/neoburger/stats");
    if (response.ok) {
      const data = await response.json();
      apy.value = parseFloat(data.apr) || 19.5;
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
    await invokeContract({
      scriptHash: BNEO_CONTRACT,
      operation: "transfer",
      args: [
        { type: "Hash160", value: await getAddress() },
        { type: "Hash160", value: BNEO_CONTRACT },
        { type: "Integer", value: amount * 100000000 },
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
      scriptHash: BNEO_CONTRACT,
      operation: "transfer",
      args: [
        { type: "Hash160", value: await getAddress() },
        { type: "Hash160", value: BNEO_CONTRACT },
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
    // Mock claim rewards - implement actual contract call
    await new Promise((resolve) => setTimeout(resolve, 2000));
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
</script>

<style lang="scss" scoped>
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.hero-apy-card {
  background: var(--brutal-yellow) !important;
  color: black !important;
  border: 4px solid black;
  box-shadow: 10px 10px 0 black;
  .hero-label {
    display: block;
    font-size: 10px;
    font-weight: $font-weight-black;
    text-transform: uppercase;
    margin-bottom: $space-2;
  }
  .hero-value {
    display: block;
    font-size: 48px;
    font-weight: $font-weight-black;
    line-height: 1;
    margin-bottom: $space-2;
  }
  .hero-subtitle {
    display: block;
    font-size: 8px;
    font-weight: $font-weight-black;
    text-transform: uppercase;
    opacity: 0.6;
  }
}

.burger-icon {
  margin-bottom: $space-4;
  color: black;
}

.rewards-badge {
  background: black;
  color: white;
  padding: 2px 8px;
  font-size: 8px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  border: 2px solid black;
}
.rewards-body {
  text-align: center;
  margin-bottom: $space-4;
}
.rewards-amount {
  display: block;
  font-size: 32px;
  font-weight: $font-weight-black;
  color: var(--neo-green);
  font-family: $font-mono;
}
.rewards-usd {
  display: block;
  font-size: 12px;
  font-weight: $font-weight-bold;
  opacity: 0.6;
}

.rewards-progress-container {
  background: white;
  border: 2px solid black;
  height: 12px;
  overflow: hidden;
  margin-top: $space-2;
}
.rewards-progress-bar {
  height: 100%;
  background: var(--neo-green);
  border-right: 2px solid black;
}

.conversion-card-neo {
  background: #f0f0f0;
  border: 2px solid black;
  padding: $space-4;
}
.conversion-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: $space-2;
  &:last-child {
    margin-bottom: 0;
  }
}
.conversion-label {
  font-size: 8px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  opacity: 0.6;
}
.conversion-value {
  font-size: 10px;
  font-weight: $font-weight-black;
  font-family: $font-mono;
  &.highlight {
    color: var(--neo-purple);
  }
}

.input-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: $space-2;
}
.input-label {
  font-size: 8px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
}
.balance-hint {
  font-size: 8px;
  font-weight: $font-weight-bold;
  opacity: 0.6;
}

.quick-amounts {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: $space-2;
}

.rewards-panel-card {
  border: 4px solid black;
  box-shadow: 10px 10px 0 black;
}
.summary-title {
  font-size: 10px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  opacity: 0.6;
}
.summary-value {
  font-size: 36px;
  font-weight: $font-weight-black;
  font-family: $font-mono;
  color: var(--neo-green);
}
.summary-usd {
  font-size: 14px;
  font-weight: $font-weight-bold;
  opacity: 0.6;
}

.breakdown-item {
  display: flex;
  justify-content: space-between;
  padding: $space-2 0;
  border-bottom: 1px dashed black;
  &:last-child {
    border-bottom: none;
  }
}
.breakdown-label {
  font-size: 8px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  opacity: 0.6;
}
.breakdown-value {
  font-size: 10px;
  font-weight: $font-weight-black;
  font-family: $font-mono;
}

.tab-content {
  padding: $space-4;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: $space-4;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.status-text {
  font-weight: $font-weight-black;
  text-transform: uppercase;
  font-size: 12px;
}
</style>
