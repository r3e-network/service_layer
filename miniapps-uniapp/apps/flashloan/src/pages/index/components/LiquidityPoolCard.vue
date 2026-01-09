<template>
  <NeoCard variant="default" class="liquidity-card">
    <view class="card-header">
      <text class="card-title">{{ t("availableLiquidity") }}</text>
      <view class="lightning-badge">⚡</view>
    </view>
    <view class="liquidity-grid">
      <view class="liquidity-item">
        <text class="token-label">GAS</text>
        <text class="token-amount">{{ formatNum(gasLiquidity) }}</text>
        <view class="liquidity-bar">
          <view class="liquidity-fill" :style="{ width: '75%' }"></view>
        </view>
      </view>
      <view class="liquidity-item">
        <text class="token-label">NEO</text>
        <text class="token-amount">{{ neoLiquidity }}</text>
        <view class="liquidity-bar">
          <view class="liquidity-fill neo" :style="{ width: '60%' }"></view>
        </view>
      </view>
    </view>
  </NeoCard>
</template>

<script setup lang="ts">
import { NeoCard } from "@/shared/components";

defineProps<{
  gasLiquidity: number;
  neoLiquidity: number;
  t: (key: string) => string;
}>();

const formatNum = (n: number) => {
  if (n === undefined || n === null) return "0";
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
};
</script>

<style lang="scss" scoped>
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $space-4;
}
.card-title {
  font-size: 16px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
}
.lightning-badge {
  background: black;
  color: var(--brutal-yellow);
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.liquidity-item {
  margin-bottom: $space-4;
}
.token-label {
  font-size: 12px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  border: 1px solid var(--border-color, black);
  padding: 2px 6px;
  background: var(--bg-card, white);
  color: var(--text-primary, black);
}
.token-amount {
  font-family: $font-mono;
  font-weight: $font-weight-black;
  font-size: 24px;
  color: var(--text-primary, black);
  display: block;
  margin-top: 4px;
}
.liquidity-bar {
  height: 16px;
  background: var(--bg-card, white);
  border: 3px solid var(--border-color, black);
  margin-top: 8px;
  padding: 2px;
}
.liquidity-fill {
  height: 100%;
  background: var(--neo-green);
  &.neo {
    background: var(--brutal-blue);
  }
}
</style>
