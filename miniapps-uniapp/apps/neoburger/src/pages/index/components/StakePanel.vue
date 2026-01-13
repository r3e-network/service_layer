<template>
  <NeoCard :title="t('stakeNeoTitle')" class="mb-6" variant="erobo-neo">
    <text class="panel-subtitle mb-4 text-center block">{{ t("stakeSubtitle") }}</text>

    <view class="input-group">
      <view class="input-header">
        <text class="input-label">{{ t("amountToStake") }}</text>
        <text class="balance-hint">{{ t("balance") }}: {{ formatAmount(neoBalance) }} NEO</text>
      </view>

      <NeoInput
        :modelValue="stakeAmount"
        @update:modelValue="$emit('update:stakeAmount', $event)"
        type="number"
        placeholder="0.00"
        class="mb-4"
      >
        <template #suffix>
          <text class="token-symbol">NEO</text>
        </template>
      </NeoInput>

      <view class="quick-amounts mb-4">
        <NeoButton variant="secondary" size="sm" @click="$emit('setAmount', 0.25)">25%</NeoButton>
        <NeoButton variant="secondary" size="sm" @click="$emit('setAmount', 0.5)">50%</NeoButton>
        <NeoButton variant="secondary" size="sm" @click="$emit('setAmount', 0.75)">75%</NeoButton>
        <NeoButton variant="secondary" size="sm" @click="$emit('setAmount', 1)">MAX</NeoButton>
      </view>
    </view>

    <NeoCard flat variant="erobo-neo" class="mb-6 conversion-card">
      <view class="conversion-row">
        <text class="conversion-label">{{ t("youWillReceive") }}</text>
        <text class="conversion-value">{{ estimatedBneo }} bNEO</text>
      </view>
      <view class="conversion-row">
        <text class="conversion-label">{{ t("exchangeRate") }}</text>
        <text class="conversion-value">1 NEO = 0.99 bNEO</text>
      </view>
      <view class="conversion-row">
        <text class="conversion-label">{{ t("yearlyReturn") }}</text>
        <text class="conversion-value highlight">+{{ yearlyReturn }} NEO</text>
      </view>
    </NeoCard>

    <NeoButton variant="primary" size="lg" block :disabled="!canStake" :loading="loading" @click="$emit('stake')">
      {{ loading ? t("processing") : t("stakeNeo") }}
    </NeoButton>
  </NeoCard>
</template>

<script setup lang="ts">
import { NeoCard, NeoInput, NeoButton } from "@/shared/components";

defineProps<{
  stakeAmount: string;
  neoBalance: number;
  estimatedBneo: string;
  yearlyReturn: string;
  canStake: boolean;
  loading: boolean;
  t: (key: string) => string;
}>();

defineEmits(["update:stakeAmount", "setAmount", "stake"]);

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
  color: rgba(255, 255, 255, 0.6);
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
  color: rgba(0, 229, 153, 0.6);
  letter-spacing: 0.05em;
}

.conversion-value {
  font-size: 14px;
  font-weight: 700;
  font-family: $font-family;
  color: white;

  &.highlight {
    color: #4ade80;
    text-shadow: 0 0 15px rgba(74, 222, 128, 0.3);
  }
}
</style>
