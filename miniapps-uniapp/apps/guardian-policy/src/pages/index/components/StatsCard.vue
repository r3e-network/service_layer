<template>
  <NeoCard :title="'📊 ' + t('statistics')" class="stats-card">
    <view class="stat-row">
      <text class="stat-label">{{ t("totalPolicies") }}</text>
      <text class="stat-value">{{ stats.totalPolicies }}</text>
    </view>
    <view class="stat-row">
      <text class="stat-label">{{ t("activePoliciesCount") }}</text>
      <text class="stat-value">{{ stats.activePolicies }}</text>
    </view>
    <view class="stat-row">
      <text class="stat-label">{{ t("inactivePolicies") }}</text>
      <text class="stat-value">{{ stats.inactivePolicies }}</text>
    </view>
    <view class="stat-row">
      <text class="stat-label">{{ t("totalGuardians") }}</text>
      <text class="stat-value">{{ totalGuardians }}</text>
    </view>
    <view class="stat-row">
      <text class="stat-label">{{ t("activeGuardians") }}</text>
      <text class="stat-value">{{ activeGuardians }}</text>
    </view>
  </NeoCard>
</template>

<script setup lang="ts">
import { NeoCard } from "@/shared/components";

defineProps<{
  stats: {
    totalPolicies: number;
    activePolicies: number;
    inactivePolicies: number;
  };
  totalGuardians: number;
  activeGuardians: number;
  t: (key: string) => string;
}>();
</script>

<style lang="scss" scoped>
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.stats-card { margin-bottom: $space-4; }

.stat-row {
  display: flex;
  justify-content: space-between;
  padding: $space-3 0;
  border-bottom: 2px solid black;
}
.stat-label {
  font-size: 12px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
}
.stat-value {
  font-family: $font-mono;
  font-weight: $font-weight-black;
  font-size: 18px;
  background: black;
  color: white;
  padding: 0 8px;
}
</style>
