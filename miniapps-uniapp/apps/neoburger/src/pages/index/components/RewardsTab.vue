<template>
  <view class="tab-content">
    <NeoCard variant="erobo-neo">
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

      <NeoButton variant="success" size="lg" block @click="$emit('claim')">
        {{ t("claimRewards") }}
      </NeoButton>
    </NeoCard>
  </view>
</template>

<script setup lang="ts">
import { NeoCard, NeoButton } from "@/shared/components";

defineProps<{
  totalRewards: number;
  totalRewardsUsd: string;
  bNeoBalance: number;
  dailyRewards: string;
  weeklyRewards: string;
  monthlyRewards: string;
  t: (key: string) => string;
}>();

defineEmits(["claim"]);

function formatAmount(amount: number): string {
  return amount.toFixed(4);
}
</script>

<style lang="scss" scoped>
@use "@/shared/styles/tokens.scss" as *;
@use "@/shared/styles/variables.scss";

.summary-title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--text-secondary, rgba(255, 255, 255, 0.5));
  letter-spacing: 0.1em;
}

.summary-value {
  font-size: 40px;
  font-weight: 800;
  font-family: $font-family;
  color: #00E599;
  text-shadow: 0 0 20px rgba(0, 229, 153, 0.3);
  letter-spacing: -0.02em;
}

.summary-usd {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary, rgba(255, 255, 255, 0.5));
}

.breakdown-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  &:last-child {
    border-bottom: none;
  }
}

.breakdown-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--text-secondary, rgba(255, 255, 255, 0.5));
  letter-spacing: 0.05em;
}

.breakdown-value {
  font-size: 13px;
  font-weight: 700;
  font-family: $font-mono;
  color: white;
}

.tab-content {
  padding: 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>
