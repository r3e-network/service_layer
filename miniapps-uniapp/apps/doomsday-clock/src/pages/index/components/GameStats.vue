<template>
  <NeoCard>
    <view class="stats-grid">
      <NeoCard class="flex-1 text-center">
        <text class="stat-value">{{ formatNum(totalPot) }}</text>
        <text class="stat-label">{{ t("totalPot") }}</text>
      </NeoCard>
      <NeoCard class="flex-1 text-center">
        <text class="stat-value">{{ userKeys }}</text>
        <text class="stat-label">{{ t("yourKeys") }}</text>
      </NeoCard>
      <NeoCard class="flex-1 text-center">
        <text class="stat-value">#{{ roundId }}</text>
        <text class="stat-label">{{ t("round") }}</text>
      </NeoCard>
    </view>
    <view class="stats-subgrid">
      <view class="stat-row">
        <text class="stat-row-label">{{ t("lastBuyer") }}</text>
        <text class="stat-row-value">{{ lastBuyerLabel }}</text>
      </view>
      <view class="stat-row">
        <text class="stat-row-label">{{ t("roundStatus") }}</text>
        <text class="stat-row-value" :class="{ active: isRoundActive }">
          {{ isRoundActive ? t("activeRound") : t("inactiveRound") }}
        </text>
      </view>
    </view>
  </NeoCard>
</template>

<script setup lang="ts">
import { NeoCard } from "@/shared/components";

defineProps<{
  totalPot: number;
  userKeys: number;
  roundId: number;
  lastBuyerLabel: string;
  isRoundActive: boolean;
  t: (key: string) => string;
}>();

const formatNum = (n: number) => {
  if (n === undefined || n === null) return "0.00";
  return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
};
</script>

<style lang="scss" scoped>
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $space-4;
}
.stat-value {
  font-size: 18px;
  font-weight: $font-weight-black;
  font-family: $font-mono;
  display: block;
  border-bottom: 3px solid black;
  margin-bottom: 4px;
}
.stat-label {
  font-size: 10px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  opacity: 0.6;
}

.stats-subgrid {
  margin-top: $space-6;
  display: flex;
  flex-direction: column;
  gap: $space-3;
}
.stat-row {
  display: flex;
  justify-content: space-between;
  padding: $space-3;
  background: var(--bg-card, white);
  border: 2px solid var(--border-color, black);
  box-shadow: 4px 4px 0 var(--shadow-color, black);
  color: var(--text-primary, black);
}
.stat-row-label {
  font-size: 10px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
}
.stat-row-value {
  font-size: 12px;
  font-weight: $font-weight-black;
  font-family: $font-mono;
  &.active {
    color: var(--neo-green);
  }
}
</style>
