<template>
  <NeoCard :title="'➕ ' + t('createPolicy')" class="create-card">
    <NeoInput
      :modelValue="policyName"
      @update:modelValue="$emit('update:policyName', $event)"
      :placeholder="t('policyName')"
      class="input"
    />
    <NeoInput
      :modelValue="policyRule"
      @update:modelValue="$emit('update:policyRule', $event)"
      :placeholder="t('policyRule')"
      class="input"
    />
    <view class="level-selector">
      <text class="selector-label">{{ t("securityLevel") }}:</text>
      <view class="level-options">
        <view
          v-for="level in LEVELS"
          :key="level"
          :class="['level-option', { selected: newPolicyLevel === level }]"
          @click="$emit('update:newPolicyLevel', level)"
        >
          <text>{{ getLevelText(level) }}</text>
        </view>
      </view>
    </view>
    <NeoButton variant="primary" size="lg" block @click="$emit('create')">
      {{ t("createPolicy") }}
    </NeoButton>
  </NeoCard>
</template>

<script setup lang="ts">
import { NeoCard, NeoInput, NeoButton } from "@/shared/components";

const LEVELS = ["low", "medium", "high", "critical"] as const;
type Level = (typeof LEVELS)[number];

const props = defineProps<{
  policyName: string;
  policyRule: string;
  newPolicyLevel: Level;
  t: (key: string) => string;
}>();

defineEmits(["update:policyName", "update:policyRule", "update:newPolicyLevel", "create"]);

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

.create-card {
  margin-top: $space-4;
}
.input {
  margin-bottom: $space-4;
}

.level-selector {
  margin-bottom: $space-4;
}
.selector-label {
  font-size: 10px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  margin-bottom: $space-2;
  display: block;
}

.level-options {
  display: flex;
  gap: $space-3;
  margin-bottom: $space-6;
}
.level-option {
  flex: 1;
  padding: $space-3;
  border: 3px solid var(--border-color, black);
  text-align: center;
  font-size: 12px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  cursor: pointer;
  background: var(--bg-card, white);
  transition: all $transition-fast;
  color: var(--text-primary, black);
  &.selected {
    background: var(--brutal-yellow);
    box-shadow: 4px 4px 0 var(--shadow-color, black);
    transform: translate(2px, 2px);
  }
}
</style>
