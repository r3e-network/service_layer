<template>
  <NeoCard :title="t('statistics')" variant="success">
    <view class="stats-grid-neo">
      <view class="stat-item-neo">
        <text class="stat-label">{{ t("totalTrusts") }}</text>
        <text class="stat-value">{{ stats.totalTrusts }}</text>
      </view>
      <view class="stat-item-neo gas">
        <text class="stat-label">{{ t("totalGasValue") }}</text>
        <text class="stat-value">{{ stats.totalGasValue }} GAS</text>
      </view>
      <view class="stat-item-neo neo">
        <text class="stat-label">{{ t("totalNeoValue") }}</text>
        <text class="stat-value">{{ stats.totalNeoValue }} NEO</text>
      </view>
      <view class="stat-item-neo">
        <text class="stat-label">{{ t("activeTrusts") }}</text>
        <text class="stat-value">{{ stats.activeTrusts }}</text>
      </view>
    </view>
  </NeoCard>
</template>

<script setup lang="ts">
import { NeoCard } from "@/shared/components";

export interface TrustStats {
  totalTrusts: number;
  totalGasValue: number;
  totalNeoValue: number;
  activeTrusts: number;
}

defineProps<{
  stats: TrustStats;
  t: (key: string) => string;
}>();
</script>

<style lang="scss" scoped>
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.stats-grid-neo {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}
.stat-item-neo {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $space-4;
  background: var(--bg-card, white);
  border: 3px solid var(--border-color, black);
  box-shadow: 4px 4px 0 var(--shadow-color, black);
  color: var(--text-primary, black);

  &.gas {
    border-left: 6px solid var(--brutal-yellow);
  }

  &.neo {
    border-left: 6px solid var(--neo-green);
  }
}
.stat-label {
  font-size: 12px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
}
.stat-value {
  font-size: 18px;
  font-weight: $font-weight-black;
  font-family: $font-mono;
  background: black;
  color: white;
  padding: 2px 10px;
}
</style>
