<template>
  <NeoCard :title="'📋 ' + t('activePolicies')" class="policies-card">
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
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.policy-row {
  padding: $space-4;
  background: var(--bg-card, white);
  border: 3px solid var(--border-color, black);
  margin-bottom: $space-4;
  box-shadow: 5px 5px 0 var(--shadow-color, black);
  color: var(--text-primary, black);
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
  border: 3px solid var(--border-color, black);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  &.level-low {
    background: var(--brutal-yellow);
  }
  &.level-medium {
    background: var(--neo-cyan);
  }
  &.level-high {
    background: var(--neo-green);
  }
  &.level-critical {
    background: var(--brutal-red);
  }
}
.policy-name {
  font-weight: $font-weight-black;
  font-size: 16px;
  text-transform: uppercase;
}
.policy-desc {
  font-size: 10px;
  font-weight: $font-weight-black;
  opacity: 0.6;
}
.policy-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--bg-elevated, #eee);
  padding: $space-2 $space-4;
  border: 2px solid var(--border-color, black);
  color: var(--text-primary, black);
}
.policy-level {
  font-size: 10px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  background: var(--bg-card, white);
  padding: 2px 10px;
  border: 1px solid var(--border-color, black);
  color: var(--text-primary, black);
}
</style>
