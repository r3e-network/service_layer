<template>
  <NeoCard class="mb-6" variant="erobo">
    <text class="panel-subtitle mb-4 text-center block">{{ t("unstakeSubtitle") }}</text>

    <view class="input-group">
      <view class="input-header">
        <text class="input-label">{{ t("amountToUnstake") }}</text>
        <text class="balance-hint">{{ t("balance") }}: {{ formatAmount(bNeoBalance) }} bNEO</text>
      </view>

      <NeoInput
        :modelValue="unstakeAmount"
        @update:modelValue="$emit('update:unstakeAmount', $event)"
        type="number"
        placeholder="0.00"
        class="mb-4"
      >
        <template #suffix>
          <text class="token-symbol">bNEO</text>
        </template>
      </NeoInput>

      <view class="quick-amounts mb-4">
        <NeoButton variant="secondary" size="sm" @click="$emit('setAmount', 0.25)">25%</NeoButton>
        <NeoButton variant="secondary" size="sm" @click="$emit('setAmount', 0.5)">50%</NeoButton>
        <NeoButton variant="secondary" size="sm" @click="$emit('setAmount', 0.75)">75%</NeoButton>
        <NeoButton variant="secondary" size="sm" @click="$emit('setAmount', 1)">MAX</NeoButton>
      </view>
    </view>

    <NeoCard variant="danger" class="mb-6">
      <view class="conversion-row-glass">
        <text class="conversion-label-glass">{{ t("youWillReceive") }}</text>
        <text class="conversion-value-glass">{{ estimatedNeo }} NEO</text>
      </view>
      <view class="conversion-row-glass">
        <text class="conversion-label-glass">{{ t("exchangeRate") }}</text>
        <text class="conversion-value-glass">1 bNEO = 1.01 NEO</text>
      </view>
    </NeoCard>

    <NeoButton variant="danger" size="lg" block :disabled="!canUnstake" :loading="loading" @click="$emit('unstake')">
      {{ loading ? t("processing") : t("unstakeBneo") }}
    </NeoButton>
  </NeoCard>
</template>

<script setup lang="ts">
import { NeoCard, NeoInput, NeoButton } from "@/shared/components";

defineProps<{
  unstakeAmount: string;
  bNeoBalance: number;
  estimatedNeo: string;
  canUnstake: boolean;
  loading: boolean;
  t: (key: string) => string;
}>();

defineEmits(["update:unstakeAmount", "setAmount", "unstake"]);

function formatAmount(amount: number): string {
  return amount.toFixed(2);
}
</script>

<style lang="scss" scoped>
@use "@/shared/styles/tokens.scss" as *;
@use "@/shared/styles/variables.scss";

.panel-subtitle {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary, rgba(255, 255, 255, 0.5));
  margin-bottom: 24px;
}

.input-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.input-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-secondary, rgba(255, 255, 255, 0.5));
}

.balance-hint {
  font-size: 11px;
  font-weight: 700;
  opacity: 0.8;
  color: white;
  letter-spacing: 0.05em;
}

.token-symbol {
  font-weight: 700;
  color: #00E599;
}

.quick-amounts {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.conversion-row-glass {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  &:last-child { margin-bottom: 0; }
}

.conversion-label-glass {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.7);
  letter-spacing: 0.05em;
}

.conversion-value-glass {
  font-size: 14px;
  font-weight: 700;
  font-family: $font-family;
  color: white;
}
</style>
