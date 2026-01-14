<template>
  <AppLayout  :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <view v-if="chainType === 'evm'" class="px-5 mb-4">
      <NeoCard variant="danger">
        <view class="flex flex-col items-center gap-2 py-1">
          <text class="text-center font-bold text-red-400">{{ t("wrongChain") }}</text>
          <text class="text-xs text-center opacity-80 text-white">{{ t("wrongChainMessage") }}</text>
          <NeoButton size="sm" variant="secondary" class="mt-2" @click="() => switchChain('neo-n3-mainnet')">{{ t("switchToNeo") }}</NeoButton>
        </view>
      </NeoCard>
    </view>

    <SwapTab v-if="activeTab === 'swap'" :t="t as any" />
    <PoolTab v-if="activeTab === 'pool'" :t="t as any" />

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
import { ref, computed } from "vue";
import { useWallet } from "@neo/uniapp-sdk";
import { createT } from "@/shared/utils/i18n";
import { AppLayout, NeoDoc, NeoCard, NeoButton } from "@/shared/components";
import type { NavTab } from "@/shared/components/NavBar.vue";
import SwapTab from "./components/SwapTab.vue";
import PoolTab from "./components/PoolTab.vue";

const translations = {
  title: { en: "Flamingo Swap", zh: "火烈鸟兑换" },
  subtitle: { en: "Swap NEO ↔ GAS instantly", zh: "即时兑换 NEO ↔ GAS" },
  from: { en: "From", zh: "从" },
  to: { en: "To", zh: "到" },
  balance: { en: "Balance", zh: "余额" },
  exchangeRate: { en: "Exchange Rate", zh: "兑换率" },
  priceImpact: { en: "Price Impact", zh: "价格影响" },
  notAvailable: { en: "Unavailable", zh: "不可用" },
  slippage: { en: "Slippage Tolerance", zh: "滑点容差" },
  liquidityPool: { en: "Liquidity Pool", zh: "流动性池" },
  minReceived: { en: "Minimum Received", zh: "最少收到" },
  enterAmount: { en: "Enter amount", zh: "输入数量" },
  rateUnavailable: { en: "Rate unavailable", zh: "汇率不可用" },
  loadingRate: { en: "Loading rate...", zh: "正在加载汇率..." },
  refreshRate: { en: "Refresh rate", zh: "刷新汇率" },
  insufficientBalance: { en: "Insufficient balance", zh: "余额不足" },
  swapping: { en: "Swapping...", zh: "兑换中..." },
  selectToken: { en: "Select Token", zh: "选择代币" },
  swapSuccess: { en: "Swapped", zh: "兑换成功" },
  swapFailed: { en: "Swap failed", zh: "兑换失败" },
  tabSwap: { en: "Swap", zh: "兑换" },
  tabPool: { en: "Pool", zh: "流动池" },
  poolSubtitle: { en: "Provide liquidity and earn fees", zh: "提供流动性并赚取手续费" },
  poolInfo: {
    en: "Liquidity management is executed on Flamingo DEX. Use the live price feed here to plan your position.",
    zh: "流动性管理在 Flamingo DEX 执行。此处提供实时价格数据以辅助规划。",
  },
  routerLabel: { en: "Swap Router", zh: "兑换路由" },
  openDex: { en: "Open Flamingo DEX", zh: "打开 Flamingo DEX" },
  yourPosition: { en: "Your Position", zh: "您的仓位" },
  poolShare: { en: "Pool Share", zh: "池份额" },
  addLiquidity: { en: "Add Liquidity", zh: "添加流动性" },
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
  error: { en: "Error", zh: "错误" },
  wrongChain: { en: "Wrong Network", zh: "网络错误" },
  wrongChainMessage: { en: "This app requires Neo N3 network.", zh: "此应用需 Neo N3 网络。" },
  switchToNeo: { en: "Switch to Neo N3", zh: "切换到 Neo N3" },
};

const t = createT(translations);
const { chainType, switchChain } = useWallet() as any;

const navTabs: NavTab[] = [
  { id: "swap", icon: "swap", label: t("tabSwap") },
  { id: "pool", icon: "droplet", label: t("tabPool") },
  { id: "docs", icon: "book", label: t("docs") },
];

const activeTab = ref("swap");

const docSteps = computed(() => [t("step1"), t("step2"), t("step3"), t("step4")]);
const docFeatures = computed(() => [
  { name: t("feature1Name"), desc: t("feature1Desc") },
  { name: t("feature2Name"), desc: t("feature2Desc") },
]);
</script>

<style lang="scss" scoped>
@use "@/shared/styles/tokens.scss" as *;
@use "@/shared/styles/variables.scss";

.tab-content {
  padding: $space-4;
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
