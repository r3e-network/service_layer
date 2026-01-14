<template>
  <view class="tab-content">
    <NeoCard class="swap-card" variant="erobo">
      <!-- From Token Card -->
      <TokenInput
        :label="t('from')"
        :symbol="fromToken.symbol"
        :balance="fromToken.balance"
        v-model:amount="fromAmount"
        :t="t as any"
        @select-token="openFromSelector"
        @update:amount="onFromAmountChange"
      />

      <!-- Swap Direction Button -->
      <view class="swap-direction-container">
        <view :class="['swap-direction-btn', { rotating: isSwapping }]" @click="swapTokens">
          <AppIcon name="swap" :size="24" />
        </view>
      </view>

      <!-- To Token Card -->
      <TokenInput
        :label="t('to')"
        :symbol="toToken.symbol"
        :balance="toToken.balance"
        v-model:amount="toAmount"
        disabled
        :t="t as any"
        @select-token="openToSelector"
      />
    </NeoCard>

    <!-- Exchange Rate & Details -->
    <RateDetails
      v-if="exchangeRate && !rateLoading"
      :from-symbol="fromToken.symbol"
      :to-symbol="toToken.symbol"
      :exchange-rate="exchangeRate"
      :price-impact="priceImpact"
      :slippage="slippage"
      :liquidity-pool="liquidityPool"
      :min-received="minReceived"
      :t="t as any"
      @refresh="fetchExchangeRate"
    />
    <NeoCard v-else class="rate-empty" variant="erobo">
      <view class="rate-empty-content">
        <text class="rate-empty-text">{{ rateLoading ? t("loadingRate") : t("rateUnavailable") }}</text>
        <NeoButton
          size="sm"
          variant="secondary"
          :loading="rateLoading"
          :disabled="rateLoading"
          @click="fetchExchangeRate"
        >
          {{ t("refreshRate") }}
        </NeoButton>
      </view>
    </NeoCard>

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
    <NeoCard v-if="status" :variant="status.type === 'error' ? 'danger' : 'success'" class="mt-4">
      <text class="text-center font-bold">{{ status.msg }}</text>
    </NeoCard>

    <!-- Token Selector Modal -->
    <TokenSelectorModal
      :show="showSelector"
      :tokens="availableTokens"
      :current-symbol="selectorTarget === 'from' ? fromToken.symbol : toToken.symbol"
      :t="t as any"
      @close="closeSelector"
      @select="selectToken"
    />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useWallet } from "@neo/uniapp-sdk";
import { AppIcon, NeoButton, NeoCard } from "@/shared/components";
import TokenInput from "./TokenInput.vue";
import RateDetails from "./RateDetails.vue";
import TokenSelectorModal from "./TokenSelectorModal.vue";

const props = defineProps<{
  t: (key: string) => string;
}>();

const { getAddress, invokeContract, getBalance, getContractAddress } = useWallet() as any;
const SWAP_ROUTER = ref<string | null>(null);

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
const rateLoading = ref(false);
const loading = ref(false);
const status = ref<{ msg: string; type: string } | null>(null);
const showSelector = ref(false);
const selectorTarget = ref<"from" | "to">("from");
const isSwapping = ref(false);

const availableTokens = computed(() => TOKENS);

const hasRate = computed(() => {
  const rate = parseFloat(exchangeRate.value);
  return Number.isFinite(rate) && rate > 0;
});

const canSwap = computed(() => {
  const amount = parseFloat(fromAmount.value);
  return hasRate.value && amount > 0 && amount <= fromToken.value.balance;
});

const swapButtonText = computed(() => {
  if (loading.value) return props.t("swapping");
  if (!fromAmount.value) return props.t("enterAmount");
  if (rateLoading.value) return props.t("loadingRate");
  if (!hasRate.value) return props.t("rateUnavailable");
  if (parseFloat(fromAmount.value) > fromToken.value.balance) return props.t("insufficientBalance");
  return `Swap ${fromToken.value.symbol} → ${toToken.value.symbol}`;
});

// DeFi metrics
const priceImpact = computed<string | null>(() => null);

const slippage = computed(() => "0.5%");
const liquidityPool = computed(() => `${fromToken.value.symbol}/${toToken.value.symbol}`);
const minReceived = computed(() => {
  const amount = parseFloat(toAmount.value) || 0;
  return (amount * 0.995).toFixed(4);
});

// Methods
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
    // Refresh current tokens if they are in the list
    if (fromToken.value.symbol === "NEO") fromToken.value.balance = TOKENS[0].balance;
    if (fromToken.value.symbol === "GAS") fromToken.value.balance = TOKENS[1].balance;
    if (toToken.value.symbol === "NEO") toToken.value.balance = TOKENS[0].balance;
    if (toToken.value.symbol === "GAS") toToken.value.balance = TOKENS[1].balance;
  } catch (e) {
    console.error("Failed to load balances:", e);
  }
}

async function fetchExchangeRate() {
  if (rateLoading.value) return;
  rateLoading.value = true;
  exchangeRate.value = "";
  try {
    // Try to fetch real exchange rate from datafeed API
    const sdk = await import("@neo/uniapp-sdk").then((m) => m.waitForSDK?.() || null);
    if (sdk?.datafeed?.getPrice) {
      const fromPrice = await sdk.datafeed.getPrice(`${fromToken.value.symbol}-USD`);
      const toPrice = await sdk.datafeed.getPrice(`${toToken.value.symbol}-USD`);
      if (fromPrice?.price && toPrice?.price) {
        const rate = parseFloat(fromPrice.price) / parseFloat(toPrice.price);
        if (Number.isFinite(rate) && rate > 0) {
          exchangeRate.value = rate.toFixed(6);
          return;
        }
      }
    }
  } catch (e) {
    console.warn("[SwapTab] Failed to fetch exchange rate:", e);
  } finally {
    rateLoading.value = false;
  }
}

async function loadRouter() {
  if (SWAP_ROUTER.value) return;
  try {
    SWAP_ROUTER.value = await getContractAddress();
  } catch (e) {
    console.warn("[SwapTab] Failed to load swap router:", e);
  }
}

function onFromAmountChange(val: string) {
  fromAmount.value = val;
  const amount = parseFloat(fromAmount.value) || 0;
  const rate = parseFloat(exchangeRate.value);
  if (!Number.isFinite(rate) || rate <= 0) {
    toAmount.value = "";
    return;
  }
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

    // Calculate minimum output with slippage protection (0.5% default)
    const expectedOutput = parseFloat(toAmount.value) || 0;
    const slippageTolerance = 0.005; // 0.5%
    const minOutputAmount = expectedOutput * (1 - slippageTolerance);
    const toDecimals = toToken.value.decimals;
    const minOutputInt = Math.floor(minOutputAmount * Math.pow(10, toDecimals));

    const routerAddress = SWAP_ROUTER.value || (await getContractAddress());
    if (!routerAddress) throw new Error("Swap router unavailable");

    await invokeContract({
      scriptHash: routerAddress,
      operation: "swap",
      args: [
        { type: "Hash160", value: await getAddress() },
        { type: "Hash160", value: fromToken.value.hash },
        { type: "Hash160", value: toToken.value.hash },
        { type: "Integer", value: amountInt },
        { type: "Integer", value: minOutputInt },
      ],
    });

    showStatus(`${props.t("swapSuccess")} ${amount} ${fromToken.value.symbol}!`, "success");
    fromAmount.value = "";
    toAmount.value = "";
    await loadBalances();
  } catch (e: any) {
    showStatus(e.message || props.t("swapFailed"), "error");
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadBalances();
  loadRouter();
  fetchExchangeRate();
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

// Deep selector to override TokenInput margin when used in SwapTab
:deep(.token-card) {
  margin-bottom: 12px;
}

.swap-card {
  margin-bottom: 24px;
}

.swap-direction-container {
  display: flex;
  justify-content: center;
  margin: 4px 0;
  position: relative;
  z-index: 2;
}

.swap-direction-btn {
  width: 44px;
  height: 44px;
  background: rgba(0, 29, 30, 0.6); // Darker glass
  border: 1px solid rgba(159, 157, 243, 0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  box-shadow: 0 0 15px rgba(159, 157, 243, 0.1);
  color: #9f9df3;

  &:hover {
    background: #9f9df3;
    color: white;
    box-shadow: 0 0 20px rgba(159, 157, 243, 0.4);
    transform: scale(1.1) rotate(180deg);
  }

  &.rotating {
    transform: rotate(180deg);
  }
}

.rate-empty {
  margin-bottom: 8px;
}

.rate-empty-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.rate-empty-text {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}
</style>
