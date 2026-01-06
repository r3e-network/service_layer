<template>
  <AppLayout :title="t('title')" show-top-nav :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <!-- Swap Tab -->
    <view v-if="activeTab === 'swap'">
      <!-- Swap Card -->
      <!-- Swap Card -->
      <NeoCard class="swap-card">
        <!-- From Token Card -->
        <view class="token-card">
          <view class="token-card-header">
            <text class="section-label">{{ t("from") }}</text>
            <text class="balance-text">{{ t("balance") }}: {{ formatAmount(fromToken.balance) }}</text>
          </view>
          <view class="token-input-row">
            <view class="token-select" @click="openFromSelector">
              <AppIcon :name="fromToken.symbol.toLowerCase()" :size="32" />
              <view class="token-info">
                <text class="token-symbol">{{ fromToken.symbol }}</text>
                <AppIcon name="chevron-right" :size="16" rotate="90" />
              </view>
            </view>
            <NeoInput
              v-model="fromAmount"
              type="number"
              placeholder="0.0"
              @input="onFromAmountChange"
              class="amount-input-wrapper"
            />
          </view>
        </view>

        <!-- Swap Direction Button -->
        <view class="swap-direction-container">
          <view :class="['swap-direction-btn', { rotating: isSwapping }]" @click="swapTokens">
            <AppIcon name="swap" :size="24" />
          </view>
        </view>

        <!-- To Token Card -->
        <view class="token-card">
          <view class="token-card-header">
            <text class="section-label">{{ t("to") }}</text>
            <text class="balance-text">{{ t("balance") }}: {{ formatAmount(toToken.balance) }}</text>
          </view>
          <view class="token-input-row">
            <view class="token-select" @click="openToSelector">
              <AppIcon :name="toToken.symbol.toLowerCase()" :size="32" />
              <view class="token-info">
                <text class="token-symbol">{{ toToken.symbol }}</text>
                <AppIcon name="chevron-right" :size="16" rotate="90" />
              </view>
            </view>
            <NeoInput v-model="toAmount" type="number" placeholder="0.0" disabled class="amount-input-wrapper" />
          </view>
        </view>
      </NeoCard>

      <!-- Exchange Rate & Details -->
      <view class="rate-card" v-if="exchangeRate">
        <view class="rate-header" @click="toggleDetails">
          <view class="rate-info">
            <text class="rate-label">{{ t("exchangeRate") }}</text>
            <text class="rate-value">1 {{ fromToken.symbol }} ≈ {{ exchangeRate }} {{ toToken.symbol }}</text>
          </view>
          <view class="rate-actions">
            <AppIcon name="history" :size="20" class="refresh-icon" @click.stop="fetchExchangeRate" />
            <AppIcon name="chevron-right" :size="16" :rotate="showDetails ? 270 : 90" />
          </view>
        </view>

        <!-- Transaction Details Accordion -->
        <view v-if="showDetails" class="details-accordion">
          <view class="detail-row">
            <text class="detail-label">{{ t("priceImpact") }}</text>
            <text :class="['detail-value', priceImpactClass]">{{ priceImpact }}</text>
          </view>
          <view class="detail-row">
            <text class="detail-label">{{ t("slippage") }}</text>
            <text class="detail-value">{{ slippage }}</text>
          </view>
          <view class="detail-row">
            <text class="detail-label">{{ t("liquidityPool") }}</text>
            <text class="detail-value">{{ liquidityPool }}</text>
          </view>
          <view class="detail-row">
            <text class="detail-label">{{ t("minReceived") }}</text>
            <text class="detail-value">{{ minReceived }} {{ toToken.symbol }}</text>
          </view>
        </view>
      </view>

      <!-- Swap Button -->
      <!-- Swap Button -->
      <NeoButton
        variant="primary"
        size="lg"
        block
        :loading="loading"
        :disabled="!canSwap || loading"
        @click="executeSwap"
      >
        {{ swapButtonText }}
      </NeoButton>

      <!-- Status -->
      <!-- Status -->
      <NeoCard v-if="status" :variant="status.type === 'error' ? 'danger' : 'success'" class="mt-4">
        <text class="text-center font-bold">{{ status.msg }}</text>
      </NeoCard>

      <!-- Token Selector Modal -->
      <view v-if="showSelector" class="modal-overlay" @click="closeSelector">
        <view class="modal-content scale-in" @click.stop>
          <view class="modal-header">
            <text class="modal-title">{{ t("selectToken") }}</text>
            <AppIcon name="x" :size="24" class="close-btn" @click="closeSelector" />
          </view>
          <scroll-view scroll-y class="token-list">
            <view v-for="token in availableTokens" :key="token.symbol" class="token-option" @click="selectToken(token)">
              <AppIcon :name="token.symbol.toLowerCase()" :size="32" />
              <view class="token-info">
                <text class="token-name">{{ token.symbol }}</text>
                <text class="token-balance">{{ formatAmount(token.balance) }}</text>
              </view>
              >
              <AppIcon
                v-if="token.symbol === (selectorTarget === 'from' ? fromToken.symbol : toToken.symbol)"
                name="check"
                :size="20"
                class="check-mark"
              />
            </view>
          </scroll-view>
        </view>
      </view>
    </view>

    <!-- Pool Tab -->
    <view v-if="activeTab === 'pool'" class="tab-content">
      <view class="pool-section">
        <view class="pool-header">
          <text class="pool-title">{{ t("liquidityPool") }}</text>
          <text class="pool-subtitle">{{ t("poolSubtitle") }}</text>
        </view>

        <!-- Pool Stats -->
        <!-- Pool Stats -->
        <view class="pool-stats">
          <NeoStats :stats="poolStats" />
        </view>

        <!-- Your Position -->
        <!-- Your Position -->
        <NeoCard :title="t('yourPosition')" variant="default">
          <view class="position-row mb-2 flex justify-between">
            <text class="position-label text-secondary">NEO/GAS LP</text>
            <text class="position-value font-bold">0.00</text>
          </view>
          <view class="position-row flex justify-between">
            <text class="position-label text-secondary">{{ t("poolShare") }}</text>
            <text class="position-value font-bold">0.00%</text>
          </view>
        </NeoCard>

        <!-- Add Liquidity Button -->
        <button class="pool-btn" disabled>
          {{ t("addLiquidity") }}
        </button>
        <text class="coming-soon">{{ t("comingSoon") }}</text>
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
import { ref, computed, onMounted } from "vue";
import { useWallet } from "@neo/uniapp-sdk";
import { createT } from "@/shared/utils/i18n";
import { AppLayout, NeoDoc, AppIcon, NeoButton, NeoCard, NeoInput, NeoStats, type StatItem } from "@/shared/components";
import type { NavTab } from "@/shared/components/NavBar.vue";

const docSteps = computed(() => [t("step1"), t("step2"), t("step3"), t("step4")]);
const docFeatures = computed(() => [
  { name: t("feature1Name"), desc: t("feature1Desc") },
  { name: t("feature2Name"), desc: t("feature2Desc") },
]);
const APP_ID = "miniapp-neo-swap";
const SWAP_ROUTER = "0xf970f4ccecd765b63732b821775dc38c25d74f23";

const translations = {
  title: { en: "Flamingo Swap", zh: "火烈鸟兑换" },
  subtitle: { en: "Swap NEO ↔ GAS instantly", zh: "即时兑换 NEO ↔ GAS" },
  from: { en: "From", zh: "从" },
  to: { en: "To", zh: "到" },
  balance: { en: "Balance", zh: "余额" },
  exchangeRate: { en: "Exchange Rate", zh: "兑换率" },
  priceImpact: { en: "Price Impact", zh: "价格影响" },
  slippage: { en: "Slippage Tolerance", zh: "滑点容差" },
  liquidityPool: { en: "Liquidity Pool", zh: "流动性池" },
  minReceived: { en: "Minimum Received", zh: "最少收到" },
  enterAmount: { en: "Enter amount", zh: "输入数量" },
  insufficientBalance: { en: "Insufficient balance", zh: "余额不足" },
  swapping: { en: "Swapping...", zh: "兑换中..." },
  selectToken: { en: "Select Token", zh: "选择代币" },
  swapSuccess: { en: "Swapped", zh: "兑换成功" },
  swapFailed: { en: "Swap failed", zh: "兑换失败" },
  tabSwap: { en: "Swap", zh: "兑换" },
  tabPool: { en: "Pool", zh: "流动池" },
  poolSubtitle: { en: "Provide liquidity and earn fees", zh: "提供流动性并赚取手续费" },
  yourPosition: { en: "Your Position", zh: "您的仓位" },
  poolShare: { en: "Pool Share", zh: "池份额" },
  addLiquidity: { en: "Add Liquidity", zh: "添加流动性" },
  comingSoon: { en: "Coming Soon", zh: "即将推出" },

  docs: { en: "Docs", zh: "文档" },
  docSubtitle: {
    en: "Instant token swaps via Flamingo DEX",
    zh: "通过 Flamingo DEX 即时代币兑换",
  },
  docDescription: {
    en: "Neo Swap provides instant token swaps between NEO, GAS, and other Neo N3 tokens. Powered by Flamingo DEX with competitive rates and minimal slippage.",
    zh: "Neo Swap 提供 NEO、GAS 和其他 Neo N3 代币之间的即时兑换。由 Flamingo DEX 驱动，提供有竞争力的汇率和最小滑点。",
  },
  step1: {
    en: "Connect your Neo wallet and select tokens to swap",
    zh: "连接您的 Neo 钱包并选择要兑换的代币",
  },
  step2: {
    en: "Enter the amount and review the exchange rate and price impact",
    zh: "输入金额并查看汇率和价格影响",
  },
  step3: {
    en: "Confirm the swap transaction in your wallet",
    zh: "在钱包中确认兑换交易",
  },
  step4: {
    en: "Receive tokens instantly - no waiting period required",
    zh: "即时收到代币 - 无需等待期",
  },
  feature1Name: { en: "Best Rates", zh: "最佳汇率" },
  feature1Desc: {
    en: "Aggregates liquidity from Flamingo DEX for optimal swap rates.",
    zh: "聚合 Flamingo DEX 流动性以获得最佳兑换率。",
  },
  feature2Name: { en: "Low Slippage", zh: "低滑点" },
  feature2Desc: {
    en: "Deep liquidity pools ensure minimal price impact on your trades.",
    zh: "深度流动性池确保您的交易价格影响最小。",
  },
};

const t = createT(translations);

const { getAddress, invokeContract, getBalance } = useWallet();

// Navigation tabs
const navTabs: NavTab[] = [
  { id: "swap", icon: "swap", label: t("tabSwap") },
  { id: "pool", icon: "droplet", label: t("tabPool") },
  { id: "docs", icon: "book", label: t("docs") },
];
const activeTab = ref("swap");

interface Token {
  symbol: string;
  icon: string;
  hash: string;
  balance: number;
  decimals: number;
}

const TOKENS: Token[] = [
  { symbol: "NEO", icon: "neo", hash: "0xef4073a0f2b305a38ec4050e4d3d28bc40ea63f5", balance: 0, decimals: 0 },
  { symbol: "GAS", icon: "gas", hash: "0xd2a4cff31913016155e38e474a2c06d08be276cf", balance: 0, decimals: 8 },
];

// State
const fromToken = ref<Token>({ ...TOKENS[0] });
const toToken = ref<Token>({ ...TOKENS[1] });
const fromAmount = ref("");
const toAmount = ref("");
const exchangeRate = ref("");
const loading = ref(false);
const status = ref<{ msg: string; type: string } | null>(null);
const showSelector = ref(false);
const selectorTarget = ref<"from" | "to">("from");
const showDetails = ref(false);
const isSwapping = ref(false);

const availableTokens = computed(() => TOKENS);

const canSwap = computed(() => {
  const amount = parseFloat(fromAmount.value);
  return amount > 0 && amount <= fromToken.value.balance;
});

const swapButtonText = computed(() => {
  if (loading.value) return t("swapping");
  if (!fromAmount.value) return t("enterAmount");
  if (parseFloat(fromAmount.value) > fromToken.value.balance) return t("insufficientBalance");
  return `Swap ${fromToken.value.symbol} → ${toToken.value.symbol}`;
});

// DeFi metrics
const priceImpact = computed(() => {
  const amount = parseFloat(fromAmount.value) || 0;
  if (amount === 0) return "0.00%";
  // Simplified calculation - in production would use pool reserves
  const impact = (amount / 1000) * 100;
  return impact > 0.01 ? `${impact.toFixed(2)}%` : "< 0.01%";
});

const priceImpactClass = computed(() => {
  const impact = parseFloat(priceImpact.value);
  if (impact < 1) return "impact-low";
  if (impact < 3) return "impact-medium";
  return "impact-high";
});

const slippage = computed(() => "0.5%");
const liquidityPool = computed(() => "NEO/GAS");
const minReceived = computed(() => {
  const amount = parseFloat(toAmount.value) || 0;
  return (amount * 0.995).toFixed(4);
});

const poolStats = computed<StatItem[]>(() => [
  { label: "TVL", value: "$12.5M" },
  { label: "APR", value: "24.5%", variant: "success" },
]);

// Methods
function formatAmount(amount: number): string {
  return amount.toFixed(4);
}

function showStatus(msg: string, type: "success" | "error") {
  status.value = { msg, type };
  setTimeout(() => (status.value = null), 5000);
}

async function loadBalances() {
  try {
    const neo = await getBalance("NEO");
    const gas = await getBalance("GAS");
    TOKENS[0].balance = typeof neo === "object" ? 0 : Number(neo || 0);
    TOKENS[1].balance = typeof gas === "object" ? 0 : Number(gas || 0);
    fromToken.value = { ...TOKENS[0] };
    toToken.value = { ...TOKENS[1] };
  } catch (e) {
    console.error("Failed to load balances:", e);
  }
}

async function fetchExchangeRate() {
  // Simplified rate - in production would call Flamingo API
  const rate = fromToken.value.symbol === "NEO" ? "8.5" : "0.118";
  exchangeRate.value = rate;
}

function onFromAmountChange() {
  const amount = parseFloat(fromAmount.value) || 0;
  const rate = parseFloat(exchangeRate.value) || 0;
  toAmount.value = (amount * rate).toFixed(4);
}

function swapTokens() {
  isSwapping.value = true;
  const temp = fromToken.value;
  fromToken.value = toToken.value;
  toToken.value = temp;
  fromAmount.value = "";
  toAmount.value = "";
  fetchExchangeRate();
  setTimeout(() => (isSwapping.value = false), 300);
}

function toggleDetails() {
  showDetails.value = !showDetails.value;
}

function openFromSelector() {
  selectorTarget.value = "from";
  showSelector.value = true;
}

function openToSelector() {
  selectorTarget.value = "to";
  showSelector.value = true;
}

function closeSelector() {
  showSelector.value = false;
}

function selectToken(token: Token) {
  if (selectorTarget.value === "from") {
    if (token.symbol === toToken.value.symbol) swapTokens();
    else fromToken.value = { ...token };
  } else {
    if (token.symbol === fromToken.value.symbol) swapTokens();
    else toToken.value = { ...token };
  }
  closeSelector();
  fetchExchangeRate();
}

async function executeSwap() {
  if (!canSwap.value || loading.value) return;

  loading.value = true;
  try {
    const amount = parseFloat(fromAmount.value);
    const decimals = fromToken.value.decimals;
    const amountInt = Math.floor(amount * Math.pow(10, decimals));

    await invokeContract({
      scriptHash: SWAP_ROUTER,
      operation: "swap",
      args: [
        { type: "Hash160", value: await getAddress() },
        { type: "Hash160", value: fromToken.value.hash },
        { type: "Hash160", value: toToken.value.hash },
        { type: "Integer", value: amountInt },
        { type: "Integer", value: 0 },
      ],
    });

    showStatus(`${t("swapSuccess")} ${amount} ${fromToken.value.symbol}!`, "success");
    fromAmount.value = "";
    toAmount.value = "";
    await loadBalances();
  } catch (e: any) {
    showStatus(e.message || t("swapFailed"), "error");
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadBalances();
  fetchExchangeRate();
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

.swap-card {
  background: white;
  border: 4px solid black;
  box-shadow: 10px 10px 0 black;
  padding: $space-5;
  margin-bottom: $space-4;
  position: relative;
}

.token-card {
  margin-bottom: $space-4;
}
.token-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $space-2;
}
.section-label {
  font-size: 8px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  opacity: 0.6;
}
.balance-text {
  font-size: 8px;
  font-weight: $font-weight-bold;
  opacity: 0.6;
}

.token-input-row {
  display: flex;
  align-items: center;
  gap: $space-3;
  background: #f0f0f0;
  border: 2px solid black;
  padding: $space-2;
}
.token-select {
  display: flex;
  align-items: center;
  gap: $space-2;
  background: black;
  color: white;
  padding: $space-2 $space-3;
  cursor: pointer;
  border: 2px solid black;
  &:hover {
    background: var(--neo-purple);
  }
}
.token-symbol {
  font-weight: $font-weight-black;
  font-size: 14px;
}

.amount-input-wrapper {
  flex: 1;
  ::v_deep .uni-easyinput__content {
    background: transparent !important;
    border: none !important;
  }
  ::v_deep .uni-easyinput__content-input {
    font-size: 24px !important;
    font-weight: $font-weight-black;
    text-align: right !important;
    height: 40px;
  }
}

.swap-direction-container {
  display: flex;
  justify-content: center;
  margin: -$space-4 0;
  position: relative;
  z-index: 2;
}
.swap-direction-btn {
  width: 40px;
  height: 40px;
  background: var(--brutal-yellow);
  border: 2px solid black;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 4px 4px 0 black;
  &:hover {
    transform: scale(1.1) rotate(180deg);
    transition: transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  }
}

.rate-card {
  background: #f9f9f9;
  border: 2px solid black;
  padding: $space-3;
  margin-bottom: $space-4;
}
.rate-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}
.rate-label {
  font-size: 8px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  opacity: 0.6;
  display: block;
}
.rate-value {
  font-weight: $font-weight-black;
  font-size: 10px;
  font-family: $font-mono;
}

.details-accordion {
  margin-top: $space-3;
  padding-top: $space-3;
  border-top: 1px dashed black;
}
.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 2px 0;
}
.detail-label {
  font-size: 8px;
  opacity: 0.6;
  font-weight: $font-weight-bold;
}
.detail-value {
  font-size: 8px;
  font-weight: $font-weight-black;
  &.impact-low {
    color: #10b981;
  }
}

.pool-section {
  padding: $space-4;
}
.pool-title {
  font-size: 24px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  display: block;
}
.pool-subtitle {
  font-size: 10px;
  opacity: 0.6;
  font-weight: $font-weight-bold;
  display: block;
  margin-bottom: $space-4;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}
.modal-content {
  background: white;
  border: 4px solid black;
  width: 300px;
  box-shadow: 10px 10px 0 black;
}
.modal-header {
  padding: $space-3;
  border-bottom: 2px solid black;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #eee;
}
.modal-title {
  font-weight: $font-weight-black;
  text-transform: uppercase;
  font-size: 12px;
}
.token-option {
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: $space-3;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  &:hover {
    background: #f0f0f0;
  }
}

.scrollable {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

@keyframes rotate360 {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(180deg);
  }
}

// === SWAP BUTTON ===
.swap-btn {
  width: 100%;
  background: var(--neo-purple);
  border: $border-width-md solid var(--border-color);
  box-shadow: $shadow-md;
  padding: $space-4;
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
  color: var(--neo-white);
  cursor: pointer;
  transition: all $transition-fast;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $space-2;

  &:hover:not(:disabled) {
    background: var(--neo-green);
    box-shadow: $shadow-neo;
    transform: translate(-2px, -2px);
  }

  &:active:not(:disabled) {
    transform: translate(0, 0);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &.loading {
    background: var(--text-secondary);
  }
}

.loading-spinner {
  font-size: $font-size-xl;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

// === MODAL ===
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: $z-modal;
}

.modal-content {
  background: var(--bg-card);
  border: $border-width-md solid var(--border-color);
  box-shadow: $shadow-lg;
  padding: 0;
  width: 320px;
  overflow: hidden;
}

.modal-header {
  padding: $space-4 $space-5;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: $border-width-sm solid var(--border-color);
  background: var(--bg-secondary);
}

.close-btn {
  font-size: $font-size-2xl;
  color: var(--text-secondary);
  padding: $space-1;
  line-height: 1;
  cursor: pointer;
}

.token-list {
  max-height: 300px;
  padding: $space-3;
}

.token-option {
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: $space-3;
  cursor: pointer;
  transition: background $transition-fast;
  margin-bottom: $space-1;
  border: $border-width-sm solid transparent;

  &:active {
    background: var(--bg-secondary);
    border-color: var(--border-color);
  }
}

.check-mark {
  color: var(--neo-green);
  font-weight: $font-weight-bold;
}

.scale-in {
  animation: scaleIn $transition-normal;
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.button-hover {
  opacity: 0.9 !important;
  transform: translate(2px, 2px);
}

// === STATUS MESSAGE ===
.status-msg {
  padding: $space-3 $space-4;
  margin-top: $space-4;
  border: $border-width-sm solid var(--border-color);
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;

  &.success {
    background: var(--neo-green);
    color: var(--neo-black);
    border-color: var(--neo-green);
  }

  &.error {
    background: var(--brutal-red);
    color: var(--neo-white);
    border-color: var(--brutal-red);
  }
}

// === TAB CONTENT ===
.tab-content {
  padding: $space-4;
  flex: 1;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
}

// === MODAL TITLE ===
.modal-title {
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
  color: var(--text-primary);
}

// === POOL SECTION ===
.pool-section {
  padding: $space-4;
}

.pool-header {
  text-align: center;
  margin-bottom: $space-5;
}

.pool-title {
  display: block;
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  color: var(--text-primary);
  margin-bottom: $space-2;
}

.pool-subtitle {
  font-size: $font-size-sm;
  color: var(--text-secondary);
}

.pool-stats {
  display: flex;
  gap: $space-3;
  margin-bottom: $space-4;
}

.stat-card {
  flex: 1;
  background: var(--bg-card);
  border: $border-width-sm solid var(--border-color);
  padding: $space-4;
  text-align: center;
}

.stat-label {
  display: block;
  font-size: $font-size-xs;
  color: var(--text-secondary);
  text-transform: uppercase;
  margin-bottom: $space-2;
}

.stat-value {
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  color: var(--text-primary);

  &.highlight {
    color: var(--neo-green);
  }
}

.position-card {
  background: var(--bg-card);
  border: $border-width-sm solid var(--border-color);
  padding: $space-4;
  margin-bottom: $space-4;
}

.position-title {
  display: block;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  color: var(--text-primary);
  margin-bottom: $space-3;
}

.position-row {
  display: flex;
  justify-content: space-between;
  padding: $space-2 0;
}

.position-label {
  font-size: $font-size-sm;
  color: var(--text-secondary);
}

.position-value {
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;
  color: var(--text-primary);
}

.pool-btn {
  width: 100%;
  background: var(--bg-secondary);
  border: $border-width-md solid var(--border-color);
  padding: $space-4;
  font-size: $font-size-base;
  font-weight: $font-weight-bold;
  color: var(--text-muted);
  cursor: not-allowed;
  opacity: 0.6;
}

.coming-soon {
  display: block;
  text-align: center;
  font-size: $font-size-xs;
  color: var(--text-muted);
  margin-top: $space-3;
  text-transform: uppercase;
  letter-spacing: 1px;
}
</style>
