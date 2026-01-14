<template>
  <NeoCard>
    <view class="quota-display">
      <view class="quota-header">
        <text class="quota-title">{{ t("todayUsage") }}</text>
        <text class="quota-percent">{{ Math.round(quotaPercent) }}%</text>
      </view>
      <view class="quota-bar-container">
        <view class="quota-fill" :style="{ width: quotaPercent + '%' }"></view>
      </view>
      <view class="quota-markers">
        <text class="marker">0</text>
        <text class="marker">{{ formatBalance(dailyLimit) }}</text>
      </view>
      <text class="quota-text"> {{ formatBalance(usedQuota) }} / {{ formatBalance(dailyLimit) }} GAS </text>
    </view>

    <view class="info-row">
      <text class="info-label">{{ t("remainingToday") }}</text>
      <text class="info-value highlight">{{ formatBalance(remainingQuota) }} GAS</text>
    </view>
    <view class="info-row">
      <text class="info-label">{{ t("resetsIn") }}</text>
      <text class="info-value">{{ resetTime }}</text>
    </view>
  </NeoCard>
</template>

<script setup lang="ts">
import { NeoCard } from "@/shared/components";

defineProps<{
  quotaPercent: number;
  dailyLimit: string;
  usedQuota: string;
  remainingQuota: number;
  resetTime: string;
  t: (key: string) => string;
}>();

const formatBalance = (val: string | number) => parseFloat(String(val)).toFixed(4);
</script>

<style lang="scss" scoped>
@use "@/shared/styles/tokens.scss" as *;
@use "@/shared/styles/variables.scss";

.quota-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  align-items: flex-end;
}

.quota-title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--text-secondary, rgba(255, 255, 255, 0.6));
  letter-spacing: 0.05em;
}

.quota-percent {
  font-size: 16px;
  font-weight: 800;
  color: #7000FF;
  font-family: $font-family;
}

.quota-bar-container {
  height: 8px;
  background: var(--bg-card, rgba(255, 255, 255, 0.05));
  border-radius: 4px;
  margin: 8px 0;
  position: relative;
  overflow: hidden;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.2);
}

.quota-fill {
  height: 100%;
  background: #7000FF;
  transition: width 0.5s ease-out;
  box-shadow: 0 0 10px rgba(112, 0, 255, 0.4);
  border-radius: 4px;
}

.quota-markers {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  margin-top: 4px;
  color: var(--text-muted, rgba(255, 255, 255, 0.4));
  font-weight: 500;
}

.quota-text {
  font-size: 11px;
  font-family: $font-mono;
  text-align: center;
  display: block;
  margin-top: 12px;
  margin-bottom: 16px;
  color: var(--text-primary, rgba(255, 255, 255, 0.8));
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  &:last-child {
    border-bottom: none;
  }
}

.info-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  opacity: 0.5;
}

.info-value {
  font-size: 13px;
  font-weight: 600;
  font-family: $font-family;
  color: white;

  &.highlight {
    color: #00E599;
    text-shadow: 0 0 10px rgba(0, 229, 153, 0.2);
  }
}
</style>
