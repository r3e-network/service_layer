<template>
  <view class="card collateral-card">
    <text class="card-title">{{ t("collateralStatus") }}</text>
    <view class="collateral-visual">
      <view class="collateral-bar">
        <view class="collateral-fill" :style="{ width: collateralUtilization + '%' }">
          <text class="collateral-percent">{{ collateralUtilization }}%</text>
        </view>
      </view>
      <view class="collateral-info">
        <view class="info-row">
          <text class="info-label">{{ t("locked") }}:</text>
          <text class="info-value locked">{{ fmt(loan.collateralLocked, 2) }} GAS</text>
        </view>
        <view class="info-row">
          <text class="info-label">{{ t("available") }}:</text>
          <text class="info-value available">{{ fmt(terms.maxBorrow * 1.5 - loan.collateralLocked, 2) }} GAS</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { formatNumber } from "@/shared/utils/format";

const props = defineProps<{
  loan: any;
  terms: any;
  collateralUtilization: number;
  t: (key: string) => string;
}>();

const fmt = (n: number, d = 2) => formatNumber(n, d);
</script>

<style lang="scss" scoped>
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.card {
  background: var(--bg-card);
  border: $border-width-md solid var(--border-color);
  box-shadow: $shadow-md;
  padding: $space-4;
  margin-bottom: $space-3;
}

.card-title {
  color: var(--neo-green);
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
  display: block;
  margin-bottom: $space-3;
  text-transform: uppercase;
}

.collateral-card { background: var(--bg-card); }

.collateral-visual {
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.collateral-bar {
  height: 40px;
  background: var(--bg-secondary);
  border: $border-width-sm solid var(--border-color);
  position: relative;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
}

.collateral-fill {
  flex: 1;
  min-height: 0;
  background: var(--neo-green);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: width $transition-normal;
  border-right: $border-width-sm solid var(--border-color);
}

.collateral-percent {
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: $neo-black;
}

.collateral-info {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: $space-2;
  background: var(--bg-secondary);
  border: $border-width-sm solid var(--border-color);
}

.info-label {
  color: var(--text-secondary);
  font-size: $font-size-sm;
}

.info-value {
  font-weight: $font-weight-bold;
  font-size: $font-size-sm;
  &.locked { color: var(--brutal-yellow); }
  &.available { color: var(--neo-green); }
}
</style>
