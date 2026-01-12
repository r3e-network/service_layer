<template>
  <NeoCard :title="t('addLiquidity')" variant="default" class="mb-4">
    <view class="token-input-section">
      <view class="section-header">
        <text class="input-label">NEO</text>
        <text class="balance-label">{{ t("balance") }}: 0.00</text>
      </view>
      <NeoInput
        :modelValue="amountA"
        @update:modelValue="$emit('update:amountA', $event)"
        type="number"
        placeholder="0.0"
        @input="$emit('calculateB')"
        class="seamless-input"
      />
    </view>

    <view class="plus-divider">
      <view class="plus-icon-circle">
        <AppIcon name="plus" :size="16" />
      </view>
    </view>

    <view class="token-input-section">
      <view class="section-header">
        <text class="input-label">GAS</text>
        <text class="balance-label">{{ t("balance") }}: 0.00</text>
      </view>
      <NeoInput
        :modelValue="amountB"
        @update:modelValue="$emit('update:amountB', $event)"
        type="number"
        placeholder="0.0"
        @input="$emit('calculateA')"
        class="seamless-input"
      />
    </view>

    <view class="rate-info">
        1 NEO ≈ 8.5 GAS
    </view>

    <NeoButton variant="primary" block @click="$emit('addLiquidity')" :loading="loading">
      {{ t("addLiquidity") }}
    </NeoButton>
  </NeoCard>
</template>

<script setup lang="ts">
import { NeoCard, NeoInput, NeoButton, AppIcon } from "@/shared/components";

defineProps<{
  amountA: string;
  amountB: string;
  loading: boolean;
  t: (key: string) => string;
}>();

defineEmits(["update:amountA", "update:amountB", "calculateA", "calculateB", "addLiquidity"]);
</script>

<style lang="scss" scoped>
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.token-input-section {
  background: var(--bg-card, rgba(255, 255, 255, 0.05));
  border-radius: 16px;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.2s;

  &:focus-within {
    border-color: #00E599;
    box-shadow: 0 0 15px rgba(0, 229, 153, 0.1);
    background: rgba(255, 255, 255, 0.08);
  }
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.input-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--text-secondary, rgba(255, 255, 255, 0.5));
  letter-spacing: 0.1em;
}

.balance-label {
  font-size: 11px;
  font-weight: 500;
  font-family: $font-mono;
  color: var(--text-secondary, rgba(255, 255, 255, 0.5));
}

.plus-divider {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 32px;
  position: relative;
  z-index: 1;
}

.plus-icon-circle {
  width: 24px;
  height: 24px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary, rgba(255, 255, 255, 0.6));
}

.rate-info {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary, rgba(255, 255, 255, 0.5));
  margin: 16px 0 24px;
  text-align: center;
}

.seamless-input {
  ::v-deep .uni-easyinput__content {
    background: transparent !important;
    border: none !important;
    padding: 0 !important;
  }
  ::v-deep .uni-easyinput__content-input {
    font-size: 20px !important;
    font-weight: 600 !important;
    color: white !important;
    height: 32px;
    padding: 0 !important;
    text-align: right !important; 
  }
}

.mb-4 { margin-bottom: 16px; }
</style>
