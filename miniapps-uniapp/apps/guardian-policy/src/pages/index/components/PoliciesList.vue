<template>
  <NeoCard :title="'📋 ' + t('activePolicies')" class="policies-card" variant="erobo">
    <view v-for="policy in policies" :key="policy.id" class="policy-row">
      <view class="policy-header">
        <view class="policy-icon" :class="'level-' + policy.level">🔒</view>
        <view class="policy-info">
          <text class="policy-name">{{ policy.name }}</text>
          <text class="policy-desc">{{ policy.description }}</text>
        </view>
      </view>
      <view class="policy-controls">
        <text :class="['policy-level', 'level-' + policy.level]">{{ getLevelText(policy.level) }}</text>
        <NeoButton :variant="policy.enabled ? 'primary' : 'secondary'" size="sm" @click="$emit('toggle', policy.id)">
          {{ policy.enabled ? "ON" : "OFF" }}
        </NeoButton>
      </view>
    </view>
  </NeoCard>
</template>

<script setup lang="ts">
import { NeoCard, NeoButton } from "@/shared/components";

const LEVELS = ["low", "medium", "high", "critical"] as const;
export type Level = (typeof LEVELS)[number];

export interface Policy {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  level: Level;
}

const props = defineProps<{
  policies: Policy[];
  t: (key: string) => string;
}>();

defineEmits(["toggle"]);

const getLevelText = (level: string) => {
  const levelMap: Record<string, string> = {
    low: props.t("levelLow"),
    medium: props.t("levelMedium"),
    high: props.t("levelHigh"),
    critical: props.t("levelCritical"),
  };
  return levelMap[level] || level;
};
</script>

<style lang="scss" scoped>
@use "@/shared/styles/tokens.scss" as *;
@use "@/shared/styles/variables.scss";

.policy-row {
  padding: $space-4;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  margin-bottom: $space-4;
  color: white;
  transition: all 0.2s ease;
}
.policy-header {
  display: flex;
  align-items: center;
  gap: $space-4;
  margin-bottom: $space-4;
}
.policy-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  &.level-low { background: rgba(255, 255, 255, 0.1); color: white; }
  &.level-medium { background: rgba(0, 229, 153, 0.1); color: #00E599; border: 1px solid rgba(0, 229, 153, 0.2); }
  &.level-high { background: rgba(249, 115, 22, 0.1); color: #F97316; border: 1px solid rgba(249, 115, 22, 0.2); }
  &.level-critical { background: rgba(239, 68, 68, 0.1); color: #EF4444; border: 1px solid rgba(239, 68, 68, 0.2); }
}
.policy-name {
  font-weight: 700;
  font-size: 14px;
  text-transform: uppercase;
  color: white;
  display: block;
}
.policy-desc {
  font-size: 11px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.6);
}
.policy-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(0, 0, 0, 0.2);
  padding: $space-2 $space-4;
  border-radius: 8px;
  color: white;
}
.policy-level {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
  &.level-critical { color: #EF4444; background: rgba(239, 68, 68, 0.1); }
  &.level-high { color: #F97316; background: rgba(249, 115, 22, 0.1); }
  &.level-medium { color: #00E599; background: rgba(0, 229, 153, 0.1); }
}
</style>
