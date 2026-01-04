<template>
  <AppLayout :title="t('title')" show-top-nav :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <view v-if="activeTab === 'stake' || activeTab === 'unstake' || activeTab === 'rewards'">
      <!-- Hero APY Card with Burger Theme -->
      <view class="hero-apy">
        <view class="burger-icon">🍔</view>
        <text class="hero-label">{{ t("currentApy") }}</text>
        <text class="hero-value">{{ animatedApy }}%</text>
        <text class="hero-subtitle">{{ t("liquidStaking") }}</text>
      </view>

      <!-- Stats Dashboard -->
      <view class="stats-grid">
        <view class="stat-card stat-primary">
          <view class="stat-icon">💰</view>
          <text class="stat-label">{{ t("yourNeo") }}</text>
          <text class="stat-value">{{ formatAmount(neoBalance) }}</text>
          <text class="stat-unit">NEO</text>
        </view>
        <view class="stat-card stat-secondary">
          <view class="stat-icon">🎯</view>
          <text class="stat-label">{{ t("yourBneo") }}</text>
          <text class="stat-value">{{ formatAmount(bNeoBalance) }}</text>
          <text class="stat-unit">bNEO</text>
        </view>
      </view>

      <!-- Rewards Card -->
      <view class="rewards-card">
        <view class="rewards-header">
          <text class="rewards-title">{{ t("estimatedRewards") }}</text>
          <view class="rewards-badge">{{ t("daily") }}</view>
        </view>
        <view class="rewards-body">
          <text class="rewards-amount">+{{ dailyRewards }} NEO</text>
          <text class="rewards-usd">≈ ${{ dailyRewardsUsd }}</text>
        </view>
        <view class="rewards-progress">
          <view class="progress-bar" :style="{ width: rewardsProgress + '%' }"></view>
        </view>
      </view>

    <!-- Stake Panel -->
    <view v-if="activeTab === 'stake'" class="panel">
      <view class="panel-header">
        <text class="panel-title">{{ t("stakeNeoTitle") }}</text>
        <text class="panel-subtitle">{{ t("stakeSubtitle") }}</text>
      </view>

      <view class="input-group">
        <view class="input-header">
          <text class="input-label">{{ t("amountToStake") }}</text>
          <text class="balance-hint">{{ t("balance") }}: {{ formatAmount(neoBalance) }} NEO</text>
        </view>
        <view class="input-wrapper">
          <input v-model="stakeAmount" type="digit" placeholder="0.00" class="amount-input" />
          <view class="token-badge">
            <text class="token-symbol">NEO</text>
          </view>
        </view>
        <view class="quick-amounts">
          <text class="quick-btn" @click="setStakeAmount(0.25)">25%</text>
          <text class="quick-btn" @click="setStakeAmount(0.5)">50%</text>
          <text class="quick-btn" @click="setStakeAmount(0.75)">75%</text>
          <text class="quick-btn" @click="setStakeAmount(1)">MAX</text>
        </view>
      </view>

      <view class="conversion-card">
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
    </view>

    <!-- Unstake Panel -->
    <view v-if="activeTab === 'unstake'" class="panel">
      <view class="panel-header">
        <text class="panel-title">{{ t("unstakeBneoTitle") }}</text>
        <text class="panel-subtitle">{{ t("unstakeSubtitle") }}</text>
      </view>

      <view class="input-group">
        <view class="input-header">
          <text class="input-label">{{ t("amountToUnstake") }}</text>
          <text class="balance-hint">{{ t("balance") }}: {{ formatAmount(bNeoBalance) }} bNEO</text>
        </view>
        <view class="input-wrapper">
          <input v-model="unstakeAmount" type="digit" placeholder="0.00" class="amount-input" />
          <view class="token-badge token-badge-secondary">
            <text class="token-symbol">bNEO</text>
          </view>
        </view>
        <view class="quick-amounts">
          <text class="quick-btn" @click="setUnstakeAmount(0.25)">25%</text>
          <text class="quick-btn" @click="setUnstakeAmount(0.5)">50%</text>
          <text class="quick-btn" @click="setUnstakeAmount(0.75)">75%</text>
          <text class="quick-btn" @click="setUnstakeAmount(1)">MAX</text>
        </view>
      </view>

      <view class="conversion-card">
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
    </view>

    <!-- Rewards Tab -->
    <view v-if="activeTab === 'rewards'" class="tab-content">
      <view class="rewards-panel">
        <view class="rewards-summary">
          <text class="summary-title">{{ t("totalRewards") }}</text>
          <text class="summary-value">{{ formatAmount(totalRewards) }} NEO</text>
          <text class="summary-usd">≈ ${{ totalRewardsUsd }}</text>
        </view>

        <view class="rewards-breakdown">
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

    <!-- Status Message -->
    <view v-if="statusMessage" class="status" :class="statusType">
      <text>{{ statusMessage }}</text>
    </view>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useWallet } from "@neo/uniapp-sdk";
import { createT } from "@/shared/utils/i18n";
import AppLayout from "@/shared/components/AppLayout.vue";
import NeoButton from "@/shared/components/NeoButton.vue";
import NeoDoc from "@/shared/components/NeoDoc.vue";
import type { NavTab } from "@/shared/components/NavBar.vue";

const APP_ID = "miniapp-neoburger";
const BNEO_CONTRACT = "0x48c40d4666f93408be1bef038b6722404d9a4c2a";
const NEO_PRICE_USD = 15; // Mock price, should fetch from API

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

// Docs
const docSteps = computed(() => [t("step1"), t("step2"), t("step3")]);
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
  return (parseFloat(dailyRewards.value) * NEO_PRICE_USD).toFixed(2);
});

const totalRewardsUsd = computed(() => {
  return (totalRewards.value * NEO_PRICE_USD).toFixed(2);
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
    neoBalance.value = neo || 0;
    bNeoBalance.value = bneo || 0;
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

onMounted(() => {
  loadBalances();
  loadApy();
});
</script>

<style lang="scss" scoped>
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

// ============================================
// HERO APY CARD - Burger Theme
// ============================================

.hero-apy {
  background: linear-gradient(135deg, var(--brutal-orange), var(--brutal-yellow));
  border: $border-width-lg solid var(--border-color);
  border-radius: $radius-md;
  padding: $space-8;
  text-align: center;
  margin-bottom: $space-6;
  box-shadow: $shadow-xl;
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: -50%;
    right: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
    animation: pulse 3s ease-in-out infinite;
  }
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

.burger-icon {
  font-size: 3rem;
  margin-bottom: $space-2;
  animation: bounce 2s ease-in-out infinite;
}

@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.hero-label {
  display: block;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: $neo-black;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-bottom: $space-2;
}

.hero-value {
  display: block;
  font-size: $font-size-4xl;
  font-weight: $font-weight-black;
  color: $neo-black;
  line-height: $line-height-tight;
  margin-bottom: $space-2;
  text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.1);
}

.hero-subtitle {
  display: block;
  font-size: $font-size-xs;
  font-weight: $font-weight-medium;
  color: $neo-black;
  opacity: 0.8;
}

// ============================================
// STATS GRID
// ============================================

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $space-4;
  margin-bottom: $space-6;
}

.stat-card {
  background: var(--bg-card);
  border: $border-width-md solid var(--border-color);
  border-radius: $radius-sm;
  padding: $space-5;
  text-align: center;
  box-shadow: $shadow-md;
  transition: transform $transition-fast;

  &:active {
    transform: translateY(2px);
    box-shadow: $shadow-sm;
  }
}

.stat-primary {
  border-color: var(--neo-green);
  box-shadow: 4px 4px 0 var(--neo-green);
}

.stat-secondary {
  border-color: var(--neo-purple);
  box-shadow: 4px 4px 0 var(--neo-purple);
}

.stat-icon {
  font-size: 2rem;
  margin-bottom: $space-2;
}

.stat-label {
  display: block;
  font-size: $font-size-xs;
  color: var(--text-secondary);
  margin-bottom: $space-2;
  font-weight: $font-weight-bold;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.stat-value {
  display: block;
  font-size: $font-size-2xl;
  font-weight: $font-weight-black;
  color: var(--text-primary);
  line-height: $line-height-tight;
  margin-bottom: $space-1;
}

.stat-unit {
  display: block;
  font-size: $font-size-xs;
  color: var(--text-muted);
  font-weight: $font-weight-medium;
}

// ============================================
// REWARDS CARD
// ============================================

.rewards-card {
  background: var(--bg-card);
  border: $border-width-md solid var(--neo-green);
  border-radius: $radius-sm;
  padding: $space-5;
  margin-bottom: $space-6;
  box-shadow: 5px 5px 0 var(--neo-green);
}

.rewards-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $space-4;
}

.rewards-title {
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.rewards-badge {
  background: var(--neo-green);
  color: $neo-black;
  padding: $space-1 $space-3;
  border-radius: $radius-sm;
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  text-transform: uppercase;
  border: $border-width-sm solid $neo-black;
}

.rewards-body {
  margin-bottom: $space-3;
}

.rewards-amount {
  display: block;
  font-size: $font-size-3xl;
  font-weight: $font-weight-black;
  color: var(--neo-green);
  line-height: $line-height-tight;
  margin-bottom: $space-1;
}

.rewards-usd {
  display: block;
  font-size: $font-size-sm;
  color: var(--text-muted);
  font-weight: $font-weight-medium;
}

.rewards-progress {
  background: var(--bg-secondary);
  border: $border-width-sm solid var(--border-color);
  border-radius: $radius-sm;
  height: 8px;
  overflow: hidden;
  position: relative;
}

.progress-bar {
  flex: 1;
  min-height: 0;
  background: var(--neo-green);
  transition: width 0.5s ease;
  position: relative;

  &::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    animation: shimmer 2s infinite;
  }
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

// ============================================
// PANEL
// ============================================

.panel {
  background: var(--bg-card);
  border: $border-width-md solid var(--border-color);
  border-radius: $radius-sm;
  padding: $space-6;
  box-shadow: $shadow-md;
}

.panel-header {
  margin-bottom: $space-6;
  text-align: center;
}

.panel-title {
  display: block;
  font-size: $font-size-xl;
  font-weight: $font-weight-black;
  color: var(--text-primary);
  margin-bottom: $space-2;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.panel-subtitle {
  display: block;
  font-size: $font-size-sm;
  color: var(--text-secondary);
  font-weight: $font-weight-medium;
}

// ============================================
// INPUT GROUP
// ============================================

.input-group {
  margin-bottom: $space-5;
}

.input-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $space-3;
}

.input-label {
  font-size: $font-size-sm;
  color: var(--text-secondary);
  font-weight: $font-weight-bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.balance-hint {
  font-size: $font-size-xs;
  color: var(--text-muted);
  font-weight: $font-weight-medium;
}

.input-wrapper {
  display: flex;
  align-items: center;
  background: var(--bg-secondary);
  border: $border-width-md solid var(--border-color);
  border-radius: $radius-sm;
  padding: $space-4;
  margin-bottom: $space-3;
  box-shadow: $shadow-sm;
  transition: border-color $transition-fast;

  &:focus-within {
    border-color: var(--neo-green);
    box-shadow: 0 0 0 3px rgba(0, 229, 153, 0.1);
  }
}

.amount-input {
  flex: 1;
  background: transparent;
  border: none;
  font-size: $font-size-3xl;
  font-weight: $font-weight-bold;
  color: var(--text-primary);
  outline: none;

  &::placeholder {
    color: var(--text-muted);
    opacity: 0.5;
  }
}

.token-badge {
  background: var(--neo-green);
  color: $neo-black;
  padding: $space-2 $space-4;
  border-radius: $radius-sm;
  border: $border-width-sm solid $neo-black;
  box-shadow: 2px 2px 0 $neo-black;
}

.token-badge-secondary {
  background: var(--neo-purple);
  color: $neo-white;
}

.token-symbol {
  font-size: $font-size-sm;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  letter-spacing: 1px;
}

// ============================================
// QUICK AMOUNTS
// ============================================

.quick-amounts {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: $space-2;
}

.quick-btn {
  background: var(--bg-elevated);
  border: $border-width-sm solid var(--border-color);
  border-radius: $radius-sm;
  padding: $space-2;
  text-align: center;
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all $transition-fast;
  text-transform: uppercase;

  &:active {
    transform: translateY(1px);
    background: var(--brutal-yellow);
    color: $neo-black;
    border-color: $neo-black;
  }
}

// ============================================
// CONVERSION CARD
// ============================================

.conversion-card {
  background: var(--bg-secondary);
  border: $border-width-sm solid var(--border-color);
  border-radius: $radius-sm;
  padding: $space-4;
  margin-bottom: $space-5;
}

.conversion-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $space-2 0;

  &:not(:last-child) {
    border-bottom: 1px solid var(--border-color);
  }
}

.conversion-label {
  font-size: $font-size-sm;
  color: var(--text-secondary);
  font-weight: $font-weight-medium;
}

.conversion-value {
  font-size: $font-size-base;
  font-weight: $font-weight-bold;
  color: var(--text-primary);

  &.highlight {
    color: var(--neo-green);
    font-size: $font-size-lg;
  }
}

// ============================================
// REWARDS PANEL
// ============================================

.rewards-panel {
  background: var(--bg-card);
  border: $border-width-md solid var(--border-color);
  border-radius: $radius-sm;
  padding: $space-6;
  box-shadow: $shadow-md;
}

.rewards-summary {
  text-align: center;
  padding: $space-6;
  background: linear-gradient(135deg, var(--neo-green), var(--brutal-lime));
  border: $border-width-md solid $neo-black;
  border-radius: $radius-sm;
  margin-bottom: $space-6;
  box-shadow: $shadow-lg;
}

.summary-title {
  display: block;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: $neo-black;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-bottom: $space-3;
}

.summary-value {
  display: block;
  font-size: $font-size-4xl;
  font-weight: $font-weight-black;
  color: $neo-black;
  line-height: $line-height-tight;
  margin-bottom: $space-2;
}

.summary-usd {
  display: block;
  font-size: $font-size-base;
  font-weight: $font-weight-medium;
  color: $neo-black;
  opacity: 0.7;
}

.rewards-breakdown {
  margin-bottom: $space-6;
}

.breakdown-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $space-4;
  background: var(--bg-secondary);
  border: $border-width-sm solid var(--border-color);
  border-radius: $radius-sm;
  margin-bottom: $space-3;

  &:last-child {
    margin-bottom: 0;
  }
}

.breakdown-label {
  font-size: $font-size-sm;
  color: var(--text-secondary);
  font-weight: $font-weight-bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.breakdown-value {
  font-size: $font-size-lg;
  font-weight: $font-weight-black;
  color: var(--text-primary);
}

// ============================================
// STATUS MESSAGE
// ============================================

.status {
  margin-top: $space-4;
  padding: $space-4;
  border: $border-width-md solid var(--border-color);
  border-radius: $radius-sm;
  text-align: center;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  text-transform: uppercase;
  box-shadow: $shadow-sm;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.status.success {
  background: var(--status-success);
  color: $neo-black;
  border-color: $neo-black;
}

.status.error {
  background: var(--status-error);
  color: $neo-white;
  border-color: $neo-black;
}

// ============================================
// TAB CONTENT
// ============================================

.tab-content {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.scrollable {
  max-height: 600px;
  overflow-y: auto;
    -webkit-overflow-scrolling: touch;
}
</style>
