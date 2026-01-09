<template>
  <NeoCard variant="default" class="stats-overview">
    <text class="stats-title">📊 {{ t("statistics") }}</text>
    <view class="stats-grid">
      <NeoCard variant="default" class="flex-1 text-center">
        <text class="stat-value">{{ stats.totalLoans }}</text>
        <text class="stat-label">{{ t("totalLoans") }}</text>
      </NeoCard>
      <NeoCard variant="default" class="flex-1 text-center">
        <text class="stat-value">{{ formatNum(stats.totalVolume) }}</text>
        <text class="stat-label">{{ t("totalVolume") }}</text>
      </NeoCard>
      <NeoCard variant="default" class="flex-1 text-center">
        <text class="stat-value">{{ stats.totalFees.toFixed(2) }}</text>
        <text class="stat-label">{{ t("totalFees") }}</text>
      </NeoCard>
      <NeoCard variant="default" class="flex-1 text-center">
        <text class="stat-value">{{
          stats.totalLoans > 0 ? formatNum(stats.totalVolume / stats.totalLoans) : 0
        }}</text>
        <text class="stat-label">{{ t("avgLoanSize") }}</text>
      </NeoCard>
    </view>
  </NeoCard>
</template>

<script setup lang="ts">
import { NeoCard } from "@/shared/components";

defineProps<{
  stats: {
    totalLoans: number;
    totalVolume: number;
    totalFees: number;
    totalProfit: number;
  };
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

.stats-title { font-size: 16px; font-weight: $font-weight-black; text-transform: uppercase; margin-bottom: $space-4; display: block; }
.stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: $space-4; }
.stat-value { font-weight: $font-weight-black; font-family: $font-mono; font-size: 18px; display: block; border-bottom: 3px solid black; margin-bottom: 4px; }
.stat-label { font-size: 10px; font-weight: $font-weight-black; text-transform: uppercase; opacity: 0.6; }
</style>
