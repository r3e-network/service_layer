<template>
  <NeoCard :title="t('estimatedRewards')" class="mb-6" variant="erobo-bitcoin">
    <template #header-extra>
      <view class="rewards-badge">{{ t("daily") }}</view>
    </template>
    <view class="rewards-body">
      <text class="rewards-amount">+{{ dailyRewards }} NEO</text>
      <text class="rewards-usd">≈ ${{ dailyRewardsUsd }}</text>
    </view>
    <view class="rewards-progress-container">
      <view class="rewards-progress-bar" :style="{ width: rewardsProgress + '%' }"></view>
    </view>
  </NeoCard>
</template>

<script setup lang="ts">
import { NeoCard } from "@/shared/components";

defineProps<{
  dailyRewards: string;
  dailyRewardsUsd: string;
  rewardsProgress: number;
  t: (key: string) => string;
}>();
</script>

<style lang="scss" scoped>
@use "@/shared/styles/tokens.scss" as *;
@use "@/shared/styles/variables.scss";

.rewards-badge {
  background: linear-gradient(135deg, #fbbf24, #d97706);
  color: black;
  padding: 4px 12px;
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  border-radius: 99px;
  box-shadow: 0 0 10px rgba(251, 191, 36, 0.4);
}

.rewards-body {
  text-align: center;
  margin-bottom: 24px;
  padding-top: 12px;
}

.rewards-amount {
  display: block;
  font-size: 32px;
  font-weight: 800;
  color: white;
  margin-bottom: 2px;
  font-family: $font-family;
  letter-spacing: -0.02em;
  text-shadow: 0 0 20px rgba(234, 179, 8, 0.2);
}

.rewards-usd {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary, rgba(255, 255, 255, 0.5));
}

.rewards-progress-container {
  background: var(--bg-card, rgba(255, 255, 255, 0.05));
  height: 6px;
  border-radius: 3px;
  overflow: hidden;
  margin-top: 16px;
}

.rewards-progress-bar {
  height: 100%;
  background: #FBBF24;
  border-radius: 3px;
  box-shadow: 0 0 10px rgba(251, 191, 36, 0.6);
}
</style>
