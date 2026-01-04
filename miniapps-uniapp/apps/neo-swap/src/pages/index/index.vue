<template>
  <AppLayout :title="t('title')" show-top-nav :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <view v-if="activeTab === 'swap' || activeTab === 'pool'">
      <!-- Swap Card -->
      <view class="swap-card">
        <!-- From Token Card -->
        <view class="token-card">
          <view class="token-card-header">
            <text class="section-label">{{ t("from") }}</text>
            <text class="balance-text">{{ t("balance") }}: {{ formatAmount(fromToken.balance) }}</text>
          </view>
          <view class="token-input-row">
            <view class="token-select" @click="openFromSelector">
              <text class="token-icon">{{ fromToken.icon }}</text>
              <view class="token-info">
                <text class="token-symbol">{{ fromToken.symbol }}</text>
                <text class="dropdown-arrow">▼</text>
              </view>
            </view>
            <uni-easyinput
              v-model="fromAmount"
              type="number"
              :placeholder="'0.0'"
              :inputBorder="false"
              :clearable="true"
              @input="onFromAmountChange"
              class="amount-input-wrapper"
            />
          </view>
        </view>

        <!-- Swap Direction Button -->
        <view class="swap-direction-container">
          <view :class="['swap-direction-btn', { rotating: isSwapping }]" @click="swapTokens">
            <text class="swap-icon">⇅</text>
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
              <text class="token-icon">{{ toToken.icon }}</text>
              <view class="token-info">
                <text class="token-symbol">{{ toToken.symbol }}</text>
                <text class="dropdown-arrow">▼</text>
              </view>
            </view>
            <uni-easyinput
              v-model="toAmount"
              type="number"
              :placeholder="'0.0'"
              :inputBorder="false"
              disabled
              class="amount-input-wrapper disabled"
            />
          </view>
        </view>
      </view>

      <!-- Exchange Rate & Details -->
      <view class="rate-card" v-if="exchangeRate">
        <view class="rate-header" @click="toggleDetails">
          <view class="rate-info">
            <text class="rate-label">{{ t("exchangeRate") }}</text>
            <text class="rate-value">1 {{ fromToken.symbol }} ≈ {{ exchangeRate }} {{ toToken.symbol }}</text>
          </view>
          <view class="rate-actions">
            <text class="refresh-icon" @click.stop="fetchExchangeRate">↻</text>
            <text class="expand-icon">{{ showDetails ? "▲" : "▼" }}</text>
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
      <button
        :class="['swap-btn', { loading: loading }]"
        :disabled="!canSwap || loading"
        @click="executeSwap"
        hover-class="button-hover"
      >
        <text v-if="loading" class="loading-spinner">⟳</text>
        <text>{{ swapButtonText }}</text>
      </button>

      <!-- Status -->
      <view v-if="status" :class="['status-msg', status.type]">
        <text>{{ status.msg }}</text>
      </view>

      <!-- Token Selector Modal -->
      <view v-if="showSelector" class="modal-overlay" @click="closeSelector">
        <view class="modal-content scale-in" @click.stop>
          <view class="modal-header">
            <text class="modal-title">{{ t("selectToken") }}</text>
            <text class="close-btn" @click="closeSelector">×</text>
          </view>
          <scroll-view scroll-y class="token-list">
            <view v-for="token in availableTokens" :key="token.symbol" class="token-option" @click="selectToken(token)">
              <text class="token-icon">{{ token.icon }}</text>
              <view class="token-info">
                <text class="token-name">{{ token.symbol }}</text>
                <text class="token-balance">{{ formatAmount(token.balance) }}</text>
              </view>
              <text
                v-if="token.symbol === (selectorTarget === 'from' ? fromToken.symbol : toToken.symbol)"
                class="check-mark"
                >✓</text
              >
            </view>
          </scroll-view>
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
import { ref, computed, onMounted } from "vue";
import { useWallet } from "@neo/uniapp-sdk";
import { createT } from "@/shared/utils/i18n";
import AppLayout from "@/shared/components/AppLayout.vue";
import type { NavTab } from "@/shared/components/NavBar.vue";

const docSteps = computed(() => [t("step1"), t("step2"), t("step3")]);
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
  { symbol: "NEO", icon: "💚", hash: "0xef4073a0f2b305a38ec4050e4d3d28bc40ea63f5", balance: 0, decimals: 0 },
  { symbol: "GAS", icon: "⛽", hash: "0xd2a4cff31913016155e38e474a2c06d08be276cf", balance: 0, decimals: 8 },
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
    TOKENS[0].balance = neo || 0;
    TOKENS[1].balance = gas || 0;
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

// === SWAP CARD ===
.swap-card {
  background: var(--bg-card);
  border: $border-width-md solid var(--border-color);
  box-shadow: $shadow-md;
  padding: $space-5;
  margin-bottom: $space-4;
  position: relative;
}

// === TOKEN CARDS ===
.token-card {
  background: var(--bg-secondary);
  border: $border-width-sm solid var(--border-color);
  padding: $space-4;
  margin-bottom: $space-3;
  transition: all $transition-normal;

  &:hover {
    border-color: var(--neo-purple);
  }
}

.token-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $space-3;
}

.section-label {
  font-size: $font-size-xs;
  color: var(--text-secondary);
  text-transform: uppercase;
  font-weight: $font-weight-semibold;
  letter-spacing: 0.5px;
}

.balance-text {
  font-size: $font-size-xs;
  color: var(--text-muted);
}

.token-input-row {
  display: flex;
  align-items: center;
  gap: $space-3;
}

.token-select {
  display: flex;
  align-items: center;
  gap: $space-2;
  background: var(--bg-elevated);
  border: $border-width-sm solid var(--border-color);
  padding: $space-3 $space-4;
  cursor: pointer;
  transition: all $transition-fast;
  min-width: 120px;

  &:hover {
    border-color: var(--neo-green);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
}

.token-info {
  display: flex;
  align-items: center;
  gap: $space-2;
}

.token-icon {
  font-size: $font-size-xl;
}

.token-symbol {
  font-size: $font-size-base;
  font-weight: $font-weight-bold;
  color: var(--text-primary);
}

.dropdown-arrow {
  font-size: $font-size-xs;
  color: var(--text-secondary);
}

.amount-input-wrapper {
  flex: 1;
  text-align: right;
  ::v-deep .uni-easyinput__content {
    background: transparent !important;
    border: none !important;
    min-height: 48px;
  }
  ::v-deep .uni-easyinput__content-input {
    font-size: $font-size-2xl !important;
    color: var(--text-primary) !important;
    text-align: right !important;
    height: 48px;
    padding-right: 0;
  }
  ::v-deep .uni-easyinput__content-input::placeholder {
    color: var(--text-muted);
  }
  &.disabled {
    opacity: 0.7;
  }
}

// === SWAP DIRECTION BUTTON ===
.swap-direction-container {
  display: flex;
  justify-content: center;
  margin: -$space-2 0;
  position: relative;
  z-index: 1;
}

.swap-direction-btn {
  width: 48px;
  height: 48px;
  background: var(--bg-card);
  border: $border-width-md solid var(--border-color);
  box-shadow: $shadow-sm;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all $transition-normal;

  &:hover {
    border-color: var(--neo-purple);
    box-shadow: $shadow-purple;
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }

  &.rotating {
    animation: rotate360 0.3s ease-in-out;
  }
}

.swap-icon {
  font-size: $font-size-2xl;
  color: var(--neo-purple);
  font-weight: $font-weight-bold;
}

@keyframes rotate360 {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(180deg);
  }
}

// === RATE CARD ===
.rate-card {
  background: var(--bg-card);
  border: $border-width-sm solid var(--border-color);
  padding: $space-4;
  margin-bottom: $space-4;
}

.rate-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}

.rate-info {
  display: flex;
  flex-direction: column;
  gap: $space-1;
}

.rate-label {
  font-size: $font-size-xs;
  color: var(--text-secondary);
  text-transform: uppercase;
}

.rate-value {
  font-size: $font-size-base;
  color: var(--text-primary);
  font-weight: $font-weight-semibold;
}

.rate-actions {
  display: flex;
  align-items: center;
  gap: $space-3;
}

.refresh-icon {
  font-size: $font-size-lg;
  color: var(--neo-green);
  cursor: pointer;
  transition: transform $transition-fast;

  &:hover {
    transform: rotate(180deg);
  }
}

.expand-icon {
  font-size: $font-size-sm;
  color: var(--text-secondary);
}

// === DETAILS ACCORDION ===
.details-accordion {
  margin-top: $space-4;
  padding-top: $space-4;
  border-top: $border-width-sm solid var(--border-color);
  animation: slideDown $transition-normal;
}

@keyframes slideDown {
  from {
    opacity: 0;
    max-height: 0;
  }
  to {
    opacity: 1;
    max-height: 200px;
  }
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $space-2 0;
}

.detail-label {
  font-size: $font-size-sm;
  color: var(--text-secondary);
}

.detail-value {
  font-size: $font-size-sm;
  color: var(--text-primary);
  font-weight: $font-weight-medium;

  &.impact-low {
    color: var(--neo-green);
  }

  &.impact-medium {
    color: var(--brutal-yellow);
  }

  &.impact-high {
    color: var(--brutal-red);
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
  overflow: hidden;

  &.scrollable {
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }
}

// === MODAL TITLE ===
.modal-title {
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
  color: var(--text-primary);
}
</style>
