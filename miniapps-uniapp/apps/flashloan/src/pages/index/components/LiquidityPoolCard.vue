<template>
  <NeoCard variant="erobo-neo" class="liquidity-card">
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
@use "@/shared/styles/tokens.scss" as *;
@use "@/shared/styles/variables.scss";

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $space-4;
}
.card-title {
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
  color: white;
  letter-spacing: 0.05em;
}
.lightning-badge {
  background: rgba(0, 229, 153, 0.2);
  color: #00e599;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  box-shadow: 0 0 10px rgba(0, 229, 153, 0.3);
}

.liquidity-item {
  margin-bottom: $space-4;
}
.token-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  padding: 2px 8px;
  border-radius: 99px;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
  display: inline-block;
}
.token-amount {
  font-family: $font-mono;
  font-weight: 700;
  font-size: 24px;
  color: white;
  display: block;
  margin-top: 8px;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.2);
}
.liquidity-bar {
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  margin-top: 8px;
  overflow: hidden;
}
.liquidity-fill {
  height: 100%;
  background: #00e599;
  box-shadow: 0 0 10px rgba(0, 229, 153, 0.5);
  &.neo {
    background: #a78bfa; /* E-Robo Purple */
    box-shadow: 0 0 10px rgba(167, 139, 250, 0.5);
  }
}
</style>
