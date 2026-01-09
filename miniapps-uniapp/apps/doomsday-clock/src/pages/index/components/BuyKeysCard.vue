<template>
  <NeoCard>
    <text class="card-title">{{ t("buyKeys") }}</text>
    <NeoInput
      :modelValue="keyCount"
      @update:modelValue="$emit('update:keyCount', $event)"
      type="number"
      :placeholder="t('keyCountPlaceholder')"
      suffix="Keys"
    />
    <view class="cost-row">
      <text class="cost-label">{{ t("estimatedCost") }}</text>
      <text class="cost-value">{{ estimatedCost }} GAS</text>
    </view>
    <text class="hint-text">{{ t("keyPrice") }}</text>
    <NeoButton variant="primary" size="lg" block @click="$emit('buy')" :disabled="isPaying">
      {{ isPaying ? t("buying") : t("buyKeys") }}
    </NeoButton>
  </NeoCard>
</template>

<script setup lang="ts">
import { NeoCard, NeoInput, NeoButton } from "@/shared/components";

defineProps<{
  keyCount: string;
  estimatedCost: string;
  isPaying: boolean;
  t: (key: string) => string;
}>();

defineEmits(["update:keyCount", "buy"]);
</script>

<style lang="scss" scoped>
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.card-title {
  font-size: 14px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  border-bottom: 2px solid black;
  margin-bottom: $space-4;
  display: block;
}

.cost-row {
  display: flex;
  justify-content: space-between;
  margin: $space-4 0;
  padding: $space-3;
  background: var(--bg-elevated, #eee);
  border: 2px solid var(--border-color, black);
  color: var(--text-primary, black);
}
.cost-label {
  font-size: 12px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
}
.cost-value {
  font-size: 18px;
  font-weight: $font-weight-black;
  font-family: $font-mono;
}

.hint-text {
  font-size: 10px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  opacity: 0.6;
  display: block;
  margin-bottom: $space-4;
}
</style>
