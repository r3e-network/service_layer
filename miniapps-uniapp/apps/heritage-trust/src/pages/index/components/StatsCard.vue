<template>
  <NeoCard variant="erobo">
    <view class="stats-grid-neo">
      <view class="stat-item-neo">
        <text class="stat-label">{{ t("totalTrusts") }}</text>
        <text class="stat-value">{{ stats.totalTrusts }}</text>
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
  totalNeoValue: number;
  activeTrusts: number;
}

defineProps<{
  stats: TrustStats;
  t: (key: string) => string;
}>();
</script>

<style lang="scss" scoped>
@use "@/shared/styles/tokens.scss" as *;
@use "@/shared/styles/variables.scss";

.stats-grid-neo {
  display: list-item; /* This is weird, let's just use flex column */
  display: flex;
  flex-direction: column;
  gap: $space-3;
}
.stat-item-neo {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $space-4;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: var(--text-primary);

  &.neo {
    background: linear-gradient(90deg, rgba(0, 229, 153, 0.1), transparent);
    border-left: 4px solid var(--neo-green);
  }
}
.stat-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--text-secondary);
  letter-spacing: 0.05em;
}
.stat-value {
  font-size: 16px;
  font-weight: 700;
  font-family: $font-mono;
  color: var(--text-primary);
}
</style>
