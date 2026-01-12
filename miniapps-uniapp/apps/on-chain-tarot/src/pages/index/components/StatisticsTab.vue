<template>
  <NeoCard :title="t('statistics')" variant="erobo">
    <view class="stat-row">
      <text class="stat-label">{{ t("totalGames") }}</text>
      <text class="stat-value">{{ readingsCount }}</text>
    </view>
    <view class="stat-row">
      <text class="stat-label">{{ t("cardsDrawnCount") }}</text>
      <text class="stat-value">{{ readingsCount * 3 }}</text>
    </view>
    <view class="stat-row">
      <text class="stat-label">{{ t("totalSpent") }}</text>
      <text class="stat-value">{{ (readingsCount * 0.05).toFixed(2) }} GAS</text>
    </view>
  </NeoCard>
</template>

<script setup lang="ts">
import { NeoCard } from "@/shared/components";

defineProps<{
  readingsCount: number;
  t: (key: string) => string;
}>();
</script>

<style lang="scss" scoped>
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.stat-row {
  display: flex;
  justify-content: space-between;
  padding: 16px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  align-items: center;
  &:last-child { border-bottom: none; }
}

.stat-label {
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--text-secondary, rgba(255, 255, 255, 0.5));
  letter-spacing: 0.05em;
}

.stat-value {
  font-weight: 700;
  font-family: $font-mono;
  font-size: 16px;
  color: #9f9df3;
  text-shadow: 0 0 10px rgba(159, 157, 243, 0.3);
}
</style>
