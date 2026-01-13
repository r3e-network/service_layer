<template>
  <NeoCard :title="'➕ ' + t('createPolicy')" class="create-card" variant="erobo-neo">
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
@use "@/shared/styles/tokens.scss" as *;
@use "@/shared/styles/variables.scss";

.create-card { margin-top: $space-6; }
.level-selector { margin-bottom: $space-4; }
.selector-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  margin-bottom: $space-2;
  display: block;
  color: rgba(255, 255, 255, 0.6);
  letter-spacing: 0.05em;
}

.level-options {
  display: flex;
  gap: $space-3;
  margin-bottom: $space-6;
}
.level-option {
  flex: 1;
  padding: $space-3;
  border: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.03);
  transition: all 0.2s ease;
  color: rgba(255, 255, 255, 0.6);
  border-radius: 8px;
  
  &.selected {
    background: rgba(0, 229, 153, 0.1);
    border-color: #00E599;
    color: #00E599;
    box-shadow: 0 0 10px rgba(0, 229, 153, 0.2);
  }
}
</style>
