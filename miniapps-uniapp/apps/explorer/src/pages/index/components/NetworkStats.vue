<template>
  <view class="stats-grid mb-6">
    <NeoCard :title="t('mainnet')" variant="success" class="flex-1">
      <NeoStats :stats="mainnetStats" />
    </NeoCard>
    <NeoCard :title="t('testnet')" variant="accent" class="flex-1">
      <NeoStats :stats="testnetStats" />
    </NeoCard>
  </view>
</template>

<script setup lang="ts">
import { NeoCard, NeoStats, type StatItem } from "@/shared/components";

defineProps<{
  mainnetStats: StatItem[];
  testnetStats: StatItem[];
  t: (key: string) => string;
}>();
</script>

<style lang="scss" scoped>
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.stats-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.flex-1 { flex: 1; }
.mb-6 { margin-bottom: 24px; }
</style>
