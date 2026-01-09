<template>
  <NeoCard :title="t('unstakeBneoTitle')" class="mb-6" variant="erobo">
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

    <view class="conversion-card mb-6">
      <view class="conversion-row">
        <text class="conversion-label">{{ t("youWillReceive") }}</text>
        <text class="conversion-value">{{ estimatedNeo }} NEO</text>
      </view>
      <view class="conversion-row">
        <text class="conversion-label">{{ t("exchangeRate") }}</text>
        <text class="conversion-value">1 bNEO = 1.01 NEO</text>
      </view>
    </view>

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
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

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

.conversion-card {
  background: rgba(239, 68, 68, 0.05);
  border: 1px solid rgba(239, 68, 68, 0.1);
  border-radius: 16px;
  padding: 20px;
  backdrop-filter: blur(10px);
}

.conversion-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  &:last-child { margin-bottom: 0; }
}

.conversion-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: rgba(239, 68, 68, 0.6);
  letter-spacing: 0.05em;
}

.conversion-value {
  font-size: 14px;
  font-weight: 700;
  font-family: 'Inter', sans-serif;
  color: white;
}
</style>
