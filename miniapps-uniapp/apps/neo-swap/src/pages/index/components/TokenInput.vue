<template>
  <view class="token-card">
    <view class="token-card-header">
      <text class="section-label">{{ label }}</text>
      <text class="balance-text">{{ t("balance") }}: {{ formatAmount(balance) }}</text>
    </view>
    <view class="token-input-row">
      <view class="token-select" @click="$emit('select-token')">
        <AppIcon :name="symbol.toLowerCase()" :size="32" />
        <view class="token-info">
          <text class="token-symbol">{{ symbol }}</text>
          <AppIcon name="chevron-right" :size="16" rotate="90" />
        </view>
      </view>
      <NeoInput
        :modelValue="amount"
        @update:modelValue="$emit('update:amount', $event)"
        type="number"
        placeholder="0.0"
        :disabled="disabled"
        class="amount-input-wrapper"
      />
    </view>
  </view>
</template>

<script setup lang="ts">
import { AppIcon, NeoInput } from "@/shared/components";

defineProps<{
  label: string;
  symbol: string;
  balance: number;
  amount: string;
  disabled?: boolean;
  t: (key: string) => string;
}>();

defineEmits(["select-token", "update:amount"]);

function formatAmount(amount: number): string {
  return amount.toFixed(4);
}
</script>

<style lang="scss" scoped>
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.token-card {
  margin-bottom: 24px;
}

.token-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.section-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--text-secondary, rgba(255, 255, 255, 0.5));
  letter-spacing: 0.1em;
}

.balance-text {
  font-size: 11px;
  font-weight: 500;
  color: var(--text-secondary, rgba(255, 255, 255, 0.5));
  font-family: 'Inter', monospace;
}

.token-input-row {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--bg-card, rgba(255, 255, 255, 0.03));
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 12px;
  transition: all 0.2s;
  backdrop-filter: blur(10px);

  &:focus-within {
    border-color: rgba(159, 157, 243, 0.6);
    box-shadow: 0 0 20px rgba(159, 157, 243, 0.2);
    background: var(--bg-card, rgba(255, 255, 255, 0.05));
  }
}

.token-select {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.1);
  padding: 8px 12px;
  border-radius: 99px;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
}

.token-symbol {
  font-weight: 700;
  font-size: 16px;
  color: white;
}

.token-info {
  display: flex;
  align-items: center;
  gap: 4px;
}

.amount-input-wrapper {
  flex: 1;
  ::v-deep .uni-easyinput__content {
    background: transparent !important;
    border: none !important;
    padding: 0 !important;
  }
  ::v-deep .uni-easyinput__content-input {
    font-size: 28px !important;
    font-family: 'Inter', sans-serif !important;
    font-weight: 600 !important;
    color: white !important;
    text-align: right !important;
    height: 48px;
    padding: 0 !important;
  }
}
</style>
